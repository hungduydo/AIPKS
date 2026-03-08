import type { FastifyInstance } from 'fastify'
import type { Container } from '../container.js'

export function registerStatusRoutes(app: FastifyInstance, { store, hnsw }: Container) {
  app.get(
    '/api/status',
    {
      schema: {
        tags: ['Status'],
        summary: 'System status',
        description: 'Get system health, document count, and vector store stats',
        response: {
          200: {
            type: 'object',
            properties: {
              documents: { type: 'number' },
              chunks: { type: 'number' },
              vectorCount: { type: 'number' },
              lastReport: { type: 'string', nullable: true },
              embeddingModel: { type: 'string', nullable: true },
            },
          },
        },
      },
    },
    async (_req, reply) => {
      return reply.send({
        documents: store.countDocuments(),
        chunks: store.countChunks(),
        vectorCount: hnsw.getCurrentCount(),
        lastReport: store.getMeta('lastReportDate'),
        embeddingModel: store.getMeta('embeddingModel'),
      })
    },
  )
}
