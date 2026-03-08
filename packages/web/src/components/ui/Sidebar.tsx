'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  MessageCircle,
  Search,
  Library,
  Database,
  FileText,
  Settings,
  Brain,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'

const NAV = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/ask', label: 'Ask', icon: MessageCircle },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/knowledge', label: 'Knowledge', icon: Library },
  { href: '/sources', label: 'Sources', icon: Database },
  { href: '/reports', label: 'Reports', icon: FileText },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function Sidebar() {
  const path = usePathname()

  return (
    <aside className="fixed inset-y-0 left-0 z-50 flex w-[var(--sidebar-w)] flex-col border-r border-border bg-sidebar">
      {/* Logo */}
      <div className="px-5 py-6">
        <Link href="/" className="flex items-center gap-2.5 no-underline">
          <div className="flex size-9 items-center justify-center rounded-[10px] bg-primary/15 text-primary">
            <Brain size={18} />
          </div>
          <div>
            <div className="font-display text-[15px] font-semibold tracking-wide text-foreground">
              AIPKS
            </div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Knowledge System
            </div>
          </div>
        </Link>
      </div>

      <Separator className="mx-4" />

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-0.5 px-2.5 py-3">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = path === href || (href !== '/' && path.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-[13px] no-underline transition-colors',
                active
                  ? 'bg-primary/15 font-medium text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon size={16} strokeWidth={active ? 2 : 1.5} />
              {label}
              {active && (
                <div className="ml-auto size-1.5 rounded-full bg-primary" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border px-5 py-3">
        <span className="font-mono text-[10px] text-muted-foreground">v0.1.0</span>
      </div>
    </aside>
  )
}
