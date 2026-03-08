'use client'

import { useState } from 'react'
import { Search, FileText } from 'lucide-react'
import { api } from '@/lib/api-client'
import { useDebounce } from '@/lib/hooks/useDebounce'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const FOLDERS = ['', 'inbox', 'projects', 'areas', 'resources', 'archive']

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [paraFolder, setParaFolder] = useState('')
  const debouncedQuery = useDebounce(query, 300)

  const { data, isLoading } = useQuery({
    queryKey: ['search', debouncedQuery, paraFolder],
    queryFn: () => api.search(debouncedQuery, { paraFolder: paraFolder || undefined }),
    enabled: debouncedQuery.length >= 2,
  })

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div className="animate-fade-up">
        <h2 className="font-display text-[28px] font-semibold text-foreground">Search</h2>
        <p className="mt-1 text-sm text-muted-foreground">Semantic search across your knowledge base</p>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search your notes..."
          className="h-10 pl-10"
          autoFocus
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {FOLDERS.map((f) => (
          <Button
            key={f}
            variant={paraFolder === f ? 'default' : 'outline'}
            size="sm"
            onClick={() => setParaFolder(f)}
            className="rounded-full"
          >
            {f || 'All'}
          </Button>
        ))}
      </div>

      {isLoading && <p className="text-sm text-primary">Searching...</p>}
      {data && data.results.length === 0 && (
        <p className="text-sm text-muted-foreground">No results for &ldquo;{debouncedQuery}&rdquo;</p>
      )}

      <div className="flex flex-col gap-3">
        {data?.results.map((r: any, i: number) => <SearchResultCard key={i} result={r} />)}
      </div>
    </div>
  )
}

function SearchResultCard({ result }: { result: any }) {
  const score = Math.round(result.score * 100)
  const scoreColor = score >= 80 ? 'text-success' : score >= 60 ? 'text-warning' : 'text-muted-foreground'

  return (
    <Card>
      <CardContent>
        <div className="flex justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-center gap-2">
              <FileText size={14} className="shrink-0 text-primary" />
              <Link href={`/knowledge/${result.document.id}`} className="truncate text-sm font-medium text-foreground no-underline hover:text-primary">
                {result.document.title}
              </Link>
              {result.document.paraFolder && <Badge variant="secondary">{result.document.paraFolder}</Badge>}
            </div>
            {result.chunkRef.heading && (
              <p className="mb-1.5 font-mono text-[11px] text-muted-foreground">
                {result.chunkRef.heading}
              </p>
            )}
            <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
              {result.chunkText}
            </p>
          </div>
          <div className={`shrink-0 font-mono text-sm font-medium ${scoreColor}`}>
            {score}%
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
