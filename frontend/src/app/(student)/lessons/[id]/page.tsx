import { checkLessonAccess } from '@/actions/lessons'
import { getLessonById } from '@/lib/data/lessons'
import { getNotes } from '@/actions/notes'
import { requireAuth } from '@/lib/auth/get-session'
import { notFound, redirect } from 'next/navigation'
import { formatDuration, extractYoutubeId } from '@/lib/utils'
import VideoPlayer from '@/components/lessons/VideoPlayer'
import AudioPlayer from '@/components/lessons/AudioPlayer'
import LessonBackButton from '@/components/lessons/LessonBackButton'
import LessonActions from '@/components/lessons/LessonActions'
import LessonAttachment from '@/components/lessons/LessonAttachment'
import HistoryTracker from '@/components/lessons/HistoryTracker'
import Badge from '@/components/ui/Badge'
import I18nText from '@/components/shared/I18nText'
import { SUPPORT_WHATSAPP_URL } from '@/constants'
import {
  ArrowRightIcon,
  BookOpenIcon,
  ClockIcon,
  CreditCardIcon,
  LockIcon,
  MessageCircleIcon,
  ShieldIcon,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function LessonPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  if (!id || id === 'undefined') {
    console.error('[LessonPage] missing or invalid id param, redirecting to /courses')
    redirect('/courses')
  }

  await requireAuth()

  const lesson = await getLessonById(id)
  if (!lesson?.id) notFound()

  const [access, initialNotes] = await Promise.all([
    checkLessonAccess(lesson.id),
    getNotes(lesson.id),
  ])
  const canAccess = access?.can_access ?? false
  const streamUrl = canAccess ? `/api/lesson-stream/${lesson.id}` : ''
  const hasMedia = !!(lesson.video_url || (lesson.video_bucket && lesson.video_path))
  const isAudio = lesson.video_type === 'audio'
  const hasAttachment = !!(lesson.attachment_path && (lesson.attachment_type === 'image' || lesson.attachment_type === 'pdf'))

  const originalVideoUrl = lesson.video_url ?? ''
  let finalRawVideoUrl = ''

  if (canAccess) {
    if (lesson.video_bucket && lesson.video_path) {
      finalRawVideoUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/${lesson.video_bucket}/${lesson.video_path}`
    } else if (lesson.video_type === 'youtube' || originalVideoUrl.includes('youtu') || originalVideoUrl.length === 11) {
      finalRawVideoUrl = extractYoutubeId(originalVideoUrl) ?? originalVideoUrl
    } else {
      finalRawVideoUrl = originalVideoUrl
    }
  }

  return (
    <div className="min-h-[100dvh] w-full page-enter bg-bg pb-[calc(7rem+env(safe-area-inset-bottom))]">
      <header className="bg-primary-dark px-4 pb-7 pt-[calc(1rem+env(safe-area-inset-top))] text-white">
        <div className="flex items-center gap-3">
          <LessonBackButton courseId={lesson.course?.id ?? null} />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase text-white/60">
              <I18nText path="courses.lesson" />
            </p>
            <p className="mt-1 truncate text-sm font-bold text-white">
              {lesson.course?.title ?? lesson.title}
            </p>
          </div>
        </div>
      </header>

      <div className="relative z-10 -mt-3 px-4">
        {!canAccess ? (
          <LockedLessonScreen reason={access?.reason ?? 'subscription_required'} />
        ) : hasMedia ? (
          isAudio ? (
            <AudioPlayer
              streamUrl={streamUrl}
              lessonId={lesson.id}
              isProtected={lesson.is_protected}
            />
          ) : (
            <VideoPlayer
              streamUrl={streamUrl}
              rawVideoUrl={finalRawVideoUrl}
              lessonId={lesson.id}
              isProtected={lesson.is_protected}
            />
          )
        ) : (
          <div className="flex aspect-video flex-col items-center justify-center gap-2 rounded-lg border border-primary/15 bg-primary-light dark:bg-primary/15">
            <BookOpenIcon size={32} className="text-primary/60" />
            <p className="text-sm text-muted"><I18nText path="lesson.unavailableVideo" /></p>
          </div>
        )}
      </div>

      {canAccess && hasAttachment && (
        <div className="px-4 pt-4">
          <LessonAttachment
            lessonId={lesson.id}
            type={lesson.attachment_type}
            name={lesson.attachment_name}
          />
        </div>
      )}

      <section className="space-y-3 px-4 pt-5">
        <h1 className="text-[22px] font-black leading-tight text-text">
          {lesson.title}
        </h1>

        <div className="flex flex-wrap items-center gap-2">
          {lesson.duration > 0 && (
            <span className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-card px-3 py-2 text-xs font-semibold text-muted">
              <ClockIcon size={12} className="text-primary" />
              {formatDuration(lesson.duration)}
            </span>
          )}
          {lesson.is_protected && (
            <Badge variant="yellow" className="rounded-lg py-2">
              <ShieldIcon size={10} className="me-1" />
              <I18nText path="courses.protected" />
            </Badge>
          )}
        </div>

        {lesson.description && (
          <p className="text-sm leading-relaxed text-muted">{lesson.description}</p>
        )}

        {canAccess && <HistoryTracker lessonId={lesson.id} />}
      </section>

      <div className="px-4 pt-5">
        <LessonActions
          lessonId={lesson.id}
          lessonTitle={lesson.title}
          canAccess={canAccess}
          isDownloadable={lesson.is_downloadable}
          initialNotes={initialNotes}
        />
      </div>
    </div>
  )
}

function LockedLessonScreen({ reason }: { reason: string }) {
  const isSubscriptionRequired = reason === 'subscription_required'

  return (
    <div className="relative min-h-60 overflow-hidden rounded-lg border border-primary/15 bg-card px-5 py-6 text-center shadow-lg shadow-primary-dark/10">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-accent to-accent-warm" />
      <span className="inline-flex rounded-lg bg-primary-light px-3 py-1.5 text-[10px] font-extrabold uppercase text-primary dark:bg-primary/15">
        {isSubscriptionRequired
          ? <I18nText path="courses.protected" />
          : <I18nText path="courses.accessRestricted" />
        }
      </span>

      <div className="mx-auto mt-4 flex h-14 w-14 items-center justify-center rounded-lg border border-primary/15 bg-primary-light dark:bg-primary/15">
        {isSubscriptionRequired
          ? <CreditCardIcon size={26} className="text-primary" />
          : <LockIcon size={26} className="text-primary" />
        }
      </div>

      <div className="mt-4">
        <p className="text-base font-black text-text">
          <I18nText path={isSubscriptionRequired ? 'courses.subscriptionRequired' : 'courses.accessRestricted'} />
        </p>
        <p className="mx-auto mt-2 max-w-xs text-xs leading-relaxed text-muted">
          <I18nText path={isSubscriptionRequired ? 'courses.subscriptionRequiredDescription' : 'courses.accessRestrictedDescription'} />
        </p>
      </div>

      {isSubscriptionRequired && (
        <a
          href={SUPPORT_WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-xs font-bold text-white shadow-md shadow-primary/20 transition active:scale-95"
        >
          <MessageCircleIcon size={16} />
          <I18nText path="courses.subscribe" />
          <ArrowRightIcon size={14} className="rtl:rotate-180" />
        </a>
      )}
    </div>
  )
}
