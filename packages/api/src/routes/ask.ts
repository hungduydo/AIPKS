import type { FastifyInstance } from 'fastify'
import type { Container } from '../container.js'

export function registerAskRoutes(app: FastifyInstance, { queryEngine }: Container) {
  app.post<{
    Body: {
      question: string
      topK?: number
      minScore?: number
      paraFolder?: string
      domain?: string
      tags?: string[]
      stream?: boolean
    }
  }>(
    '/api/ask',
    {
      schema: {
        tags: ['Ask'],
        summary: 'Ask a question',
        description: 'AI-powered Q&A using RAG. Supports streaming (SSE) and non-streaming responses.',
        body: {
          type: 'object',
          required: ['question'],
          properties: {
            question: { type: 'string', description: 'Your question' },
            topK: { type: 'number', description: 'Max context chunks (default: 5)' },
            minScore: { type: 'number', description: 'Minimum similarity score' },
            paraFolder: { type: 'string', description: 'Filter by PARA folder' },
            domain: { type: 'string', description: 'Filter by domain' },
            tags: { type: 'array', items: { type: 'string' }, description: 'Filter by tags' },
            stream: { type: 'boolean', description: 'Enable SSE streaming (default: true)' },
          },
        },
        response: {
          200: {
            type: 'object',
            description: 'Non-streaming response (when stream=false)',
            properties: {
              answer: { type: 'string' },
              sources: { type: 'array', items: { type: 'object' } },
            },
          },
        },
      },
    },
    async (req, reply) => {
      const { stream = true, ...askReq } = req.body

      if (stream) {
        reply.raw.setHeader('Content-Type', 'text/event-stream')
        reply.raw.setHeader('Cache-Control', 'no-cache')
        reply.raw.setHeader('Connection', 'keep-alive')
        reply.raw.flushHeaders()

        try {
          for await (const delta of queryEngine.askStream(askReq)) {
            reply.raw.write(`data: ${JSON.stringify({ type: 'delta', content: delta })}\n\n`)
          }
          reply.raw.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
        } catch (err) {
          reply.raw.write(`data: ${JSON.stringify({ type: 'error', message: String(err) })}\n\n`)
        } finally {
          reply.raw.end()
        }
      } else {
        const response = await queryEngine.ask(askReq)
        return reply.send(response)
      }
    },
  )
}
