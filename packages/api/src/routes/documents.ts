import type { FastifyInstance } from 'fastify'
import type { Container } from '../container.js'

export function registerDocumentRoutes(app: FastifyInstance, { store }: Container) {
  app.get<{
    Querystring: { paraFolder?: string; domain?: string; limit?: string; offset?: string }
  }>(
    '/api/documents',
    {
      schema: {
        tags: ['Documents'],
        summary: 'List documents',
        description: 'List indexed documents with pagination and filters',
        querystring: {
          type: 'object',
          properties: {
            paraFolder: { type: 'string', description: 'Filter by PARA folder' },
            domain: { type: 'string', description: 'Filter by domain' },
            limit: { type: 'string', description: 'Page size (default: 50)' },
            offset: { type: 'string', description: 'Offset (default: 0)' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              documents: { type: 'array', items: { type: 'object' } },
              total: { type: 'number' },
            },
          },
        },
      },
    },
    async (req, reply) => {
      const { paraFolder, domain, limit, offset } = req.query
      const docs = store.listDocuments({
        paraFolder,
        domain,
        limit: limit ? parseInt(limit) : 50,
        offset: offset ? parseInt(offset) : 0,
      })
      return reply.send({ documents: docs, total: store.countDocuments() })
    },
  )

  app.get<{ Params: { id: string } }>(
    '/api/documents/:id',
    {
      schema: {
        tags: ['Documents'],
        summary: 'Get document',
        description: 'Get a single document by ID',
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Document ID' },
          },
        },
        response: {
          200: { type: 'object' },
          404: {
            type: 'object',
            properties: { error: { type: 'string' } },
          },
        },
      },
    },
    async (req, reply) => {
      const doc = store.getDocumentById(req.params.id)
      if (!doc) return reply.status(404).send({ error: 'Document not found' })
      return reply.send(doc)
    },
  )

  app.delete<{ Params: { id: string } }>(
    '/api/documents/:id',
    {
      schema: {
        tags: ['Documents'],
        summary: 'Delete document',
        description: 'Delete a document and its chunks from the index',
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Document ID' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: { success: { type: 'boolean' } },
          },
          404: {
            type: 'object',
            properties: { error: { type: 'string' } },
          },
        },
      },
    },
    async (req, reply) => {
      const doc = store.getDocumentById(req.params.id)
      if (!doc) return reply.status(404).send({ error: 'Document not found' })
      store.deleteDocument(req.params.id)
      return reply.send({ success: true })
    },
  )
}
