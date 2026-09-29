import { clsx, type ClassValue } from 'clsx'
import { differenceInCalendarDays, formatDistanceToNow } from 'date-fns'
import { ar, enUS, fr } from 'date-fns/locale'
import { BAC_EXAM_DATE } from '@/constants'
import type { Language } from '@/lib/i18n'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatDuration(seconds: number): string {
  if (!seconds) return '0 min'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}min`
  return `${m} min`
}

export function daysUntilBac(): number {
  return Math.max(0, differenceInCalendarDays(BAC_EXAM_DATE, new Date()))
}

export function timeAgo(date: string, language: Language = 'fr'): string {
  const locale = language === 'ar' ? ar : language === 'en' ? enUS : fr
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale })
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function getInitials(name: string | null): string {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

/* ─── Video URL helpers ───────────────────────────────────────────────────── */

export type VideoUrlType = 'youtube' | 'vimeo' | 'direct' | 'invalid'

export function classifyVideoUrl(url: string): VideoUrlType {
  const s = url?.trim()
  if (!s) return 'invalid'

  // Bare YouTube ID (11 chars)
  if (!s.includes('/') && /^[A-Za-z0-9_-]{11}$/.test(s)) return 'youtube'

  try {
    const u = new URL(s)
    if (!['http:', 'https:'].includes(u.protocol)) return 'invalid'

    if (['youtube.com', 'www.youtube.com', 'm.youtube.com'].includes(u.hostname)) {
      if (u.pathname === '/watch' && u.searchParams.has('v')) return 'youtube'
      if (u.pathname.startsWith('/embed/') || u.pathname.startsWith('/shorts/')) return 'youtube'
      return 'invalid'
    }
    if (u.hostname === 'youtu.be' && u.pathname.length > 1) return 'youtube'

    if (['vimeo.com', 'www.vimeo.com'].includes(u.hostname)) return 'vimeo'

    if (u.pathname.includes('/storage/v1/object/')) return 'direct'

    const ext = u.pathname.split('.').pop()?.toLowerCase() ?? ''
    if (['mp4', 'webm', 'ogg', 'mov', 'm4v', 'mkv'].includes(ext)) return 'direct'

    return 'invalid'
  } catch {
    return 'invalid'
  }
}

export function extractYoutubeId(url: string): string | null {
  const s = url?.trim()
  if (!s) return null

  // If it does not look like a URL, check if it's an 11-character ID
  if (!s.includes('http://') && !s.includes('https://') && !s.includes('/')) {
    return /^[A-Za-z0-9_-]{11}$/.test(s) ? s : null
  }

  try {
    const u = new URL(s)
    if (u.hostname === 'youtu.be') {
      return u.pathname.slice(1).split('/')[0] || null
    }
    if (u.hostname.includes('youtube.com') || u.hostname.includes('m.youtube.com')) {
      if (u.pathname.startsWith('/embed/')) {
        return u.pathname.split('/embed/')[1]?.split('/')[0] ?? null
      }
      if (u.pathname.startsWith('/shorts/')) {
        return u.pathname.split('/shorts/')[1]?.split('/')[0] ?? null
      }
      return u.searchParams.get('v')
    }
    return null
  } catch {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|\&v=)([^#\&\?]*).*/
    const match = s.match(regExp)
    return (match && match[2].length === 11) ? match[2] : null
  }
}

export function toYoutubeEmbedUrl(url: string): string | null {
  const id = extractYoutubeId(url)
  return id ? `https://www.youtube.com/embed/${id}?enablejsapi=1&controls=0&disablekb=1&fs=0&rel=0&playsinline=1&iv_load_policy=3&modestbranding=1` : null
}

export function toVimeoEmbedUrl(url: string): string | null {
  try {
    const id = new URL(url.trim()).pathname.split('/').find(s => /^\d+$/.test(s))
    return id ? `https://player.vimeo.com/video/${id}` : null
  } catch {
    return null
  }
}

export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 11 && digits.startsWith('222')) {
    return `+${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 7)} ${digits.slice(7, 9)} ${digits.slice(9)}`
  }
  return phone
}
