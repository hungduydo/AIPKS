import { api } from '@/lib/api-client'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, FileText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

export default async function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  let doc: any
  try {
    doc = await api.document(id)
  } catch {
    notFound()
  }

  if (!doc) notFound()

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <Link href="/knowledge" className="inline-flex items-center gap-2 text-xs text-muted-foreground no-underline hover:text-foreground">
        <ArrowLeft size={12} />
        Back to Knowledge Base
      </Link>

      <div className="animate-fade-up">
        <div className="mb-2 flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <FileText size={16} />
          </div>
          <h2 className="font-display text-2xl font-semibold text-foreground">{doc.title}</h2>
        </div>
        <p className="font-mono text-xs text-muted-foreground">{doc.filePath}</p>
      </div>

      <Card className="animate-fade-up stagger-1">
        <CardHeader>
          <CardTitle className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            Metadata
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <MetaField label="ID" value={doc.id} />
            <MetaField label="PARA Folder" value={doc.paraFolder ?? '—'} />
            <MetaField label="Type" value={doc.noteType ?? '—'} />
            <MetaField label="Domain" value={doc.domain ?? '—'} />
            <MetaField label="Created" value={doc.createdAt ?? '—'} />
            <MetaField label="Updated" value={doc.updatedAt ?? '—'} />
            <MetaField label="Indexed" value={doc.indexedAt?.slice(0, 19)} />
            <MetaField label="Content Hash" value={doc.contentHash?.slice(0, 12) + '...'} />
          </dl>
          {doc.tags?.length > 0 && (
            <>
              <Separator className="my-4" />
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Tags</span>
              <div className="mt-2 flex gap-1.5">
                {doc.tags.map((t: string) => (
                  <Badge key={t} variant="secondary">{t}</Badge>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function MetaField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="mt-1 truncate font-mono text-xs text-secondary-foreground">{value}</dd>
    </div>
  )
}
