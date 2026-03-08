import 'dotenv/config'
import { loadConfig, logger } from '@aipks/core'
import { getContainer } from './container.js'
import { createServer } from './server.js'

async function main() {
  const config = loadConfig()
  const container = getContainer()
  const app = await createServer(container)

  try {
    await app.listen({ port: config.apiPort, host: '0.0.0.0' })
    logger.info({ port: config.apiPort }, 'AIPKS API server started')
  } catch (err) {
    logger.error(err, 'Failed to start server')
    process.exit(1)
  }

  process.on('SIGTERM', async () => {
    logger.info('Shutting down...')
    container.hnsw.persist()
    container.store.close()
    await app.close()
    process.exit(0)
  })
}

main()
