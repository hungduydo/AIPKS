/**
 * CLI-side dependency injection — mirrors API container but used directly
 * (no HTTP layer) for faster local commands.
 */
import 'dotenv/config'
import { resolve } from 'node:path'
import { loadConfig } from '@aipks/core'
import { MetadataStore, HnswAdapter } from '@aipks/vector-store'
import { Embedder, IngestionPipeline } from '@aipks/ingestion'
import { Retriever, ContextBuilder, QueryEngine, ReportGenerator } from '@aipks/ai-engine'

export interface CliContainer {
  store: MetadataStore
  hnsw: HnswAdapter
  pipeline: IngestionPipeline
  queryEngine: QueryEngine
  retriever: Retriever
  reportGenerator: ReportGenerator
  brainRoot: string
}

let _container: CliContainer | null = null

export function getCliContainer(): CliContainer {
  if (_container) return _container

  const config = loadConfig()
  const store = new MetadataStore(config.dbPath)
  const hnsw = new HnswAdapter(config.vectorStorePath)
  hnsw.initialize(0)

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

  _container = { store, hnsw, pipeline, queryEngine, retriever, reportGenerator, brainRoot }
  return _container
}
