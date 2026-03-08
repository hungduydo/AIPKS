import { describe, it, expect, vi, afterEach } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { registerIngestRoutes } from './ingest.js'
import { buildTestApp, createMockContainer } from '../helpers/test-utils.js'

describe('POST /api/ingest', () => {
  let app: FastifyInstance

  afterEach(async () => {
    await app?.close()
  })

  it('streams SSE events and returns complete', async () => {
    const ingestPath = vi.fn().mockResolvedValue({ filesProcessed: 3 })
    const container = createMockContainer({
      pipeline: {
        ingestPath,
        on: vi.fn(),
        off: vi.fn(),
      } as any,
    })

    app = await buildTestApp(registerIngestRoutes, container)

    const res = await app.inject({
      method: 'POST',
      url: '/api/ingest',
      payload: { uri: '/path/to/notes' },
    })

    expect(res.body).toContain('"type":"complete"')
    expect(res.body).toContain('"filesProcessed":3')
    expect(container.pipeline.on).toHaveBeenCalledWith('event', expect.any(Function))
    expect(container.pipeline.off).toHaveBeenCalledWith('event', expect.any(Function))
  })

  it('returns error event on ingestion failure', async () => {
    const container = createMockContainer({
      pipeline: {
        ingestPath: vi.fn().mockRejectedValue(new Error('File not found')),
        on: vi.fn(),
        off: vi.fn(),
      } as any,
    })

    app = await buildTestApp(registerIngestRoutes, container)

    const res = await app.inject({
      method: 'POST',
      url: '/api/ingest',
      payload: { uri: '/bad/path' },
    })

    expect(res.body).toContain('"type":"error"')
    expect(res.body).toContain('File not found')
  })

  it('returns 400 when uri is missing', async () => {
    app = await buildTestApp(registerIngestRoutes)

    const res = await app.inject({
      method: 'POST',
      url: '/api/ingest',
      payload: {},
    })

    expect(res.statusCode).toBe(400)
  })
})
