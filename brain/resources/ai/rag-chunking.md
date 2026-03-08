---
id: 20260307-rag-chunking
type: resource
domain: ai
tags: [rag, chunking, llm]
created: 2026-03-07
updated: 2026-03-07
---

# RAG Chunking Strategy

## Idea
Chunk documents by semantic boundary rather than fixed token count.

## Notes
LLM chunking may outperform token-based chunking because it preserves semantic units.
Recursive character splitter with markdown-aware separators (H2, H3) works well for notes.

## Source
https://example.com/rag-chunking
