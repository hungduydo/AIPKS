# AIPKS — AI Personal Knowledge System

Your second brain, powered by AI. Semantic search and RAG Q&A over your PARA Markdown vault.

## Quick Start

### 1. Configure

```bash
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY
```

### 2. Index your notes

```bash
# Build all packages first
pnpm build

# Index your brain vault
pnpm exec node packages/cli/dist/index.js add ./brain

# Or link globally: pnpm --filter @aipks/cli link --global
# Then: aipks add ./brain
```

### 3. Use the CLI

```bash
aipks status                          # Show stats
aipks search "RAG chunking"           # Semantic search
aipks ask "What do I know about RAG?" # AI-powered Q&A
aipks watch ./brain                   # Auto-index on changes
aipks report                          # Generate daily digest
aipks list                            # List all notes
```

### 4. Start the Web UI

```bash
# Terminal 1: API server
aipks serve

# Terminal 2: Next.js web app
pnpm --filter @aipks/web dev
# Open http://localhost:3000
```

## Note Format

```markdown
---
id: YYYYMMDD-slug
type: resource|project|area|note
domain: ai|programming|english
tags: [tag1, tag2]
created: 2026-03-07
updated: 2026-03-07
---

# Title

## Idea
...

## Notes
...

## Source
https://...
```

## Deploy with Docker

### Prerequisites

- Docker & Docker Compose installed
- OpenAI API key

### Quick Start

```bash
# 1. Configure environment
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY

# 2. Start all services
docker compose up -d

# API:  http://localhost:3001
# Web:  http://localhost:3000
```

### Custom API URL

If deploying on a remote server, set the public-facing API URL before building:

```bash
NEXT_PUBLIC_API_URL=https://api.yourdomain.com docker compose up -d --build
```

### Services

| Service | Port | Description |
|---------|------|-------------|
| `api`   | 3001 | Fastify REST + SSE server |
| `web`   | 3000 | Next.js 15 UI |

### Volumes

- `./brain` is bind-mounted into the API container — your notes stay on disk as the single source of truth
- `aipks_data` named volume persists the vector index and SQLite DB across restarts

### Useful Commands

```bash
# Rebuild after code changes
docker compose up -d --build

# View logs
docker compose logs -f api
docker compose logs -f web

# Stop all services
docker compose down

# Stop and remove data volume (full reset)
docker compose down -v
```

## Testing

### Unit Tests (API)

Unit tests use [Vitest](https://vitest.dev/) with Fastify's `.inject()` method to test routes without starting a real server or connecting to external services.

```bash
# Run all unit tests
pnpm test

# Run API tests only
pnpm --filter @aipks/api test

# Watch mode (re-run on file changes)
pnpm --filter @aipks/api test:watch

# With coverage report
pnpm --filter @aipks/api test:coverage
```

Test files are co-located with source files using the `*.test.ts` convention:

```
packages/api/src/
├── server.test.ts
├── helpers/test-utils.ts        # Mock container & test app builder
└── routes/
    ├── ask.test.ts
    ├── documents.test.ts
    ├── ingest.test.ts
    ├── reports.test.ts
    ├── search.test.ts
    └── status.test.ts
```

### E2E Tests (Web)

End-to-end tests use [Playwright](https://playwright.dev/) to test the Next.js frontend in a real browser.

```bash
# Install Playwright browsers (first time only)
pnpm --filter @aipks/web exec playwright install

# Run all e2e tests
pnpm --filter @aipks/web exec playwright test

# Run with UI mode (interactive)
pnpm --filter @aipks/web exec playwright test --ui

# Run a specific test file
pnpm --filter @aipks/web exec playwright test e2e/ask.spec.ts

# Show HTML report after run
pnpm --filter @aipks/web exec playwright show-report
```

> **Note:** E2E tests auto-start the Next.js dev server on port 3000. Make sure the API server is running on port 3001 before running e2e tests (`aipks serve` or `pnpm --filter @aipks/api start`).

## Architecture

```
brain/           ← Your notes (single source of truth, never duplicated)
data/
  vector-store/  ← hnswlib embeddings index  
  db/            ← SQLite metadata index (file paths + offsets only)
packages/
  core/          ← Shared types, config, utilities
  vector-store/  ← hnswlib + SQLite adapters
  ingestion/     ← Pipeline: parse → chunk → embed → index
  ai-engine/     ← RAG: embed query → search → context → LLM
  api/           ← Fastify REST + SSE server
  cli/           ← Commander.js CLI
  web/           ← Next.js 15 UI
```
