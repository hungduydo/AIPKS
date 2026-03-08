import OpenAI from 'openai'
import type { AskRequest, QueryResponse } from '@aipks/core'
import { withRetry } from '@aipks/core'
import { Retriever } from './retriever.js'
import { ContextBuilder } from './context-builder.js'
import { SYSTEM_PROMPT } from './prompts.js'

export class QueryEngine {
  private client: OpenAI
  private chatModel: string
  private temperature: number
  readonly retriever: Retriever
  private contextBuilder: ContextBuilder

  constructor(opts: {
    apiKey: string
    chatModel: string
    temperature: number
    retriever: Retriever
    contextBuilder: ContextBuilder
  }) {
    this.client = new OpenAI({ apiKey: opts.apiKey })
    this.chatModel = opts.chatModel
    this.temperature = opts.temperature
    this.retriever = opts.retriever
    this.contextBuilder = opts.contextBuilder
  }

  async ask(req: AskRequest): Promise<QueryResponse> {
    const sources = await this.retriever.retrieve(req.question, {
      topK: req.topK ?? 5,
      minScore: req.minScore ?? 0.7,
      paraFolder: req.paraFolder,
      domain: req.domain,
      tags: req.tags,
    })

    const context = this.contextBuilder.build(sources)
    const systemPrompt = SYSTEM_PROMPT.replace('{context}', context)

    const response = await withRetry(
      () =>
        this.client.chat.completions.create({
          model: this.chatModel,
          temperature: this.temperature,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: req.question },
          ],
        }),
      { maxAttempts: 3 },
    )

    return {
      answer: response.choices[0].message.content ?? '',
      sources,
      tokensUsed: response.usage?.total_tokens ?? 0,
      model: this.chatModel,
    }
  }

  async *askStream(req: AskRequest): AsyncIterable<string> {
    const sources = await this.retriever.retrieve(req.question, {
      topK: req.topK ?? 5,
      minScore: req.minScore ?? 0.7,
      paraFolder: req.paraFolder,
      domain: req.domain,
      tags: req.tags,
    })

    const context = this.contextBuilder.build(sources)
    const systemPrompt = SYSTEM_PROMPT.replace('{context}', context)

    const stream = await this.client.chat.completions.create({
      model: this.chatModel,
      temperature: this.temperature,
      stream: true,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: req.question },
      ],
    })

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content
      if (delta) yield delta
    }
  }
}
