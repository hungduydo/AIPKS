import { describe, it, expect, afterEach } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { createServer } from './server.js'
import { createMockContainer } from './helpers/test-utils.js'

describe('createServer', () => {
  let app: FastifyInstance

  afterEach(async () => {
    await app?.close()
  })

  it('creates a Fastify instance with all routes registered', async () => {
    const container = createMockContainer()
    app = await createServer(container)

    // Verify key routes are registered by checking they don't 404
    const statusRes = await app.inject({ method: 'GET', url: '/api/status' })
    expect(statusRes.statusCode).toBe(200)

    const docsRes = await app.inject({ method: 'GET', url: '/api/documents' })
    expect(docsRes.statusCode).toBe(200)
  })

  it('has swagger docs enabled at /docs', async () => {
    const container = createMockContainer()
    app = await createServer(container)

    const res = await app.inject({ method: 'GET', url: '/docs/json' })
    expect(res.statusCode).toBe(200)
    const spec = res.json()
    expect(spec.openapi).toBeDefined()
    expect(spec.info.title).toBe('AIPKS API')
  })
})
