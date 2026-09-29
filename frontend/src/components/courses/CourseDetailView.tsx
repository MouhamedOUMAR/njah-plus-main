'use client'
import { useState } from 'react'
import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ClockIcon, StarIcon, BookOpenIcon, PlayCircleIcon, ArrowRightIcon,
} from 'lucide-react'
import { formatDuration, cn } from '@/lib/utils'
import Badge from '@/components/ui/Badge'
import LessonListItem from '@/components/lessons/LessonListItem'
import type { Course, Lesson } from '@/types'
import { useT } from '@/components/shared/LanguageProvider'

interface Props {
  course: Course
  lessons: Lesson[]
}

type Tab = 'lessons' | 'about'

export default function CourseDetailView({ course, lessons }: Props) {
  const [tab, setTab] = useState<Tab>('lessons')
  const router = useRouter()
  const t = useT()

  const firstLesson = lessons[0]
  const firstLessonId = firstLesson?.id
  const ctaHref  = firstLessonId ? `/lessons/${firstLessonId}` : '#'
  const ctaLabel = t.courses.startCourse

  useEffect(() => {
    if (firstLessonId) router.prefetch(`/lessons/${firstLessonId}`)
  }, [firstLessonId, router])

  return (
    <div className="mx-auto min-h-[100dvh] w-full max-w-5xl page-enter bg-bg pb-28">

      {/* ── Hero image ──────────────────────────────────────────── */}
      <div className="relative h-56 bg-[#E6FAF8] dark:bg-primary/15 overflow-hidden">
        {course.thumbnail_url ? (
          <img
            src={course.thumbnail_url}
            alt={course.title}
            width={720}
            height={405}
            loading="eager"
            decoding="async"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#E6FAF8] to-primary-light dark:from-primary/15 dark:to-slate-800">
            <BookOpenIcon size={72} className="text-[#0E7490]/45" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        {course.thumbnail_url && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
              <PlayCircleIcon size={32} className="text-white ml-1 rtl:mr-1 rtl:ml-0" />
            </div>
          </div>
        )}

      </div>

      {/* ── Info card ───────────────────────────────────────────── */}
      <div className="px-5 pt-5 space-y-4">

        <h1 className="text-2xl font-bold text-text leading-tight">{course.title}</h1>

        {/* Meta chips */}
        <div className="flex items-center gap-2 flex-wrap">
          {course.total_duration > 0 && (
            <span className="flex items-center gap-1.5 text-xs text-muted bg-card border border-border/60 px-3 py-1.5 rounded-full">
              <ClockIcon size={12} className="text-[#0E7490]" />
              {formatDuration(course.total_duration)}
            </span>
          )}
          {lessons.length > 0 && (
            <span className="flex items-center gap-1.5 text-xs text-muted bg-card border border-border/60 px-3 py-1.5 rounded-full">
              <BookOpenIcon size={12} className="text-[#0E7490]" />
              {lessons.length} {lessons.length === 1 ? t.courses.lesson : t.courses.lessonPlural}
            </span>
          )}
          {course.rating > 0 && (
            <span className="flex items-center gap-1.5 text-xs text-muted bg-card border border-border/60 px-3 py-1.5 rounded-full">
              <StarIcon size={12} className="fill-amber-400 text-amber-500" />
              {course.rating}
            </span>
          )}
          {course.license_year && course.semester && (
            <Badge variant="gray">{course.license_year} · {course.semester}</Badge>
          )}
        </div>

        {/* Tab switcher */}
        <div className="flex bg-card rounded-lg p-1 gap-1 border border-border/50 shadow-sm">
          {([
            { key: 'lessons', label: `${t.courses.lessons} (${lessons.length})` },
            { key: 'about',   label: t.courses.about },
          ] as { key: Tab; label: string }[]).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                'flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer active:scale-95',
                tab === key
                  ? 'bg-[#E6FAF8] dark:bg-primary/15 text-[#0E7490] shadow-[0_2px_8px_rgba(14,116,144,0.06)] border border-primary/25'
                  : 'text-muted hover:text-text border border-transparent',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'lessons' ? (
          <div className="space-y-2 pb-4">
            {lessons.length === 0 ? (
              <p className="text-center text-muted text-sm py-8">{t.courses.noLessonsAvailable}</p>
            ) : (
              lessons.map((lesson, i) => (
                <LessonListItem key={lesson.id} lesson={lesson} index={i + 1} />
              ))
            )}
          </div>
        ) : (
          <div className="pb-4">
            {course.description ? (
              <p className="text-sm text-muted leading-relaxed">{course.description}</p>
            ) : (
              <p className="text-sm text-muted text-center py-8">{t.courses.noDescriptionAvailable}</p>
            )}
          </div>
        )}
      </div>

      {/* ── Sticky CTA ──────────────────────────────────────────── */}
      {firstLesson && (
        <div className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] left-0 right-0 px-5 z-30 pointer-events-none">
          <div className="max-w-md mx-auto pointer-events-auto">
            <Link
              href={ctaHref}
              prefetch={!!firstLessonId}
              className="flex items-center justify-center gap-2.5 w-full py-4 rounded-lg bg-gradient-to-r from-primary to-accent text-white font-extrabold text-sm uppercase tracking-wider shadow-[0_10px_25px_rgba(14,116,144,0.3)] active:scale-95 transition-all hover:scale-[1.01] hover:shadow-[0_12px_30px_rgba(14,116,144,0.4)]"
            >
              {ctaLabel} <ArrowRightIcon size={16} className="rtl:rotate-180" />
            </Link>
          </div>
        </div>
      )}


    </div>
  )
}
