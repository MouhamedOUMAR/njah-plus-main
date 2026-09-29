'use client'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronLeftIcon, ChevronRightIcon, SearchIcon,
  DownloadIcon, BookOpenIcon, ClockIcon,
  PlayCircleIcon, FileTextIcon, CheckCircle2Icon,
  SlidersHorizontalIcon,
} from 'lucide-react'
import { formatDuration } from '@/lib/utils'
import type { DownloadableLesson } from '@/types'
import { useT } from '@/components/shared/LanguageProvider'

type FilterType = 'all' | 'video' | 'text'

interface Props { items: DownloadableLesson[] }

/* ── Helpers ───────────────────────────────────────────────────────────── */
function lessonType(lesson: DownloadableLesson): 'video' | 'text' {
  return lesson.video_type ? 'video' : 'text'
}

function groupByDate(items: DownloadableLesson[], labels: { today: string; yesterday: string; older: string }) {
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
  const yesterdayStart = new Date(todayStart)
  yesterdayStart.setDate(yesterdayStart.getDate() - 1)

  const today     = items.filter(i => new Date(i.created_at) >= todayStart)
  const yesterday = items.filter(i => {
    const d = new Date(i.created_at)
    return d >= yesterdayStart && d < todayStart
  })
  const older = items.filter(i => new Date(i.created_at) < yesterdayStart)

  return [
    ...(today.length     ? [{ label: labels.today,     items: today }]     : []),
    ...(yesterday.length ? [{ label: labels.yesterday, items: yesterday }] : []),
    ...(older.length     ? [{ label: labels.older,     items: older }]    : []),
  ]
}

/* ── Type icon ─────────────────────────────────────────────────────────── */
function TypeIcon({ lesson }: { lesson: DownloadableLesson }) {
  if (lessonType(lesson) === 'video') {
    return (
      <div className="w-12 h-12 rounded-lg bg-[#E6FAF8] dark:bg-primary/15 border border-primary/15 flex items-center justify-center shrink-0">
        <PlayCircleIcon size={22} className="text-[#0E7490]" />
      </div>
    )
  }
  return (
    <div className="w-12 h-12 rounded-lg bg-green-50 dark:bg-green-500/10 border border-green-500/10 flex items-center justify-center shrink-0">
      <FileTextIcon size={22} className="text-green-600" />
    </div>
  )
}

