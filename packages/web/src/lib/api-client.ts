const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'
const DEFAULT_TIMEOUT_MS = 15_000

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS)

  try {
    const res = await fetch(`${API_URL}${path}`, {
      headers: { 'Content-Type': 'application/json', ...init?.headers },
      ...init,
      signal: init?.signal ?? controller.signal,
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }))
      throw new Error((err as any).error ?? res.statusText)
    }
    return res.json() as Promise<T>
  } finally {
    clearTimeout(timeout)
  }
}

export function apiStream(path: string, body: unknown): EventSource {
  // POST with SSE: use fetch + ReadableStream
  return new EventSource(`${API_URL}${path}?${new URLSearchParams({ body: JSON.stringify(body) })}`)
}

export const api = {
  status: () => apiFetch<{
    documents: number
    chunks: number
    vectorCount: number
    lastReport: string | null
    embeddingModel: string | null
  }>('/api/status'),

  documents: (params?: { paraFolder?: string; domain?: string; limit?: number; offset?: number }) => {
    const q = new URLSearchParams()
    if (params?.paraFolder) q.set('paraFolder', params.paraFolder)
    if (params?.domain) q.set('domain', params.domain)
    if (params?.limit) q.set('limit', String(params.limit))
    if (params?.offset) q.set('offset', String(params.offset))
    return apiFetch<{ documents: any[]; total: number }>(`/api/documents?${q}`)
  },

  document: (id: string) => apiFetch<any>(`/api/documents/${id}`),

  deleteDocument: (id: string) =>
    apiFetch<{ success: boolean }>(`/api/documents/${id}`, { method: 'DELETE' }),

  search: (q: string, params?: { topK?: number; paraFolder?: string; domain?: string }) => {
    const qs = new URLSearchParams({ q })
    if (params?.topK) qs.set('topK', String(params.topK))
    if (params?.paraFolder) qs.set('paraFolder', params.paraFolder)
    if (params?.domain) qs.set('domain', params.domain)
    return apiFetch<{ results: any[] }>(`/api/search?${qs}`)
  },

  ask: (body: { question: string; topK?: number; stream?: boolean }) =>
    apiFetch<{ answer: string; sources: any[]; tokensUsed: number }>('/api/ask', {
      method: 'POST',
      body: JSON.stringify({ ...body, stream: false }),
    }),

  reports: () => apiFetch<{ reports: { date: string; path: string }[] }>('/api/reports'),

  report: (date: string) =>
    apiFetch<{ date: string; content: string }>(`/api/reports/${date}`),

  generateReport: (date?: string) =>
    apiFetch<{ date: string; reportPath: string; content: string; documentsIncluded: number }>(
      '/api/reports/generate',
      { method: 'POST', body: JSON.stringify({ date }) },
    ),

  ingest: (uri: string) =>
    apiFetch<{ success: boolean }>('/api/ingest', {
      method: 'POST',
      body: JSON.stringify({ uri }),
    }),
}
