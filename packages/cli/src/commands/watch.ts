import { Command } from 'commander'
import chalk from 'chalk'
import { getCliContainer } from '../container.js'
import { FileWatcher } from '@aipks/ingestion'

export const watchCommand = new Command('watch')
  .description('Watch a folder for changes and auto-reindex')
  .argument('[folder]', 'folder to watch (default: brain folder from config)')
  .action(async (folder?: string) => {
    const { pipeline, brainRoot } = getCliContainer()
    const target = folder ?? brainRoot

    const watcher = new FileWatcher(pipeline)
    watcher.watch(target)

    console.log(chalk.green(`Watching ${chalk.cyan(target)} for changes...`))
    console.log(chalk.dim('Press Ctrl+C to stop'))

    pipeline.on('event', (event: any) => {
      if (event.type === 'done' && !event.result.skipped) {
        console.log(chalk.green(`✓ Re-indexed: ${shorten(event.result.filePath)} (${event.result.chunkCount} chunks)`))
      }
    })

    process.on('SIGINT', () => {
      watcher.stop()
      console.log(chalk.yellow('\nStopped watching.'))
      process.exit(0)
    })
  })

function shorten(path: string): string {
  const parts = path.split('/')
  return parts.slice(-2).join('/')
}
