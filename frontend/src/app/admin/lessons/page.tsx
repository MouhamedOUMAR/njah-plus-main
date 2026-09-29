import { getAllLessonsAdmin } from '@/actions/lessons'
import { getAllCoursesAdmin } from '@/actions/courses'
import { requireAdmin } from '@/lib/auth/get-session'
import { PlusIcon, ShieldIcon, DownloadIcon, FileTextIcon, HeadphonesIcon, ImageIcon, VideoIcon } from 'lucide-react'
import { formatDuration } from '@/lib/utils'
import AdminLessonForm from '@/components/admin/AdminLessonForm'
import Link from 'next/link'
import { AdminText } from '@/components/admin/AdminI18n'
import DeleteAdminItemButton from '@/components/admin/DeleteAdminItemButton'

export default async function AdminLessonsPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; id?: string; course_id?: string }>
}) {
  await requireAdmin()
  const { action, id, course_id } = await searchParams

  const [lessons, courses] = await Promise.all([
    getAllLessonsAdmin(),
    getAllCoursesAdmin(),
  ])

  const editingLesson = action === 'edit' && id ? lessons.find(lesson => lesson.id === id) : undefined
  const showForm = action === 'new' || action === 'edit'
  const coursesForForm = courses
    .map(course => ({
      id: course.id,
      title: course.title,
      license_year: course.license_year,
      semester: course.semester,
    }))
    .sort((a, b) => `${a.license_year}${a.semester}${a.title}`.localeCompare(`${b.license_year}${b.semester}${b.title}`))

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white"><AdminText k="lessons.title" /></h1>
          <p className="mt-1 text-sm text-slate-400">
            <AdminText k="lessons.totalLessons" values={{ count: lessons.length }} />
          </p>
        </div>
        <Link
          href="/admin/lessons?action=new"
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
        >
          <PlusIcon size={16} />
          <AdminText k="lessons.newLesson" />
        </Link>
      </div>

      {showForm && (
        <div className="mb-6 max-w-2xl rounded-lg border border-admin-border bg-admin-surface p-6">
          <h2 className="mb-4 text-base font-bold text-white">
            <AdminText k={editingLesson ? 'lessons.editLesson' : 'lessons.newLesson'} />
          </h2>
          <AdminLessonForm lesson={editingLesson} courses={coursesForForm} defaultCourseId={course_id} />
        </div>
      )}

      <div className="overflow-hidden overflow-x-auto rounded-lg border border-admin-border bg-admin-surface">
        {lessons.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-400"><AdminText k="lessons.empty" /></div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-admin-border">
                <th className="px-6 py-4 text-start text-xs font-semibold uppercase tracking-wider text-slate-400"><AdminText k="common.title" /></th>
                <th className="hidden px-6 py-4 text-start text-xs font-semibold uppercase tracking-wider text-slate-400 md:table-cell"><AdminText k="common.course" /></th>
                <th className="hidden px-6 py-4 text-start text-xs font-semibold uppercase tracking-wider text-slate-400 lg:table-cell"><AdminText k="common.duration" /></th>
                <th className="px-6 py-4 text-start text-xs font-semibold uppercase tracking-wider text-slate-400"><AdminText k="common.options" /></th>
                <th className="px-6 py-4 text-end text-xs font-semibold uppercase tracking-wider text-slate-400"><AdminText k="common.actions" /></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border">
              {lessons.map(lesson => (
                <tr key={lesson.id} className="transition-colors hover:bg-white/5">
                  <td className="px-6 py-4">
                    <p className="line-clamp-1 font-medium text-white">{lesson.title}</p>
                    <p className="text-xs text-slate-400 md:hidden">{lesson.course?.title}</p>
                  </td>
                  <td className="hidden px-6 py-4 text-slate-300 md:table-cell">{lesson.course?.title ?? '-'}</td>
                  <td className="hidden px-6 py-4 text-slate-300 lg:table-cell">{formatDuration(lesson.duration)}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1.5">
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-cyan-300">
                        {lesson.video_type === 'audio'
                          ? <><HeadphonesIcon size={10} /><AdminText k="lessons.audio" /></>
                          : <><VideoIcon size={10} /><AdminText k="lessons.video" /></>
                        }
                      </span>
                      {lesson.is_protected && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/10 px-2 py-0.5 text-xs text-yellow-400">
                          <ShieldIcon size={10} /><AdminText k="common.protected" />
                        </span>
                      )}
                      {lesson.is_downloadable && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-xs text-green-400">
                          <DownloadIcon size={10} /><AdminText k="common.downloadable" />
                        </span>
                      )}
                      {lesson.attachment_type === 'pdf' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/10 px-2 py-0.5 text-xs text-violet-300">
                          <FileTextIcon size={10} /> PDF
                        </span>
                      )}
                      {lesson.attachment_type === 'image' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/10 px-2 py-0.5 text-xs text-cyan-300">
                          <ImageIcon size={10} /> Image
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-end">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/lessons?action=edit&id=${lesson.id}`}
                        className="rounded-lg bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:bg-white/10"
                      >
                        <AdminText k="common.edit" />
                      </Link>
                      <DeleteAdminItemButton id={lesson.id} title={lesson.title} kind="lesson" />
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
