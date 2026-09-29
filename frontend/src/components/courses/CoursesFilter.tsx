'use client'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { SearchIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCallback, useEffect, useTransition, useState } from 'react'
import { useT } from '@/components/shared/LanguageProvider'
import { LICENSE_STRUCTURE, LICENSE_YEARS } from '@/constants'
import type { LicenseYear } from '@/types'

export default function CoursesFilter({ mode = 'all' }: { mode?: 'all' | 'search' | 'filters' }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()
  const [q, setQ] = useState(searchParams.get('q') ?? '')
  const currentYear = searchParams.get('year') ?? ''
  const currentSemester = searchParams.get('semester') ?? ''
  const currentQuery = searchParams.get('q') ?? ''
  const t = useT()

  const updateParam = useCallback((key: string, value: string, mode: 'push' | 'replace' = 'push') => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    if (key !== 'q') {
      if (q) params.set('q', q)
      else params.delete('q')
    }
    const query = params.toString()
    const nextHref = query ? `${pathname}?${query}` : pathname
    startTransition(() => {
      if (mode === 'replace') router.replace(nextHref)
      else router.push(nextHref)
    })
  }, [pathname, q, router, searchParams, startTransition])

  useEffect(() => {
    if (q === currentQuery) return
    const timeout = window.setTimeout(() => updateParam('q', q, 'replace'), 220)
    return () => window.clearTimeout(timeout)
  }, [currentQuery, q, updateParam])

  function updateYear(year: LicenseYear | '') {
    const params = new URLSearchParams(searchParams.toString())
    if (year) params.set('year', year)
    else params.delete('year')
    params.delete('semester')
    const query = params.toString()
    startTransition(() => router.push(query ? `${pathname}?${query}` : pathname))
  }

  const semesters = currentYear && currentYear in LICENSE_STRUCTURE
    ? LICENSE_STRUCTURE[currentYear as LicenseYear]
    : []
  const showSearch = mode !== 'filters'
  const showFilters = mode !== 'search'
  const onDark = mode === 'all'

  return (
    <div className="space-y-4">
      {showSearch && (
        <div className="group relative">
          <SearchIcon size={18} className="absolute start-4 top-1/2 -translate-y-1/2 text-primary" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder={t.courses.searchCourse}
            className="w-full rounded-lg border border-gray-200 bg-white py-3.5 pe-4 ps-11 text-start text-sm font-medium text-[#111827] shadow-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-400"
          />
        </div>
      )}

      {showFilters && (
        <>
          <div className="space-y-2">
            <p className={cn('px-1 text-[10px] font-bold uppercase', onDark ? 'text-white/65' : 'text-muted')}>
              {t.courses.licenseYear}
            </p>
            <div className="grid grid-cols-4 gap-2" role="group" aria-label={t.courses.licenseYear}>
              <button
                onClick={() => updateYear('')}
                className={cn(
                  'min-w-0 rounded-lg border px-2 py-2.5 text-xs font-bold transition active:scale-95',
                  !currentYear
                    ? onDark ? 'border-white bg-white text-primary' : 'border-primary bg-primary text-white'
                    : onDark ? 'border-white/20 bg-white/10 text-white' : 'border-border bg-card text-muted',
                )}
              >
                {t.courses.all}
              </button>
              {LICENSE_YEARS.map(year => (
                <button
                  key={year}
                  onClick={() => updateYear(year)}
                  className={cn(
                    'min-w-0 rounded-lg border px-2 py-2.5 text-xs font-bold transition active:scale-95',
                    currentYear === year
                      ? onDark ? 'border-white bg-white text-primary' : 'border-primary bg-primary text-white'
                      : onDark ? 'border-white/20 bg-white/10 text-white' : 'border-border bg-card text-muted',
                  )}
                >
                  {year}
                </button>
              ))}
            </div>
          </div>

          {semesters.length > 0 && (
            <div className="space-y-2">
              <p className={cn('px-1 text-[10px] font-bold uppercase', onDark ? 'text-white/65' : 'text-muted')}>
                {t.courses.semester}
              </p>
              <div className="grid grid-cols-3 gap-2" role="group" aria-label={t.courses.semester}>
                <button
                  onClick={() => updateParam('semester', '')}
                  className={cn(
                    'min-w-0 rounded-lg border px-2 py-2.5 text-xs font-bold transition active:scale-95',
                    !currentSemester
                      ? onDark ? 'border-white bg-white text-primary' : 'border-primary bg-primary text-white'
                      : onDark ? 'border-white/20 bg-white/10 text-white' : 'border-border bg-card text-muted',
                  )}
                >
                  {t.courses.allSemesters}
                </button>
                {semesters.map(value => (
                  <button
                    key={value}
                    onClick={() => updateParam('semester', value === currentSemester ? '' : value)}
                    className={cn(
                      'min-w-0 rounded-lg border px-2 py-2.5 text-xs font-bold transition active:scale-95',
                      currentSemester === value
                        ? onDark ? 'border-white bg-white text-primary' : 'border-primary bg-primary text-white'
                        : onDark ? 'border-white/20 bg-white/10 text-white' : 'border-border bg-card text-muted',
                    )}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
