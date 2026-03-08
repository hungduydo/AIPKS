import type { FastifyInstance } from 'fastify'
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { loadConfig } from '@aipks/core'
import type { Container } from '../container.js'

export function registerReportRoutes(app: FastifyInstance, { reportGenerator, pipeline }: Container) {
  app.post<{ Body: { date?: string } }>(
    '/api/reports/generate',
    {
      schema: {
        tags: ['Reports'],
        summary: 'Generate report',
        description: 'Generate a daily digest report and auto-ingest it',
        body: {
          type: 'object',
          properties: {
            date: { type: 'string', description: 'ISO date string (default: today)' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              reportPath: { type: 'string' },
              date: { type: 'string' },
            },
          },
        },
      },
    },
    async (req, reply) => {
      const date = req.body.date ? new Date(req.body.date) : undefined
      const result = await reportGenerator.generate(date)

      // Auto-ingest the generated report
      await pipeline.ingestFile(result.reportPath).catch(() => {})

      return reply.send(result)
    },
  )

  app.get(
    '/api/reports',
    {
      schema: {
        tags: ['Reports'],
        summary: 'List reports',
        description: 'List all generated daily reports',
        response: {
          200: {
            type: 'object',
            properties: {
              reports: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    date: { type: 'string' },
                    path: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (_req, reply) => {
      const config = loadConfig()
      const reportsDir = resolve(config.brainFolder, 'inbox', 'reports')

      if (!existsSync(reportsDir)) return reply.send({ reports: [] })

      const files = readdirSync(reportsDir)
        .filter((f) => f.endsWith('.md'))
        .sort()
        .reverse()

      const reports = files.map((f) => ({
        date: f.replace('.md', ''),
        path: join(reportsDir, f),
      }))

      return reply.send({ reports })
    },
  )

  app.get<{ Params: { date: string } }>(
    '/api/reports/:date',
    {
      schema: {
        tags: ['Reports'],
        summary: 'Get report',
        description: 'Get a specific report by date',
        params: {
          type: 'object',
          properties: {
            date: { type: 'string', description: 'Report date (YYYY-MM-DD)' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              date: { type: 'string' },
              content: { type: 'string' },
            },
          },
          404: {
            type: 'object',
            properties: { error: { type: 'string' } },
          },
        },
      },
    },
    async (req, reply) => {
      const config = loadConfig()
      const filePath = resolve(config.brainFolder, 'inbox', 'reports', `${req.params.date}.md`)

      if (!existsSync(filePath)) return reply.status(404).send({ error: 'Report not found' })

      const content = readFileSync(filePath, 'utf8')
      return reply.send({ date: req.params.date, content })
    },
  )
}
