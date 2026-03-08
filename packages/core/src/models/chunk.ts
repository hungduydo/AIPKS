/**
 * Pointer to a chunk within an original file.
 * Content is NOT stored — read from disk at query time via charStart/charEnd.
 */
export interface ChunkRef {
  id: string
  documentId: string
  /** Integer label used in hnswlib (bridge between vector DB and SQLite) */
  vectorId: number
  /** Position of this chunk within the document */
  chunkIndex: number
  /** Byte offset start in the original file */
  charStart: number
  /** Byte offset end in the original file */
  charEnd: number
  /** Nearest H2/H3 heading above this chunk, e.g. "## Notes" */
  heading: string | null
  tokenCount: number
  /** SHA-256 of chunk text — used for embedding cache lookup */
  contentHash: string
}
