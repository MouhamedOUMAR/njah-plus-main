'use client'
import { useCallback, useEffect, useRef, useState, type MouseEvent, type PointerEvent } from 'react'
import CustomYouTubePlayer from './CustomYouTubePlayer'
import {
  AlertCircleIcon, FastForwardIcon, MaximizeIcon, MinimizeIcon,
  PauseIcon, PlayIcon, RefreshCwIcon,
} from 'lucide-react'
import {
  classifyVideoUrl, toYoutubeEmbedUrl, toVimeoEmbedUrl,
} from '@/lib/utils'
import { useT } from '@/components/shared/LanguageProvider'

interface VideoPlayerProps {
  streamUrl: string
  rawVideoUrl: string
  lessonId: string
  isProtected: boolean
}

const SEEK_WINDOW_MS = 10000
const SEEK_THRESHOLD = 5
const SPEED_STEPS = [0.75, 1, 1.25, 1.5, 2]

function reportEvent(lessonId: string, eventType: 'tab_hidden' | 'seek_abuse', payload: Record<string, unknown>) {
  void fetch('/api/video-event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lessonId, eventType, metadata: payload }),
    keepalive: true,
  }).catch(() => {
    // Monitoring must never interrupt lesson playback.
  })
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  const t = useT()
  return (
    <div className="aspect-video bg-card rounded-lg border border-border/50 flex flex-col items-center justify-center gap-3 text-center px-6">
      <AlertCircleIcon size={32} className="text-red-500" />
      <p className="text-sm font-semibold text-text">{t.lesson.videoLoadError}</p>
      <p className="text-xs text-muted">{t.lesson.videoLoadHint}</p>
      <button
        onClick={onRetry}
        className="flex items-center gap-2 text-xs font-semibold text-[#0E7490] mt-1"
      >
        <RefreshCwIcon size={13} /> {t.lesson.retry}
      </button>
    </div>
  )
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0:00'

  const total = Math.floor(seconds)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60

  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

function lockLandscape() {
  try {
    ;(screen.orientation as any)?.lock?.('landscape')?.catch?.(() => {})
  } catch {
    // Unsupported on some mobile browsers.
  }
}

function unlockOrientation() {
  try {
    ;(screen.orientation as any)?.unlock?.()
  } catch {
    // Unsupported on some mobile browsers.
  }
}

