import { Command } from 'commander'
import chalk from 'chalk'
import Table from 'cli-table3'
import { relative } from 'node:path'
import { getCliContainer } from '../container.js'

export const listCommand = new Command('list')
  .description('List indexed documents')
  .option('-s, --para-folder <folder>', 'filter by PARA folder')
  .option('-d, --domain <domain>', 'filter by domain')
  .option('-l, --limit <n>', 'max results', '20')
  .option('--json', 'output as JSON')
  .action(async (opts) => {
    const { store, brainRoot } = getCliContainer()

    const docs = store.listDocuments({
      paraFolder: opts.paraFolder,
      domain: opts.domain,
      limit: parseInt(opts.limit),
    })

    if (opts.json) {
      console.log(JSON.stringify(docs, null, 2))
      return
    }

    if (docs.length === 0) {
      console.log(chalk.yellow('No documents indexed yet. Run `aipks add <path>` to get started.'))
      return
    }

    const table = new Table({
      head: [chalk.bold('Title'), chalk.bold('Folder'), chalk.bold('Domain'), chalk.bold('Tags'), chalk.bold('Indexed')],
      colWidths: [30, 12, 14, 20, 14],
      wordWrap: true,
    })

    for (const doc of docs) {
      table.push([
        doc.title,
        doc.paraFolder ?? '—',
        doc.domain ?? '—',
        doc.tags.join(', ') || '—',
        doc.indexedAt.slice(0, 10),
      ])
    }

    console.log(table.toString())
    console.log(chalk.dim(`\nTotal: ${store.countDocuments()} documents`))
  })
