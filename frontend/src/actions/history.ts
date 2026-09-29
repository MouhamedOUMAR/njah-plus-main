'use server'
import { createAuthedClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/auth/get-session'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function recordHistory(lessonId: string): Promise<void> {
  if (!UUID_PATTERN.test(lessonId)) return
  const { profile } = await requireAuth()
  const supabase = await createAuthedClient()

  const now = new Date().toISOString()

  // Use upsert to update the viewed_at date if the record already exists.
  // This relies on a UNIQUE(user_id, lesson_id) constraint in the database.
  const { error } = await supabase
    .from('history')
    .upsert(
      { 
        user_id: profile.id,
        lesson_id: lessonId, 
        viewed_at: now 
      },
      { onConflict: 'user_id,lesson_id' }
    )

  if (error) {
    console.error('[recordHistory] error:', error.message)
  } else {
    revalidatePath('/history')
    revalidatePath('/dashboard')
  }
}
