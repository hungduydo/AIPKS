export type SourceType = 'markdown' | 'web' | 'notion' | 'github'

export type ParaFolder = 'inbox' | 'projects' | 'areas' | 'resources' | 'archive'

export interface Source {
  id: string
  type: SourceType
  /** Absolute file path, URL, Notion page/database ID, or "owner/repo" */
  uri: string
  label?: string
  createdAt: string
  lastSyncedAt: string | null
}
