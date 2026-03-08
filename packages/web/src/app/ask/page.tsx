'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, ChevronDown, ChevronUp, Sparkles } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

interface Message {
  role: 'user' | 'assistant'
  content: string
  sources?: any[]
}

export default function AskPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || loading) return

    const question = input.trim()
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: question }])
    setLoading(true)

    const assistantMsg: Message = { role: 'assistant', content: '', sources: [] }
    setMessages((prev) => [...prev, assistantMsg])

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 120_000)

    try {
      const res = await fetch(`${API_URL}/api/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, stream: true }),
        signal: controller.signal,
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }))
        throw new Error((err as any).error ?? `Request failed (${res.status})`)
      }

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) throw new Error('No response body')

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const event = JSON.parse(line.slice(6))
            if (event.type === 'delta') {
              setMessages((prev) => {
                const updated = [...prev]
                updated[updated.length - 1] = {
                  ...updated[updated.length - 1],
                  content: updated[updated.length - 1].content + event.content,
                }
                return updated
              })
            } else if (event.type === 'error') {
              throw new Error(event.message ?? 'Stream error')
            }
          } catch (parseErr) {
            if (parseErr instanceof Error && parseErr.message !== 'Stream error') continue
            throw parseErr
          }
        }
      }
    } catch (err) {
      setMessages((prev) => {
        const updated = [...prev]
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          content: `Error: ${err}`,
        }
        return updated
      })
    } finally {
      clearTimeout(timeout)
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-3xl flex-col">
      <div className="animate-fade-up mb-6">
        <h2 className="font-display text-[28px] font-semibold text-foreground">Ask</h2>
        <p className="mt-1 text-sm text-muted-foreground">Chat with your knowledge base</p>
      </div>

      <div className="animate-fade-in flex flex-1 flex-col gap-5 overflow-y-auto pb-4">
        {messages.length === 0 && (
          <div className="py-20 text-center">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <Sparkles size={24} strokeWidth={1.5} />
            </div>
            <p className="text-sm text-muted-foreground">
              Ask anything about your notes.
            </p>
            <p className="mt-2 text-xs text-muted-foreground/60">
              e.g. &ldquo;What do I know about RAG?&rdquo; or &ldquo;Summarize my project notes&rdquo;
            </p>
          </div>
        )}
        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}
        <div ref={bottomRef} />
      </div>

      <Separator />
      <form onSubmit={handleSubmit} className="flex gap-3 pt-4">
        <Input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question..."
          disabled={loading}
          className="h-10 flex-1"
        />
        <Button type="submit" disabled={loading || !input.trim()} size="lg">
          <Send size={16} />
        </Button>
      </form>
    </div>
  )
}

function MessageBubble({ message }: { message: Message }) {
  const [showSources, setShowSources] = useState(false)

  if (message.role === 'user') {
    return (
      <div className="animate-fade-up flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-tr-sm border border-primary/15 bg-primary/10 px-4 py-3 text-sm text-foreground">
          {message.content}
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-up flex justify-start">
      <div className="max-w-[90%] space-y-2">
        <div className="rounded-2xl rounded-tl-sm border border-border bg-card px-5 py-4 text-sm leading-relaxed text-muted-foreground">
          {message.content ? (
            <div className="prose-warm prose prose-sm max-w-none">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          ) : (
            <span className="animate-pulse text-primary">Thinking...</span>
          )}
        </div>
        {message.sources && message.sources.length > 0 && (
          <div className="text-xs">
            <button
              onClick={() => setShowSources(!showSources)}
              className="flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
            >
              {showSources ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {message.sources.length} source(s)
            </button>
            {showSources && (
              <div className="mt-1 space-y-1 border-l border-border pl-4">
                {message.sources.map((s: any, i: number) => (
                  <div key={i} className="text-muted-foreground">
                    {s.document.title}
                    {s.chunkRef.heading ? ` > ${s.chunkRef.heading}` : ''}{' '}
                    <span className="text-primary">({Math.round(s.score * 100)}%)</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
