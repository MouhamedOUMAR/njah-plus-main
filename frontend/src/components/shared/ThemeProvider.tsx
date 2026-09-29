'use client'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

type Theme = 'system' | 'light' | 'dark'

interface ThemeContextValue {
  theme: Theme
  setTheme: (t: Theme) => void
  resolvedTheme: 'light' | 'dark'
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'system',
  setTheme: () => {},
  resolvedTheme: 'light',
})

export function useTheme() {
  return useContext(ThemeContext)
}

function isTheme(value: string | null): value is Theme {
  return value === 'system' || value === 'light' || value === 'dark'
}

function resolveTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return theme
}

function applyResolvedTheme(resolved: 'light' | 'dark') {
  document.documentElement.classList.toggle('dark', resolved === 'dark')
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system')
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('bac-theme')
    setThemeState(isTheme(saved) ? saved : 'system')
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const syncTheme = () => {
      const resolved = resolveTheme(theme)
      applyResolvedTheme(resolved)
      setResolvedTheme(resolved)
    }

    syncTheme()

    if (theme !== 'system') return

    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    mq.addEventListener('change', syncTheme)
    return () => mq.removeEventListener('change', syncTheme)
  }, [theme, mounted])

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t)
    localStorage.setItem('bac-theme', t)
  }, [])

  const value = useMemo(
    () => ({
      theme: mounted ? theme : 'system',
      setTheme,
      resolvedTheme: mounted ? resolvedTheme : 'light',
    }),
    [mounted, resolvedTheme, setTheme, theme],
  )

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}
