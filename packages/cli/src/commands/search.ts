import { Command } from 'commander'
import chalk from 'chalk'
import Table from 'cli-table3'
import { relative } from 'node:path'
import { getCliContainer } from '../container.js'

export const searchCommand = new Command('search')
  .description('Semantic search across the knowledge base')
  .argument('<query>', 'search query')
  .option('-k, --top-k <n>', 'number of results', '5')
  .option('-s, --para-folder <folder>', 'filter by PARA folder')
  .option('-d, --domain <domain>', 'filter by domain')
  .option('--min-score <n>', 'minimum similarity score (0-1)', '0.7')
  .option('--json', 'output as JSON')
  .action(async (query: string, opts) => {
    const { retriever, brainRoot } = getCliContainer()

    const results = await retriever.retrieve(query, {
      topK: parseInt(opts.topK),
      minScore: parseFloat(opts.minScore),
      paraFolder: opts.paraFolder,
      domain: opts.domain,
    })

    if (opts.json) {
      console.log(JSON.stringify(results, null, 2))
      return
    }

    if (results.length === 0) {
      console.log(chalk.yellow('No results found.'))
      return
    }

    const table = new Table({
      head: [
        chalk.bold('Score'),
        chalk.bold('Title'),
        chalk.bold('Path'),
        chalk.bold('Section'),
      ],
      colWidths: [8, 30, 40, 20],
      wordWrap: true,
    })

    for (const r of results) {
      const relPath = relative(brainRoot, r.document.filePath)
      table.push([
        chalk.green((r.score * 100).toFixed(0) + '%'),
        r.document.title,
        relPath,
        r.chunkRef.heading ?? '—',
      ])
    }

    console.log(table.toString())
    console.log(chalk.dim(`\n${results.length} result(s) for "${query}"`))
  })
