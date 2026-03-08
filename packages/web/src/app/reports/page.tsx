'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Calendar, RefreshCw, FileText } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { api } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export default function ReportsPage() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const qc = useQueryClient()

  const { data: reportsData, isLoading } = useQuery({
    queryKey: ['reports'],
    queryFn: api.reports,
  })

  const { data: reportContent } = useQuery({
    queryKey: ['report', selectedDate],
    queryFn: () => api.report(selectedDate!),
    enabled: !!selectedDate,
  })

  const generateMutation = useMutation({
    mutationFn: () => api.generateReport(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reports'] }),
  })

  const reports = reportsData?.reports ?? []

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="animate-fade-up flex items-end justify-between">
        <div>
          <h2 className="font-display text-[28px] font-semibold text-foreground">Reports</h2>
          <p className="mt-1 text-sm text-muted-foreground">Daily brain digests</p>
        </div>
        <Button onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending}>
          {generateMutation.isPending ? (
            <RefreshCw size={14} className="animate-spin" />
          ) : (
            <Calendar size={14} />
          )}
          Generate Report
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Report List */}
        <div className="animate-fade-up stagger-1 flex flex-col gap-2">
          {isLoading && <p className="text-sm text-primary">Loading...</p>}
          {reports.length === 0 && !isLoading && (
            <p className="text-sm text-muted-foreground">
              No reports yet. Click &ldquo;Generate&rdquo; to create one.
            </p>
          )}
          {reports.map((r: { date: string }) => (
            <button
              key={r.date}
              onClick={() => setSelectedDate(r.date)}
              className={cn(
                'flex w-full items-center gap-2.5 rounded-lg border px-4 py-3 text-left text-sm transition-colors',
                selectedDate === r.date
                  ? 'border-primary/20 bg-primary/10 text-primary'
                  : 'border-border bg-card text-muted-foreground hover:bg-muted'
              )}
            >
              <Calendar size={12} className="opacity-50" />
              <span className="font-mono text-xs">{r.date}</span>
            </button>
          ))}
        </div>

        {/* Report Content */}
        <div className="animate-fade-up stagger-2 lg:col-span-2">
          {selectedDate && reportContent ? (
            <Card>
              <CardContent>
                <div className="prose-warm prose prose-sm max-w-none">
                  <ReactMarkdown>{reportContent.content}</ReactMarkdown>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-10 text-center">
                <FileText size={32} className="mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">Select a report to view</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
