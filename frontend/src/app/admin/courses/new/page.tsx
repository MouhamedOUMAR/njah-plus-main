import { requireAdmin } from '@/lib/auth/get-session'
import AdminCourseForm from '@/components/admin/AdminCourseForm'
import Link from 'next/link'
import { ArrowLeftIcon } from 'lucide-react'
import { AdminText } from '@/components/admin/AdminI18n'

export default async function NewCoursePage() {
  await requireAdmin()
  return (
    <div className="max-w-2xl p-4 md:p-8">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin/courses" className="rounded-xl p-2 transition-colors hover:bg-white/5">
          <ArrowLeftIcon size={20} className="text-slate-400 rtl:rotate-180" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white"><AdminText k="courses.newCourse" /></h1>
          <p className="mt-0.5 text-sm text-slate-400"><AdminText k="courses.createCourse" /></p>
        </div>
      </div>
      <div className="rounded-lg border border-admin-border bg-admin-surface p-6">
        <AdminCourseForm />
      </div>
    </div>
  )
}
