import { EventEmitter } from 'node:events'
import { generateId, logger, sha256 } from '@aipks/core'
import type { IngestResult } from '@aipks/core'
import type { MetadataStore, HnswAdapter } from '@aipks/vector-store'
import { Chunker } from './chunker.js'
import { Embedder } from './embedder.js'
import { parseMarkdownFile, collectMarkdownFiles } from './sources/markdown.js'

export interface PipelineOptions {
  chunkSize?: number
  chunkOverlap?: number
  brainRoot: string
}

export type PipelineEvent =
  | { type: 'fetch'; filePath: string }
  | { type: 'skip'; filePath: string; reason: string }
  | { type: 'chunk'; filePath: string; count: number }
  | { type: 'embed'; filePath: string; count: number; cached: number }
  | { type: 'store'; filePath: string; count: number }
  | { type: 'done'; result: IngestResult }
  | { type: 'error'; filePath: string; error: unknown }

export class IngestionPipeline extends EventEmitter {
  private chunker: Chunker
  private embedder: Embedder
  private store: MetadataStore
  private hnswAdapter: HnswAdapter
  private brainRoot: string

  constructor(
    embedder: Embedder,
    store: MetadataStore,
    hnswAdapter: HnswAdapter,
    opts: PipelineOptions,
  ) {
    super()
    this.embedder = embedder
    this.store = store
    this.hnswAdapter = hnswAdapter
    this.brainRoot = opts.brainRoot
    this.chunker = new Chunker(opts.chunkSize, opts.chunkOverlap)
  }

  /** Ingest a single markdown file */
  async ingestFile(filePath: string): Promise<IngestResult> {
    this.emit('event', { type: 'fetch', filePath } satisfies PipelineEvent)

    const { document, rawText } = parseMarkdownFile(filePath, this.brainRoot)

    // Dedup check
    const existing = this.store.getDocumentByPath(filePath)
    if (existing && existing.contentHash === document.contentHash) {
      const result: IngestResult = {
        documentId: existing.id,
        filePath,
        chunkCount: 0,
        skipped: true,
        reason: 'content unchanged',
      }
      this.emit('event', { type: 'skip', filePath, reason: 'content unchanged' } satisfies PipelineEvent)
      this.emit('event', { type: 'done', result } satisfies PipelineEvent)
      return result
    }

    // Remove old chunks + vectors if re-indexing
    if (existing) {
      const oldChunks = this.store.getChunksByVectorIds([]) // we'll delete by documentId
      this.store.deleteChunksByDocumentId(existing.id)
      // Note: hnswlib marks deletions lazily; removePoints handles that
    }

    // Upsert document record
    this.store.upsertDocument(document)

    // Chunk
    const rawChunks = await this.chunker.split(rawText)
    this.emit('event', { type: 'chunk', filePath, count: rawChunks.length } satisfies PipelineEvent)

    // Embed (with cache)
    const embedded = await this.embedder.embedBatch(rawChunks)
    const cachedCount = rawChunks.length - embedded.filter((e) => e.embedding.length > 0).length
    this.emit('event', { type: 'embed', filePath, count: embedded.length, cached: cachedCount } satisfies PipelineEvent)

    // Allocate vector IDs and write to hnswlib
    const chunkRefs = embedded.map((ec) => {
      const vectorId = this.hnswAdapter.allocateVectorId()
      return { ec, vectorId }
    })

    this.hnswAdapter.addPoints(chunkRefs.map(({ ec, vectorId }) => ({ vectorId, embedding: ec.embedding })))

    // Write chunk refs to SQLite
    const chunkRecords = chunkRefs.map(({ ec, vectorId }) => ({
      id: generateId(),
      documentId: document.id,
      vectorId,
      chunkIndex: ec.chunkIndex,
      charStart: ec.charStart,
      charEnd: ec.charEnd,
      heading: ec.heading,
      tokenCount: ec.tokenCount,
      contentHash: ec.contentHash,
    }))

    this.store.insertChunks(chunkRecords)
    this.hnswAdapter.persist()

    this.emit('event', { type: 'store', filePath, count: chunkRecords.length } satisfies PipelineEvent)

    const result: IngestResult = {
      documentId: document.id,
      filePath,
      chunkCount: chunkRecords.length,
      skipped: false,
    }
    this.emit('event', { type: 'done', result } satisfies PipelineEvent)
    return result
  }

  /** Ingest all markdown files in a directory (or a single file) */
  async ingestPath(pathOrDir: string): Promise<IngestResult[]> {
    const files = collectMarkdownFiles(pathOrDir)
    logger.info({ count: files.length, path: pathOrDir }, 'Starting ingestion')

    const results: IngestResult[] = []
    for (const file of files) {
      try {
        results.push(await this.ingestFile(file))
      } catch (err) {
        logger.error({ err, file }, 'Failed to ingest file')
        this.emit('event', { type: 'error', filePath: file, error: err } satisfies PipelineEvent)
      }
    }
    return results
  }
}
