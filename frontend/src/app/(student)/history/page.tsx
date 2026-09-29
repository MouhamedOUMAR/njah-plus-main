import { requireAuth } from '@/lib/auth/get-session'
import { createAuthedClient } from '@/lib/supabase/server'
import HistoryView from '@/components/history/HistoryView'
import type { HistoryEntry } from '@/types'

export default async function HistoryPage() {
  const { profile } = await requireAuth()

  const supabase = await createAuthedClient()
  const { data } = await supabase
    .from('history')
    .select('*, lesson:lessons(id, title, course:courses(id, title, thumbnail_url))')
    .eq('user_id', profile.id)
    .order('viewed_at', { ascending: false })
    .limit(50)

  return <HistoryView items={(data ?? []) as HistoryEntry[]} />
}
