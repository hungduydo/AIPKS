import type { FastifyInstance } from 'fastify'
import { resolve } from 'node:path'
import type { Container } from '../container.js'

export function registerIngestRoutes(app: FastifyInstance, { pipeline }: Container) {
  app.post<{ Body: { uri: string; type?: string; label?: string } }>(
    '/api/ingest',
    {
      schema: {
        tags: ['Ingest'],
        summary: 'Ingest a file or directory',
        description: 'Index a markdown file or directory into the knowledge base. Returns SSE stream with progress events.',
        body: {
          type: 'object',
          required: ['uri'],
          properties: {
            uri: { type: 'string', description: 'Path to file or directory to ingest' },
            type: { type: 'string', description: 'Source type override' },
            label: { type: 'string', description: 'Optional label' },
          },
        },
        response: {
          200: {
            type: 'string',
            description: 'SSE stream with JSON events: {type:"event",...}, {type:"complete",results}, {type:"error",message}',
          },
        },
      },
    },
    async (req, reply) => {
      const { uri } = req.body

      reply.raw.setHeader('Content-Type', 'text/event-stream')
      reply.raw.setHeader('Cache-Control', 'no-cache')
      reply.raw.setHeader('Connection', 'keep-alive')
      reply.raw.flushHeaders()

      const send = (data: unknown) => {
        reply.raw.write(`data: ${JSON.stringify(data)}\n\n`)
      }

      pipeline.on('event', send)

      try {
        const results = await pipeline.ingestPath(resolve(uri))
        reply.raw.write(`data: ${JSON.stringify({ type: 'complete', results })}\n\n`)
      } catch (err) {
        reply.raw.write(`data: ${JSON.stringify({ type: 'error', message: String(err) })}\n\n`)
      } finally {
        pipeline.off('event', send)
        reply.raw.end()
      }
    },
  )
}
