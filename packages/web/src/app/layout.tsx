import type { Metadata } from 'next'
import { Crimson_Pro, DM_Sans, JetBrains_Mono } from 'next/font/google'
import { Sidebar } from '@/components/ui/Sidebar'
import { Providers } from './providers'
import './globals.css'

const crimson = Crimson_Pro({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
  weight: ['400', '500'],
})

export const metadata: Metadata = {
  title: 'AIPKS — AI Personal Knowledge System',
  description: 'Your second brain, powered by AI',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${crimson.variable} ${dmSans.variable} ${jetbrains.variable}`}>
      <body className="min-h-screen antialiased">
        <Providers>
          <Sidebar />
          <main className="ml-[var(--sidebar-w)] min-h-screen px-10 py-8">
            <div className="mx-auto max-w-[960px]">
              {children}
            </div>
          </main>
        </Providers>
      </body>
    </html>
  )
}
