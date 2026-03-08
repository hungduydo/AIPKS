import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters'
import { sha256 } from '@aipks/core'

export interface RawChunk {
  content: string
  chunkIndex: number
  /** Byte offset start within the full document text */
  charStart: number
  /** Byte offset end within the full document text */
  charEnd: number
  heading: string | null
  contentHash: string
  tokenCount: number
}

const HEADING_RE = /^#{1,3} .+/m

/**
 * Splits document text into overlapping chunks and records
 * the charStart/charEnd offsets so we can retrieve text from
 * disk without storing it ourselves.
 */
export class Chunker {
  private splitter: RecursiveCharacterTextSplitter

  constructor(chunkSize = 512, chunkOverlap = 64) {
    this.splitter = new RecursiveCharacterTextSplitter({
      chunkSize,
      chunkOverlap,
      separators: ['\n## ', '\n### ', '\n\n', '\n', ' ', ''],
    })
  }

  async split(text: string): Promise<RawChunk[]> {
    const docs = await this.splitter.createDocuments([text])

    const chunks: RawChunk[] = []
    let searchFrom = 0

    for (let i = 0; i < docs.length; i++) {
      const content = docs[i].pageContent
      const charStart = text.indexOf(content, searchFrom)
      const charEnd = charStart + content.length

      // Find nearest heading before this chunk
      const preceding = text.slice(0, charStart)
      const headingMatches = [...preceding.matchAll(new RegExp(HEADING_RE, 'gm'))]
      const heading =
        headingMatches.length > 0 ? headingMatches[headingMatches.length - 1][0].trim() : null

      chunks.push({
        content,
        chunkIndex: i,
        charStart: Math.max(0, charStart),
        charEnd,
        heading,
        contentHash: sha256(content),
        tokenCount: estimateTokens(content),
      })

      searchFrom = charStart + 1
    }

    return chunks
  }
}

/** Rough token estimate: ~4 chars per token for English */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}
