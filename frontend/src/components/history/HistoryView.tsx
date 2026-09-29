'use client'
import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { PlayCircleIcon, ChevronRightIcon } from 'lucide-react'
import { timeAgo } from '@/lib/utils'
import type { HistoryEntry } from '@/types'
import AppHeader    from '@/components/shared/AppHeader'
import SearchBar    from '@/components/shared/SearchBar'
import SectionHeader from '@/components/shared/SectionHeader'
import { CardItem } from '@/components/shared/CardItem'
import { useLanguage, useT } from '@/components/shared/LanguageProvider'

interface Props { items: HistoryEntry[] }

function groupByDate(items: HistoryEntry[], labels: { today: string; yesterday: string; older: string }) {
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
  const yesterdayStart = new Date(todayStart); yesterdayStart.setDate(yesterdayStart.getDate() - 1)
  const today     = items.filter(i => new Date(i.viewed_at) >= todayStart)
  const yesterday = items.filter(i => { const d = new Date(i.viewed_at); return d >= yesterdayStart && d < todayStart })
  const older     = items.filter(i => new Date(i.viewed_at) < yesterdayStart)
  return [
    ...(today.length     ? [{ label: labels.today,     items: today }]     : []),
    ...(yesterday.length ? [{ label: labels.yesterday, items: yesterday }] : []),
    ...(older.length     ? [{ label: labels.older,     items: older }]     : []),
  ]
}

export default function HistoryView({ items }: Props) {
  const [search, setSearch] = useState('')
  const [historyItems, setHistoryItems] = useState<HistoryEntry[]>(items)
  const t = useT()
  const { language } = useLanguage()

  // Sync state with props when server-side data changes
  useEffect(() => {
    setHistoryItems(items)
  }, [items])

  const valid = useMemo(() => historyItems.filter(e => e.lesson?.id), [historyItems])
  const isEmpty  = valid.length === 0
  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    if (!needle) return valid
    return valid.filter(e =>
      e.lesson?.title?.toLowerCase().includes(needle) ||
      e.lesson?.course?.title?.toLowerCase().includes(needle),
    )
  }, [search, valid])
  const groups = useMemo(
    () => groupByDate(filtered, { today: t.history.today, yesterday: t.history.yesterday, older: t.history.older }),
    [filtered, t],
  )

  return (
    <div className="min-h-[100dvh] w-full page-enter bg-bg">
      <div className="w-full px-4 pb-24">
        <AppHeader
          title={t.history.title}
          subtitle={!isEmpty ? `${valid.length} ${valid.length === 1 ? t.history.viewedLesson : t.history.viewedLessons}` : undefined}
        />

        <div className="mb-8">
          <SearchBar value={search} onChange={setSearch} />
        </div>

        {isEmpty ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
             <div className="w-20 h-20 rounded-lg bg-[#E6FAF8] dark:bg-primary/15 flex items-center justify-center shadow-inner border border-primary/15">
               <PlayCircleIcon size={35} className="text-[#0E7490]/60" />
             </div>
             <div className="space-y-2">
              <p className="text-[17px] font-bold text-text tracking-tight">{t.history.emptyTitle}</p>
              <p className="text-sm text-muted px-10 leading-relaxed font-medium">
                {t.history.emptyDescription}
              </p>
            </div>
            <Link 
              href="/courses"
              prefetch
              className="px-8 py-4 rounded-lg bg-primary text-white font-bold text-[15px] shadow-xl shadow-primary/20 active:scale-95 transition-all"
            >
              {t.history.browseCourses}
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-sm py-12 text-muted font-medium">
            {t.history.noResultsFor} &quot;{search}&quot;
          </p>
        ) : (
          <div className="space-y-8">
            {groups.map((group, gi) => (
              <div key={group.label}>
                <SectionHeader label={group.label} index={gi} />
                <div className="space-y-4">
                  {group.items.map((entry, i) => (
                    <Link key={entry.id} href={`/lessons/${entry.lesson!.id}`} prefetch>
                      <CardItem
                        index={i}
                        title={entry.lesson?.title ?? ''}
                        subtitle={entry.lesson?.course?.title}
                        icon={
                          entry.lesson?.course?.thumbnail_url
                            ? <img src={entry.lesson.course.thumbnail_url} alt="" width={96} height={96} loading="lazy" decoding="async" className="w-full h-full object-cover rounded-lg" />
                            : PlayCircleIcon
                        }
                        right={
                          <div className="flex flex-col items-end gap-1.5">
                            <span className="text-[10px] font-bold text-muted uppercase tracking-tighter">{timeAgo(entry.viewed_at, language)}</span>
                            <ChevronRightIcon size={16} className="text-[#0E7490]/50 rtl:rotate-180" />
                          </div>
                        }
                      />
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
