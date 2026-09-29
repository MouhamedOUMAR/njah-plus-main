'use client'

import { useState } from 'react'
import { HeadphonesIcon, RefreshCwIcon } from 'lucide-react'
import { useT } from '@/components/shared/LanguageProvider'

interface AudioPlayerProps {
  streamUrl: string
  lessonId: string
  isProtected: boolean
}

export default function AudioPlayer({ streamUrl, lessonId, isProtected }: AudioPlayerProps) {
  const [loadError, setLoadError] = useState(false)
  const t = useT()

  if (loadError) {
    return (
      <div className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-lg border border-border/50 bg-card px-6 text-center">
        <HeadphonesIcon size={32} className="text-red-500" />
        <p className="text-sm font-semibold text-text">{t.lesson.audioLoadError}</p>
        <p className="text-xs text-muted">{t.lesson.videoLoadHint}</p>
        <button
          type="button"
          onClick={() => setLoadError(false)}
          className="flex items-center gap-2 text-xs font-semibold text-primary"
        >
          <RefreshCwIcon size={13} /> {t.lesson.retry}
        </button>
      </div>
    )
  }

  return (
    <div
      className="flex min-h-48 flex-col items-center justify-center gap-5 overflow-hidden rounded-lg border border-primary/15 bg-card px-5 py-7 shadow-sm"
      onContextMenu={event => {
        if (isProtected) event.preventDefault()
      }}
    >
      <div className="flex h-20 w-20 items-center justify-center rounded-full border border-primary/20 bg-primary-light text-primary shadow-inner">
        <HeadphonesIcon size={34} />
      </div>
      <div className="w-full text-center">
        <p className="mb-3 text-xs font-bold uppercase text-muted">{t.lesson.audioTitle}</p>
        <audio
          key={`${lessonId}-${streamUrl}`}
          src={streamUrl}
          controls
          preload="metadata"
          controlsList={isProtected ? 'nodownload noplaybackrate' : undefined}
          onError={() => setLoadError(true)}
          className="h-12 w-full"
        />
      </div>
    </div>
  )
}
