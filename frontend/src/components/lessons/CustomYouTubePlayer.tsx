// YouTube iframe links and branding cannot be fully protected.
// This implementation blocks direct iframe interaction and keeps custom controls as an MVP deterrent, not DRM-level protection.
'use client'
import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent, type PointerEvent } from 'react'
import { FastForwardIcon, MaximizeIcon, MinimizeIcon, PauseIcon, PlayIcon, RotateCcwIcon } from 'lucide-react'
import ProtectedVideoGuard from './ProtectedVideoGuard'

interface CustomYouTubePlayerProps {
  embedUrl: string
  isProtected: boolean
  lessonId?: string
}

type YouTubeApiWindow = Window & {
  YT?: any
  onYouTubeIframeAPIReady?: () => void
}

const SPEED_STEPS = [0.75, 1, 1.25, 1.5, 2]
let youtubeApiPromise: Promise<void> | null = null

function loadYouTubeIframeApi() {
  if (typeof window === 'undefined') return Promise.resolve()

  const ytWindow = window as YouTubeApiWindow
  if (ytWindow.YT?.Player) return Promise.resolve()
  if (youtubeApiPromise) return youtubeApiPromise

  youtubeApiPromise = new Promise(resolve => {
    const existingScript = document.querySelector<HTMLScriptElement>('script[src="https://www.youtube.com/iframe_api"]')
    const previousReady = ytWindow.onYouTubeIframeAPIReady

    ytWindow.onYouTubeIframeAPIReady = () => {
      previousReady?.()
      resolve()
    }

    if (!existingScript) {
      const script = document.createElement('script')
      script.src = 'https://www.youtube.com/iframe_api'
      script.async = true
      document.head.appendChild(script)
    }
  })

  return youtubeApiPromise
}

function withYouTubeParams(embedUrl: string, origin: string) {
  try {
    const url = new URL(embedUrl)
    url.searchParams.set('controls', '0')
    url.searchParams.set('disablekb', '1')
    url.searchParams.set('fs', '0')
    url.searchParams.set('rel', '0')
    url.searchParams.set('playsinline', '1')
    url.searchParams.set('iv_load_policy', '3')
    url.searchParams.set('modestbranding', '1')
    url.searchParams.set('enablejsapi', '1')
    if (origin) url.searchParams.set('origin', origin)
    return url.toString()
  } catch {
    return embedUrl
  }
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
    // Orientation lock is not available on every mobile browser.
  }
}

function unlockOrientation() {
  try {
    ;(screen.orientation as any)?.unlock?.()
  } catch {
    // Ignore unsupported orientation APIs.
  }
}

