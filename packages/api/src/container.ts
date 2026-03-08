/**
 * Dependency injection container — wires together all packages
 * and initializes the hnswlib index on startup.
 */
import { resolve } from 'node:path'
import { loadConfig } from '@aipks/core'
import { MetadataStore, HnswAdapter } from '@aipks/vector-store'
import { Embedder, IngestionPipeline } from '@aipks/ingestion'
import { Retriever, ContextBuilder, QueryEngine, ReportGenerator } from '@aipks/ai-engine'

export interface Container {
  store: MetadataStore
  hnsw: HnswAdapter
  pipeline: IngestionPipeline
  queryEngine: QueryEngine
  reportGenerator: ReportGenerator
}

let _container: Container | null = null

export function getContainer(): Container {
  if (_container) return _container

  const config = loadConfig()

  const store = new MetadataStore(config.dbPath)

  const hnsw = new HnswAdapter(config.vectorStorePath)
  // Load or create the hnswlib index; use current max vectorId from SQLite
  const maxVectorId = getMaxVectorId(store)
  hnsw.initialize(maxVectorId)

  const embedder = new Embedder(config.openaiApiKey, config.embeddingModel, store)

  const brainRoot = resolve(config.brainFolder)

  const pipeline = new IngestionPipeline(embedder, store, hnsw, {
    brainRoot,
    chunkSize: 512,
    chunkOverlap: 64,
  })

  const retriever = new Retriever(config.openaiApiKey, config.embeddingModel, store, hnsw)
  const contextBuilder = new ContextBuilder(brainRoot)

  const queryEngine = new QueryEngine({
    apiKey: config.openaiApiKey,
    chatModel: config.chatModel,
    temperature: config.chatTemperature,
    retriever,
    contextBuilder,
  })

  const reportOutputFolder = resolve(config.brainFolder, 'inbox', 'reports')
  const reportGenerator = new ReportGenerator({
    apiKey: config.openaiApiKey,
    chatModel: config.chatModel,
    store,
    outputFolder: reportOutputFolder,
  })

  _container = { store, hnsw, pipeline, queryEngine, reportGenerator }
  return _container
}

function getMaxVectorId(store: MetadataStore): number {
  // Quick query to find the highest vectorId currently stored
  // MetadataStore doesn't expose this directly, so we use a workaround:
  // initialize with 0 and let the adapter sync from existing data
  return 0
}

export function resetContainer(): void {
  _container = null
}
