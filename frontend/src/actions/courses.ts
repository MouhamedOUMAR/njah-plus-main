'use server'
import { createClient } from '@/lib/supabase/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache'
import { isValidLicenseStructure } from '@/constants'
import { requireAdmin } from '@/lib/auth/get-session'

const COURSES_CACHE_TAG = 'published-courses'
const COURSE_THUMBNAILS_BUCKET = 'course-thumbnails'

type CourseActionResult =
  | { success: true }
  | { success: false; error: string }

function normalizeOptionalUrl(value: FormDataEntryValue | null) {
  const raw = String(value ?? '').trim()
  if (!raw) return null

  try {
    const url = new URL(raw)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return undefined
    return url.toString()
  } catch {
    return undefined
  }
}

function getCourseThumbnailPath(url: string | null | undefined) {
  if (!url) return null

  try {
    const parsed = new URL(url)
    const marker = `/storage/v1/object/public/${COURSE_THUMBNAILS_BUCKET}/`
    const index = parsed.pathname.indexOf(marker)
    if (index === -1) return null
    return decodeURIComponent(parsed.pathname.slice(index + marker.length))
  } catch {
    return null
  }
}

async function removeCourseThumbnail(url: string | null | undefined) {
  const path = getCourseThumbnailPath(url)
  if (!path) return

  const supabase = await createClient()
  const { error } = await supabase.storage.from(COURSE_THUMBNAILS_BUCKET).remove([path])
  if (error) {
    console.error('[removeCourseThumbnail] error:', error.message)
  }
}

async function fetchPublishedCourses(q?: string, licenseYear?: string, semester?: string) {
  const supabase = await createClient()
  let query = supabase
    .from('courses')
    .select('*, lessons(count)')
    .eq('is_published', true)

  if (q)        query = query.ilike('title', `%${q}%`)
  if (licenseYear) query = query.eq('license_year', licenseYear)
  if (semester)    query = query.eq('semester', semester)

  const { data } = await query
    .order('license_year', { ascending: true })
    .order('semester', { ascending: true })
    .order('created_at', { ascending: false })
  return data ?? []
}

const getCachedPublishedCourses = unstable_cache(
  fetchPublishedCourses,
  [COURSES_CACHE_TAG],
  { revalidate: 60, tags: [COURSES_CACHE_TAG] },
)

export async function getCourses(opts?: { q?: string; licenseYear?: string; semester?: string }) {
  return getCachedPublishedCourses(
    opts?.q ?? '',
    opts?.licenseYear ?? '',
    opts?.semester ?? '',
  )
}

export async function getStudentCourseDetail(
  courseId: string
): Promise<{ data: any; error: string | null }> {
  if (!courseId || courseId === 'undefined') {
    return { data: null, error: 'missing_id' }
  }

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

  const { data, error } = await supabase.rpc('get_student_course_detail', {
    p_course_id: courseId,
  })

  if (error) {
    console.error('[getStudentCourseDetail] RPC Error:', error.message)
    return { data: null, error: error.message }
  }

  const rpcError = (data as any)?.error
  if (rpcError) {
    console.error('[getStudentCourseDetail] RPC returned error:', rpcError)
    return { data: null, error: rpcError }
  }

  return { data, error: null }
}

export async function getAllCoursesAdmin() {
  await requireAdmin()
  const supabase = await createClient()
  const { data } = await supabase
    .from('courses')
    .select('*, lessons(count)')
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function upsertCourse(formData: FormData, id?: string): Promise<CourseActionResult> {
  await requireAdmin()
  const supabase = await createClient()
  const title = String(formData.get('title') ?? '').trim()
  const thumbnailUrl = normalizeOptionalUrl(formData.get('thumbnail_url'))
  const licenseYear = String(formData.get('license_year') ?? '')
  const semester = String(formData.get('semester') ?? '')

  if (!title || title.length > 160) {
    return { success: false, error: 'invalid_title' }
  }

  if (thumbnailUrl === undefined) {
    return { success: false, error: 'invalid_thumbnail_url' }
  }

  if (!isValidLicenseStructure(licenseYear, semester)) {
    return { success: false, error: 'invalid_academic_structure' }
  }

  const payload = {
    title,
    description: formData.get('description') as string,
    category: null,
    license_year: licenseYear,
    semester,
    thumbnail_url: thumbnailUrl,
    is_published: formData.get('is_published') === 'true',
  }

  let previousThumbnailUrl: string | null = null
  if (id) {
    const { data } = await supabase
      .from('courses')
      .select('thumbnail_url')
      .eq('id', id)
      .maybeSingle()
    previousThumbnailUrl = data?.thumbnail_url ?? null
  }

  const result = id
    ? await supabase.from('courses').update(payload).eq('id', id)
    : await supabase.from('courses').insert(payload)

  if (result.error) {
    console.error('[upsertCourse] error:', result.error.message)
    if (thumbnailUrl && thumbnailUrl !== previousThumbnailUrl) {
      await removeCourseThumbnail(thumbnailUrl)
    }
    return { success: false, error: result.error.message }
  }

  revalidatePath('/admin/courses')
  revalidatePath('/courses')
  revalidateTag(COURSES_CACHE_TAG, 'max')

  if (previousThumbnailUrl && previousThumbnailUrl !== thumbnailUrl) {
    await removeCourseThumbnail(previousThumbnailUrl)
  }

  return { success: true }
}

export async function deleteCourse(id: string) {
  await requireAdmin()
  const supabase = await createClient()
  const { data, error: readError } = await supabase
    .from('courses')
    .select('thumbnail_url, lessons(video_bucket, video_path, attachment_bucket, attachment_path)')
    .eq('id', id)
    .maybeSingle()

  if (readError) {
    console.error('[deleteCourse] read error:', readError.message)
    return { success: false, error: readError.message }
  }

  const { error } = await supabase.from('courses').delete().eq('id', id)
  if (error) {
    console.error('[deleteCourse] delete error:', error.message)
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/courses')
  revalidatePath('/admin/lessons')
  revalidatePath('/courses')
  revalidateTag(COURSES_CACHE_TAG, 'max')
  await removeCourseThumbnail(data?.thumbnail_url)

  const filesByBucket = new Map<string, string[]>()
  for (const lesson of data?.lessons ?? []) {
    const storedFiles = [
      { bucket: lesson.video_bucket, path: lesson.video_path },
      { bucket: lesson.attachment_bucket, path: lesson.attachment_path },
    ]
    for (const { bucket, path } of storedFiles) {
      if (!bucket || !path || !['lesson-videos', 'lesson-assets'].includes(bucket)) continue
      filesByBucket.set(bucket, [...(filesByBucket.get(bucket) ?? []), path])
    }
  }
  for (const [bucket, paths] of filesByBucket) {
    const { error: storageError } = await supabase.storage.from(bucket).remove(paths)
    if (storageError) console.error('[deleteCourse] storage error:', storageError.message)
  }

  return { success: true }
}

export async function toggleCoursePublished(id: string, current: boolean) {
  await requireAdmin()
  const supabase = await createClient()
  const { error } = await supabase.from('courses').update({ is_published: !current }).eq('id', id)
  if (error) {
    console.error('[toggleCoursePublished] error:', error.message)
    return { success: false, error: error.message }
  }
  revalidatePath('/admin/courses')
  revalidatePath('/courses')
  revalidateTag(COURSES_CACHE_TAG, 'max')
  return { success: true }
}
