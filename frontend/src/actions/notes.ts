'use server'
import { createClient, createAuthedClient } from '@/lib/supabase/server'
import { getSessionProfile } from '@/lib/auth/session'
import { requireAuth } from '@/lib/auth/get-session'
import type { AdminNote } from '@/types'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function getNotes(lessonId: string) {
  if (!UUID_PATTERN.test(lessonId)) return []
  const { profile } = await requireAuth()
  const supabase = await createClient()
  const { data } = await supabase
    .from('notes')
    .select('*')
    .eq('lesson_id', lessonId)
    .eq('user_id', profile.id)
    .order('created_at', { ascending: true })
  return data ?? []
}

export async function addNote(lessonId: string, content: string) {
  if (!UUID_PATTERN.test(lessonId)) return null
  const safeContent = content.trim()
  if (!safeContent || safeContent.length > 5000) return null
  const { profile } = await requireAuth()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('notes')
    .insert({ user_id: profile.id, lesson_id: lessonId, content: safeContent })
    .select()
    .single()
  if (error) {
    console.error('[addNote] error:', error.message)
    return null
  }
  return data
}

export async function getAllNotes() {
  const { profile } = await requireAuth()
  const supabase = await createClient()
  const { data } = await supabase
    .from('notes')
    .select('*, lesson:lessons(id, title, course_id, course:courses(id, title))')
    .eq('user_id', profile.id)
    .order('updated_at', { ascending: false })
  return data ?? []
}

export async function deleteNote(id: string) {
  if (!UUID_PATTERN.test(id)) return
  const { profile } = await requireAuth()
  const supabase = await createClient()
  await supabase.from('notes').delete().eq('id', id).eq('user_id', profile.id)
}

/* ── Admin Actions ───────────────────────────────────────────────────────── */

export async function adminGetAllNotes() {
  const profile = await getSessionProfile()
  if (!profile || profile.role !== 'admin') {
    console.warn('[adminGetAllNotes] Unauthorized attempt or missing profile')
    return []
  }
  
  const supabase = await createAuthedClient()
  const { data, error } = await supabase.rpc('admin_get_all_notes')
  
  if (error) {
    console.error('[adminGetAllNotes] error:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    })
    return []
  }
  
  console.log('[adminGetAllNotes] success, count:', data?.length ?? 0)
  return (data ?? []) as AdminNote[]
}

export async function adminDeleteNote(noteId: string) {
  const profile = await getSessionProfile()
  if (!profile || profile.role !== 'admin') {
    return { success: false, error: 'Unauthorized' }
  }
  
  const supabase = await createAuthedClient()
  const { data, error } = await supabase.rpc('admin_delete_note', { p_note_id: noteId })
  
  if (error) {
    console.error('[adminDeleteNote] error:', error.message)
    return { success: false, error: error.message }
  }
  
  return { success: true }
}
