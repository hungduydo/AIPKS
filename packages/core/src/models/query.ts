import type { ChunkRef } from './chunk.js'
import type { Document } from './document.js'

export interface SearchResult {
  chunkRef: ChunkRef
  document: Document
  /** Resolved from disk at query time: fs.readFile(filePath).slice(charStart, charEnd) */
  chunkText: string
  /** Cosine similarity score [0, 1] */
  score: number
}

export interface AskRequest {
  question: string
  topK?: number
  minScore?: number
  paraFolder?: string
  domain?: string
  tags?: string[]
  stream?: boolean
}

export interface QueryResponse {
  answer: string
  sources: SearchResult[]
  tokensUsed: number
  model: string
}

export interface IngestRequest {
  uri: string
  type?: 'markdown' | 'web' | 'notion' | 'github'
  label?: string
}

export interface IngestResult {
  documentId: string
  filePath: string
  chunkCount: number
  skipped: boolean
  reason?: string
}
