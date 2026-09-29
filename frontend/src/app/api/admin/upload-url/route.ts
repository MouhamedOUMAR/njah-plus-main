import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSessionProfile } from '@/lib/auth/session'

export const runtime = 'nodejs'

const MEDIA_BUCKET = 'lesson-videos'
const ASSET_BUCKET = 'lesson-assets'
const MAX_MEDIA_SIZE = 500 * 1024 * 1024
const MAX_ASSET_SIZE = 25 * 1024 * 1024

const ALLOWED_CONTENT_TYPES = new Set([
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/quicktime',
  'video/x-msvideo',
  'video/avi',
  'audio/mpeg',
  'audio/mp4',
  'audio/aac',
  'audio/ogg',
  'audio/webm',
  'audio/wav',
  'audio/x-wav',
  'audio/flac',
  'audio/x-m4a',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
])

const VIDEO_EXTENSIONS = new Set(['mp4', 'webm', 'ogv', 'ogg', 'mov', 'avi'])
const AUDIO_EXTENSIONS = new Set(['mp3', 'm4a', 'aac', 'ogg', 'oga', 'webm', 'wav', 'flac'])
const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp'])

export async function POST(req: NextRequest) {
  // Admin-only endpoint
  const profile = await getSessionProfile()
  if (!profile || !profile.is_active || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: {
    ext?: string
    contentType?: string
    mediaType?: 'video' | 'audio' | 'image' | 'pdf'
    size?: number
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const contentType = body.contentType?.toLowerCase() ?? ''
  if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
    return NextResponse.json(
      { error: 'Format non accepté. Utilisez une vidéo, un audio, une image ou un PDF.' },
      { status: 400 },
    )
  }

  const mediaType = body.mediaType ?? 'video'
  const typeMatches =
    (mediaType === 'audio' && contentType.startsWith('audio/')) ||
    (mediaType === 'video' && contentType.startsWith('video/')) ||
    (mediaType === 'image' && contentType.startsWith('image/')) ||
    (mediaType === 'pdf' && contentType === 'application/pdf')

  if (!typeMatches) {
    return NextResponse.json({ error: 'Le type du fichier ne correspond pas au contenu choisi.' }, { status: 400 })
  }
  const maximumSize = mediaType === 'image' || mediaType === 'pdf' ? MAX_ASSET_SIZE : MAX_MEDIA_SIZE
  if (!Number.isFinite(body.size) || !body.size || body.size <= 0 || body.size > maximumSize) {
    return NextResponse.json({ error: 'Taille de fichier invalide ou trop importante.' }, { status: 400 })
  }
  const extensions = mediaType === 'audio'
    ? AUDIO_EXTENSIONS
    : mediaType === 'image'
      ? IMAGE_EXTENSIONS
      : mediaType === 'pdf'
        ? new Set(['pdf'])
        : VIDEO_EXTENSIONS
  const fallbackExt = mediaType === 'audio' ? 'mp3' : mediaType === 'image' ? 'jpg' : mediaType === 'pdf' ? 'pdf' : 'mp4'
  const rawExt = (body.ext ?? fallbackExt).toLowerCase().replace(/^\./, '')
  const safeExt = extensions.has(rawExt) ? rawExt : fallbackExt
  const bucket = mediaType === 'image' || mediaType === 'pdf' ? ASSET_BUCKET : MEDIA_BUCKET
  const folder = mediaType === 'audio' ? 'audio' : mediaType === 'video' ? 'videos' : mediaType === 'image' ? 'images' : 'documents'
  const path = `${folder}/${crypto.randomUUID()}.${safeExt}`

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
    .from(bucket)
    .createSignedUploadUrl(path, { upsert: false })

  if (error || !data?.signedUrl) {
    console.error('[upload-url] Failed to create signed upload URL:', error?.message)
    return NextResponse.json(
      { error: 'Impossible de créer le lien d\'upload' },
      { status: 500 },
    )
  }

  return NextResponse.json({
    path,
    bucket,
    signedUrl: data.signedUrl,
    token: data.token,
  })
}
