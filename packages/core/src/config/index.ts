import 'dotenv/config'
import { z } from 'zod'

const ConfigSchema = z.object({
  openaiApiKey: z.string().min(1, 'OPENAI_API_KEY is required'),
  embeddingModel: z.string().default('text-embedding-3-small'),
  chatModel: z.string().default('gpt-4o-mini'),
  chatTemperature: z.coerce.number().min(0).max(2).default(0.1),

  notionApiKey: z.string().optional(),
  githubToken: z.string().optional(),

  apiPort: z.coerce.number().default(3001),

  vectorStorePath: z.string().default('./data/vector-store'),
  dbPath: z.string().default('./data/db/aipks.sqlite'),
  cachePath: z.string().default('./data/cache'),
  brainFolder: z.string().default('./brain'),
})

export type Config = z.infer<typeof ConfigSchema>

let _config: Config | null = null

export function loadConfig(): Config {
  if (_config) return _config

  const result = ConfigSchema.safeParse({
    openaiApiKey: process.env.OPENAI_API_KEY,
    embeddingModel: process.env.OPENAI_EMBEDDING_MODEL,
    chatModel: process.env.OPENAI_CHAT_MODEL,
    chatTemperature: process.env.OPENAI_CHAT_TEMPERATURE,
    notionApiKey: process.env.NOTION_API_KEY,
    githubToken: process.env.GITHUB_TOKEN,
    apiPort: process.env.API_PORT,
    vectorStorePath: process.env.VECTOR_STORE_PATH,
    dbPath: process.env.DB_PATH,
    cachePath: process.env.CACHE_PATH,
    brainFolder: process.env.BRAIN_FOLDER,
  })

  if (!result.success) {
    const errors = result.error.errors.map((e) => `  ${e.path.join('.')}: ${e.message}`).join('\n')
    throw new Error(`Configuration error:\n${errors}`)
  }

  _config = result.data
  return _config
}

/** Reset cached config (useful for tests) */
export function resetConfig(): void {
  _config = null
}
