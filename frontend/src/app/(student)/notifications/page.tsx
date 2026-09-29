import { getProfile } from '@/lib/auth/get-session'
import { getNotifications } from '@/actions/notifications'
import NotificationsView from '@/components/notifications/NotificationsView'

export default async function NotificationsPage() {
  const profile = await getProfile()
  if (!profile) return null
  const notifications = await getNotifications()
  return <NotificationsView notifications={notifications} />
}
