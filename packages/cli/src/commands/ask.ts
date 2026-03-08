import { Command } from 'commander'
import chalk from 'chalk'
import { relative } from 'node:path'
import { getCliContainer } from '../container.js'

export const askCommand = new Command('ask')
  .description('Ask a question answered from your knowledge base (RAG)')
  .argument('<question>', 'your question')
  .option('-k, --top-k <n>', 'context chunks to retrieve', '5')
  .option('-s, --para-folder <folder>', 'filter context by PARA folder')
  .option('-d, --domain <domain>', 'filter context by domain')
  .option('--no-stream', 'wait for full answer before printing')
  .option('--citations', 'show source citations after answer')
  .action(async (question: string, opts) => {
    const { queryEngine, brainRoot } = getCliContainer()

    const req = {
      question,
      topK: parseInt(opts.topK),
      paraFolder: opts.paraFolder,
      domain: opts.domain,
    }

    if (opts.stream) {
      process.stdout.write(chalk.cyan('AIPKS: '))
      let fullAnswer = ''
      for await (const delta of queryEngine.askStream(req)) {
        process.stdout.write(delta)
        fullAnswer += delta
      }
      process.stdout.write('\n')

      if (opts.citations) {
        // Re-run retrieval to get sources for citations
        const response = await queryEngine.ask({ ...req, topK: parseInt(opts.topK) })
        printCitations(response.sources, brainRoot)
      }
    } else {
      const response = await queryEngine.ask(req)
      console.log(chalk.cyan('AIPKS: ') + response.answer)

      if (opts.citations) {
        printCitations(response.sources, brainRoot)
      }
    }
  })

function printCitations(sources: any[], brainRoot: string) {
  if (sources.length === 0) return
  console.log(chalk.dim('\n─── Sources ────────────────────────────'))
  for (let i = 0; i < sources.length; i++) {
    const s = sources[i]
    const relPath = relative(brainRoot, s.document.filePath)
    const section = s.chunkRef.heading ? ` › ${s.chunkRef.heading}` : ''
    console.log(chalk.dim(`[${i + 1}] ${relPath}${section} (${(s.score * 100).toFixed(0)}%)`))
  }
}
