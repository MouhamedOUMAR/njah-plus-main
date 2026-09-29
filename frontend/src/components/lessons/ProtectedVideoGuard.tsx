'use client'
import { useEffect, useState, type ReactNode } from 'react'

// YouTube iframe links cannot be fully protected.
// This guard keeps the existing suspicious-activity overlay without rendering
// any student-identifying text on top of the video.

interface ProtectedVideoGuardProps {
  children: ReactNode
  className?: string
}

export default function ProtectedVideoGuard({
  children,
  className,
}: ProtectedVideoGuardProps) {
  const [isSuspicious, setIsSuspicious] = useState(false)
  const [isArmed, setIsArmed] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsArmed(true), 2000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!isArmed) return

    const handleVisibilityChange = () => {
      if (document.hidden) setIsSuspicious(true)
    }

    let blurTimer: ReturnType<typeof setTimeout>
    const handleBlur = () => {
      blurTimer = setTimeout(() => {
        if (!document.hasFocus()) setIsSuspicious(true)
      }, 2500)
    }

    const handleFocus = () => {
      clearTimeout(blurTimer)
    }

    const handlePageHide = () => {
      setIsSuspicious(true)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      const isPrintScreen = event.key === 'PrintScreen'
      const isF12 = event.key === 'F12'
      const isDevToolsCtrlShift = (event.ctrlKey || event.metaKey) && event.shiftKey && (key === 'i' || key === 'j')
      const isSourceCodeCtrlU = (event.ctrlKey || event.metaKey) && key === 'u'
      const isDevToolsMac = event.metaKey && event.altKey && key === 'i'

      if (isPrintScreen || isF12 || isDevToolsCtrlShift || isSourceCodeCtrlU || isDevToolsMac) {
        event.preventDefault()
        setIsSuspicious(true)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('blur', handleBlur)
    window.addEventListener('focus', handleFocus)
    window.addEventListener('pagehide', handlePageHide)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      clearTimeout(blurTimer)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('blur', handleBlur)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('pagehide', handlePageHide)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isArmed])

  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault()
    setIsSuspicious(true)
  }

  return (
    <div
      className={className || 'relative w-full h-full group aspect-video overflow-hidden rounded-lg bg-black'}
      onContextMenu={handleContextMenu}
    >
      <div className="w-full h-full select-none pointer-events-auto">
        {children}
      </div>

      {isSuspicious && (
        <div
          className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/95 text-center p-6 transition-all duration-300"
          style={{ backdropFilter: 'blur(10px)' }}
        >
          <div className="max-w-xs space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-white tracking-wide">
                Contenu protege
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                La video est masquee pour des raisons de securite. Evitez de changer d onglet, de faire des captures d ecran, ou d ouvrir les outils d inspection.
              </p>
            </div>
            <button
              onClick={() => setIsSuspicious(false)}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold tracking-wide border border-white/10 hover:border-white/20 transition-all duration-200"
            >
              Reprendre la lecture
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
