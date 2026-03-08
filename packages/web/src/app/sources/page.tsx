'use client'

import { useState } from 'react'
import { FolderOpen, Globe, FileText, Github, Plus, RefreshCw, Terminal } from 'lucide-react'
import { api } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

export default function SourcesPage() {
  const [uri, setUri] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleIngest() {
    if (!uri.trim()) return
    setLoading(true)
    setStatus('Ingesting...')
    try {
      await api.ingest(uri.trim())
      setStatus('Done! Content indexed successfully.')
      setUri('')
    } catch (err) {
      setStatus(`Error: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      {/* Header */}
      <div className="animate-fade-up">
        <h2 className="font-display text-[28px] font-semibold text-foreground">Sources</h2>
        <p className="mt-1 text-sm text-muted-foreground">Add content to your knowledge base</p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="folder" className="animate-fade-up stagger-1">
        <TabsList className="w-full">
          <TabsTrigger value="folder" className="flex-1 gap-2">
            <FolderOpen size={13} /> Folder / File
          </TabsTrigger>
          <TabsTrigger value="web" className="flex-1 gap-2">
            <Globe size={13} /> Web URL
          </TabsTrigger>
          <TabsTrigger value="notion" className="flex-1 gap-2">
            <FileText size={13} /> Notion
          </TabsTrigger>
          <TabsTrigger value="github" className="flex-1 gap-2">
            <Github size={13} /> GitHub
          </TabsTrigger>
        </TabsList>

        <TabsContent value="folder">
          <Card>
            <CardContent className="flex flex-col gap-5">
              <p className="text-sm leading-relaxed text-muted-foreground">
                Enter an absolute path to a Markdown file or folder to index it. All{' '}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-primary">.md</code>{' '}
                files will be recursively indexed.
              </p>
              <Input
                type="text"
                value={uri}
                onChange={(e) => setUri(e.target.value)}
                placeholder="/Users/you/notes or /Users/you/notes/file.md"
                className="h-10"
              />
              <IngestButton loading={loading} disabled={!uri.trim()} onClick={handleIngest} />
              <StatusMessage status={status} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="web">
          <Card>
            <CardContent className="flex flex-col gap-5">
              <p className="text-sm leading-relaxed text-muted-foreground">
                Enter a URL to scrape and add to your knowledge base. The content will be saved as a
                Markdown file in{' '}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-primary">brain/inbox/</code>.
              </p>
              <Input
                type="url"
                value={uri}
                onChange={(e) => setUri(e.target.value)}
                placeholder="https://example.com/article"
                className="h-10"
              />
              <IngestButton loading={loading} disabled={!uri.trim()} onClick={handleIngest} />
              <StatusMessage status={status} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notion">
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-sm text-muted-foreground">Coming soon.</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Use the CLI: <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-primary">aipks sync notion</code>
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="github">
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-sm text-muted-foreground">Coming soon.</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Use the CLI: <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-primary">aipks sync github</code>
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* CLI Tips */}
      <Card className="animate-fade-up stagger-2">
        <CardContent className="flex flex-col gap-3">
          <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Terminal size={12} className="text-primary" />
            CLI commands
          </p>
          <div className="flex flex-col gap-1.5 font-mono text-xs text-muted-foreground">
            <p><span className="text-secondary-foreground">aipks add ./brain</span> — index your entire vault</p>
            <p><span className="text-secondary-foreground">aipks watch ./brain</span> — auto-index on file changes</p>
            <p><span className="text-secondary-foreground">aipks add https://...</span> — index a web page</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function IngestButton({ loading, disabled, onClick }: { loading: boolean; disabled: boolean; onClick: () => void }) {
  return (
    <Button onClick={onClick} disabled={loading || disabled} className="w-fit">
      {loading ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
      {loading ? 'Indexing...' : 'Index Content'}
    </Button>
  )
}

function StatusMessage({ status }: { status: string | null }) {
  if (!status) return null
  return (
    <p className={`text-sm ${status.startsWith('Error') ? 'text-destructive' : 'text-success'}`}>
      {status}
    </p>
  )
}