/* ── Download card ─────────────────────────────────────────────────────── */
function DownloadCard({ lesson }: { lesson: DownloadableLesson }) {
  const type = lessonType(lesson)
  const t = useT()

  return (
    <Link href={`/lessons/${lesson.id}`} prefetch>
      <div className="flex items-center gap-4 bg-card rounded-lg shadow-sm border border-border/40 p-4
                      active:scale-[0.98] transition-all duration-150 hover:shadow-md hover:border-border/60">

        <TypeIcon lesson={lesson} />

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text truncate leading-snug">
            {lesson.title}
          </p>

          <div className="flex items-center gap-3 mt-1 text-xs text-muted flex-wrap">
            {lesson.course && (
              <span className="flex items-center gap-1 truncate max-w-[140px]">
                <BookOpenIcon size={10} className="shrink-0 text-[#0E7490]" />
                {lesson.course.title}
              </span>
            )}
            {lesson.duration > 0 && (
              <span className="flex items-center gap-1 shrink-0">
                <ClockIcon size={10} className="text-[#0E7490]" />
                {formatDuration(lesson.duration)}
              </span>
            )}
          </div>

          {/* Type tag */}
          <div className="mt-1.5">
            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full
              ${type === 'video'
                ? 'bg-[#E6FAF8] dark:bg-primary/15 text-[#0E7490] border border-primary/15'
                : 'bg-green-50 dark:bg-green-500/10 text-green-600 border border-green-500/10'
              }`}>
              {type === 'video' ? <PlayCircleIcon size={9} /> : <FileTextIcon size={9} />}
              {type === 'video' ? t.downloads.video : t.downloads.lesson}
            </span>
          </div>
        </div>

        {/* Status + chevron */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className="flex items-center gap-1 text-[10px] font-bold text-green-600
                           bg-green-50 dark:bg-green-500/10 border border-green-500/10 px-2 py-0.5 rounded-full">
            <CheckCircle2Icon size={9} />
            {t.downloads.available}
          </span>
          <ChevronRightIcon size={14} className="text-[#0E7490]/60 rtl:rotate-180" />
        </div>

      </div>
    </Link>
  )
}

/* ── Date section ──────────────────────────────────────────────────────── */
function DownloadSection({ label, items }: { label: string; items: DownloadableLesson[] }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3 px-1">
        <p className="text-xs font-bold text-muted uppercase tracking-wider">{label}</p>
        <span className="text-[10px] font-bold text-muted/60 bg-border/30 px-1.5 py-0.5 rounded-full">
          {items.length}
        </span>
      </div>
      <div className="space-y-3">
        {items.map(lesson => (
          <DownloadCard key={lesson.id} lesson={lesson} />
        ))}
      </div>
    </div>
  )
}

/* ── Filter chips ──────────────────────────────────────────────────────── */
function FilterChips({
  active, counts, onChange,
}: {
  active: FilterType
  counts: Record<FilterType, number>
  onChange: (f: FilterType) => void
}) {
  const t = useT()
  const filters: { key: FilterType; label: string }[] = [
    { key: 'all',   label: t.downloads.all },
    { key: 'video', label: t.downloads.videos },
    { key: 'text',  label: t.downloads.lessons },
  ]

  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-5 px-5">
      {filters.map(({ key, label }) => {
        const isActive = active === key
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`flex items-center gap-1.5 shrink-0 px-4 py-2 rounded-full text-xs font-bold
                        border transition-all duration-200 active:scale-95
                        ${isActive
                          ? 'bg-primary text-white border-primary shadow-sm'
                          : 'bg-card text-muted border-border/50 hover:border-primary/40'
                        }`}
          >
            {label}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold
              ${isActive ? 'bg-white/20 text-white' : 'bg-border/40 text-muted/70'}`}>
              {counts[key]}
            </span>
          </button>
        )
      })}
    </div>
  )
}

/* ── Summary bar ───────────────────────────────────────────────────────── */
function SummaryBar({ items }: { items: DownloadableLesson[] }) {
  const videos = items.filter(i => lessonType(i) === 'video').length
  const texts  = items.filter(i => lessonType(i) === 'text').length
  const t = useT()

  return (
    <div className="flex items-center gap-3 bg-card rounded-lg border border-border/40 shadow-sm p-4">
      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-50 dark:bg-green-500/10 border border-green-500/10 shrink-0">
        <DownloadIcon size={18} className="text-green-600" />
      </div>
      <div className="flex-1">
        <p className="text-xs font-bold text-text">
          {items.length} {items.length === 1 ? t.downloads.fileAvailable : t.downloads.filesAvailable}
        </p>
        <p className="text-[11px] text-muted mt-0.5">
          {videos > 0 && `${videos} ${videos === 1 ? t.downloads.video : t.downloads.videos}`}
          {videos > 0 && texts > 0 && ' · '}
          {texts > 0 && `${texts} ${texts === 1 ? t.downloads.textLesson : t.downloads.textLessons}`}
        </p>
      </div>
      <div className="flex items-center gap-1 text-[10px] font-bold text-green-600
                      bg-green-50 dark:bg-green-500/10 border border-green-500/10 px-2 py-1 rounded-full shrink-0">
        <CheckCircle2Icon size={10} />
        {t.downloads.offline}
      </div>
    </div>
  )
}

