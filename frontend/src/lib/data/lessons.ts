import 'server-only'

import { createAuthedClient } from '@/lib/supabase/server'

export async function getLessonById(id: string) {
  const supabase = await createAuthedClient()
  const { data, error } = await supabase
    .from('lessons')
    .select('*, course:courses(id, title)')
    .eq('id', id)
    .single()

  if (error) {
    console.error('[getLessonById] error for id=%s: %s', id, error.message)
    return null
  }

  return data
}