function DirectVideoPlayer({
  streamUrl,
  lessonId,
  isProtected,
  onSeeked,
}: {
  streamUrl: string
  lessonId: string
  isProtected: boolean
  onSeeked: () => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const controlsTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isCssFullscreen, setIsCssFullscreen] = useState(false)

  const playerKey = `${lessonId}-${streamUrl}`
  const fullscreenActive = isFullscreen || isCssFullscreen
  const progress = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0
  const durationLabel = duration > 0 ? formatTime(duration) : '--:--'

  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeout.current) clearTimeout(controlsTimeout.current)
    setShowControls(true)
    controlsTimeout.current = setTimeout(() => {
      setShowControls(false)
    }, 2500)
  }, [])

  useEffect(() => {
    if (controlsTimeout.current) clearTimeout(controlsTimeout.current)
    const video = videoRef.current

    setIsLoading(true)
    setLoadError(false)
    setIsPlaying(false)
    setShowControls(true)
    setCurrentTime(0)
    setDuration(0)
    setPlaybackSpeed(1)

    if (video) {
      video.pause()
      video.currentTime = 0
      video.playbackRate = 1
      video.load()
    }

    return () => {
      if (controlsTimeout.current) clearTimeout(controlsTimeout.current)
      video?.pause()
    }
  }, [playerKey])

  useEffect(() => {
    function onVisibility() {
      if (document.hidden) {
        reportEvent(lessonId, 'tab_hidden', {
          currentTime: videoRef.current?.currentTime ?? 0,
        })
      }
    }

    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [lessonId])

  useEffect(() => {
    const handleFullscreenChange = () => {
      const nativeFullscreen = !!document.fullscreenElement || !!(document as any).webkitFullscreenElement
      setIsFullscreen(nativeFullscreen || isCssFullscreen)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
    }
  }, [isCssFullscreen])

  useEffect(() => {
    document.body.classList.toggle('video-fullscreen', fullscreenActive)
    if (fullscreenActive) {
      lockLandscape()
    } else {
      unlockOrientation()
    }

    return () => {
      document.body.classList.remove('video-fullscreen')
      unlockOrientation()
    }
  }, [fullscreenActive])

  const togglePlay = useCallback(() => {
    const video = videoRef.current
    if (!video || loadError) return

    if (isPlaying) {
      video.pause()
      setIsPlaying(false)
      setShowControls(true)
      if (controlsTimeout.current) clearTimeout(controlsTimeout.current)
      return
    }

    video.play().then(() => {
      setIsPlaying(true)
      resetControlsTimeout()
    }).catch(() => {
      setIsCssFullscreen(false)
      setIsFullscreen(false)
      setLoadError(true)
      setIsLoading(false)
      setIsPlaying(false)
    })
  }, [isPlaying, loadError, resetControlsTimeout])

  const seekFromPointer = useCallback((event: PointerEvent<HTMLDivElement>) => {
    event.stopPropagation()
    const video = videoRef.current
    if (!video || !duration || !progressRef.current) return

    const rect = progressRef.current.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width))
    const nextTime = ratio * duration

    video.currentTime = nextTime
    setCurrentTime(nextTime)
    resetControlsTimeout()
  }, [duration, resetControlsTimeout])

  const cycleSpeed = useCallback((event: MouseEvent) => {
    event.stopPropagation()
    const video = videoRef.current
    if (!video) return

    const currentIndex = SPEED_STEPS.indexOf(playbackSpeed)
    const nextSpeed = SPEED_STEPS[(currentIndex + 1) % SPEED_STEPS.length]
    video.playbackRate = nextSpeed
    setPlaybackSpeed(nextSpeed)
    resetControlsTimeout()
  }, [playbackSpeed, resetControlsTimeout])

  const toggleFullscreen = useCallback((event: MouseEvent) => {
    event.stopPropagation()

    if (fullscreenActive) {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {})
      } else if ((document as any).webkitFullscreenElement && (document as any).webkitExitFullscreen) {
        ;(document as any).webkitExitFullscreen()
      } else {
        setIsCssFullscreen(false)
        setIsFullscreen(false)
      }
      return
    }

    const element = containerRef.current
    if (!element) return

    if (element.requestFullscreen) {
      element.requestFullscreen().then(() => {
        setIsFullscreen(true)
      }).catch(() => {
        setIsCssFullscreen(true)
        setIsFullscreen(true)
      })
    } else if ((element as any).webkitRequestFullscreen) {
      ;(element as any).webkitRequestFullscreen()
      setIsFullscreen(true)
    } else {
      setIsCssFullscreen(true)
      setIsFullscreen(true)
    }
  }, [fullscreenActive])

  function retry() {
    const video = videoRef.current
    setLoadError(false)
    setIsLoading(true)
    setIsPlaying(false)
    setCurrentTime(0)
    video?.load()
  }

  function handleContextMenu(event: MouseEvent) {
    if (isProtected) event.preventDefault()
  }

  if (loadError) return <ErrorState onRetry={retry} />

  const wrapperClass = fullscreenActive
    ? 'video-wrapper video-fullscreen-shell fixed inset-0 z-[99999] flex h-[100dvh] w-[100vw] items-center justify-center overflow-hidden rounded-none bg-black'
    : 'video-wrapper relative aspect-video w-full overflow-hidden rounded-lg bg-black'

  const videoClass = fullscreenActive
    ? 'h-[100dvh] w-[100vw] bg-black object-contain'
    : 'h-full w-full bg-black object-contain'

  return (
    <div
      ref={containerRef}
      className={wrapperClass}
      onContextMenu={handleContextMenu}
      onMouseMove={() => isPlaying && resetControlsTimeout()}
      onTouchStart={() => isPlaying && resetControlsTimeout()}
      onClick={togglePlay}
    >
      <video
        ref={videoRef}
        key={playerKey}
        src={streamUrl}
        playsInline
        preload="metadata"
        controls={false}
        controlsList={isProtected ? 'nodownload nofullscreen noremoteplayback' : 'nodownload'}
        disablePictureInPicture={isProtected}
        className={videoClass}
        onLoadedMetadata={event => {
          const nextDuration = Number(event.currentTarget.duration)
          if (Number.isFinite(nextDuration) && nextDuration > 0) setDuration(nextDuration)
          setIsLoading(false)
        }}
        onCanPlay={() => setIsLoading(false)}
        onWaiting={() => setIsLoading(true)}
        onPlaying={() => {
          setIsLoading(false)
          setIsPlaying(true)
          resetControlsTimeout()
        }}
        onPause={() => {
          setIsPlaying(false)
          setShowControls(true)
          if (controlsTimeout.current) clearTimeout(controlsTimeout.current)
        }}
        onTimeUpdate={event => {
          setCurrentTime(event.currentTarget.currentTime)
          const nextDuration = Number(event.currentTarget.duration)
          if (Number.isFinite(nextDuration) && nextDuration > 0) setDuration(nextDuration)
        }}
        onEnded={event => {
          setIsPlaying(false)
          setShowControls(true)
          setCurrentTime(event.currentTarget.duration || 0)
        }}
        onError={() => {
          setIsCssFullscreen(false)
          setIsFullscreen(false)
          setLoadError(true)
          setIsLoading(false)
          setIsPlaying(false)
        }}
        onSeeked={onSeeked}
      />

      <div
        className={`absolute inset-0 z-20 flex flex-col justify-between transition-opacity duration-200 ${
          showControls || !isPlaying || isLoading ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="h-16 bg-gradient-to-b from-black/80 to-transparent pointer-events-none" />

        <div className="flex flex-1 items-center justify-center">
          {isLoading ? (
            <div className="h-11 w-11 animate-spin rounded-full border-2 border-white/20 border-t-white" />
          ) : (
            <button
              onClick={event => {
                event.stopPropagation()
                togglePlay()
              }}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-white shadow-2xl transition-transform active:scale-95 sm:h-20 sm:w-20"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <PauseIcon className="h-8 w-8 fill-current sm:h-10 sm:w-10" />
              ) : (
                <PlayIcon className="ml-1 h-8 w-8 fill-current sm:h-10 sm:w-10" />
              )}
            </button>
          )}
        </div>

        <div
          className="bg-gradient-to-t from-black/95 via-black/80 to-transparent px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-7 pointer-events-auto sm:px-5"
          onClick={event => event.stopPropagation()}
        >
          <div
            ref={progressRef}
            role="slider"
            aria-label="Progression video"
            aria-valuemin={0}
            aria-valuemax={Math.max(0, Math.floor(duration))}
            aria-valuenow={Math.floor(currentTime)}
            tabIndex={0}
            onPointerDown={seekFromPointer}
            className="group/progress mb-3 flex h-5 cursor-pointer items-center"
          >
            <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/25">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-[#0E7490]"
                style={{ width: `${progress}%` }}
              />
              <span
                className="absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full bg-white shadow-lg transition-transform group-hover/progress:scale-110"
                style={{ left: `calc(${progress}% - 7px)` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <button
                onClick={event => {
                  event.stopPropagation()
                  togglePlay()
                }}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 active:scale-95"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <PauseIcon className="h-4 w-4 fill-current" /> : <PlayIcon className="ml-0.5 h-4 w-4 fill-current" />}
              </button>

              <span className="truncate text-xs font-semibold tabular-nums text-white/90 sm:text-sm">
                {formatTime(currentTime)} / {durationLabel}
              </span>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={cycleSpeed}
                className="flex h-9 items-center gap-1.5 rounded-full bg-white/10 px-3 text-xs font-bold text-white transition-colors hover:bg-white/20 active:scale-95"
                title="Vitesse de lecture"
                aria-label="Changer la vitesse"
              >
                <FastForwardIcon className="h-4 w-4" />
                {playbackSpeed}x
              </button>

              <button
                onClick={toggleFullscreen}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 active:scale-95"
                title={fullscreenActive ? 'Quitter le plein ecran' : 'Plein ecran'}
                aria-label={fullscreenActive ? 'Quitter le plein ecran' : 'Plein ecran'}
              >
                {fullscreenActive ? <MinimizeIcon className="h-5 w-5" /> : <MaximizeIcon className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function VideoPlayer({
  streamUrl,
  rawVideoUrl,
  lessonId,
  isProtected,
}: VideoPlayerProps) {
  const seekTimes = useRef<number[]>([])
  const [loadError, setLoadError] = useState(false)
  const t = useT()

  const urlType = classifyVideoUrl(rawVideoUrl)
  const embedUrl =
    urlType === 'youtube' ? toYoutubeEmbedUrl(rawVideoUrl) :
    urlType === 'vimeo' ? toVimeoEmbedUrl(rawVideoUrl) :
    null
  const playerKey = `${lessonId}-${embedUrl ?? streamUrl ?? rawVideoUrl}`

  useEffect(() => {
    setLoadError(false)
    seekTimes.current = []
  }, [lessonId, rawVideoUrl, streamUrl])

  const handleSeeked = useCallback(() => {
    const now = Date.now()
    seekTimes.current = seekTimes.current.filter(time => now - time < SEEK_WINDOW_MS)
    seekTimes.current.push(now)

    if (seekTimes.current.length >= SEEK_THRESHOLD) {
      reportEvent(lessonId, 'seek_abuse', {
        seekCount: seekTimes.current.length,
        windowMs: SEEK_WINDOW_MS,
      })
      seekTimes.current = []
    }
  }, [lessonId])

  function handleContextMenu(event: MouseEvent) {
    if (isProtected) event.preventDefault()
  }

  if (loadError) return <ErrorState onRetry={() => setLoadError(false)} />

  if (urlType === 'invalid' || (!embedUrl && !streamUrl)) {
    return <ErrorState onRetry={() => setLoadError(false)} />
  }

  if (embedUrl) {
    if (urlType === 'youtube') {
      return (
        <CustomYouTubePlayer
          key={playerKey}
          embedUrl={embedUrl}
          isProtected={isProtected}
          lessonId={lessonId}
        />
      )
    }

    return (
      <div
        className="video-wrapper relative bg-black rounded-lg overflow-hidden aspect-video"
        onContextMenu={handleContextMenu}
      >
        <iframe
          key={playerKey}
          src={embedUrl}
          title={t.lesson.videoTitle}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen={!isProtected}
          className="absolute inset-0 w-full h-full border-0"
        />
      </div>
    )
  }

  return (
    <DirectVideoPlayer
      key={playerKey}
      streamUrl={streamUrl}
      lessonId={lessonId}
      isProtected={isProtected}
      onSeeked={handleSeeked}
    />
  )
}
