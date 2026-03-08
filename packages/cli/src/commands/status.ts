import { Command } from 'commander'
import chalk from 'chalk'
import { getCliContainer } from '../container.js'

export const statusCommand = new Command('status')
  .description('Show knowledge base statistics')
  .action(async () => {
    const { store, hnsw } = getCliContainer()

    const docs = store.countDocuments()
    const chunks = store.countChunks()
    const vectors = hnsw.getCurrentCount()
    const lastReport = store.getMeta('lastReportDate')
    const embeddingModel = store.getMeta('embeddingModel') ?? 'text-embedding-3-small'

    console.log(chalk.bold('\n AIPKS Knowledge Base Status\n'))
    console.log(`  ${chalk.cyan('Documents')}: ${docs}`)
    console.log(`  ${chalk.cyan('Chunks')}:    ${chunks}`)
    console.log(`  ${chalk.cyan('Vectors')}:   ${vectors}`)
    console.log(`  ${chalk.cyan('Model')}:     ${embeddingModel}`)
    if (lastReport) {
      console.log(`  ${chalk.cyan('Last report')}: ${lastReport}`)
    }
    console.log()
  })
