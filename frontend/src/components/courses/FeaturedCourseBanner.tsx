'use client'

import Link from 'next/link'
import { ArrowRightIcon, BookOpenIcon } from 'lucide-react'
import { useT } from '@/components/shared/LanguageProvider'
import type { Course } from '@/types'

export default function FeaturedCourseBanner({ course }: { course: Course }) {
  const t = useT()

  if (!course.id) return null

  return (
    <Link
      href={`/courses/${course.id}`}
      prefetch
      className="group relative block min-h-36 overflow-hidden rounded-lg bg-gradient-to-r from-primary-dark via-primary to-primary text-white shadow-lg shadow-primary/20"
    >
      {course.thumbnail_url ? (
        <img
          src={course.thumbnail_url}
          alt=""
          width={420}
          height={280}
          loading="eager"
          decoding="async"
          className="absolute inset-y-0 end-0 h-full w-[48%] object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-y-0 end-0 flex w-[42%] items-center justify-center bg-white/10">
          <BookOpenIcon size={48} className="text-white/55" />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-primary-dark via-primary-dark/90 to-primary-dark/15 rtl:bg-gradient-to-l" />

      <div className="relative z-10 flex min-h-36 w-[72%] flex-col justify-center p-4">
        <div className="flex flex-wrap items-center gap-2 text-[9px] font-extrabold uppercase text-white/70">
          {course.license_year && course.semester && (
            <span className="rounded bg-white/15 px-2 py-1 text-white">
              {course.license_year} · {course.semester}
            </span>
          )}
        </div>
        <h2 className="mt-2 line-clamp-2 text-lg font-black leading-tight">{course.title}</h2>
        <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-accent-warm">
          {t.courses.startCourse}
          <ArrowRightIcon size={14} className="rtl:rotate-180" />
        </span>
      </div>
    </Link>
  )
}
