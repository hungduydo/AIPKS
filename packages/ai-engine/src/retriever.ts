import { readFileSync } from 'node:fs'
import OpenAI from 'openai'
import { withRetry } from '@aipks/core'
import type { SearchResult } from '@aipks/core'
import type { MetadataStore, HnswAdapter } from '@aipks/vector-store'

export interface RetrieveOptions {
  topK?: number
  minScore?: number
  paraFolder?: string
  domain?: string
  tags?: string[]
}

export class Retriever {
  private client: OpenAI
  private model: string
  private store: MetadataStore
  private hnsw: HnswAdapter

  constructor(apiKey: string, embeddingModel: string, store: MetadataStore, hnsw: HnswAdapter) {
    this.client = new OpenAI({ apiKey })
    this.model = embeddingModel
    this.store = store
    this.hnsw = hnsw
  }

  async retrieve(query: string, opts: RetrieveOptions = {}): Promise<SearchResult[]> {
    const { topK = 10, minScore = 0.7, paraFolder, domain, tags } = opts

    // Embed the query
    const response = await withRetry(
      () => this.client.embeddings.create({ model: this.model, input: query }),
      { maxAttempts: 3 },
    )
    const queryEmbedding = response.data[0].embedding

    // Vector search
    const hits = this.hnsw.search(queryEmbedding, topK * 2)

    // Filter by score
    const filtered = hits.filter((h) => h.score >= minScore)

    // Hydrate from SQLite
    const vectorIds = filtered.map((h) => h.vectorId)
    const chunkRefs = this.store.getChunksByVectorIds(vectorIds)

    const scoreMap = new Map(filtered.map((h) => [h.vectorId, h.score]))
    const results: SearchResult[] = []

    for (const chunkRef of chunkRefs) {
      const doc = this.store.getDocumentById(chunkRef.documentId)
      if (!doc) continue

      // Apply metadata filters
      if (paraFolder && doc.paraFolder !== paraFolder) continue
      if (domain && doc.domain !== domain) continue
      if (tags && tags.length > 0 && !tags.some((t) => doc.tags.includes(t))) continue

      // Read chunk text from disk
      let chunkText = ''
      try {
        const fileContent = readFileSync(doc.filePath, 'utf8')
        chunkText = fileContent.slice(chunkRef.charStart, chunkRef.charEnd)
      } catch {
        continue // skip if file no longer exists
      }

      results.push({
        chunkRef,
        document: doc,
        chunkText,
        score: scoreMap.get(chunkRef.vectorId) ?? 0,
      })
    }

    // Sort by score and return top-K
    return results.sort((a, b) => b.score - a.score).slice(0, topK)
  }
}
