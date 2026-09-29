'use client'
import { CalendarDaysIcon, TimerIcon, TrendingUpIcon } from 'lucide-react'
import { daysUntilBac } from '@/lib/utils'
import { useT } from '@/components/shared/LanguageProvider'

export default function WelcomeHero() {
  const days = daysUntilBac()
  const t = useT()
  const progressPercent = 92

  return (
    <div className="overflow-hidden rounded-lg border border-white/10 bg-gradient-to-br from-[#0E7490] via-[#0F5F78] to-[#7AC943] p-4 text-white shadow-lg shadow-primary/20">
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center rounded-full border border-white/15 bg-white/15 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider">
          {t.dashboard.bac2026}
        </span>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-cyan-50/90 shrink-0">
          <CalendarDaysIcon size={12} className="text-cyan-100" />
          15 juin 2026
        </span>
      </div>

      <div className="mt-4 grid grid-cols-[4rem_1fr] items-center gap-3">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-white/20 bg-white/[0.14] shadow-inner">
          <span className="text-3xl font-extrabold leading-none tabular-nums">
            {days}
          </span>
        </div>

        <div className="min-w-0">
          <p className="flex items-center gap-2 text-lg font-extrabold leading-tight">
            <TimerIcon size={18} className="shrink-0 text-cyan-100" />
            {t.dashboard.daysLeft}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-cyan-50/85">
            {t.dashboard.keepGoing}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.09] p-3">
        <div className="flex items-center justify-between gap-3 text-[11px] font-bold text-cyan-50/90">
          <span className="inline-flex items-center gap-1.5 min-w-0">
            <TrendingUpIcon size={13} className="text-emerald-300 shrink-0" />
            <span className="truncate">{t.dashboard.progressBac}</span>
          </span>
          <span className="shrink-0">{progressPercent}% {t.dashboard.pathCovered}</span>
        </div>

        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/15">
          <div
            className="h-full rounded-full bg-gradient-to-r from-yellow-300 to-emerald-400 rtl:bg-gradient-to-l"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

    </div>
  )
}
