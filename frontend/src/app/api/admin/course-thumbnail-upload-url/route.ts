import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSessionProfile } from '@/lib/auth/session'

export const runtime = 'nodejs'

const BUCKET = 'course-thumbnails'
const MAX_FILE_SIZE = 5 * 1024 * 1024

const ALLOWED_CONTENT_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
])

const EXT_WHITELIST = new Set(['jpg', 'jpeg', 'png', 'webp'])

export async function POST(req: NextRequest) {
  const profile = await getSessionProfile()
  if (!profile || !profile.is_active || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: { ext?: string; contentType?: string; size?: number }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const contentType = body.contentType?.toLowerCase() ?? ''
  if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
    return NextResponse.json(
      { error: 'Format non accepte. Utilise JPG, PNG ou WebP.' },
      { status: 400 },
    )
  }

  if (typeof body.size !== 'number' || body.size <= 0 || body.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: 'Image trop lourde. Taille maximum: 5 MB.' },
      { status: 400 },
    )
  }

  const rawExt = (body.ext ?? 'jpg').toLowerCase().replace(/^\./, '')
  const safeExt = EXT_WHITELIST.has(rawExt) ? rawExt : 'jpg'
  const path = `courses/${crypto.randomUUID()}.${safeExt}`

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: 'Service non configure.' }, { status: 500 })
  }

  const svc = createClient(
    supabaseUrl,
    serviceRoleKey,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )

  const { data, error } = await svc.storage
    .from(BUCKET)
    .createSignedUploadUrl(path, { upsert: false })

  if (error || !data?.signedUrl) {
    console.error('[course-thumbnail-upload-url] failed:', error?.message)
    return NextResponse.json(
      { error: 'Impossible de creer le lien d upload' },
      { status: 500 },
    )
  }

  const { data: publicData } = svc.storage.from(BUCKET).getPublicUrl(path)

  return NextResponse.json({
    bucket: BUCKET,
    path,
    signedUrl: data.signedUrl,
    token: data.token,
    publicUrl: publicData.publicUrl,
  })
}
