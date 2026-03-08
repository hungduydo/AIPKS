import { Command } from 'commander'
import ora from 'ora'
import chalk from 'chalk'
import { getCliContainer } from '../container.js'
import type { PipelineEvent } from '@aipks/ingestion'

export const addCommand = new Command('add')
  .description('Ingest a file, directory, or URL into the knowledge base')
  .argument('<path>', 'file path or directory to ingest')
  .action(async (path: string) => {
    const { pipeline } = getCliContainer()
    const spinner = ora('Preparing...').start()
    let totalDocs = 0
    let totalChunks = 0
    let skipped = 0

    pipeline.on('event', (event: PipelineEvent) => {
      switch (event.type) {
        case 'fetch':
          spinner.text = `Fetching ${chalk.cyan(shorten(event.filePath))}`
          break
        case 'skip':
          skipped++
          break
        case 'chunk':
          spinner.text = `Chunking ${chalk.cyan(shorten(event.filePath))} → ${event.count} chunks`
          break
        case 'embed':
          spinner.text = `Embedding ${event.count} chunks (${event.cached} cached)`
          break
        case 'store':
          totalDocs++
          totalChunks += event.count
          break
        case 'error':
          spinner.warn(chalk.red(`Error: ${event.filePath}`))
          break
      }
    })

    try {
      await pipeline.ingestPath(path)
      spinner.succeed(
        chalk.green(
          `Done! ${totalDocs} notes indexed, ${totalChunks} chunks stored` +
            (skipped > 0 ? `, ${skipped} unchanged (skipped)` : ''),
        ),
      )
    } catch (err) {
      spinner.fail(chalk.red(`Failed: ${err}`))
      process.exit(1)
    }
  })

function shorten(path: string): string {
  const parts = path.split('/')
  return parts.slice(-2).join('/')
}
