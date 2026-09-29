'use client'
import Link from 'next/link'
import {
  PlayCircleIcon, HeadphonesIcon, LockIcon, ClockIcon, DownloadIcon, ChevronRightIcon, ShieldCheckIcon,
} from 'lucide-react'
import { formatDuration } from '@/lib/utils'
import IconBox from '@/components/ui/IconBox'
import type { Lesson } from '@/types'
import { useT } from '@/components/shared/LanguageProvider'

interface LessonListItemProps {
  lesson: Lesson
  index: number
}

export default function LessonListItem({ lesson, index }: LessonListItemProps) {
  const canAccess = lesson.can_access ?? !lesson.is_protected
  const isAudio = lesson.video_type === 'audio'
  const t = useT()

  const card = (
    <div className={`flex items-center gap-4 bg-card rounded-lg border p-4 shadow-sm active:scale-[0.98] transition-all group ${canAccess ? 'border-border/40' : 'border-border/20 opacity-70'}`}>

      {/* State icon */}
      <IconBox 
        icon={canAccess ? (isAudio ? HeadphonesIcon : PlayCircleIcon) : LockIcon}
        variant={canAccess ? 'soft' : 'neutral'}
        size="md"
        className={canAccess ? 'transition-colors' : ''}
        iconClassName={canAccess && !lesson.is_protected ? 'animate-pulse' : ''}
        fill={canAccess}
      />

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-bold text-text truncate leading-snug tracking-tight">
          <span className="text-[#0E7490]/70 font-medium me-2 text-sm">{index}.</span>
          {lesson.title}
        </p>
        <div className="flex items-center gap-3 mt-1 text-[11px] text-muted font-bold uppercase tracking-widest">
          {lesson.duration > 0 && (
            <span className="flex items-center gap-1">
              <ClockIcon size={12} className="text-[#0E7490]" />
              {formatDuration(lesson.duration)}
            </span>
          )}
          {isAudio && (
            <span className="flex items-center gap-1 text-primary">
              <HeadphonesIcon size={12} /> {t.courses.audio}
            </span>
          )}
          {!canAccess && lesson.lock_reason === 'subscription_required' && (
            <span className="flex items-center gap-1 text-amber-600">
              <ShieldCheckIcon size={12} /> {t.courses.subscribe}
            </span>
          )}
          {canAccess && lesson.is_protected && (
            <span className="flex items-center gap-1 text-amber-600">
              <ShieldCheckIcon size={12} /> {t.courses.protected}
            </span>
          )}
          {canAccess && lesson.is_downloadable && (
            <span className="flex items-center gap-1 text-green-600">
              <DownloadIcon size={12} /> {t.courses.offline}
            </span>
          )}
        </div>
      </div>

      {/* Right side */}
      <div className="w-9 h-9 rounded-full bg-[#E6FAF8] dark:bg-primary/15 flex items-center justify-center border border-primary/15 transition-colors">
        {canAccess
          ? <ChevronRightIcon size={18} className="text-[#0E7490] rtl:rotate-180" />
          : <LockIcon size={14} className="text-slate-400 dark:text-slate-300" />
        }
      </div>
    </div>
  )

  return <Link href={`/lessons/${lesson.id}`} prefetch={canAccess} className="block">{card}</Link>
}
