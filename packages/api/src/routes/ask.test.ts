import { describe, it, expect, vi, afterEach } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { registerAskRoutes } from './ask.js'
import { buildTestApp, createMockContainer } from '../helpers/test-utils.js'

describe('POST /api/ask', () => {
  let app: FastifyInstance

  afterEach(async () => {
    await app?.close()
  })

  it('returns non-streaming response when stream=false', async () => {
    const answer = { answer: 'The answer is 42', sources: [{ id: 's1' }] }
    const container = createMockContainer({
      queryEngine: {
        ask: vi.fn().mockResolvedValue(answer),
      } as any,
    })

    app = await buildTestApp(registerAskRoutes, container)

    const res = await app.inject({
      method: 'POST',
      url: '/api/ask',
      payload: { question: 'What is the answer?', stream: false },
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.answer).toBe('The answer is 42')
    expect(body.sources).toHaveLength(1)
    expect(container.queryEngine.ask).toHaveBeenCalledWith({
      question: 'What is the answer?',
    })
  })

  it('returns SSE stream when stream=true', async () => {
    const container = createMockContainer({
      queryEngine: {
        askStream: async function* () {
          yield 'Hello '
          yield 'world'
        },
      } as any,
    })

    app = await buildTestApp(registerAskRoutes, container)

    const res = await app.inject({
      method: 'POST',
      url: '/api/ask',
      payload: { question: 'Hi', stream: true },
    })

    const body = res.body
    expect(body).toContain('data: {"type":"delta","content":"Hello "}')
    expect(body).toContain('data: {"type":"delta","content":"world"}')
    expect(body).toContain('data: {"type":"done"}')
  })

  it('passes filter options to queryEngine.ask', async () => {
    const ask = vi.fn().mockResolvedValue({ answer: 'ok', sources: [] })
    const container = createMockContainer({
      queryEngine: { ask } as any,
    })

    app = await buildTestApp(registerAskRoutes, container)

    await app.inject({
      method: 'POST',
      url: '/api/ask',
      payload: {
        question: 'test',
        stream: false,
        topK: 10,
        domain: 'ai',
        paraFolder: 'projects',
        tags: ['rag'],
      },
    })

    expect(ask).toHaveBeenCalledWith({
      question: 'test',
      topK: 10,
      domain: 'ai',
      paraFolder: 'projects',
      tags: ['rag'],
    })
  })

  it('returns 400 when question is missing', async () => {
    app = await buildTestApp(registerAskRoutes)

    const res = await app.inject({
      method: 'POST',
      url: '/api/ask',
      payload: {},
    })

    expect(res.statusCode).toBe(400)
  })

  it('sends error event on stream failure', async () => {
    const container = createMockContainer({
      queryEngine: {
        askStream: async function* () {
          throw new Error('LLM unavailable')
        },
      } as any,
    })

    app = await buildTestApp(registerAskRoutes, container)

    const res = await app.inject({
      method: 'POST',
      url: '/api/ask',
      payload: { question: 'fail', stream: true },
    })

    expect(res.body).toContain('"type":"error"')
    expect(res.body).toContain('LLM unavailable')
  })
})
