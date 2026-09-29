'use client'
import Link from 'next/link'
import { ClockIcon, StarIcon, BookOpenIcon, PlayCircleIcon } from 'lucide-react'
import { formatDuration } from '@/lib/utils'
import ProgressBar from '@/components/ui/ProgressBar'
import Badge from '@/components/ui/Badge'
import type { Course } from '@/types'
import { useT } from '@/components/shared/LanguageProvider'

interface CourseCardProps {
  course: Course
  progress?: number
  variant?: 'default' | 'compact'
}

export default function CourseCard({ course, progress, variant = 'default' }: CourseCardProps) {
  const lessonCount = course.lessons?.length ?? 0
  const t = useT()

  if (!course.id) return null

  if (variant === 'compact') {
    return (
      <Link href={`/courses/${course.id}`} prefetch className="block h-full">
        <article className="group flex h-full min-w-0 flex-col overflow-hidden rounded-lg border border-border/70 bg-card shadow-sm transition active:scale-[0.98]">
          <div className="relative aspect-[4/3] overflow-hidden bg-primary-light dark:bg-primary/15">
            {course.thumbnail_url ? (
              <img
                src={course.thumbnail_url}
                alt={course.title}
                width={360}
                height={270}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <BookOpenIcon size={34} className="text-primary/45" />
              </div>
            )}
            {course.license_year && course.semester && (
              <span className="absolute end-2 top-2 rounded bg-white/90 px-2 py-1 text-[9px] font-extrabold text-primary-dark shadow-sm">
                {course.license_year} · {course.semester}
              </span>
            )}
          </div>

          <div className="flex flex-1 flex-col p-3">
            <h3 className="line-clamp-2 text-[13px] font-bold leading-snug text-text">
              {course.title}
            </h3>
            <div className="mt-auto flex items-center gap-3 pt-3 text-[10px] font-semibold text-muted">
              {lessonCount > 0 && (
                <span className="inline-flex items-center gap-1">
                  <BookOpenIcon size={11} className="text-primary" />
                  {lessonCount}
                </span>
              )}
              {course.total_duration > 0 && (
                <span className="inline-flex min-w-0 items-center gap-1 truncate">
                  <ClockIcon size={11} className="shrink-0 text-primary" />
                  {formatDuration(course.total_duration)}
                </span>
              )}
            </div>
          </div>
        </article>
      </Link>
    )
  }

  return (
    <Link href={`/courses/${course.id}`} prefetch className="block">
      <div className="group h-full overflow-hidden rounded-lg border border-border/70 bg-card shadow-sm transition-colors hover:border-primary/30 hover:shadow-md">

        {/* Thumbnail */}
        <div className="relative h-48 bg-[#E6FAF8] dark:bg-primary/15 overflow-hidden">
          {course.thumbnail_url ? (
            <img
              src={course.thumbnail_url}
              alt={course.title}
              width={640}
              height={360}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#E6FAF8] to-primary-light dark:from-primary/15 dark:to-slate-800">
              <BookOpenIcon size={48} className="text-[#0E7490]/45" />
            </div>
          )}
          {course.thumbnail_url && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent" />
          )}

          {/* Course classification */}
          <div className="absolute inset-x-4 top-4 flex items-start justify-between gap-2">
            {course.license_year && course.semester && (
              <Badge variant="white" className="ms-auto shrink-0 shadow-sm font-bold">
                {course.license_year} · {course.semester}
              </Badge>
            )}
          </div>

          {/* Play Icon Overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 bg-primary/10">
            <div className="w-14 h-14 rounded-lg bg-white/90 dark:bg-slate-900/90 flex items-center justify-center shadow-2xl transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
              <PlayCircleIcon size={28} className="text-[#0E7490]" />
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <h3 className="font-bold text-text text-[15px] leading-snug line-clamp-2 tracking-tight group-hover:text-[#0E7490] transition-colors">
            {course.title}
          </h3>

          {/* Meta info */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-3">
              {lessonCount > 0 && (
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted uppercase tracking-wider">
                  <BookOpenIcon size={12} className="text-[#0E7490]" />
                  {lessonCount}
                </div>
              )}
              {course.total_duration > 0 && (
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted uppercase tracking-wider">
                  <ClockIcon size={12} className="text-[#0E7490]" />
                  {formatDuration(course.total_duration)}
                </div>
              )}
            </div>
            
            {course.rating > 0 && (
              <div className="flex items-center gap-1 text-[11px] font-bold text-gray-900 dark:text-white bg-amber-50 dark:bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-100 dark:border-amber-500/10">
                <StarIcon size={10} className="fill-amber-400 text-amber-500" />
                {course.rating}
              </div>
            )}
          </div>

          {/* Progress */}
          {progress !== undefined && (
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="text-muted uppercase tracking-[0.15em]">{t.courses.progress}</span>
                <span className="text-[#0E7490]">{progress}%</span>
              </div>
              <ProgressBar value={progress} size="sm" className="bg-[#E6FAF8] dark:bg-primary/15 h-1.5" />
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
