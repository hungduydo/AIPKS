import { Command } from 'commander'
import chalk from 'chalk'

export const serveCommand = new Command('serve')
  .description('Start the AIPKS API server')
  .option('-p, --port <port>', 'port to listen on')
  .action(async (opts) => {
    if (opts.port) process.env.API_PORT = opts.port

    const { loadConfig } = await import('@aipks/core')
    const { getContainer } = await import('@aipks/api')
    const { createServer } = await import('@aipks/api')

    const config = loadConfig()
    const container = getContainer()
    const app = await createServer(container)

    await app.listen({ port: config.apiPort, host: '0.0.0.0' })
    console.log(chalk.green(`API running at http://localhost:${config.apiPort}`))

    process.on('SIGINT', async () => {
      container.hnsw.persist()
      container.store.close()
      await app.close()
      process.exit(0)
    })
  })
