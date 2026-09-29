'use client'

import { GlobeIcon } from 'lucide-react'
import { useLanguage, useT } from '@/components/shared/LanguageProvider'
import type { Language } from '@/lib/i18n'
import { cn } from '@/lib/utils'

const OPTIONS: { value: Language; code: string }[] = [
  { value: 'fr', code: 'FR' },
  { value: 'ar', code: 'AR' },
  { value: 'en', code: 'EN' },
]

function readPath(source: unknown, path: string): string {
  const value = path.split('.').reduce<unknown>((current, part) => {
    if (current && typeof current === 'object' && part in current) {
      return (current as Record<string, unknown>)[part]
    }
    return undefined
  }, source)

  return typeof value === 'string' ? value : path
}

function applyValues(text: string, values?: Record<string, string | number>) {
  if (!values) return text
  return Object.entries(values).reduce(
    (next, [key, value]) => next.replaceAll(`{${key}}`, String(value)),
    text,
  )
}

export function useAdminT() {
  const t = useT()
  return (path: string, values?: Record<string, string | number>) =>
    applyValues(readPath(t.admin, path), values)
}

export function AdminText({
  k,
  values,
  className,
}: {
  k: string
  values?: Record<string, string | number>
  className?: string
}) {
  const adminT = useAdminT()
  return <span className={className}>{adminT(k, values)}</span>
}

export function AdminLanguageSelector({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage } = useLanguage()
  const t = useT()

  return (
    <label
      className={cn(
        'flex items-center gap-2 rounded-xl border border-admin-border bg-admin-surface px-2.5 py-2 text-slate-300',
        compact ? 'justify-center' : 'w-full',
      )}
      title={t.common.language}
    >
      <GlobeIcon size={16} className="shrink-0 text-cyan-300" />
      <select
        value={language}
        onChange={event => setLanguage(event.target.value as Language)}
        className={cn(
          'min-w-0 bg-transparent text-xs font-bold text-slate-200 outline-none',
          compact ? 'w-10' : 'flex-1',
        )}
        aria-label={t.common.language}
      >
        {OPTIONS.map(option => (
          <option key={option.value} value={option.value} className="bg-admin-bg text-white">
            {compact ? option.code : `${t.settings.languageNames[option.value]} - ${option.code}`}
          </option>
        ))}
      </select>
    </label>
  )
}
