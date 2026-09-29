'use client'
import { useRouter } from 'next/navigation'
import { ChevronLeftIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import IconBox from '@/components/ui/IconBox'
import { useT } from '@/components/shared/LanguageProvider'

interface PageHeaderProps {
  title: string
  subtitle?: string
  back?: boolean
  action?: React.ReactNode
  className?: string
}

export default function PageHeader({ title, subtitle, back, action, className }: PageHeaderProps) {
  const router = useRouter()
  const t = useT()
  return (
    <header className={cn('sticky top-0 z-40 flex items-center gap-3 border-b border-border/70 bg-bg/95 px-4 py-4 backdrop-blur sm:px-6', className)}>
      {back && (
        <button onClick={() => router.back()} className="shrink-0 active:scale-90 transition-transform" aria-label={t.common.back}>
          <IconBox icon={ChevronLeftIcon} variant="white" size="sm" className="rtl:rotate-180" />
        </button>
      )}
      <div className="flex-1 min-w-0">
        <h1 className="text-[18px] font-bold text-text truncate tracking-tight">{title}</h1>
        {subtitle && <p className="text-[11px] font-bold text-muted mt-0.5 uppercase tracking-wider">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  )
}
