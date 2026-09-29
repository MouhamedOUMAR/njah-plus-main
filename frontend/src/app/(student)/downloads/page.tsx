import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/auth/get-session'
import { createAuthedClient } from '@/lib/supabase/server'
import DownloadsView from '@/components/downloads/DownloadsView'
import type { DownloadableLesson, LessonAccessResult } from '@/types'

export default async function DownloadsPage() {
  const profile = await getProfile()
  if (!profile) redirect('/login')

  const supabase = await createAuthedClient()
  const { data: lessons } = await supabase
    .from('lessons')
    .select('id, title, duration, created_at, video_type, course:courses!inner(id, title, is_published)')
    .eq('is_downloadable', true)
    .eq('course.is_published', true)
    .order('created_at', { ascending: false })

  const accessibleLessons = await Promise.all(
    (lessons ?? []).map(async lesson => {
      const { data, error } = await supabase.rpc('check_lesson_access', {
        p_lesson_id: lesson.id,
      })
      return !error && (data as LessonAccessResult | null)?.can_access ? lesson : null
    }),
  )

  const items: DownloadableLesson[] = accessibleLessons.flatMap(lesson => {
    if (!lesson) return []
    const course = Array.isArray(lesson.course) ? lesson.course[0] ?? null : lesson.course
    return [{
      id: lesson.id,
      title: lesson.title,
      duration: lesson.duration,
      created_at: lesson.created_at,
      video_type: lesson.video_type,
      course,
    }]
  })

  return <DownloadsView items={items} />
}
