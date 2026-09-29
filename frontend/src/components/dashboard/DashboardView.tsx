'use client'
import type React from 'react'
import { useMemo } from 'react'
import Link from 'next/link'
import {
  BellIcon, ChevronRightIcon,
  BookOpenIcon, HistoryIcon, NotebookPenIcon, SearchIcon,
} from 'lucide-react'
import Avatar from '@/components/ui/Avatar'
import IconBox from '@/components/ui/IconBox'
import CourseCard from '@/components/courses/CourseCard'
import FeaturedCourseBanner from '@/components/courses/FeaturedCourseBanner'
import type { Profile, Course, DashboardStats } from '@/types'
import { useT } from '@/components/shared/LanguageProvider'

interface Props {
  profile: Profile
  stats: DashboardStats
  courses: Course[]
  firstName: string | null
  hour: number
}

export default function DashboardView({ profile, courses, firstName, hour, stats }: Props) {
  const [featured, rest] = useMemo(() => [courses.slice(0, 6), courses.slice(6)], [courses])
  const t = useT()
  const greeting = hour < 12 ? t.dashboard.goodMorning : hour < 18 ? t.dashboard.goodAfternoon : t.dashboard.goodEvening
  const displayName = firstName ?? t.dashboard.studentFallback

  return (
    <div className="min-h-[100dvh] w-full page-enter bg-bg">

      {/* ── Header ─────────────────────────────────────── */}
      <header className="bg-primary-dark px-4 pb-6 pt-[calc(1rem+env(safe-area-inset-top))] text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/profile" prefetch className="rounded-full bg-white p-0.5 ring-2 ring-white/20 transition-transform active:scale-95">
              <Avatar name={profile.full_name} src={profile.avatar_url} size="sm" />
            </Link>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/65">{greeting}</p>
              <p className="mt-1 text-[17px] font-bold leading-none text-white">{displayName}</p>
            </div>
          </div>
          <Link
            href="/notifications"
            prefetch
            className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 bg-white/10 transition-transform active:scale-90"
            aria-label={t.common.notifications}
          >
            <BellIcon size={18} className="text-white" />
            <span className="absolute end-1 top-1 h-2 w-2 rounded-full border border-primary-dark bg-accent-warm" />
          </Link>
        </div>

        <Link
          href="/courses"
          prefetch
          className="mt-5 flex h-12 items-center gap-3 rounded-lg bg-white px-4 text-start shadow-sm transition-transform active:scale-[0.99]"
        >
          <SearchIcon size={18} className="shrink-0 text-primary" />
          <span className="truncate text-sm font-medium text-muted">{t.courses.searchCourse}</span>
        </Link>
      </header>

      {/* ── Scrollable content ────────────────────────────────── */}
      <div className="w-full space-y-6 px-4 pb-24 pt-5">

        {courses[0] && (
          <div className="nm-card-enter stagger-1">
            <FeaturedCourseBanner course={courses[0]} />
          </div>
        )}

        {/* Stats grid */}
        <div className="nm-card-enter stagger-2">
          <SectionRow title={t.dashboard.myStats} />
          <div className="grid w-full grid-cols-3 gap-2">
            <StatCard
              href="/courses"
              label={t.nav.courses}
              value={stats.total_courses}
              icon={BookOpenIcon}
            />
            <StatCard
              href="/history"
              label={t.dashboard.history}
              value={stats.total_lessons}
              icon={HistoryIcon}
            />
            <StatCard
              href="/notes"
              label={t.lesson.myNotes}
              value={stats.notes_count}
              icon={NotebookPenIcon}
            />
          </div>
        </div>

        {/* Horizontal course scroll */}
        {courses.length > 0 && (
          <div className="nm-card-enter stagger-4">
            <SectionRow title={t.dashboard.ourCourses} href="/courses" labelHref={t.dashboard.seeAll} />
            <div className="-mx-4">
              <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3 scrollbar-hide">
                {featured.map(course => (
                  <div key={course.id} className="w-[168px] shrink-0 snap-start">
                    <CourseCard course={course} variant="compact" />
                  </div>
                ))}
                <Link
                  href="/courses"
                  prefetch
                  className="flex min-h-48 w-[120px] shrink-0 snap-start flex-col items-center justify-center gap-3 rounded-lg border border-border/60 bg-card px-3 shadow-sm transition-colors hover:border-primary/30"
                >
                  <IconBox icon={BookOpenIcon} variant="soft" size="md" fill />
                  <span className="text-xs font-bold text-text text-center uppercase tracking-widest">{t.dashboard.seeAll}</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Compact remaining courses list */}
        {rest.length > 0 && (
          <div className="nm-card-enter stagger-5">
            <SectionRow title={t.dashboard.moreCourses} href="/courses" labelHref={t.dashboard.seeAll} />
            <div className="grid grid-cols-1 gap-3">
              {rest.map(course => (
                <Link key={course.id} href={`/courses/${course.id}`} prefetch>
                  <div className="flex items-center gap-4 bg-card rounded-lg p-3 border border-border/40 shadow-sm active:scale-[0.98] transition-all group">
                    <div className="w-16 h-16 rounded-lg bg-[#E6FAF8] dark:bg-primary/15 overflow-hidden shrink-0 border border-primary/15">
                      {course.thumbnail_url
                        ? <img src={course.thumbnail_url} alt={course.title} width={128} height={128} loading="lazy" decoding="async" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        : <div className="w-full h-full flex items-center justify-center"><BookOpenIcon size={24} className="text-[#0E7490]" /></div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-bold text-text truncate leading-snug tracking-tight">{course.title}</p>
                      <p className="mt-1 text-[11px] font-bold text-muted">{course.license_year} · {course.semester}</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-[#E6FAF8] dark:bg-primary/15 flex items-center justify-center ltr:mr-2 rtl:ml-2 transition-colors">
                      <ChevronRightIcon size={16} className="text-[#0E7490] rtl:rotate-180" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ href, label, value, icon }: { href: string; label: string; value: number; icon: any }) {
  return (
    <Link
      href={href}
      prefetch
      className="flex min-w-0 flex-col gap-3 rounded-lg border border-border/40 bg-card p-3 shadow-sm transition-all active:scale-95"
    >
      <IconBox icon={icon} variant="primary" size="md" fill />
      <div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white leading-none tracking-tight">{value}</p>
        <p className="mt-2 break-words text-[9px] font-bold uppercase text-gray-500 dark:text-slate-400">{label}</p>
      </div>
    </Link>
  )
}

function SectionRow({ title, href, labelHref }: { title: string; href?: string; labelHref?: string }) {
  return (
    <div className="flex items-center justify-between mb-4 px-1">
      <h2 className="text-sm font-black text-text">{title}</h2>
      {href && (
        <Link href={href} prefetch className="border-b border-primary/25 text-[11px] font-bold text-primary transition-opacity active:opacity-70">
          {labelHref ?? 'Voir tout'}
        </Link>
      )}
    </div>
  )
}
