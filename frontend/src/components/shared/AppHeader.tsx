'use client'
import { useRouter } from 'next/navigation'
import { ChevronLeftIcon } from 'lucide-react'
import IconBox from '@/components/ui/IconBox'
import { useT } from '@/components/shared/LanguageProvider'

interface Props {
  title: string
  subtitle?: string
  right?: React.ReactNode
}

export default function AppHeader({ title, subtitle, right }: Props) {
  const router = useRouter()
  const t = useT()

  return (
    <div className="pt-10 pb-6 flex items-center gap-4">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="active:scale-90 transition-transform shrink-0"
        aria-label={t.common.back}
      >
        <IconBox icon={ChevronLeftIcon} variant="white" size="sm" className="rtl:rotate-180" />
      </button>

      {/* Title block — centered */}
      <div className="flex-1 text-center">
        <h1 className="text-lg font-bold text-text tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-[11px] font-bold text-muted mt-0.5 uppercase tracking-wider">
            {subtitle}
          </p>
        )}
      </div>

      {/* Right slot */}
      <div className="w-10 shrink-0 flex justify-end rtl:justify-start">
        {right ?? null}
      </div>
    </div>
  )
}


