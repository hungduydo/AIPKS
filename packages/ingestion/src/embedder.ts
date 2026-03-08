import OpenAI from 'openai'
import { withRetry, logger } from '@aipks/core'
import type { MetadataStore } from '@aipks/vector-store'
import type { RawChunk } from './chunker.js'

const BATCH_SIZE = 100

export interface EmbeddedChunk extends RawChunk {
  embedding: number[]
}

export class Embedder {
  private client: OpenAI
  private model: string
  private store: MetadataStore

  constructor(apiKey: string, model: string, store: MetadataStore) {
    this.client = new OpenAI({ apiKey })
    this.model = model
    this.store = store
  }

  async embedBatch(chunks: RawChunk[]): Promise<EmbeddedChunk[]> {
    const result: EmbeddedChunk[] = []
    const uncached: { chunk: RawChunk; index: number }[] = []

    // 1. Check cache
    for (let i = 0; i < chunks.length; i++) {
      const cached = this.store.getCachedEmbedding(chunks[i].contentHash, this.model)
      if (cached) {
        result[i] = { ...chunks[i], embedding: cached }
      } else {
        uncached.push({ chunk: chunks[i], index: i })
      }
    }

    if (uncached.length === 0) return result

    logger.debug({ count: uncached.length, model: this.model }, 'Fetching embeddings from OpenAI')

    // 2. Batch API calls
    for (let b = 0; b < uncached.length; b += BATCH_SIZE) {
      const batch = uncached.slice(b, b + BATCH_SIZE)
      const texts = batch.map((u) => u.chunk.content)

      const response = await withRetry(
        () => this.client.embeddings.create({ model: this.model, input: texts }),
        { maxAttempts: 4, initialDelayMs: 1000 },
      )

      for (let j = 0; j < batch.length; j++) {
        const embedding = response.data[j].embedding
        const { chunk, index } = batch[j]

        this.store.setCachedEmbedding(chunk.contentHash, this.model, embedding)
        result[index] = { ...chunk, embedding }
      }
    }

    return result
  }
}
