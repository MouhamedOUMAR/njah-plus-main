import { requireAdmin } from '@/lib/auth/get-session'
import { getAdminOverview, getAnalytics } from '@/actions/analytics'
import { UsersIcon, BookOpenIcon, VideoIcon, CheckSquareIcon, StarIcon } from 'lucide-react'
import { AdminText } from '@/components/admin/AdminI18n'

export default async function AdminAnalyticsPage() {
  await requireAdmin()

  const [overview, analytics] = await Promise.all([
    getAdminOverview(),
    getAnalytics(),
  ])

  const sortedCourses = analytics.top_courses ?? []
  const uniqueStudents = analytics.active_students_count
  const completionRate = overview.totalLessons > 0
    ? Math.round((overview.completedLessons / (overview.totalLessons * Math.max(overview.totalStudents, 1))) * 100)
    : 0

  const cards = [
    { labelKey: 'analytics.enrolledStudents', value: overview.totalStudents, icon: UsersIcon, color: 'text-cyan-300', bg: 'bg-primary/15' },
    { labelKey: 'analytics.publishedCourses', value: overview.totalCourses, icon: BookOpenIcon, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { labelKey: 'analytics.createdLessons', value: overview.totalLessons, icon: VideoIcon, color: 'text-green-400', bg: 'bg-green-500/10' },
    { labelKey: 'analytics.activeStudents', value: uniqueStudents, icon: StarIcon, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  ]

  return (
    <div className="space-y-8 p-4 md:p-8">
      <div>
        <h1 className="text-2xl font-bold text-white"><AdminText k="analytics.title" /></h1>
        <p className="mt-1 text-sm text-slate-400"><AdminText k="analytics.subtitle" /></p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map(({ labelKey, value, icon: Icon, color, bg }) => (
          <div key={labelKey} className="rounded-lg border border-admin-border bg-admin-surface p-5">
            <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${bg}`}>
              <Icon size={20} className={color} />
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="mt-0.5 text-xs text-slate-400"><AdminText k={labelKey} /></p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-admin-border bg-admin-surface p-6">
        <h2 className="mb-4 text-base font-bold text-white"><AdminText k="analytics.completionRate" /></h2>
        <div className="flex items-end gap-4">
          <p className="text-5xl font-bold text-primary">{completionRate}%</p>
          <p className="mb-1 text-sm leading-relaxed text-slate-400">
            {overview.completedLessons} <AdminText k="analytics.totalCompletedLessons" /><br />
            {overview.totalLessons} x {overview.totalStudents}
          </p>
        </div>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-admin-border">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all"
            style={{ width: `${Math.min(completionRate, 100)}%` }}
          />
        </div>
      </div>

      <div className="rounded-lg border border-admin-border bg-admin-surface p-6">
        <h2 className="mb-4 text-base font-bold text-white"><AdminText k="analytics.topCourses" /></h2>
        {sortedCourses.length === 0 ? (
          <p className="text-sm text-slate-400"><AdminText k="analytics.noProgressData" /></p>
        ) : (
          <div className="space-y-3">
            {sortedCourses.map((course, index) => (
              <div key={course.title} className="flex items-center gap-4">
                <span className="w-5 text-sm font-bold text-slate-500">{index + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">{course.title}</p>
                </div>
                <span className="shrink-0 text-sm font-bold text-primary">
                  {course.completion_count} <AdminText k="analytics.completions" />
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-lg border border-admin-border bg-admin-surface p-6">
        <div className="mb-1 flex items-center gap-2">
          <CheckSquareIcon size={16} className="text-green-400" />
          <h2 className="text-base font-bold text-white"><AdminText k="analytics.totalCompletedLessons" /></h2>
        </div>
        <p className="mt-3 text-4xl font-bold text-white">{overview.completedLessons}</p>
        <p className="mt-1 text-sm text-slate-400"><AdminText k="analytics.acrossAllStudents" /></p>
      </div>
    </div>
  )
}
