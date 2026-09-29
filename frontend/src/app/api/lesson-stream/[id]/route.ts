import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { LessonAccessResult } from '@/types'

export const runtime = 'nodejs'

// 300 seconds — enough to buffer a few minutes, short enough to be useless if leaked
const SIGNED_URL_TTL = 300

function getServiceClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) return null
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    key,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

/**
 * Parses a full Supabase Storage object URL into { bucket, path }.
 */
function parseStorageUrl(url: string): { bucket: string; path: string } | null {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!base) return null
  try {
    const baseHost = new URL(base).hostname
    const target   = new URL(url)
    if (target.hostname !== baseHost) return null
    const m = target.pathname.match(
      /^\/storage\/v1\/object\/(?:public|authenticated)\/([^/]+)\/(.+)$/
    )
    if (!m) return null
    return { bucket: m[1], path: decodeURIComponent(m[2]) }
  } catch {
    return null
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // ── 1. Authenticate via Supabase Auth cookies ─────────────
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

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const svc = getServiceClient()
  if (!svc) {
    return NextResponse.json({ error: 'Service non configuré' }, { status: 500 })
  }

  // ── 2. Subscription-aware access check via RPC ────────────
  const { data: access, error: accessError } = await supabase
    .rpc('check_lesson_access', { p_lesson_id: id })

  if (accessError) {
    console.error('[lesson-stream] Access check failed:', accessError)
    return NextResponse.json({ error: 'Erreur de vérification' }, { status: 500 })
  }

  const { can_access, reason } = access as LessonAccessResult
  if (!can_access) {
    const status = reason === 'subscription_required' ? 402 : 403
    return NextResponse.json({ error: `Accès refusé (${reason})` }, { status })
  }

  // ── 3. Fetch lesson metadata ──────────────────────────────
  const { data: lesson } = await svc
    .from('lessons')
    .select(`
      id,
      video_url,
      video_bucket,
      video_path,
      video_type,
      is_protected,
      is_downloadable
    `)
    .eq('id', id)
    .single()

  const hasStorageVideo = !!(lesson?.video_bucket && lesson?.video_path)
  const hasLegacyVideo  = !!lesson?.video_url

  if (!lesson || (!hasStorageVideo && !hasLegacyVideo)) {
    return NextResponse.json({ error: 'Leçon introuvable' }, { status: 404 })
  }

  if (hasStorageVideo && lesson.video_bucket !== 'lesson-videos') {
    return NextResponse.json({ error: 'Stockage média invalide' }, { status: 500 })
  }

  // ── 4. Generate signed URL ────────────────────────────────

  // PATH A: new-style storage (video_bucket + video_path)
  if (hasStorageVideo) {
    const { data: signed, error } = await svc.storage
      .from(lesson.video_bucket as string)
      .createSignedUrl(lesson.video_path as string, SIGNED_URL_TTL)

    if (error || !signed?.signedUrl) {
      console.error('[lesson-stream] Failed to sign storage URL:', error?.message)
      return NextResponse.json(
        { error: 'Impossible de générer le lien sécurisé' },
        { status: 502 },
      )
    }
    return buildRedirect(signed.signedUrl)
  }

  // PATH B: legacy video_url
  const rawUrl = lesson.video_url as string

  // B1: Protected + Supabase Storage URL → sign it
  if (lesson.is_protected) {
    const storageInfo = parseStorageUrl(rawUrl)
    if (storageInfo?.bucket === 'lesson-videos') {
      const { data: signed, error } = await svc.storage
        .from(storageInfo.bucket)
        .createSignedUrl(storageInfo.path, SIGNED_URL_TTL)

      if (error || !signed?.signedUrl) {
        console.error('[lesson-stream] Failed to sign legacy URL:', error?.message)
        return NextResponse.json(
          { error: 'Impossible de générer le lien sécurisé' },
          { status: 502 },
        )
      }
      return buildRedirect(signed.signedUrl)
    }
    return buildRedirect(rawUrl)
  }

  // B2: Non-protected legacy URL — pass through
  return buildRedirect(rawUrl)
}

function buildRedirect(url: string): NextResponse {
  let target: URL
  try {
    target = new URL(url)
    if (!['http:', 'https:'].includes(target.protocol)) throw new Error('Invalid protocol')
  } catch {
    return NextResponse.json({ error: 'URL média invalide' }, { status: 500 })
  }

  const res = NextResponse.redirect(target, { status: 302 })
  res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
  res.headers.set('Pragma', 'no-cache')
  res.headers.set('X-Frame-Options', 'SAMEORIGIN')
  res.headers.set('Content-Security-Policy', "frame-ancestors 'self'")
  res.headers.set('Cross-Origin-Resource-Policy', 'same-origin')
  res.headers.set('X-Content-Type-Options', 'nosniff')
  return res
}
