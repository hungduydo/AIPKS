import type { SearchResult } from '@aipks/core'
import { relative } from 'node:path'

const TOKEN_BUDGET = 3000
const AVG_CHARS_PER_TOKEN = 4

export class ContextBuilder {
  private brainRoot: string

  constructor(brainRoot: string) {
    this.brainRoot = brainRoot
  }

  build(results: SearchResult[]): string {
    let budget = TOKEN_BUDGET * AVG_CHARS_PER_TOKEN
    const parts: string[] = []

    for (const r of results) {
      const relPath = relative(this.brainRoot, r.document.filePath)
      const section = r.chunkRef.heading ?? ''
      const header = section ? `[${relPath} | ${section}]` : `[${relPath}]`
      const block = `${header}\n${r.chunkText}`

      if (block.length > budget && parts.length > 0) break

      parts.push(block)
      budget -= block.length + 2 // +2 for \n\n separator
    }

    return parts.join('\n\n')
  }
}
