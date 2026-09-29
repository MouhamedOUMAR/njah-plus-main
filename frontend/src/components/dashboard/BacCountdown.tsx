'use client'
import { CalendarDaysIcon, SparklesIcon, TrophyIcon, TrendingUpIcon } from 'lucide-react'
import { daysUntilBac } from '@/lib/utils'

export default function BacCountdown() {
  const days = daysUntilBac()

  return (
    <div className="relative bg-gradient-to-br from-[#0E7490] to-[#0B3D66] rounded-lg p-6 text-white shadow-lg overflow-hidden">
      {/* Decorative effect */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 bg-white/15 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest backdrop-blur-sm border border-white/10">
          <SparklesIcon size={12} />
          BAC 2026
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-medium text-white/80">
          <CalendarDaysIcon size={12} />
          15 juin 2026
        </div>
      </div>

      {/* Countdown */}
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-6xl font-extrabold tracking-tighter">{days}</span>
        <span className="text-xl font-medium text-white/90">jours restants</span>
      </div>
      <p className="text-sm text-white/70 mb-8 font-medium">Continue ta préparation, chaque leçon compte.</p>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-white/80">
          <span>Progression vers le BAC</span>
          <span>92% du chemin parcouru</span>
        </div>
        <div className="h-2 w-full bg-black/20 rounded-full overflow-hidden">
          <div className="h-full bg-white/40 rounded-full w-[92%]" />
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 flex items-center gap-2 text-[11px] font-medium text-white/90 bg-white/10 p-3 rounded-lg border border-white/5">
        <TrophyIcon size={14} className="text-yellow-300" />
        Reste concentré, ton objectif se rapproche.
      </div>
    </div>
  )
}
