'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CheckCircle, AlertCircle, Zap, HardDrive, Terminal, Key } from 'lucide-react'
import { api } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export default function SettingsPage() {
  const { data: status } = useQuery({ queryKey: ['status'], queryFn: api.status })
  const [testResult, setTestResult] = useState<string | null>(null)

  async function testConnection() {
    try {
      await api.status()
      setTestResult('ok')
    } catch {
      setTestResult('error')
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      {/* Header */}
      <div className="animate-fade-up">
        <h2 className="font-display text-[28px] font-semibold text-foreground">Settings</h2>
        <p className="mt-1 text-sm text-muted-foreground">Configuration and storage info</p>
      </div>

      {/* API Connection */}
      <Section title="API Server" icon={Zap} delay={1}>
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">URL</span>
            <code className="rounded-lg border border-border bg-muted px-3 py-1.5 font-mono text-xs text-secondary-foreground">
              {API_URL}
            </code>
            <Button variant="outline" size="sm" onClick={testConnection}>Test</Button>
          </div>
          {testResult === 'ok' && (
            <p className="flex items-center gap-1.5 text-xs text-success">
              <CheckCircle size={13} /> Connected
            </p>
          )}
          {testResult === 'error' && (
            <p className="flex items-center gap-1.5 text-xs text-destructive">
              <AlertCircle size={13} /> Cannot connect — is the server running?
            </p>
          )}
        </div>
      </Section>

      {/* Storage */}
      <Section title="Storage" icon={HardDrive} delay={2}>
        <div className="grid grid-cols-2 gap-4">
          <InfoRow label="Documents" value={status?.documents ?? '—'} />
          <InfoRow label="Chunks" value={status?.chunks ?? '—'} />
          <InfoRow label="Vectors" value={status?.vectorCount ?? '—'} />
          <InfoRow label="Embedding Model" value={status?.embeddingModel ?? 'text-embedding-3-small'} />
          <InfoRow label="Last Report" value={status?.lastReport ?? 'None'} />
        </div>
      </Section>

      {/* Index */}
      <Section title="Index" icon={Terminal} delay={3}>
        <p className="text-sm text-muted-foreground">Use CLI to rebuild the entire index:</p>
        <code className="mt-2 block rounded-lg border border-border bg-muted px-4 py-3 font-mono text-xs text-primary">
          aipks add ./brain --force
        </code>
      </Section>

      {/* Configuration */}
      <Section title="Configuration" icon={Key} delay={4}>
        <p className="text-sm text-muted-foreground">
          Configured via environment variables. Edit your{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-primary">.env</code> file:
        </p>
        <div className="mt-3 flex flex-col gap-1 rounded-lg border border-border bg-muted p-4 font-mono text-xs">
          <p><span className="text-primary">OPENAI_API_KEY</span><span className="text-muted-foreground">=sk-...</span></p>
          <p><span className="text-primary">OPENAI_EMBEDDING_MODEL</span><span className="text-muted-foreground">=text-embedding-3-small</span></p>
          <p><span className="text-primary">OPENAI_CHAT_MODEL</span><span className="text-muted-foreground">=gpt-4o-mini</span></p>
          <p><span className="text-primary">BRAIN_FOLDER</span><span className="text-muted-foreground">=./brain</span></p>
          <p><span className="text-primary">API_PORT</span><span className="text-muted-foreground">=3001</span></p>
        </div>
      </Section>
    </div>
  )
}

function Section({ title, icon: Icon, delay, children }: { title: string; icon: React.ElementType; delay: number; children: React.ReactNode }) {
  return (
    <Card className={`animate-fade-up stagger-${delay}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Icon size={14} className="text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {children}
      </CardContent>
    </Card>
  )
}

function InfoRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="mt-1 text-sm text-secondary-foreground">{value}</div>
    </div>
  )
}
