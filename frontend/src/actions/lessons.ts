'use server'
import { createClient } from '@/lib/supabase/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import type { LessonAccessResult } from '@/types'
import { requireAdmin } from '@/lib/auth/get-session'
import { classifyVideoUrl } from '@/lib/utils'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const VIDEO_BUCKET = 'lesson-videos'
const ATTACHMENT_BUCKET = 'lesson-assets'

type StorageObject = { bucket: string | null; path: string | null }

function isSafeStoragePath(path: string) {
  return path.length <= 500 && !path.startsWith('/') && !path.includes('..')
}

async function removeStoredObjects(
  supabase: Awaited<ReturnType<typeof createClient>>,
  objects: StorageObject[],
) {
  for (const { bucket, path } of objects) {
    if (!bucket || !path || ![VIDEO_BUCKET, ATTACHMENT_BUCKET].includes(bucket)) continue
    const { error } = await supabase.storage.from(bucket).remove([path])
    if (error) console.error('[lesson-storage] remove error:', error.message)
  }
}

export async function getAllLessonsAdmin() {
  await requireAdmin()
  const supabase = await createClient()
  const { data } = await supabase
    .from('lessons')
    .select('*, course:courses(id, title)')
    .order('created_at', { ascending: false })
  return data ?? []
}

/**
 * Checks whether the calling user can access a lesson.
 * Uses the user's Supabase Auth JWT so auth.uid() resolves inside the RPC.
 */
export async function checkLessonAccess(lessonId: string): Promise<LessonAccessResult | null> {
  if (!UUID_PATTERN.test(lessonId)) return null
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() {},
      },
    }
  )
  const { data, error } = await supabase.rpc('check_lesson_access', {
    p_lesson_id: lessonId,
  })
  if (error) {
    console.error('[checkLessonAccess] RPC error:', error.message)
    return null
  }
  return data as LessonAccessResult
}

