import { api } from '@/lib/api-client'
import { BookOpen, Layers, Database, Calendar, MessageCircle, Search, Plus } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'

async function getStatus() {
  try { return await api.status() } catch { return null }
}

async function getRecentDocs() {
  try { const { documents } = await api.documents({ limit: 8 }); return documents } catch { return [] }
}

async function getTodayReport() {
  try { const today = new Date().toISOString().slice(0, 10); return await api.report(today) } catch { return null }
}

export default async function DashboardPage() {
  const [status, recentDocs, todayReport] = await Promise.all([getStatus(), getRecentDocs(), getTodayReport()])

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="animate-fade-up">
        <h2 className="font-display text-[28px] font-semibold text-foreground">Dashboard</h2>
        <p className="mt-1 text-sm text-muted-foreground">Your knowledge base at a glance</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard icon={BookOpen} label="Notes" value={status?.documents ?? '—'} />
        <StatCard icon={Layers} label="Chunks" value={status?.chunks ?? '—'} />
        <StatCard icon={Database} label="Vectors" value={status?.vectorCount ?? '—'} />
        <StatCard icon={Calendar} label="Last Report" value={status?.lastReport ?? 'None'} />
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3">
        <Link href="/ask" className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground no-underline transition-colors hover:bg-primary/80">
          <MessageCircle size={15} /> Ask a Question
        </Link>
        <Link href="/search" className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground no-underline transition-colors hover:bg-muted">
          <Search size={15} /> Search
        </Link>
        <Link href="/sources" className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground no-underline transition-colors hover:bg-muted">
          <Plus size={15} /> Add Content
        </Link>
      </div>

      {/* Content */}
      <div className="grid grid-cols-2 gap-5">
        {todayReport && (
          <Card>
            <CardContent>
              <h3 className="mb-3 flex items-center gap-2 font-display text-base font-semibold text-foreground">
                <Calendar size={16} className="text-primary" />
                Today&apos;s Report
              </h3>
              <p className="line-clamp-6 text-sm leading-relaxed text-muted-foreground">
                {todayReport.content.replace(/^---[\s\S]*?---\n/, '').trim()}
              </p>
              <Link href="/reports" className="mt-3 block text-xs text-primary no-underline">
                View full report &rarr;
              </Link>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent>
            <h3 className="mb-3 flex items-center gap-2 font-display text-base font-semibold text-foreground">
              <BookOpen size={16} className="text-primary" />
              Recent Notes
            </h3>
            {recentDocs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No notes indexed yet.{' '}
                <Link href="/sources" className="text-primary">Add your first note &rarr;</Link>
              </p>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {recentDocs.map((doc: any) => (
                  <li key={doc.id} className="flex items-center justify-between">
                    <Link href={`/knowledge/${doc.id}`} className="truncate text-sm text-muted-foreground no-underline hover:text-foreground">
                      {doc.title}
                    </Link>
                    <span className="ml-3 shrink-0 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {doc.paraFolder ?? '—'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/knowledge" className="mt-3 block text-xs text-primary no-underline">
              Browse all notes &rarr;
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | number }) {
  return (
    <Card className="animate-fade-up">
      <CardContent>
        <div className="mb-3 text-primary">
          <Icon size={20} strokeWidth={1.5} />
        </div>
        <div className="font-display text-[26px] font-semibold text-foreground">{value}</div>
        <div className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  )
}
