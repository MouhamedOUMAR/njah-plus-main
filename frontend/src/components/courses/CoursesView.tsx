'use client'
import { Suspense } from 'react'
import Link from 'next/link'
import { BellIcon, SearchIcon } from 'lucide-react'
import CourseCard from '@/components/courses/CourseCard'
import FeaturedCourseBanner from '@/components/courses/FeaturedCourseBanner'
import CoursesFilter from '@/components/courses/CoursesFilter'
import EmptyState from '@/components/ui/EmptyState'
import Skeleton from '@/components/ui/Skeleton'
import { useT } from '@/components/shared/LanguageProvider'
import type { Course } from '@/types'

interface Props {
  courses: Course[]
}

export default function CoursesView({ courses }: Props) {
  const t = useT()
  const featuredCourse = courses[0]

  return (
    <div className="min-h-[100dvh] w-full page-enter bg-bg">
      <div className="w-full">
        <header className="border-b border-white/15 bg-primary-dark px-4 pb-6 pt-[calc(1rem+env(safe-area-inset-top))]">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="min-w-0 text-start">
              <p className="text-xs font-medium text-white/65">{t.courses.library}</p>
              <h1 className="text-xl font-bold leading-tight text-white">{t.courses.ourCourses}</h1>
            </div>
            <Link
              href="/notifications"
              prefetch
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/10 transition-transform active:scale-90"
              aria-label={t.common.notifications}
            >
              <BellIcon size={18} className="text-white" />
            </Link>
          </div>

          <Suspense fallback={<Skeleton className="h-12 rounded-lg" />}>
            <CoursesFilter mode="search" />
          </Suspense>
        </header>

        <div className="space-y-6 px-4 pb-24 pt-5">
          <Suspense fallback={<Skeleton className="h-24 rounded-lg" />}>
            <CoursesFilter mode="filters" />
          </Suspense>

          {courses.length === 0 ? (
            <EmptyState
              icon={<SearchIcon size={32} className="text-[#0E7490]/60" />}
              title={t.courses.noCoursesFound}
              description={t.courses.modifySearch}
            />
          ) : (
            <>
              {featuredCourse && (
                <section>
                  <div className="mb-3 flex items-center justify-between px-1">
                    <h2 className="text-sm font-black text-text">{t.dashboard.ourCourses}</h2>
                    <span className="text-[10px] font-bold uppercase text-primary">{t.courses.library}</span>
                  </div>
                  <FeaturedCourseBanner course={featuredCourse} />
                </section>
              )}

              <section>
                <div className="mb-3 flex items-end justify-between gap-3 px-1">
                  <h2 className="text-sm font-black text-text">{t.courses.ourCourses}</h2>
                  <p className="shrink-0 text-[10px] font-semibold text-muted">
                    {courses.length} {t.courses.coursesAvailable}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {courses.map(course => (
                    <CourseCard key={course.id} course={course} variant="compact" />
                  ))}
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
