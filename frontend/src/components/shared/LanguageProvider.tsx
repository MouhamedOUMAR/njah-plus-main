'use client'

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { translations, Language, TranslationDictionary } from '@/lib/i18n'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: TranslationDictionary
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

function applyLanguage(lang: Language) {
  document.documentElement.lang = lang
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('fr')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Read from localStorage on mount
    const saved = localStorage.getItem('app-language') as Language
    if (saved && ['fr', 'ar', 'en'].includes(saved)) {
      setLanguageState(saved)
      applyLanguage(saved)
    } else {
      // default
      applyLanguage('fr')
    }
    setMounted(true)
  }, [])

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem('app-language', lang)
    applyLanguage(lang)
  }, [])

  // Prevent hydration mismatch by rendering a safe default or nothing until mounted,
  // but since we want to avoid layout shift, we just use the default 'fr' state
  // until the effect runs.
  
  const value = useMemo(() => ({
    language: mounted ? language : 'fr',
    setLanguage,
    t: mounted ? translations[language] : translations.fr
  }), [language, mounted, setLanguage])

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

export function useT() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useT must be used within a LanguageProvider')
  }
  return context.t
}
