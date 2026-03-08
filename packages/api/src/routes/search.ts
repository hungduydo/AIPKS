import type { FastifyInstance } from 'fastify'
import type { Container } from '../container.js'

export function registerSearchRoutes(app: FastifyInstance, { queryEngine }: Container) {
  app.get<{
    Querystring: { q: string; topK?: string; paraFolder?: string; domain?: string; minScore?: string }
  }>(
    '/api/search',
    {
      schema: {
        tags: ['Search'],
        summary: 'Semantic search',
        description: 'Search indexed notes using semantic similarity',
        querystring: {
          type: 'object',
          required: ['q'],
          properties: {
            q: { type: 'string', description: 'Search query' },
            topK: { type: 'string', description: 'Max results (default: 5)' },
            minScore: { type: 'string', description: 'Minimum similarity score (default: 0.7)' },
            paraFolder: { type: 'string', description: 'Filter by PARA folder' },
            domain: { type: 'string', description: 'Filter by domain' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              results: { type: 'array', items: { type: 'object' } },
            },
          },
          400: {
            type: 'object',
            properties: { error: { type: 'string' } },
          },
        },
      },
    },
    async (req, reply) => {
      const { q, topK, paraFolder, domain, minScore } = req.query

      if (!q) return reply.status(400).send({ error: 'q is required' })

      const results = await queryEngine.retriever.retrieve(q, {
        topK: topK ? parseInt(topK) : 5,
        minScore: minScore ? parseFloat(minScore) : 0.7,
        paraFolder,
        domain,
      })

      return reply.send({ results })
    },
  )
}
