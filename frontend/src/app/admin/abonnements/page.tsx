import { getAllSubscriptions } from '@/actions/subscriptions'
import { requireAdmin } from '@/lib/auth/get-session'
import { formatPhone } from '@/lib/utils'
import { AdminText } from '@/components/admin/AdminI18n'

function SubscriptionBadge({ status }: { status: string }) {
  const map: Record<string, { labelKey: string; cls: string }> = {
    active: { labelKey: 'common.active', cls: 'bg-emerald-500/10 text-emerald-400' },
    inactive: { labelKey: 'common.inactive', cls: 'bg-slate-500/10 text-slate-400' },
    expired: { labelKey: 'common.expired', cls: 'bg-red-500/10 text-red-400' },
    blocked: { labelKey: 'common.blocked', cls: 'bg-yellow-500/10 text-yellow-400' },
  }
  const { labelKey, cls } = map[status] ?? map.inactive
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${cls}`}>
      <AdminText k={labelKey} />
    </span>
  )
}

function PaymentBadge({ status }: { status: string }) {
  const map: Record<string, { labelKey: string; cls: string }> = {
    paid: { labelKey: 'common.paid', cls: 'bg-emerald-500/10 text-emerald-400' },
    pending: { labelKey: 'common.pending', cls: 'bg-yellow-500/10 text-yellow-400' },
    unpaid: { labelKey: 'common.unpaid', cls: 'bg-red-500/10 text-red-400' },
    refunded: { labelKey: 'common.refunded', cls: 'bg-slate-500/10 text-slate-400' },
  }
  const { labelKey, cls } = map[status] ?? map.unpaid
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
    <span className={`text-xs ${expired ? 'font-medium text-red-400' : 'text-slate-300'}`}>
      {d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
    </span>
  )
}

function formatPlan(plan: string) {
  if (plan === 'monthly') return '1 mois'
  if (plan === '3_months') return '3 mois'
  if (plan === 'yearly') return '1 an'
  return plan
}

export default async function AdminSubscriptionsPage() {
  await requireAdmin()
  const subscriptions = await getAllSubscriptions()

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white"><AdminText k="subscriptions.historyTitle" /></h1>
        <p className="mt-1 text-sm text-slate-400">
          <AdminText k="subscriptions.count" values={{ count: subscriptions.length }} />
        </p>
      </div>

      <div className="overflow-hidden overflow-x-auto rounded-lg border border-admin-border bg-admin-surface">
        {subscriptions.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-400"><AdminText k="subscriptions.empty" /></div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-admin-border">
                <th className="px-6 py-4 text-start text-xs font-semibold uppercase tracking-wider text-slate-400"><AdminText k="common.createdAt" /></th>
                <th className="px-6 py-4 text-start text-xs font-semibold uppercase tracking-wider text-slate-400"><AdminText k="common.student" /></th>
                <th className="px-6 py-4 text-start text-xs font-semibold uppercase tracking-wider text-slate-400"><AdminText k="common.plan" /></th>
                <th className="hidden px-6 py-4 text-start text-xs font-semibold uppercase tracking-wider text-slate-400 md:table-cell"><AdminText k="common.status" /></th>
                <th className="hidden px-6 py-4 text-start text-xs font-semibold uppercase tracking-wider text-slate-400 lg:table-cell"><AdminText k="subscriptions.payment" /></th>
                <th className="hidden px-6 py-4 text-start text-xs font-semibold uppercase tracking-wider text-slate-400 xl:table-cell"><AdminText k="subscriptions.startAndExpiration" /></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border">
              {subscriptions.map(sub => (
                <tr key={sub.id} className="transition-colors hover:bg-white/5">
                  <td className="px-6 py-4 text-xs text-slate-400">
                    {new Date(sub.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-medium text-white">{sub.student_name ?? <AdminText k="common.noName" />}</span>
                      <span className="text-xs text-slate-400">{formatPhone(sub.student_phone ?? '')}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-xs font-medium text-slate-300">
                      {formatPlan(sub.plan_type)}
                    </span>
                  </td>
                  <td className="hidden px-6 py-4 md:table-cell">
                    <SubscriptionBadge status={sub.subscription_status} />
                  </td>
                  <td className="hidden px-6 py-4 lg:table-cell">
                    <div className="flex flex-col items-start gap-1">
                      <PaymentBadge status={sub.payment_status} />
                      {sub.payment_status === 'paid' && (
                        <span className="text-xs font-medium text-emerald-400">{sub.amount_paid} {sub.currency}</span>
                      )}
                      {sub.payment_method && (
                        <span className="text-xs text-slate-500">via {sub.payment_method}</span>
                      )}
                    </div>
                  </td>
                  <td className="hidden px-6 py-4 xl:table-cell">
                    <div className="flex flex-col space-y-1 text-xs">
                      <span className="text-slate-400">
                        <AdminText k="subscriptions.startDate" />: {new Date(sub.starts_at).toLocaleDateString('fr-FR')}
                      </span>
                      <span className="text-slate-300">
                        <AdminText k="subscriptions.endDate" />: {formatExpiry(sub.expires_at)}
                      </span>
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
