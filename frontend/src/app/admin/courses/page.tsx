import { getAllCoursesAdmin } from '@/actions/courses'
import { requireAdmin } from '@/lib/auth/get-session'
import { PlusIcon, BookOpenIcon } from 'lucide-react'
import Link from 'next/link'
import ToggleCourseButton from '@/components/admin/ToggleCourseButton'
import DeleteAdminItemButton from '@/components/admin/DeleteAdminItemButton'
import { AdminText } from '@/components/admin/AdminI18n'

export default async function AdminCoursesPage() {
  await requireAdmin()
  const courses = await getAllCoursesAdmin()

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white"><AdminText k="courses.title" /></h1>
          <p className="mt-1 text-sm text-slate-400">
            <AdminText k="courses.totalCourses" values={{ count: courses.length }} />
          </p>
        </div>
        <Link
          href="/admin/courses/new"
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
        >
          <PlusIcon size={16} />
          <AdminText k="courses.newCourse" />
        </Link>
      </div>

      <div className="overflow-hidden overflow-x-auto rounded-lg border border-admin-border bg-admin-surface">
        {courses.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-400"><AdminText k="courses.empty" /></div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-admin-border">
                <th className="px-6 py-4 text-start text-xs font-semibold uppercase tracking-wider text-slate-400"><AdminText k="common.course" /></th>
                <th className="hidden px-6 py-4 text-start text-xs font-semibold uppercase tracking-wider text-slate-400 lg:table-cell"><AdminText k="common.licenseYear" /> / <AdminText k="common.semester" /></th>
                <th className="px-6 py-4 text-start text-xs font-semibold uppercase tracking-wider text-slate-400"><AdminText k="common.status" /></th>
                <th className="px-6 py-4 text-end text-xs font-semibold uppercase tracking-wider text-slate-400"><AdminText k="common.actions" /></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border">
              {courses.map(course => (
                <tr key={course.id} className="transition-colors hover:bg-white/5">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary/20">
                        {course.thumbnail_url
                          ? <img src={course.thumbnail_url} alt="" className="h-full w-full rounded-xl object-cover" />
                          : <BookOpenIcon size={16} className="text-primary" />
                        }
                      </div>
                      <div>
                        <p className="line-clamp-1 font-medium text-white">{course.title}</p>
                        <p className="text-xs text-slate-400">
                          <AdminText k="courses.lessonsCount" values={{ count: (course as any).lessons?.[0]?.count ?? 0 }} />
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-6 py-4 text-slate-300 lg:table-cell">
                    {course.license_year && course.semester ? `${course.license_year} · ${course.semester}` : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${course.is_published ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                      <AdminText k={course.is_published ? 'common.published' : 'common.draft'} />
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <ToggleCourseButton id={course.id} isPublished={course.is_published} />
                      <Link
                        href={`/admin/lessons?action=new&course_id=${course.id}`}
                        className="inline-flex items-center gap-1 rounded-lg bg-primary/15 px-3 py-1.5 text-xs font-semibold text-cyan-300 transition-colors hover:bg-primary/25"
                      >
                        <PlusIcon size={13} />
                        <AdminText k="lessons.addLesson" />
                      </Link>
                      <Link
                        href={`/admin/courses/${course.id}/edit`}
                        className="rounded-lg bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:bg-white/10"
                      >
                        <AdminText k="common.edit" />
                      </Link>
                      <DeleteAdminItemButton id={course.id} title={course.title} kind="course" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
