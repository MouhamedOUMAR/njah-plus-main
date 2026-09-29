interface StatCardProps {
  label: string
  value: number | string
  icon: React.ReactNode
  color?: 'blue' | 'green' | 'yellow' | 'purple'
}

const palettes = {
  blue:   { wrap: 'bg-[#E6FAF8] dark:bg-primary/15 text-[#0E7490] border border-primary/15' },
  green:  { wrap: 'bg-green-50 dark:bg-green-500/10 text-green-600 border border-green-500/10' },
  yellow: { wrap: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 border border-amber-500/10' },
  purple: { wrap: 'bg-[#E6FAF8] dark:bg-primary/15 text-[#0E7490] border border-primary/15' },
}

export default function StatCard({
  label, value, icon, color = 'blue',
}: StatCardProps) {
  const { wrap } = palettes[color]

  return (
    <div className="bg-card rounded-lg p-4 border border-border/40 shadow-sm flex flex-col gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${wrap}`}>
        {icon}
      </div>
      {/* Value + label */}
      <div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white leading-none tabular-nums">{value}</p>
        <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 leading-tight">{label}</p>
      </div>
    </div>
  )
}
