import { getStudentCourseDetail } from '@/actions/courses'
import { requireAuth } from '@/lib/auth/get-session'
import { notFound, redirect } from 'next/navigation'
import PageHeader from '@/components/layout/PageHeader'
import CourseDetailView from '@/components/courses/CourseDetailView'
import { AlertCircleIcon } from 'lucide-react'
import I18nText from '@/components/shared/I18nText'

export const dynamic = 'force-dynamic'

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // Guard: catch /courses/undefined before hitting the DB
  if (!id || id === 'undefined') {
    console.error('COURSE DETAIL: missing or invalid id param, redirecting to /courses')
    redirect('/courses')
  }

  // Protect the route — unauthenticated users go to login
  await requireAuth()

  const { data: detail, error } = await getStudentCourseDetail(id)

  if (error === 'course_not_found') notFound()

  if (error || !detail || !detail.course) {
    return (
      <div className="min-h-[100dvh] w-full bg-bg">
        <PageHeader title="" back />
        <div className="w-full px-5 pt-20 flex flex-col items-center gap-4 text-center">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
            <AlertCircleIcon size={26} className="text-red-500" />
          </div>
          <p className="text-sm font-bold text-text"><I18nText path="courses.loadErrorTitle" /></p>
          <p className="text-xs text-muted leading-relaxed">
            <I18nText path={error === 'not_authenticated' ? 'courses.notAuthenticatedRetry' : 'courses.genericLoadError'} />
          </p>
        </div>
      </div>
    )
  }

  const { course, lessons: dbLessons } = detail as any
  const lessons = (dbLessons ?? []) as any[]

  return (
    <div>
      <PageHeader title="" back />
      <CourseDetailView course={course} lessons={lessons} />
    </div>
  )
}
