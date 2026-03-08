import { describe, it, expect, vi, afterEach } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { registerSearchRoutes } from './search.js'
import { buildTestApp, createMockContainer } from '../helpers/test-utils.js'

describe('GET /api/search', () => {
  let app: FastifyInstance

  afterEach(async () => {
    await app?.close()
  })

  it('returns search results', async () => {
    const results = [{ id: 'chunk-1', score: 0.95, text: 'hello' }]
    const retrieve = vi.fn().mockResolvedValue(results)
    const container = createMockContainer({
      queryEngine: { retriever: { retrieve } } as any,
    })

    app = await buildTestApp(registerSearchRoutes, container)

    const res = await app.inject({ method: 'GET', url: '/api/search?q=hello' })

    expect(res.statusCode).toBe(200)
    expect(res.json().results).toHaveLength(1)
    expect(retrieve).toHaveBeenCalledWith('hello', {
      topK: 5,
      minScore: 0.7,
      paraFolder: undefined,
      domain: undefined,
    })
  })

  it('passes custom topK and minScore', async () => {
    const retrieve = vi.fn().mockResolvedValue([])
    const container = createMockContainer({
      queryEngine: { retriever: { retrieve } } as any,
    })

    app = await buildTestApp(registerSearchRoutes, container)

    await app.inject({
      method: 'GET',
      url: '/api/search?q=test&topK=10&minScore=0.5&paraFolder=resources&domain=ai',
    })

    expect(retrieve).toHaveBeenCalledWith('test', {
      topK: 10,
      minScore: 0.5,
      paraFolder: 'resources',
      domain: 'ai',
    })
  })

  it('returns 400 when q is missing', async () => {
    app = await buildTestApp(registerSearchRoutes)

    const res = await app.inject({ method: 'GET', url: '/api/search' })

    // Fastify schema validation will reject missing required param
    expect(res.statusCode).toBe(400)
  })
})
