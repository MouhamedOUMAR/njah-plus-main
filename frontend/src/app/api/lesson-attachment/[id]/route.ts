import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { LessonAccessResult } from '@/types'

export const runtime = 'nodejs'

const SIGNED_URL_TTL = 300

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() {},
      },
    },
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: access, error: accessError } = await supabase.rpc('check_lesson_access', {
    p_lesson_id: id,
  })
  if (accessError || !(access as LessonAccessResult | null)?.can_access) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) return NextResponse.json({ error: 'Service non configuré' }, { status: 500 })

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
  const { data: lesson } = await service
    .from('lessons')
    .select('attachment_bucket, attachment_path')
    .eq('id', id)
    .single()

  if (
    lesson?.attachment_bucket !== 'lesson-assets' ||
    !lesson.attachment_path ||
    lesson.attachment_path.startsWith('/') ||
    lesson.attachment_path.includes('..')
  ) {
    return NextResponse.json({ error: 'Document introuvable' }, { status: 404 })
  }

  const { data: signed, error } = await service.storage
    .from(lesson.attachment_bucket)
    .createSignedUrl(lesson.attachment_path, SIGNED_URL_TTL)

  if (error || !signed?.signedUrl) {
    return NextResponse.json({ error: 'Impossible de charger le document' }, { status: 502 })
  }

  const response = NextResponse.redirect(signed.signedUrl, { status: 302 })
  response.headers.set('Cache-Control', 'no-store')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  return response
}