export async function upsertLesson(formData: FormData, id?: string) {
  await requireAdmin()
  const supabase = await createClient()
  const courseId = String(formData.get('course_id') ?? '').trim()
  const title = String(formData.get('title') ?? '').trim()
  const description = String(formData.get('description') ?? '').trim() || null
  const videoBucket = String(formData.get('video_bucket') ?? '').trim() || null
  const videoPath = String(formData.get('video_path') ?? '').trim() || null
  const videoUrl = String(formData.get('video_url') ?? '').trim() || null
  const attachmentBucket = String(formData.get('attachment_bucket') ?? '').trim() || null
  const attachmentPath = String(formData.get('attachment_path') ?? '').trim() || null
  const attachmentName = String(formData.get('attachment_name') ?? '').trim() || null
  const requestedType = String(formData.get('video_type') ?? '').trim() || null
  const duration = Number.parseInt(String(formData.get('duration') ?? '0'), 10)
  const orderIndex = Number.parseInt(String(formData.get('order_index') ?? '0'), 10)
  const videoType = requestedType && ['storage', 'youtube', 'vimeo', 'direct', 'audio'].includes(requestedType)
    ? requestedType
    : null
  const requestedAttachmentType = String(formData.get('attachment_type') ?? '')
  const attachmentType = ['image', 'pdf'].includes(requestedAttachmentType)
    ? requestedAttachmentType
    : null

  if ((id && !UUID_PATTERN.test(id)) || !UUID_PATTERN.test(courseId)) {
    return { success: false, error: 'invalid_id' }
  }
  if (!title || title.length > 200 || (description?.length ?? 0) > 5000) {
    return { success: false, error: 'invalid_lesson_content' }
  }
  if (!Number.isInteger(duration) || duration < 0 || duration > 86400) {
    return { success: false, error: 'invalid_duration' }
  }
  if (!Number.isInteger(orderIndex) || orderIndex < 0 || orderIndex > 10000) {
    return { success: false, error: 'invalid_order' }
  }
  if (Boolean(videoBucket) !== Boolean(videoPath)) {
    return { success: false, error: 'invalid_media_storage' }
  }
  if (videoBucket && (videoBucket !== VIDEO_BUCKET || !isSafeStoragePath(videoPath!))) {
    return { success: false, error: 'invalid_media_storage' }
  }
  if (videoUrl && classifyVideoUrl(videoUrl) === 'invalid') {
    return { success: false, error: 'invalid_video_url' }
  }
  if (Boolean(attachmentBucket) !== Boolean(attachmentPath)) {
    return { success: false, error: 'invalid_attachment_storage' }
  }
  if (attachmentBucket && (
    attachmentBucket !== ATTACHMENT_BUCKET ||
    !isSafeStoragePath(attachmentPath!) ||
    !attachmentType
  )) {
    return { success: false, error: 'invalid_attachment_storage' }
  }
  if ((attachmentName?.length ?? 0) > 255) {
    return { success: false, error: 'invalid_attachment_name' }
  }

  let previous: {
    video_bucket: string | null
    video_path: string | null
    attachment_bucket: string | null
    attachment_path: string | null
  } | null = null

  if (id) {
    const { data, error } = await supabase
      .from('lessons')
      .select('video_bucket, video_path, attachment_bucket, attachment_path')
      .eq('id', id)
      .maybeSingle()
    if (error || !data) return { success: false, error: error?.message ?? 'lesson_not_found' }
    previous = data
  }

  const payload = {
    course_id:       courseId,
    title,
    description,
    video_url:       videoBucket ? null : videoUrl,
    video_bucket:    videoBucket,
    video_path:      videoPath,
    video_type:      videoType,
    attachment_bucket: attachmentBucket,
    attachment_path:   attachmentPath,
    attachment_type:   attachmentType,
    attachment_name:   attachmentName,
    duration,
    order_index:     orderIndex,
    is_downloadable: formData.get('is_downloadable') === 'true',
    is_protected:    formData.get('is_protected') === 'true',
  }
  const result = id
    ? await supabase.from('lessons').update(payload).eq('id', id)
    : await supabase.from('lessons').insert(payload)

  if (result.error) {
    console.error('[upsertLesson] error:', result.error.message)
    await removeStoredObjects(supabase, [
      videoPath !== previous?.video_path ? { bucket: videoBucket, path: videoPath } : { bucket: null, path: null },
      attachmentPath !== previous?.attachment_path
        ? { bucket: attachmentBucket, path: attachmentPath }
        : { bucket: null, path: null },
    ])
    return { success: false, error: result.error.message }
  }

  await removeStoredObjects(supabase, [
    previous?.video_path && previous.video_path !== videoPath
      ? { bucket: previous.video_bucket, path: previous.video_path }
      : { bucket: null, path: null },
    previous?.attachment_path && previous.attachment_path !== attachmentPath
      ? { bucket: previous.attachment_bucket, path: previous.attachment_path }
      : { bucket: null, path: null },
  ])

  revalidatePath('/admin/lessons')
  revalidatePath('/courses')
  return { success: true }
}

export async function deleteLesson(id: string) {
  await requireAdmin()
  if (!UUID_PATTERN.test(id)) return { success: false, error: 'invalid_id' }
  const supabase = await createClient()
  const { data: lesson, error: readError } = await supabase
    .from('lessons')
    .select('video_bucket, video_path, attachment_bucket, attachment_path')
    .eq('id', id)
    .maybeSingle()

  if (readError) {
    console.error('[deleteLesson] read error:', readError.message)
    return { success: false, error: readError.message }
  }

  const { error } = await supabase.from('lessons').delete().eq('id', id)
  if (error) {
    console.error('[deleteLesson] delete error:', error.message)
    return { success: false, error: error.message }
  }

  await removeStoredObjects(supabase, [
    { bucket: lesson?.video_bucket, path: lesson?.video_path },
    { bucket: lesson?.attachment_bucket, path: lesson?.attachment_path },
  ])

  revalidatePath('/admin/lessons')
  revalidatePath('/admin/courses')
  revalidatePath('/courses')
  return { success: true }
}
