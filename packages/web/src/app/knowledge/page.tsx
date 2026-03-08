'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Trash2, Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { api } from '@/lib/api-client'
import Link from 'next/link'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card } from '@/components/ui/card'

const PARA_FOLDERS = ['', 'inbox', 'projects', 'areas', 'resources', 'archive']

export default function KnowledgePage() {
  const [paraFolder, setParaFolder] = useState('')
  const [page, setPage] = useState(0)
  const qc = useQueryClient()
  const limit = 20

  const { data, isLoading } = useQuery({
    queryKey: ['documents', paraFolder, page],
    queryFn: () => api.documents({ paraFolder: paraFolder || undefined, limit, offset: page * limit }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteDocument(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }),
  })

  const totalPages = data ? Math.ceil(data.total / limit) : 0

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="animate-fade-up flex items-end justify-between">
        <div>
          <h2 className="font-display text-[28px] font-semibold text-foreground">Knowledge Base</h2>
          <p className="mt-1 font-mono text-sm text-muted-foreground">
            {data?.total ?? 0} notes indexed
          </p>
        </div>
        <Link href="/sources" className={cn(buttonVariants(), 'gap-2 no-underline')}>
          <Plus size={14} /> Add Content
        </Link>
      </div>

      {/* Folder filter */}
      <div className="flex flex-wrap gap-2">
        {PARA_FOLDERS.map((f) => (
          <Button
            key={f}
            variant={paraFolder === f ? 'default' : 'outline'}
            size="sm"
            onClick={() => { setParaFolder(f); setPage(0) }}
            className="rounded-full"
          >
            {f || 'All'}
          </Button>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <p className="text-sm text-primary">Loading...</p>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Folder</TableHead>
                <TableHead>Domain</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Indexed</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.documents.map((doc: any) => (
                <TableRow key={doc.id}>
                  <TableCell>
                    <Link href={`/knowledge/${doc.id}`} className="text-foreground no-underline hover:text-primary">
                      {doc.title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{doc.paraFolder ?? '—'}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{doc.domain ?? '—'}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {doc.tags?.map((t: string) => (
                        <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {doc.indexedAt?.slice(0, 10)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="text-destructive opacity-40 hover:opacity-100"
                      onClick={() => {
                        if (confirm('Remove from index? File stays on disk.')) {
                          deleteMutation.mutate(doc.id)
                        }
                      }}
                    >
                      <Trash2 size={13} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {data?.documents.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    No notes found.{' '}
                    <Link href="/sources" className="text-primary">Add some &rarr;</Link>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="animate-fade-in flex items-center justify-center gap-3">
          <Button variant="outline" size="icon-sm" onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}>
            <ChevronLeft size={16} />
          </Button>
          <span className="font-mono text-xs text-muted-foreground">
            {page + 1} / {totalPages}
          </span>
          <Button variant="outline" size="icon-sm" onClick={() => setPage(page + 1)} disabled={(page + 1) * limit >= (data?.total ?? 0)}>
            <ChevronRight size={16} />
          </Button>
        </div>
      )}
    </div>
  )
}
