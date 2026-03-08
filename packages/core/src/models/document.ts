import type { ParaFolder, SourceType } from './source.js'

/**
 * Index record for a note. Does NOT store body content —
 * the original file on disk is the source of truth.
 */
export interface Document {
  id: string
  /** Absolute path to the .md file (or URL for web/notion/github) */
  filePath: string
  sourceType: SourceType
  /** SHA-256 of file content — used for dedup/change detection */
  contentHash: string
  title: string
  /** PARA folder derived from directory path */
  paraFolder: ParaFolder | null
  /** frontmatter `type` field */
  noteType: string | null
  /** frontmatter `domain` field */
  domain: string | null
  tags: string[]
  /** frontmatter `created` */
  createdAt: string | null
  /** frontmatter `updated` */
  updatedAt: string | null
  /** When AIPKS last indexed this file */
  indexedAt: string
  /** All other frontmatter fields */
  metadata: Record<string, unknown>
}
