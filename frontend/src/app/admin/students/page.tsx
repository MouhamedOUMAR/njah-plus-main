import { getAllStudents } from '@/actions/students'
import { requireAdmin } from '@/lib/auth/get-session'
import { timeAgo, formatPhone } from '@/lib/utils'
import StudentSubscriptionActions from '@/components/admin/StudentSubscriptionActions'
import { AdminText } from '@/components/admin/AdminI18n'
import type { SubscriptionStatus } from '@/types'

function SubscriptionBadge({ status }: { status: SubscriptionStatus }) {
  const map: Record<SubscriptionStatus, { labelKey: string; cls: string }> = {
    active: { labelKey: 'students.subscribed', cls: 'bg-emerald-500/10 text-emerald-400' },
    none: { labelKey: 'students.noSubscription', cls: 'bg-slate-500/10 text-slate-400' },
    expired: { labelKey: 'common.expired', cls: 'bg-red-500/10 text-red-400' },
    paused: { labelKey: 'students.paused', cls: 'bg-yellow-500/10 text-yellow-400' },
  }
  const { labelKey, cls } = map[status] ?? map.none
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${cls}`}>
      <AdminText k={labelKey} />
    </span>
  )
}

function formatExpiry(date: string | null) {
  if (!date) return <span className="text-xs text-slate-500">-</span>
  const d = new Date(date)
  const expired = d < new Date()
  return (
    <span className={`text-xs ${expired ? 'text-red-400' : 'text-slate-300'}`}>
      {d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
      {expired && <> (<AdminText k="common.expired" />)</>}
    </span>
  )
}

function formatPlan(plan: string | null | undefined) {
  if (!plan) return <span className="text-xs text-slate-500">-</span>
  const label = plan === 'monthly' ? '1 mois' : plan === '3_months' ? '3 mois' : plan === 'yearly' ? '1 an' : plan
  return (
    <span className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-xs font-medium text-slate-300">
      {label}
    </span>
  )
}

export default async function AdminStudentsPage() {
  await requireAdmin()
  const students = await getAllStudents()

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white"><AdminText k="students.title" /></h1>
        <p className="mt-1 text-sm text-slate-400">
          <AdminText k="students.registeredCount" values={{ count: students.length }} />
        </p>
      </div>

      <div className="overflow-hidden overflow-x-auto rounded-lg border border-admin-border bg-admin-surface">
        {students.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-400"><AdminText k="students.empty" /></div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-admin-border">
                <th className="px-6 py-4 text-start text-xs font-semibold uppercase tracking-wider text-slate-400"><AdminText k="common.student" /></th>
                <th className="hidden px-6 py-4 text-start text-xs font-semibold uppercase tracking-wider text-slate-400 md:table-cell"><AdminText k="common.phone" /></th>
                <th className="hidden px-6 py-4 text-start text-xs font-semibold uppercase tracking-wider text-slate-400 lg:table-cell"><AdminText k="common.createdAt" /></th>
                <th className="px-6 py-4 text-start text-xs font-semibold uppercase tracking-wider text-slate-400"><AdminText k="common.account" /></th>
                <th className="px-6 py-4 text-start text-xs font-semibold uppercase tracking-wider text-slate-400"><AdminText k="common.subscription" /></th>
                <th className="px-6 py-4 text-start text-xs font-semibold uppercase tracking-wider text-slate-400"><AdminText k="common.plan" /></th>
                <th className="hidden px-6 py-4 text-start text-xs font-semibold uppercase tracking-wider text-slate-400 xl:table-cell"><AdminText k="common.expiration" /></th>
                <th className="px-6 py-4 text-end text-xs font-semibold uppercase tracking-wider text-slate-400"><AdminText k="common.actions" /></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border">
              {students.map(student => (
                <tr key={student.id} className="transition-colors hover:bg-white/5">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                        {(student.full_name ?? student.phone ?? '?')[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-white">{student.full_name ?? <AdminText k="common.noName" />}</p>
                        <p className="text-xs text-slate-400 md:hidden">{formatPhone(student.phone ?? '')}</p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-6 py-4 text-slate-300 md:table-cell">{formatPhone(student.phone ?? '')}</td>
                  <td className="hidden px-6 py-4 text-slate-400 lg:table-cell">{timeAgo(student.created_at)}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${student.is_active ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                      <AdminText k={student.is_active ? 'common.active' : 'common.inactive'} />
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <SubscriptionBadge status={student.subscription_status as SubscriptionStatus ?? 'none'} />
                  </td>
                  <td className="px-6 py-4">{formatPlan(student.subscription_plan)}</td>
                  <td className="hidden px-6 py-4 xl:table-cell">{formatExpiry(student.subscription_expires_at)}</td>
                  <td className="px-6 py-4">
                    <StudentSubscriptionActions
                      id={student.id}
                      name={student.full_name ?? 'Sans nom'}
                      phone={student.phone ?? ''}
                      isActive={student.is_active}
                      subscriptionStatus={student.subscription_status as SubscriptionStatus ?? 'none'}
                      subscriptionExpiresAt={student.subscription_expires_at}
                    />
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
