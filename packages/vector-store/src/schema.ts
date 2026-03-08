import type Database from 'better-sqlite3'

export function applyMigrations(db: Database.Database): void {
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  db.exec(`
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      file_path TEXT NOT NULL UNIQUE,
      source_type TEXT NOT NULL,
      content_hash TEXT NOT NULL,
      title TEXT NOT NULL,
      para_folder TEXT,
      note_type TEXT,
      domain TEXT,
      tags TEXT NOT NULL DEFAULT '[]',
      created_at TEXT,
      updated_at TEXT,
      indexed_at TEXT NOT NULL,
      metadata TEXT NOT NULL DEFAULT '{}'
    );

    CREATE INDEX IF NOT EXISTS idx_documents_file_path ON documents(file_path);
    CREATE INDEX IF NOT EXISTS idx_documents_para_folder ON documents(para_folder);
    CREATE INDEX IF NOT EXISTS idx_documents_domain ON documents(domain);
    CREATE INDEX IF NOT EXISTS idx_documents_indexed_at ON documents(indexed_at);

    CREATE TABLE IF NOT EXISTS chunks (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
      vector_id INTEGER NOT NULL UNIQUE,
      chunk_index INTEGER NOT NULL,
      char_start INTEGER NOT NULL,
      char_end INTEGER NOT NULL,
      heading TEXT,
      token_count INTEGER NOT NULL,
      content_hash TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_chunks_document_id ON chunks(document_id);
    CREATE INDEX IF NOT EXISTS idx_chunks_vector_id ON chunks(vector_id);

    CREATE TABLE IF NOT EXISTS embedding_cache (
      content_hash TEXT PRIMARY KEY,
      embedding TEXT NOT NULL,
      model TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sources (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      uri TEXT NOT NULL UNIQUE,
      label TEXT,
      created_at TEXT NOT NULL,
      last_synced_at TEXT
    );

    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `)
}
