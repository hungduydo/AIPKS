import Fastify, { type FastifyInstance } from 'fastify'
import cors from '@fastify/cors'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import type { Container } from './container.js'
import { registerIngestRoutes } from './routes/ingest.js'
import { registerSearchRoutes } from './routes/search.js'
import { registerAskRoutes } from './routes/ask.js'
import { registerDocumentRoutes } from './routes/documents.js'
import { registerReportRoutes } from './routes/reports.js'
import { registerStatusRoutes } from './routes/status.js'

export async function createServer(container: Container): Promise<FastifyInstance> {
  const app = Fastify({ logger: true })

  await app.register(cors, { origin: true })

  await app.register(swagger, {
    openapi: {
      info: {
        title: 'AIPKS API',
        description: 'AI Personal Knowledge System — semantic search & RAG over your PARA Markdown vault',
        version: '0.1.0',
      },
      tags: [
        { name: 'Ingest', description: 'Index notes into the knowledge base' },
        { name: 'Search', description: 'Semantic search over indexed notes' },
        { name: 'Ask', description: 'AI-powered Q&A with RAG' },
        { name: 'Documents', description: 'Manage indexed documents' },
        { name: 'Reports', description: 'Daily digest reports' },
        { name: 'Status', description: 'System health and stats' },
      ],
    },
  })

  await app.register(swaggerUi, {
    routePrefix: '/docs',
  })

  // Register all route groups
  registerIngestRoutes(app, container)
  registerSearchRoutes(app, container)
  registerAskRoutes(app, container)
  registerDocumentRoutes(app, container)
  registerReportRoutes(app, container)
  registerStatusRoutes(app, container)

  return app
}
