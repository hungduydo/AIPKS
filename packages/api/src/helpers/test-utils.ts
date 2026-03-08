import Fastify, { type FastifyInstance } from 'fastify'
import type { Container } from '../container.js'

/**
 * Creates a mock Container with stub methods for testing.
 * Override specific methods per test as needed.
 */
export function createMockContainer(overrides: Partial<Container> = {}): Container {
  const store = {
    countDocuments: () => 0,
    countChunks: () => 0,
    getMeta: () => null,
    listDocuments: () => [],
    getDocumentById: () => null,
    deleteDocument: () => {},
    close: () => {},
    ...overrides.store,
  } as unknown as Container['store']

  const hnsw = {
    getCurrentCount: () => 0,
    persist: () => {},
    ...overrides.hnsw,
  } as unknown as Container['hnsw']

  const pipeline = {
    ingestFile: async () => ({}),
    ingestPath: async () => ({}),
    on: () => {},
    off: () => {},
    ...overrides.pipeline,
  } as unknown as Container['pipeline']

  const queryEngine = {
    ask: async () => ({ answer: 'test answer', sources: [] }),
    askStream: async function* () {
      yield 'chunk'
    },
    retriever: {
      retrieve: async () => [],
    },
    ...overrides.queryEngine,
  } as unknown as Container['queryEngine']

  const reportGenerator = {
    generate: async () => ({ reportPath: '/tmp/report.md', date: '2026-03-08' }),
    ...overrides.reportGenerator,
  } as unknown as Container['reportGenerator']

  return { store, hnsw, pipeline, queryEngine, reportGenerator }
}

/**
 * Builds a Fastify instance with routes registered using a mock container.
 */
export async function buildTestApp(
  registerRoutes: (app: FastifyInstance, container: Container) => void,
  container?: Container,
): Promise<FastifyInstance> {
  const app = Fastify({ logger: false })
  const mockContainer = container ?? createMockContainer()
  registerRoutes(app, mockContainer)
  await app.ready()
  return app
}
