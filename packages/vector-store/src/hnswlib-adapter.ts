import { createRequire } from 'node:module'
import { mkdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { logger } from '@aipks/core'

// hnswlib-node is CommonJS only; use createRequire for ESM compatibility
const _require = createRequire(import.meta.url)

interface HnswIndex {
  initIndex(maxElements: number): void
  readIndexSync(path: string, allowReplaceDeleted?: boolean): void
  writeIndexSync(path: string): void
  addPoint(point: number[], label: number): void
  markDelete(label: number): void
  searchKnn(query: number[], k: number): { neighbors: number[]; distances: number[] }
  getCurrentCount(): number
}

interface HnswLibModule {
  HierarchicalNSW: new (space: string, dim: number) => HnswIndex
}

const hnswlib = _require('hnswlib-node') as HnswLibModule

const SPACE = 'cosine'
const DIMENSIONS = 1536 // text-embedding-3-small
const DEFAULT_MAX_ELEMENTS = 100_000

export class HnswAdapter {
  private index: HnswIndex
  private indexPath: string
  private maxElements: number
  private nextVectorId: number = 0
  private initialized = false

  constructor(storePath: string, maxElements = DEFAULT_MAX_ELEMENTS) {
    mkdirSync(storePath, { recursive: true })
    this.indexPath = join(storePath, 'index.bin')
    this.maxElements = maxElements
    this.index = new hnswlib.HierarchicalNSW(SPACE, DIMENSIONS)
  }

  initialize(currentMaxVectorId: number = 0): void {
    if (this.initialized) return

    if (existsSync(this.indexPath)) {
      this.index.readIndexSync(this.indexPath, true)
      logger.debug({ path: this.indexPath }, 'Loaded existing hnswlib index')
    } else {
      this.index.initIndex(this.maxElements)
      logger.debug({ path: this.indexPath }, 'Created new hnswlib index')
    }

    this.nextVectorId = currentMaxVectorId + 1
    this.initialized = true
  }

  addPoints(embeddings: { vectorId: number; embedding: number[] }[]): void {
    this.ensureInitialized()
    for (const { vectorId, embedding } of embeddings) {
      this.index.addPoint(embedding, vectorId)
      if (vectorId >= this.nextVectorId) {
        this.nextVectorId = vectorId + 1
      }
    }
  }

  allocateVectorId(): number {
    this.ensureInitialized()
    return this.nextVectorId++
  }

  search(queryEmbedding: number[], topK: number): { vectorId: number; score: number }[] {
    this.ensureInitialized()
    const count = Math.min(topK, this.index.getCurrentCount())
    if (count === 0) return []

    const result = this.index.searchKnn(queryEmbedding, count)
    return result.neighbors.map((vectorId: number, i: number) => ({
      vectorId,
      // hnswlib cosine space returns distances; convert to similarity score
      score: 1 - result.distances[i],
    }))
  }

  removePoints(vectorIds: number[]): void {
    this.ensureInitialized()
    for (const id of vectorIds) {
      try {
        this.index.markDelete(id)
      } catch {
        // ignore if already deleted
      }
    }
  }

  persist(): void {
    this.ensureInitialized()
    this.index.writeIndexSync(this.indexPath)
    logger.debug({ path: this.indexPath }, 'Persisted hnswlib index')
  }

  getCurrentCount(): number {
    return this.initialized ? this.index.getCurrentCount() : 0
  }

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('HnswAdapter not initialized. Call initialize() first.')
    }
  }
}
