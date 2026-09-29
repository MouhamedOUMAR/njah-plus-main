'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeftIcon, BellIcon } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import FAQSection from './FAQSection'
import SupportSection from './SupportSection'
import { useT } from '@/components/shared/LanguageProvider'

type MainTab = 'help' | 'support'

export default function HelpCenter() {
  const router  = useRouter()
  const [tab, setTab] = useState<MainTab>('help')
  const t = useT()

  const TABS: { key: MainTab; label: string }[] = [
    { key: 'help',    label: t.help.title },
    { key: 'support', label: t.help.onlineSupport },
  ]

  return (
    <div className="min-h-[100dvh] w-full page-enter bg-bg">
      <div className="mx-auto w-full max-w-6xl">

        {/* ── Gradient header ────────────────────────────────────── */}
        <div className="border-b border-white/15 bg-primary-dark px-4 pb-6 pt-8 sm:px-6">

          {/* Top bar */}
          <div className="flex items-center justify-between mb-5">
            <button
              onClick={() => router.back()}
              className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center active:scale-90 transition-transform"
              aria-label={t.common.back}
            >
              <ChevronLeftIcon size={20} className="text-white rtl:rotate-180" />
            </button>

            <span className="text-white font-bold text-lg text-center min-w-0 truncate px-2">
              {tab === 'help' ? t.help.title : t.help.onlineSupport}
            </span>

            <Link
              href="/notifications"
              prefetch
              className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center active:scale-90 transition-transform"
              aria-label={t.common.notifications}
            >
              <BellIcon size={18} className="text-white" />
            </Link>
          </div>

          {/* Main tab switcher */}
          <div className="flex bg-white/15 rounded-lg p-1 gap-1">
            {TABS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={cn(
                  'flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95',
                  tab === key
                    ? 'bg-white dark:bg-slate-900 text-[#0E7490] shadow-sm'
                    : 'text-white/80 hover:text-white',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Content ────────────────────────────────────────────── */}
        <div className="pb-28">
          {tab === 'help'
            ? <FAQSection />
            : <SupportSection />
          }
        </div>

      </div>
    </div>
  )
}