export default function CustomYouTubePlayer({ embedUrl, isProtected, lessonId }: CustomYouTubePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const playerRef = useRef<any>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const controlsTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const playbackSpeedRef = useRef(1)
  const durationRef = useRef(0)

  const [origin, setOrigin] = useState('')
  const [playerReady, setPlayerReady] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isCssFullscreen, setIsCssFullscreen] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const iframeSrc = useMemo(() => withYouTubeParams(embedUrl, origin), [embedUrl, origin])
  const playerKey = useMemo(() => `${lessonId ?? 'lesson'}-${iframeSrc}`, [iframeSrc, lessonId])
  const progress = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0
  const durationLabel = duration > 0 ? formatTime(duration) : '--:--'
  const fullscreenActive = isFullscreen || isCssFullscreen

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  useEffect(() => {
    playbackSpeedRef.current = playbackSpeed
  }, [playbackSpeed])

  useEffect(() => {
    if (controlsTimeout.current) clearTimeout(controlsTimeout.current)
    playerRef.current = null
    playbackSpeedRef.current = 1
    durationRef.current = 0
    setPlayerReady(false)
    setIsPlaying(false)
    setShowControls(true)
    setPlaybackSpeed(1)
    setCurrentTime(0)
    setDuration(0)
  }, [playerKey])

  const callPlayer = useCallback((func: string, args: any[] = []) => {
    if (!playerReady) return false

    const player = playerRef.current
    if (player && typeof player[func] === 'function') {
      try {
        player[func](...args)
        return true
      } catch {
        // Fall back to postMessage below.
      }
    }

    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: 'command', func, args }),
      '*',
    )
    return true
  }, [playerReady])

  const syncTimes = useCallback(() => {
    const player = playerRef.current
    if (!player) return

    try {
      const nextCurrent = Number(player.getCurrentTime?.() ?? 0)
      const nextDuration = Number(player.getDuration?.() ?? 0)

      if (Number.isFinite(nextCurrent)) setCurrentTime(Math.max(0, nextCurrent))
      if (Number.isFinite(nextDuration) && nextDuration > 0) {
        durationRef.current = nextDuration
        setDuration(nextDuration)
      }
    } catch {
      // Ignore transient YouTube API reads while the iframe is booting.
    }
  }, [])

  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeout.current) clearTimeout(controlsTimeout.current)
    setShowControls(true)
    controlsTimeout.current = setTimeout(() => {
      setShowControls(false)
    }, 2500)
  }, [])

  const togglePlay = useCallback(() => {
    if (!playerReady) return

    if (isPlaying) {
      callPlayer('pauseVideo')
      setIsPlaying(false)
      setShowControls(true)
      if (controlsTimeout.current) clearTimeout(controlsTimeout.current)
      return
    }

    callPlayer('playVideo')
    setIsPlaying(true)
    resetControlsTimeout()
  }, [callPlayer, isPlaying, playerReady, resetControlsTimeout])

  const restart = useCallback((event?: MouseEvent) => {
    event?.stopPropagation()
    if (!playerReady) return

    callPlayer('seekTo', [0, true])
    setCurrentTime(0)
    callPlayer('playVideo')
    setIsPlaying(true)
    resetControlsTimeout()
  }, [callPlayer, playerReady, resetControlsTimeout])

  const cycleSpeed = useCallback((event: MouseEvent) => {
    event.stopPropagation()
    if (!playerReady) return

    const currentIndex = SPEED_STEPS.indexOf(playbackSpeed)
    const nextSpeed = SPEED_STEPS[(currentIndex + 1) % SPEED_STEPS.length]

    setPlaybackSpeed(nextSpeed)
    playbackSpeedRef.current = nextSpeed
    callPlayer('setPlaybackRate', [nextSpeed])
    resetControlsTimeout()
  }, [callPlayer, playbackSpeed, playerReady, resetControlsTimeout])

  const seekFromPointer = useCallback((event: PointerEvent<HTMLDivElement>) => {
    event.stopPropagation()
    if (!playerReady || !duration || !progressRef.current) return

    const rect = progressRef.current.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width))
    const nextTime = ratio * duration

    setCurrentTime(nextTime)
    callPlayer('seekTo', [nextTime, true])
    resetControlsTimeout()
  }, [callPlayer, duration, playerReady, resetControlsTimeout])

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

  useEffect(() => {
    let cancelled = false
    setPlayerReady(false)

    loadYouTubeIframeApi().then(() => {
      if (cancelled || !iframeRef.current) return

      const ytWindow = window as YouTubeApiWindow
      if (!ytWindow.YT?.Player) return

      playerRef.current = new ytWindow.YT.Player(iframeRef.current, {
        events: {
          onReady: (event: any) => {
            if (cancelled) return
            playerRef.current = event.target
            setPlayerReady(true)
            event.target.setPlaybackRate?.(playbackSpeedRef.current)
            const nextDuration = Number(event.target.getDuration?.() ?? 0)
            if (Number.isFinite(nextDuration) && nextDuration > 0) {
              durationRef.current = nextDuration
              setDuration(nextDuration)
            }
            syncTimes()
          },
          onStateChange: (event: any) => {
            if (cancelled) return
            const state = event.data

            if (state === 1) {
              setIsPlaying(true)
              resetControlsTimeout()
            } else if (state === 2 || state === 0) {
              setIsPlaying(false)
              setShowControls(true)
              if (controlsTimeout.current) clearTimeout(controlsTimeout.current)
              if (state === 0) setCurrentTime(durationRef.current || 0)
            }

            syncTimes()
          },
        },
      })
    })

    return () => {
      cancelled = true
      setPlayerReady(false)
      setIsPlaying(false)
      setCurrentTime(0)
      setDuration(0)
      durationRef.current = 0
      if (controlsTimeout.current) clearTimeout(controlsTimeout.current)
      try {
        playerRef.current?.destroy?.()
      } catch {
        // Ignore iframe teardown errors.
      }
      playerRef.current = null
    }
  }, [playerKey, resetControlsTimeout, syncTimes])

  useEffect(() => {
    if (!playerReady) return

    syncTimes()
    const interval = window.setInterval(syncTimes, isPlaying ? 500 : 1000)
    return () => window.clearInterval(interval)
  }, [isPlaying, playerReady, syncTimes])

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isNativeFullscreen = !!document.fullscreenElement || !!(document as any).webkitFullscreenElement
      setIsFullscreen(isNativeFullscreen || isCssFullscreen)
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

  useEffect(() => {
    return () => {
      if (controlsTimeout.current) clearTimeout(controlsTimeout.current)
    }
  }, [])

  const iframeContent = (
    <div
      className="relative h-full w-full cursor-pointer touch-manipulation bg-black"
      onMouseMove={() => isPlaying && resetControlsTimeout()}
      onTouchStart={() => isPlaying && resetControlsTimeout()}
      onClick={togglePlay}
    >
      <iframe
        key={playerKey}
        ref={iframeRef}
        src={iframeSrc}
        title="Video de la lecon"
        className="absolute inset-0 h-full w-full border-0 pointer-events-none"
        allow="autoplay; encrypted-media"
        allowFullScreen={false}
        tabIndex={-1}
      />

      {!playerReady && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-white" />
        </div>
      )}

      <div
        className={`absolute inset-0 z-20 flex flex-col justify-between transition-opacity duration-200 ${
          showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="h-16 bg-gradient-to-b from-black/80 to-transparent pointer-events-none" />

        <div className="flex flex-1 items-center justify-center">
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

              <button
                onClick={restart}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 active:scale-95"
                title="Recommencer depuis le debut"
                aria-label="Recommencer"
              >
                <RotateCcwIcon className="h-4 w-4" />
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
                title={isFullscreen ? 'Quitter le plein ecran' : 'Plein ecran'}
                aria-label={isFullscreen ? 'Quitter le plein ecran' : 'Plein ecran'}
              >
                {isFullscreen ? <MinimizeIcon className="h-5 w-5" /> : <MaximizeIcon className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const wrappedCore = isProtected ? (
    <ProtectedVideoGuard className="relative h-full w-full bg-black">
      {iframeContent}
    </ProtectedVideoGuard>
  ) : (
    iframeContent
  )

  const wrapperClass = fullscreenActive
    ? 'video-fullscreen-shell fixed inset-0 z-[99999] h-[100dvh] w-[100vw] overflow-hidden rounded-none bg-black'
    : 'relative aspect-video w-full overflow-hidden rounded-lg bg-black'

  return (
    <div ref={containerRef} className={wrapperClass}>
      {wrappedCore}
    </div>
  )
}
