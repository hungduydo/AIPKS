import { describe, it, expect, afterEach } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { registerStatusRoutes } from './status.js'
import { buildTestApp, createMockContainer } from '../helpers/test-utils.js'

describe('GET /api/status', () => {
  let app: FastifyInstance

  afterEach(async () => {
    await app?.close()
  })

  it('returns system stats', async () => {
    const container = createMockContainer({
      store: {
        countDocuments: () => 10,
        countChunks: () => 42,
        getMeta: (key: string) => {
          if (key === 'lastReportDate') return '2026-03-08'
          if (key === 'embeddingModel') return 'text-embedding-3-small'
          return null
        },
      } as any,
      hnsw: { getCurrentCount: () => 42 } as any,
    })

    app = await buildTestApp(registerStatusRoutes, container)

    const res = await app.inject({ method: 'GET', url: '/api/status' })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body).toEqual({
      documents: 10,
      chunks: 42,
      vectorCount: 42,
      lastReport: '2026-03-08',
      embeddingModel: 'text-embedding-3-small',
    })
  })

  it('returns null for missing meta values', async () => {
    app = await buildTestApp(registerStatusRoutes)

    const res = await app.inject({ method: 'GET', url: '/api/status' })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.documents).toBe(0)
    expect(body.lastReport).toBeNull()
    expect(body.embeddingModel).toBeNull()
  })
})
