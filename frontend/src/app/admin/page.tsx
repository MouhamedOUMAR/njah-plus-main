import { getRecentStudents, getTopCourses, getDashboardSubscriptionStats } from '@/actions/analytics'
import { requireAdmin } from '@/lib/auth/get-session'
import { UsersIcon, BookOpenIcon, DollarSignIcon, CheckCircleIcon, XCircleIcon, ClockIcon, NotebookPenIcon } from 'lucide-react'
import { timeAgo } from '@/lib/utils'
import { AdminText } from '@/components/admin/AdminI18n'

export default async function AdminDashboard() {
  await requireAdmin()
  const [stats, recentStudents, topCourses] = await Promise.all([
    getDashboardSubscriptionStats(),
    getRecentStudents(),
    getTopCourses(),
  ])

  const STATS = [
    { labelKey: 'dashboard.totalStudents', value: stats.total_students, icon: UsersIcon, color: 'text-cyan-300', bg: 'bg-primary/15' },
    { labelKey: 'dashboard.activeSubscriptions', value: stats.active_subscriptions, icon: CheckCircleIcon, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { labelKey: 'dashboard.totalNotes', value: stats.total_notes, icon: NotebookPenIcon, color: 'text-orange-400', bg: 'bg-orange-500/10' },
    { labelKey: 'dashboard.pendingPayments', value: stats.pending_payments, icon: ClockIcon, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    { labelKey: 'dashboard.estimatedRevenue', value: `${stats.estimated_revenue} MRU`, icon: DollarSignIcon, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  ]

  return (
    <div className="p-4 md:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white"><AdminText k="dashboard.title" /></h1>
        <p className="text-slate-400 text-sm mt-1"><AdminText k="dashboard.subtitle" /></p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {STATS.map(({ labelKey, value, icon: Icon, color, bg }) => (
          <div key={labelKey} className="bg-admin-surface rounded-lg border border-admin-border p-5">
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
              <Icon size={20} className={color} />
            </div>
            <p className="text-xl md:text-2xl font-bold text-white truncate" title={String(value)}>{value}</p>
            <p className="text-xs text-slate-400 mt-0.5"><AdminText k={labelKey} /></p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent students */}
        <div className="bg-admin-surface rounded-lg border border-admin-border p-6">
          <h2 className="text-base font-bold text-white mb-4"><AdminText k="dashboard.recentStudents" /></h2>
          {recentStudents.length === 0 ? (
            <p className="text-slate-400 text-sm"><AdminText k="dashboard.noStudents" /></p>
          ) : (
            <div className="space-y-3">
              {recentStudents.map(s => (
                <div key={s.id} className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-primary/20 rounded-full flex items-center justify-center text-xs font-bold text-primary shrink-0">
                    {(s.full_name ?? s.phone ?? '?')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{s.full_name ?? <AdminText k="common.noName" />}</p>
                    <p className="text-xs text-slate-400">{s.phone}</p>
                  </div>
                  <p className="text-xs text-slate-500 shrink-0">{timeAgo(s.created_at)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top courses */}
        <div className="bg-admin-surface rounded-lg border border-admin-border p-6">
          <h2 className="text-base font-bold text-white mb-4"><AdminText k="dashboard.publishedCourses" /></h2>
          {topCourses.length === 0 ? (
            <p className="text-slate-400 text-sm"><AdminText k="dashboard.noPublishedCourses" /></p>
          ) : (
            <div className="space-y-3">
              {topCourses.map(course => (
                <div key={course.id} className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-primary-light rounded-xl flex items-center justify-center shrink-0">
                    <BookOpenIcon size={16} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{course.title}</p>
                    <p className="text-xs text-slate-400">
                      {[course.license_year, course.semester].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <span className="text-xs bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full shrink-0"><AdminText k="common.published" /></span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
