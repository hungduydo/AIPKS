# CLAUDE.md

## Project Overview

AIPKS (AI Personal Knowledge System) — a monorepo with pnpm workspaces and Turbo for semantic search and RAG Q&A over a PARA Markdown vault.

## Architecture

```
packages/
  core/          — Shared types, config (loadConfig), logging (pino)
  vector-store/  — hnswlib + SQLite (better-sqlite3) adapters
  ingestion/     — Pipeline: parse → chunk → embed → index
  ai-engine/     — RAG: Retriever, ContextBuilder, QueryEngine, ReportGenerator
  api/           — Fastify 5 REST + SSE server
  cli/           — Commander.js CLI
  web/           — Next.js 15, React 19, Tailwind CSS v4, shadcn
```

## Commands

```bash
pnpm install              # Install all deps
pnpm build                # Build all packages (turbo)
pnpm typecheck            # Type-check all packages
pnpm --filter @aipks/api test          # Run API unit tests (vitest)
pnpm --filter @aipks/web exec playwright test  # Run e2e tests
```

## Code Conventions

- TypeScript strict mode, ESM (`"type": "module"`)
- Target: ES2022, Module: NodeNext
- Use `tsup` for building backend packages
- Fastify routes in `packages/api/src/routes/` — one file per resource
- Container pattern for DI in `packages/api/src/container.ts`
- Tailwind CSS v4 with `@tailwindcss/postcss` plugin
- shadcn components in `packages/web/src/components/ui/`
- Tests co-located with source: `*.test.ts`
- Vitest for unit tests, Playwright for e2e

## Important Notes

- Do not commit `.env` files — they contain `OPENAI_API_KEY`
- The `data/` directory is gitignored (vector index + SQLite DB)
- Web package uses `@import "tailwindcss"` (v4 syntax), not `@tailwind` directives
