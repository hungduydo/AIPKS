import Database from 'better-sqlite3'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import type { ChunkRef, Document } from '@aipks/core'
import { applyMigrations } from './schema.js'

export class MetadataStore {
  private db: Database.Database

  constructor(dbPath: string) {
    mkdirSync(dirname(dbPath), { recursive: true })
    this.db = new Database(dbPath)
    applyMigrations(this.db)
  }

  // ── Documents ──────────────────────────────────────────────────────────────

  upsertDocument(doc: Document): void {
    this.db
      .prepare(
        `INSERT INTO documents
          (id, file_path, source_type, content_hash, title, para_folder, note_type,
           domain, tags, created_at, updated_at, indexed_at, metadata)
         VALUES
          (@id, @filePath, @sourceType, @contentHash, @title, @paraFolder, @noteType,
           @domain, @tags, @createdAt, @updatedAt, @indexedAt, @metadata)
         ON CONFLICT(file_path) DO UPDATE SET
          id = excluded.id,
          source_type = excluded.source_type,
          content_hash = excluded.content_hash,
          title = excluded.title,
          para_folder = excluded.para_folder,
          note_type = excluded.note_type,
          domain = excluded.domain,
          tags = excluded.tags,
          created_at = excluded.created_at,
          updated_at = excluded.updated_at,
          indexed_at = excluded.indexed_at,
          metadata = excluded.metadata`,
      )
      .run({
        id: doc.id,
        filePath: doc.filePath,
        sourceType: doc.sourceType,
        contentHash: doc.contentHash,
        title: doc.title,
        paraFolder: doc.paraFolder,
        noteType: doc.noteType,
        domain: doc.domain,
        tags: JSON.stringify(doc.tags),
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
        indexedAt: doc.indexedAt,
        metadata: JSON.stringify(doc.metadata),
      })
  }

  getDocumentByPath(filePath: string): Document | null {
    const row = this.db
      .prepare('SELECT * FROM documents WHERE file_path = ?')
      .get(filePath) as Row | undefined
    return row ? rowToDocument(row) : null
  }

  getDocumentById(id: string): Document | null {
    const row = this.db.prepare('SELECT * FROM documents WHERE id = ?').get(id) as Row | undefined
    return row ? rowToDocument(row) : null
  }

  listDocuments(opts: { paraFolder?: string; domain?: string; limit?: number; offset?: number } = {}): Document[] {
    const conditions: string[] = []
    const params: Record<string, unknown> = {}

    if (opts.paraFolder) {
      conditions.push('para_folder = @paraFolder')
      params.paraFolder = opts.paraFolder
    }
    if (opts.domain) {
      conditions.push('domain = @domain')
      params.domain = opts.domain
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
    const limit = opts.limit ?? 50
    const offset = opts.offset ?? 0

    const rows = this.db
      .prepare(`SELECT * FROM documents ${where} ORDER BY indexed_at DESC LIMIT @limit OFFSET @offset`)
      .all({ ...params, limit, offset }) as Row[]

    return rows.map(rowToDocument)
  }

  deleteDocument(id: string): void {
    this.db.prepare('DELETE FROM documents WHERE id = ?').run(id)
  }

  countDocuments(): number {
    const row = this.db.prepare('SELECT COUNT(*) as count FROM documents').get() as { count: number }
    return row.count
  }

  /** Returns documents indexed since a given ISO timestamp */
  getDocumentsSince(since: string): Document[] {
    const rows = this.db
      .prepare('SELECT * FROM documents WHERE indexed_at >= ? ORDER BY indexed_at DESC')
      .all(since) as Row[]
    return rows.map(rowToDocument)
  }

  // ── Chunks ─────────────────────────────────────────────────────────────────

  insertChunks(chunks: ChunkRef[]): void {
    const insert = this.db.prepare(
      `INSERT INTO chunks (id, document_id, vector_id, chunk_index, char_start, char_end, heading, token_count, content_hash)
       VALUES (@id, @documentId, @vectorId, @chunkIndex, @charStart, @charEnd, @heading, @tokenCount, @contentHash)`,
    )
    const insertMany = this.db.transaction((cs: ChunkRef[]) => {
      for (const c of cs) insert.run(c)
    })
    insertMany(chunks)
  }

  deleteChunksByDocumentId(documentId: string): void {
    this.db.prepare('DELETE FROM chunks WHERE document_id = ?').run(documentId)
  }

  getChunksByVectorIds(vectorIds: number[]): ChunkRef[] {
    if (vectorIds.length === 0) return []
    const placeholders = vectorIds.map(() => '?').join(',')
    const rows = this.db
      .prepare(`SELECT * FROM chunks WHERE vector_id IN (${placeholders})`)
      .all(...vectorIds) as ChunkRow[]
    return rows.map(rowToChunk)
  }

  countChunks(): number {
    const row = this.db.prepare('SELECT COUNT(*) as count FROM chunks').get() as { count: number }
    return row.count
  }

  // ── Embedding cache ────────────────────────────────────────────────────────

  getCachedEmbedding(contentHash: string, model: string): number[] | null {
    const row = this.db
      .prepare('SELECT embedding FROM embedding_cache WHERE content_hash = ? AND model = ?')
      .get(contentHash, model) as { embedding: string } | undefined
    return row ? (JSON.parse(row.embedding) as number[]) : null
  }

  setCachedEmbedding(contentHash: string, model: string, embedding: number[]): void {
    this.db
      .prepare(
        `INSERT INTO embedding_cache (content_hash, model, embedding, created_at)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(content_hash) DO UPDATE SET embedding = excluded.embedding, model = excluded.model`,
      )
      .run(contentHash, model, JSON.stringify(embedding), new Date().toISOString())
  }

  clearEmbeddingCache(): number {
    const result = this.db.prepare('DELETE FROM embedding_cache').run()
    return result.changes
  }

  // ── Meta ───────────────────────────────────────────────────────────────────

  getMeta(key: string): string | null {
    const row = this.db.prepare('SELECT value FROM meta WHERE key = ?').get(key) as
      | { value: string }
      | undefined
    return row?.value ?? null
  }

  setMeta(key: string, value: string): void {
    this.db
      .prepare('INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value')
      .run(key, value)
  }

  close(): void {
    this.db.close()
  }
}

// ── Row mappers ───────────────────────────────────────────────────────────────

interface Row {
  id: string
  file_path: string
  source_type: string
  content_hash: string
  title: string
  para_folder: string | null
  note_type: string | null
  domain: string | null
  tags: string
  created_at: string | null
  updated_at: string | null
  indexed_at: string
  metadata: string
}

interface ChunkRow {
  id: string
  document_id: string
  vector_id: number
  chunk_index: number
  char_start: number
  char_end: number
  heading: string | null
  token_count: number
  content_hash: string
}

function rowToDocument(row: Row): Document {
  return {
    id: row.id,
    filePath: row.file_path,
    sourceType: row.source_type as Document['sourceType'],
    contentHash: row.content_hash,
    title: row.title,
    paraFolder: row.para_folder as Document['paraFolder'],
    noteType: row.note_type,
    domain: row.domain,
    tags: JSON.parse(row.tags) as string[],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    indexedAt: row.indexed_at,
    metadata: JSON.parse(row.metadata) as Record<string, unknown>,
  }
}

function rowToChunk(row: ChunkRow): ChunkRef {
  return {
    id: row.id,
    documentId: row.document_id,
    vectorId: row.vector_id,
    chunkIndex: row.chunk_index,
    charStart: row.char_start,
    charEnd: row.char_end,
    heading: row.heading,
    tokenCount: row.token_count,
    contentHash: row.content_hash,
  }
}
