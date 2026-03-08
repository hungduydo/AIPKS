import { readFileSync, statSync, readdirSync } from 'node:fs'
import { resolve, extname, relative, basename } from 'node:path'
import matter from 'gray-matter'
import { sha256, generateId, logger } from '@aipks/core'
import type { Document, ParaFolder } from '@aipks/core'

const PARA_FOLDERS = ['inbox', 'projects', 'areas', 'resources', 'archive'] as const

export interface ParsedFile {
  document: Document
  rawText: string
}

export function parseMarkdownFile(filePath: string, brainRoot: string): ParsedFile {
  const absPath = resolve(filePath)
  const content = readFileSync(absPath, 'utf8')
  const { data: fm, content: body } = matter(content)

  const title = extractTitle(body, fm, absPath)
  const paraFolder = detectParaFolder(absPath, brainRoot)
  const contentHash = sha256(content)

  const doc: Document = {
    id: typeof fm.id === 'string' ? fm.id : generateId(),
    filePath: absPath,
    sourceType: 'markdown',
    contentHash,
    title,
    paraFolder,
    noteType: typeof fm.type === 'string' ? fm.type : null,
    domain: typeof fm.domain === 'string' ? fm.domain : null,
    tags: Array.isArray(fm.tags) ? fm.tags.map(String) : [],
    createdAt: fm.created ? String(fm.created) : null,
    updatedAt: fm.updated ? String(fm.updated) : null,
    indexedAt: new Date().toISOString(),
    metadata: stripKnownFields(fm),
  }

  // The full file content (including frontmatter) is the reference text.
  // We index the full content so charStart/charEnd offsets are accurate
  // relative to the raw file bytes.
  return { document: doc, rawText: content }
}

export function collectMarkdownFiles(pathOrDir: string): string[] {
  const abs = resolve(pathOrDir)
  let stat: ReturnType<typeof statSync>
  try {
    stat = statSync(abs)
  } catch {
    logger.warn({ path: abs }, 'Path does not exist, skipping')
    return []
  }

  if (stat.isFile()) {
    return extname(abs) === '.md' ? [abs] : []
  }

  const files: string[] = []
  collectRecursive(abs, files)
  return files
}

function collectRecursive(dir: string, acc: string[]): void {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = resolve(dir, entry.name)
    if (entry.isDirectory()) {
      collectRecursive(full, acc)
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      acc.push(full)
    }
  }
}

function extractTitle(body: string, fm: Record<string, unknown>, filePath: string): string {
  if (typeof fm.title === 'string' && fm.title) return fm.title
  const h1 = body.match(/^#\s+(.+)/m)
  if (h1) return h1[1].trim()
  return basename(filePath, '.md')
}

function detectParaFolder(absPath: string, brainRoot: string): ParaFolder | null {
  const rel = relative(resolve(brainRoot), absPath)
  const first = rel.split('/')[0]
  if ((PARA_FOLDERS as readonly string[]).includes(first)) {
    return first as ParaFolder
  }
  return null
}

function stripKnownFields(fm: Record<string, unknown>): Record<string, unknown> {
  const known = new Set(['id', 'type', 'domain', 'tags', 'created', 'updated', 'title'])
  return Object.fromEntries(Object.entries(fm).filter(([k]) => !known.has(k)))
}
