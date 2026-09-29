import { NextResponse } from 'next/server'
import { getSessionProfile } from '@/lib/auth/session'
import { createClient } from '@supabase/supabase-js'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const ALLOWED_EVENTS = new Set(['tab_hidden', 'seek_abuse'])

export async function POST(req: Request) {
  const profile = await getSessionProfile()
  if (!profile || !profile.is_active) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { lessonId, eventType, metadata = {} } = await req.json()
    if (
      typeof lessonId !== 'string' ||
      !UUID_PATTERN.test(lessonId) ||
      typeof eventType !== 'string' ||
      !ALLOWED_EVENTS.has(eventType) ||
      !metadata ||
      typeof metadata !== 'object' ||
      Array.isArray(metadata) ||
      JSON.stringify(metadata).length > 2000
    ) {
      return NextResponse.json({ error: 'Invalid event' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: 'Service not configured' }, { status: 500 })
    }

    const svc = createClient(
      supabaseUrl,
      serviceRoleKey,
      { auth: { autoRefreshToken: false, persistSession: false } },
    )
    const { error } = await svc.rpc('log_video_event', {
      p_user_id:    profile.id,
      p_lesson_id:  lessonId,
      p_event_type: eventType,
      p_metadata:   {
        ...metadata,
        ip: req.headers.get('x-forwarded-for') || 'unknown',
        ua: req.headers.get('user-agent') || 'unknown'
      }
    })

    if (error) {
      console.error('[video-event] RPC Error:', error)
      return NextResponse.json({ error: 'Failed to log event' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[video-event] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
