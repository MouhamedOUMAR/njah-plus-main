'use server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin, requireAuth } from '@/lib/auth/get-session'
import { revalidatePath } from 'next/cache'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function getNotifications() {
  const { profile } = await requireAuth()
  const supabase = await createClient()
  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function markAllRead() {
  const { profile } = await requireAuth()
  const supabase = await createClient()
  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', profile.id)
    .eq('is_read', false)
  revalidatePath('/notifications')
}

export async function markRead(id: string) {
  if (!UUID_PATTERN.test(id)) return
  const { profile } = await requireAuth()
  const supabase = await createClient()
  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id)
    .eq('user_id', profile.id)
  revalidatePath('/notifications')
}

export async function sendNotificationToAll(title: string, message: string) {
  await requireAdmin()
  const safeTitle = title.trim()
  const safeMessage = message.trim()
  if (!safeTitle || !safeMessage || safeTitle.length > 160 || safeMessage.length > 2000) {
    throw new Error('invalid_notification')
  }
  const supabase = await createClient()
  const { data: students } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'student')
    .eq('is_active', true)
  if (!students?.length) return
  const rows = students.map(s => ({ user_id: s.id, title: safeTitle, message: safeMessage }))
  await supabase.from('notifications').insert(rows)
  revalidatePath('/admin/notifications')
}

export async function sendNotificationToUser(userId: string, title: string, message: string) {
  await requireAdmin()
  const safeTitle = title.trim()
  const safeMessage = message.trim()
  if (!safeTitle || !safeMessage || safeTitle.length > 160 || safeMessage.length > 2000) {
    throw new Error('invalid_notification')
  }
  const supabase = await createClient()
  await supabase.from('notifications').insert({ user_id: userId, title: safeTitle, message: safeMessage })
  revalidatePath('/admin/notifications')
}
