import { requireAdmin } from '@/lib/auth/get-session'
import { createClient } from '@/lib/supabase/server'
import { timeAgo } from '@/lib/utils'
import AdminNotificationForm from '@/components/admin/AdminNotificationForm'
import { AdminText } from '@/components/admin/AdminI18n'

export default async function AdminNotificationsPage() {
  await requireAdmin()
  const supabase = await createClient()
  const { data: notifications } = await supabase
    .from('notifications')
    .select('id, title, message, created_at, user_id, profiles!notifications_user_id_fkey(full_name, phone)')
    .order('created_at', { ascending: false })
    .limit(50)

  const items = notifications ?? []

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white"><AdminText k="notifications.title" /></h1>
        <p className="mt-1 text-sm text-slate-400"><AdminText k="notifications.subtitle" /></p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-admin-border bg-admin-surface p-6">
          <h2 className="mb-4 text-base font-bold text-white"><AdminText k="notifications.sendNotification" /></h2>
          <AdminNotificationForm />
        </div>

        <div className="rounded-lg border border-admin-border bg-admin-surface p-6">
          <h2 className="mb-4 text-base font-bold text-white">
            <AdminText k="notifications.recentHistory" />
            {items.length > 0 && <span className="ms-2 text-xs font-normal text-slate-400">({items.length})</span>}
          </h2>
          {items.length === 0 ? (
            <p className="text-sm text-slate-400"><AdminText k="notifications.empty" /></p>
          ) : (
            <div className="scrollbar-hide max-h-[480px] space-y-3 overflow-y-auto">
              {items.map(notification => {
                const profile = (notification as any).profiles
                return (
                  <div key={notification.id} className="rounded-xl border border-admin-border p-4">
                    <div className="mb-1 flex items-start justify-between gap-2">
                      <p className="line-clamp-1 text-sm font-semibold text-white">{notification.title}</p>
                      <p className="shrink-0 text-xs text-slate-500">{timeAgo(notification.created_at)}</p>
                    </div>
                    <p className="line-clamp-2 text-xs text-slate-400">{notification.message}</p>
                    {profile && (
                      <p className="mt-1.5 text-xs text-slate-500">
                        - {profile.full_name ?? profile.phone ?? <AdminText k="common.student" />}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
