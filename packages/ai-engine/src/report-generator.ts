import { writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import OpenAI from 'openai'
import { withRetry, logger } from '@aipks/core'
import type { Document } from '@aipks/core'
import type { MetadataStore } from '@aipks/vector-store'
import { REPORT_PROMPT } from './prompts.js'

export interface DailyReportResult {
  date: string
  reportPath: string
  content: string
  documentsIncluded: number
}

export class ReportGenerator {
  private client: OpenAI
  private chatModel: string
  private store: MetadataStore
  private outputFolder: string

  constructor(opts: {
    apiKey: string
    chatModel: string
    store: MetadataStore
    outputFolder: string
  }) {
    this.client = new OpenAI({ apiKey: opts.apiKey })
    this.chatModel = opts.chatModel
    this.store = opts.store
    this.outputFolder = opts.outputFolder
  }

  async generate(date?: Date): Promise<DailyReportResult> {
    const targetDate = date ?? new Date()
    const dateStr = targetDate.toISOString().slice(0, 10)

    // Get documents indexed in the last 24 hours
    const since = new Date(targetDate)
    since.setHours(0, 0, 0, 0)
    const docs = this.store.getDocumentsSince(since.toISOString())

    logger.info({ date: dateStr, count: docs.length }, 'Generating daily report')

    const changes = formatChanges(docs)
    const prompt = REPORT_PROMPT.replace('{changes}', changes || 'No notes added or updated today.')

    const response = await withRetry(
      () =>
        this.client.chat.completions.create({
          model: this.chatModel,
          temperature: 0.3,
          messages: [{ role: 'user', content: prompt }],
        }),
      { maxAttempts: 3 },
    )

    const reportBody = response.choices[0].message.content ?? ''

    const frontmatter = `---
id: ${dateStr}-daily-report
type: report
created: ${dateStr}
---\n\n`

    const content = `${frontmatter}# Daily Brain Report — ${dateStr}\n\n${reportBody}\n`

    // Save to brain/inbox/reports/
    mkdirSync(this.outputFolder, { recursive: true })
    const reportPath = join(this.outputFolder, `${dateStr}.md`)
    writeFileSync(reportPath, content, 'utf8')

    logger.info({ reportPath }, 'Daily report saved')

    return {
      date: dateStr,
      reportPath,
      content,
      documentsIncluded: docs.length,
    }
  }
}

function formatChanges(docs: Document[]): string {
  if (docs.length === 0) return ''

  return docs
    .map((d) => {
      const folder = d.paraFolder ?? 'unknown'
      const domain = d.domain ? ` [${d.domain}]` : ''
      const tags = d.tags.length > 0 ? ` (${d.tags.join(', ')})` : ''
      return `- ${d.title}${domain}${tags} — ${folder}/`
    })
    .join('\n')
}
