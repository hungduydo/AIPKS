import { describe, it, expect, vi, afterEach } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { registerDocumentRoutes } from './documents.js'
import { buildTestApp, createMockContainer } from '../helpers/test-utils.js'

describe('Document routes', () => {
  let app: FastifyInstance

  afterEach(async () => {
    await app?.close()
  })

  describe('GET /api/documents', () => {
    it('returns a list of documents with defaults', async () => {
      const docs = [{ id: 'doc-1', title: 'Test Doc' }]
      const container = createMockContainer({
        store: {
          listDocuments: vi.fn().mockReturnValue(docs),
          countDocuments: () => 1,
        } as any,
      })

      app = await buildTestApp(registerDocumentRoutes, container)

      const res = await app.inject({ method: 'GET', url: '/api/documents' })

      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.documents).toHaveLength(1)
      expect(body.total).toBe(1)
      expect(container.store.listDocuments).toHaveBeenCalledWith({
        paraFolder: undefined,
        domain: undefined,
        limit: 50,
        offset: 0,
      })
    })

    it('passes query filters to store', async () => {
      const container = createMockContainer({
        store: {
          listDocuments: vi.fn().mockReturnValue([]),
          countDocuments: () => 0,
        } as any,
      })

      app = await buildTestApp(registerDocumentRoutes, container)

      await app.inject({
        method: 'GET',
        url: '/api/documents?paraFolder=projects&domain=ai&limit=10&offset=5',
      })

      expect(container.store.listDocuments).toHaveBeenCalledWith({
        paraFolder: 'projects',
        domain: 'ai',
        limit: 10,
        offset: 5,
      })
    })
  })

  describe('GET /api/documents/:id', () => {
    it('returns a document by id', async () => {
      const doc = { id: 'doc-1', title: 'Test' }
      const container = createMockContainer({
        store: { getDocumentById: vi.fn().mockReturnValue(doc) } as any,
      })

      app = await buildTestApp(registerDocumentRoutes, container)

      const res = await app.inject({ method: 'GET', url: '/api/documents/doc-1' })

      expect(res.statusCode).toBe(200)
      expect(container.store.getDocumentById).toHaveBeenCalledWith('doc-1')
    })

    it('returns 404 for missing document', async () => {
      app = await buildTestApp(registerDocumentRoutes)

      const res = await app.inject({ method: 'GET', url: '/api/documents/missing' })

      expect(res.statusCode).toBe(404)
      expect(res.json().error).toBe('Document not found')
    })
  })

  describe('DELETE /api/documents/:id', () => {
    it('deletes a document', async () => {
      const doc = { id: 'doc-1', title: 'Test' }
      const container = createMockContainer({
        store: {
          getDocumentById: vi.fn().mockReturnValue(doc),
          deleteDocument: vi.fn(),
        } as any,
      })

      app = await buildTestApp(registerDocumentRoutes, container)

      const res = await app.inject({ method: 'DELETE', url: '/api/documents/doc-1' })

      expect(res.statusCode).toBe(200)
      expect(res.json()).toEqual({ success: true })
      expect(container.store.deleteDocument).toHaveBeenCalledWith('doc-1')
    })

    it('returns 404 when deleting non-existent document', async () => {
      app = await buildTestApp(registerDocumentRoutes)

      const res = await app.inject({ method: 'DELETE', url: '/api/documents/missing' })

      expect(res.statusCode).toBe(404)
      expect(res.json().error).toBe('Document not found')
    })
  })
})
