import { describe, it, expect, vi, afterEach } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { registerReportRoutes } from './reports.js'
import { buildTestApp, createMockContainer } from '../helpers/test-utils.js'

// Mock fs and @aipks/core used by report routes
vi.mock('node:fs', () => ({
  readdirSync: vi.fn().mockReturnValue(['2026-03-07.md', '2026-03-08.md']),
  readFileSync: vi.fn().mockReturnValue('# Daily Report\n\nContent here'),
  existsSync: vi.fn().mockReturnValue(true),
}))

vi.mock('@aipks/core', () => ({
  loadConfig: () => ({
    brainFolder: '/tmp/brain',
  }),
}))

describe('Report routes', () => {
  let app: FastifyInstance

  afterEach(async () => {
    await app?.close()
  })

  describe('POST /api/reports/generate', () => {
    it('generates a report and auto-ingests', async () => {
      const generate = vi.fn().mockResolvedValue({
        reportPath: '/tmp/brain/inbox/reports/2026-03-08.md',
        date: '2026-03-08',
      })
      const ingestFile = vi.fn().mockResolvedValue({})
      const container = createMockContainer({
        reportGenerator: { generate } as any,
        pipeline: { ingestFile, on: vi.fn(), off: vi.fn() } as any,
      })

      app = await buildTestApp(registerReportRoutes, container)

      const res = await app.inject({
        method: 'POST',
        url: '/api/reports/generate',
        payload: {},
      })

      expect(res.statusCode).toBe(200)
      expect(res.json().date).toBe('2026-03-08')
      expect(generate).toHaveBeenCalled()
    })

    it('accepts a custom date', async () => {
      const generate = vi.fn().mockResolvedValue({
        reportPath: '/tmp/report.md',
        date: '2026-03-01',
      })
      const container = createMockContainer({
        reportGenerator: { generate } as any,
        pipeline: { ingestFile: vi.fn().mockResolvedValue({}), on: vi.fn(), off: vi.fn() } as any,
      })

      app = await buildTestApp(registerReportRoutes, container)

      await app.inject({
        method: 'POST',
        url: '/api/reports/generate',
        payload: { date: '2026-03-01' },
      })

      expect(generate).toHaveBeenCalledWith(expect.any(Date))
    })
  })

  describe('GET /api/reports', () => {
    it('returns list of reports sorted newest first', async () => {
      app = await buildTestApp(registerReportRoutes)

      const res = await app.inject({ method: 'GET', url: '/api/reports' })

      expect(res.statusCode).toBe(200)
      const { reports } = res.json()
      expect(reports).toHaveLength(2)
      expect(reports[0].date).toBe('2026-03-08')
      expect(reports[1].date).toBe('2026-03-07')
    })
  })

  describe('GET /api/reports/:date', () => {
    it('returns report content by date', async () => {
      app = await buildTestApp(registerReportRoutes)

      const res = await app.inject({ method: 'GET', url: '/api/reports/2026-03-08' })

      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.date).toBe('2026-03-08')
      expect(body.content).toContain('Daily Report')
    })

    it('returns 404 for missing report', async () => {
      const { existsSync } = await import('node:fs')
      vi.mocked(existsSync).mockReturnValueOnce(false)

      app = await buildTestApp(registerReportRoutes)

      const res = await app.inject({ method: 'GET', url: '/api/reports/1999-01-01' })

      expect(res.statusCode).toBe(404)
    })
  })
})
