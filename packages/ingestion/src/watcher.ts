import chokidar from 'chokidar'
import { logger } from '@aipks/core'
import type { IngestionPipeline } from './pipeline.js'

export class FileWatcher {
  private pipeline: IngestionPipeline
  private watcher: ReturnType<typeof chokidar.watch> | null = null
  private debounceTimers = new Map<string, ReturnType<typeof setTimeout>>()

  constructor(pipeline: IngestionPipeline) {
    this.pipeline = pipeline
  }

  watch(folder: string, debounceMs = 500): void {
    this.watcher = chokidar.watch(folder, {
      ignored: /node_modules|\.git|data\//,
      persistent: true,
      ignoreInitial: true,
    })

    this.watcher
      .on('add', (path) => this.schedule(path, 'add'))
      .on('change', (path) => this.schedule(path, 'change'))
      .on('unlink', (path) => {
        logger.info({ path }, 'File removed — note: manual deletion from index not yet implemented')
      })
      .on('error', (err) => logger.error({ err }, 'Watcher error'))

    logger.info({ folder }, 'Watching for file changes')
  }

  stop(): void {
    this.watcher?.close()
    for (const timer of this.debounceTimers.values()) clearTimeout(timer)
    this.debounceTimers.clear()
  }

  private schedule(filePath: string, event: string): void {
    if (!filePath.endsWith('.md')) return

    const existing = this.debounceTimers.get(filePath)
    if (existing) clearTimeout(existing)

    this.debounceTimers.set(
      filePath,
      setTimeout(async () => {
        this.debounceTimers.delete(filePath)
        logger.info({ filePath, event }, 'Re-indexing changed file')
        await this.pipeline.ingestFile(filePath).catch((err) => {
          logger.error({ err, filePath }, 'Failed to re-index file')
        })
      }, 500),
    )
  }
}