/* ── Empty state ───────────────────────────────────────────────────────── */
function EmptyDownloads({ isFiltered, search }: { isFiltered?: boolean; search?: string }) {
  const t = useT()
  if (isFiltered) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
        <div className="w-16 h-16 rounded-full bg-[#E6FAF8] dark:bg-primary/15 border border-primary/15 flex items-center justify-center">
          <SearchIcon size={28} className="text-[#0E7490]/60" />
        </div>
        <div>
          <p className="text-sm font-bold text-text">{t.downloads.noResults}</p>
          <p className="text-xs text-muted mt-1 max-w-[200px] leading-relaxed">
            {search
              ? `${t.downloads.noFileFor} "${search}"`
              : t.downloads.noFileInCategory}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-5">
      {/* Stacked circles decorative */}
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 rounded-full bg-green-50/60 dark:bg-green-500/10" />
        <div className="absolute inset-3 rounded-full bg-green-50 dark:bg-green-500/10" />
        <div className="absolute inset-0 flex items-center justify-center">
          <DownloadIcon size={36} className="text-green-600" />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold text-text">{t.downloads.emptyTitle}</h3>
        <p className="text-sm text-muted mt-2 max-w-xs leading-relaxed">
          {t.downloads.emptyDescription}
        </p>
      </div>

      <Link
        href="/courses"
        prefetch
        className="mt-1 px-8 py-3.5 rounded-lg bg-primary text-white text-sm font-bold
                   active:scale-95 transition-transform shadow-sm"
      >
        {t.downloads.exploreCourses}
      </Link>
    </div>
  )
}

/* ── Main view ─────────────────────────────────────────────────────────── */
export default function DownloadsView({ items }: Props) {
  const router  = useRouter()
  const [search, setSearch]   = useState('')
  const [filter, setFilter]   = useState<FilterType>('all')
  const t = useT()

  const counts = useMemo<Record<FilterType, number>>(() => ({
    all:   items.length,
    video: items.filter(i => lessonType(i) === 'video').length,
    text:  items.filter(i => lessonType(i) === 'text').length,
  }), [items])

  const filtered = useMemo(() => {
    return items.filter(item => {
      const matchSearch = !search ||
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.course?.title.toLowerCase().includes(search.toLowerCase())
      const matchFilter = filter === 'all' || lessonType(item) === filter
      return matchSearch && matchFilter
    })
  }, [items, search, filter])

  const groups = useMemo(
    () => groupByDate(filtered, { today: t.downloads.today, yesterday: t.downloads.yesterday, older: t.downloads.older }),
    [filtered, t],
  )

  const hasItems    = items.length > 0
  const hasFiltered = filtered.length > 0

  return (
    <div className="min-h-[100dvh] w-full page-enter bg-bg">
      <div className="mx-auto w-full max-w-6xl">

        {/* ── Gradient header ──────────────────────────────── */}
        <div className="border-b border-white/15 bg-primary-dark px-4 pb-6 pt-8 sm:px-6">

          {/* Top row */}
          <div className="flex items-center justify-between mb-5">
            <button
              onClick={() => router.back()}
              className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center
                         active:scale-90 transition-transform"
              aria-label={t.common.back}
            >
              <ChevronLeftIcon size={20} className="text-white rtl:rotate-180" />
            </button>

            <div className="text-center">
              <span className="text-white font-bold text-lg">{t.downloads.title}</span>
              {hasItems && (
                <p className="text-white/70 text-xs mt-0.5">
                  {items.length} {items.length === 1 ? t.downloads.fileAvailable : t.downloads.filesAvailable}
                </p>
              )}
            </div>

            <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">
              <SlidersHorizontalIcon size={16} className="text-white" />
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <SearchIcon
              size={16}
              className="absolute start-4 top-1/2 -translate-y-1/2 text-[#0E7490] pointer-events-none"
            />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t.downloads.search}
              className="w-full rounded-full bg-white dark:bg-slate-900 border border-white/20 dark:border-slate-700 ps-11 pe-4 py-3
                         text-sm text-[#111827] dark:text-white placeholder:text-gray-500 dark:placeholder:text-slate-400 outline-none shadow-sm text-start"
            />
          </div>
        </div>

        {/* ── Content ──────────────────────────────────────── */}
        <div className="px-5 pt-5 pb-28 space-y-5">

          {!hasItems ? (
            <EmptyDownloads />
          ) : (
            <>
              {/* Summary bar */}
              <SummaryBar items={items} />

              {/* Filter chips */}
              <FilterChips active={filter} counts={counts} onChange={setFilter} />

              {/* Results */}
              {!hasFiltered ? (
                <EmptyDownloads isFiltered search={search} />
              ) : (
                <div className="space-y-6">
                  {groups.map(group => (
                    <DownloadSection
                      key={group.label}
                      label={group.label}
                      items={group.items}
                    />
                  ))}
                </div>
              )}
            </>
          )}

        </div>

      </div>
    </div>
  )
}
