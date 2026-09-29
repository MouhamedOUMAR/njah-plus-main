'use client'
import { useMemo, useState } from 'react'
import PageHeader from '@/components/layout/PageHeader'
import { useTheme } from '@/components/shared/ThemeProvider'
import { useLanguage, useT } from '@/components/shared/LanguageProvider'
import type { Language } from '@/lib/i18n'
import { SUPPORT_WHATSAPP_DISPLAY, SUPPORT_WHATSAPP_URL } from '@/constants'
import { 
  BellIcon, ShieldIcon, FileTextIcon, PhoneIcon, MailIcon, 
  ChevronRightIcon, GlobeIcon, MonitorIcon, MoonIcon, SunIcon, CheckIcon
} from 'lucide-react'

type Theme = 'system' | 'light' | 'dark'

const LANG_OPTIONS: { value: Language; code: string }[] = [
  { value: 'fr', code: 'FR' },
  { value: 'ar', code: 'AR' },
  { value: 'en', code: 'EN' },
]

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const { language, setLanguage } = useLanguage()
  const t = useT()
  
  const [showThemeModal, setShowThemeModal] = useState(false)
  const [showLangModal, setShowLangModal] = useState(false)

  const langOptions = useMemo(
    () => LANG_OPTIONS.map(option => ({
      ...option,
      label: t.settings.languageNames[option.value],
    })),
    [t],
  )

  const THEME_OPTIONS: { value: Theme; label: string; desc: string; icon: any }[] = useMemo(() => [
    { value: 'system', label: t.common.system, desc: '', icon: MonitorIcon },
    { value: 'light', label: t.common.light, desc: '', icon: SunIcon },
    { value: 'dark', label: t.common.dark, desc: '', icon: MoonIcon },
  ], [t])

  const currentThemeOpt = useMemo(
    () => THEME_OPTIONS.find(o => o.value === theme) ?? THEME_OPTIONS[0],
    [THEME_OPTIONS, theme],
  )
  const currentLangOpt = useMemo(
    () => langOptions.find(o => o.value === language) ?? langOptions[0],
    [language, langOptions],
  )
  const CurrentThemeIcon = currentThemeOpt.icon

  return (
    <div className="min-h-[100dvh] w-full page-enter bg-bg pb-10">
      <PageHeader title={t.settings.title} />
      
      <div className="mx-auto w-full max-w-3xl space-y-6 px-4 sm:px-6">
        {/* Notifications Section */}
        <section>
          <h2 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2 px-1">{t.settings.notifications}</h2>
          <div className="bg-card rounded-lg border border-border/50 divide-y divide-border/50 overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4">
              <div className="w-9 h-9 bg-[#E6FAF8] dark:bg-primary/15 rounded-xl flex items-center justify-center shrink-0 border border-primary/15">
                <BellIcon size={16} className="text-[#0E7490]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text">{t.settings.notifications}</p>
              </div>
              <div className="w-10 h-6 bg-primary rounded-full relative">
                <div className="absolute top-1 end-1 w-4 h-4 bg-white rounded-full shadow-sm" />
              </div>
            </div>
          </div>
        </section>

        {/* Appearance Section */}
        <section>
          <h2 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2 px-1">{t.settings.appearance}</h2>
          <div className="bg-card rounded-lg border border-border/50 divide-y divide-border/50 overflow-hidden">
            <button 
              onClick={() => setShowLangModal(true)}
              className="w-full flex items-center gap-3 px-5 py-4 text-start"
            >
              <div className="w-9 h-9 bg-[#E6FAF8] dark:bg-primary/15 rounded-xl flex items-center justify-center shrink-0 border border-primary/15">
                <GlobeIcon size={16} className="text-[#0E7490]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text">{t.settings.language}</p>
                <p className="text-xs text-muted">{currentLangOpt.label}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-muted">{currentLangOpt.code}</span>
                <ChevronRightIcon size={16} className="text-[#0E7490]/60 shrink-0 rtl:rotate-180" />
              </div>
            </button>
            <button
              className="w-full flex items-center gap-3 px-5 py-4 text-start"
              onClick={() => setShowThemeModal(true)}
            >
              <div className="w-9 h-9 bg-[#E6FAF8] dark:bg-primary/15 rounded-xl flex items-center justify-center shrink-0 border border-primary/15">
                <CurrentThemeIcon size={16} className="text-[#0E7490]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text">{t.settings.theme}</p>
                <p className="text-xs text-muted">{currentThemeOpt.label}</p>
              </div>
              <div className="flex items-center gap-2">
                <ChevronRightIcon size={16} className="text-[#0E7490]/60 shrink-0 rtl:rotate-180" />
              </div>
            </button>
          </div>
        </section>

        {/* Privacy Section */}
        <section>
          <h2 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2 px-1">{t.settings.privacy}</h2>
          <div className="bg-card rounded-lg border border-border/50 divide-y divide-border/50 overflow-hidden">
            {[
              { icon: ShieldIcon, label: t.settings.privacyPolicy },
              { icon: FileTextIcon, label: t.settings.termsOfUse },
            ].map((item) => (
              <button key={item.label} className="w-full flex items-center gap-3 px-5 py-4 text-start">
                <div className="w-9 h-9 bg-[#E6FAF8] dark:bg-primary/15 rounded-xl flex items-center justify-center shrink-0 border border-primary/15">
                  <item.icon size={16} className="text-[#0E7490]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text">{item.label}</p>
                </div>
                <ChevronRightIcon size={16} className="text-[#0E7490]/60 shrink-0 rtl:rotate-180" />
              </button>
            ))}
          </div>
        </section>

        {/* Support Section */}
        <section>
          <h2 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2 px-1">{t.settings.support}</h2>
          <div className="bg-card rounded-lg border border-border/50 divide-y divide-border/50 overflow-hidden">
            {[
              { icon: PhoneIcon, label: t.settings.contactWhatsapp, desc: `WhatsApp: ${SUPPORT_WHATSAPP_DISPLAY}`, href: SUPPORT_WHATSAPP_URL },
              { icon: MailIcon, label: t.settings.sendEmail, desc: 'support@najahplus.mr' },
            ].map((item) => {
              const content = (
                <>
                  <div className="w-9 h-9 bg-[#E6FAF8] dark:bg-primary/15 rounded-xl flex items-center justify-center shrink-0 border border-primary/15">
                    <item.icon size={16} className="text-[#0E7490]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text">{item.label}</p>
                    <p className="text-xs text-muted">{item.desc}</p>
                  </div>
                  <ChevronRightIcon size={16} className="text-[#0E7490]/60 shrink-0 rtl:rotate-180" />
                </>
              )

              const className = 'w-full flex items-center gap-3 px-5 py-4 text-start'

              return item.href ? (
                <a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer" className={className}>
                  {content}
                </a>
              ) : (
                <button key={item.label} type="button" className={className}>
                  {content}
                </button>
              )
            })}
          </div>
        </section>

      </div>

      {/* ── Theme Modal ──────────────────────────────────────────── */}
      {showThemeModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 dark:bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setShowThemeModal(false)}
        >
          <div
            className="w-[90vw] max-w-md max-h-[85vh] overflow-y-auto rounded-lg bg-card text-text border border-border p-6 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-6" />
            <h2 className="text-base font-bold text-text mb-4">{t.settings.chooseTheme}</h2>
            <div className="space-y-3">
              {THEME_OPTIONS.map(({ value, label, icon: Icon }) => {
                const selected = theme === value
                return (
                  <button
                    key={value}
                    className={`w-full flex items-center gap-4 px-4 py-4 rounded-lg border transition-all ${
                      selected
                        ? 'border-primary/25 bg-[#E6FAF8] dark:bg-primary/15'
                        : 'border-border/50 bg-bg active:scale-[0.98]'
                    }`}
                    onClick={() => { setTheme(value); setShowThemeModal(false) }}
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-[#E6FAF8] dark:bg-primary/15 text-[#0E7490] border border-primary/15">
                      <Icon size={18} />
                    </div>
                    <div className="flex-1 text-start">
                      <p className={`text-sm font-semibold ${selected ? 'text-[#0E7490]' : 'text-text'}`}>{label}</p>
                    </div>
                    {selected && <CheckIcon size={18} className="text-[#0E7490] shrink-0" />}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Language Modal ───────────────────────────────────────── */}
      {showLangModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 dark:bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setShowLangModal(false)}
        >
          <div
            className="w-[90vw] max-w-md max-h-[85vh] overflow-y-auto rounded-lg bg-card text-text border border-border p-6 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-6" />
            <h2 className="text-base font-bold text-text mb-4">{t.settings.chooseLanguage}</h2>
            <div className="space-y-3">
              {langOptions.map(({ value, label, code }) => {
                const selected = language === value
                return (
                  <button
                    key={value}
                    className={`w-full flex items-center gap-4 px-4 py-4 rounded-lg border transition-all ${
                      selected
                        ? 'border-primary/25 bg-[#E6FAF8] dark:bg-primary/15'
                        : 'border-border/50 bg-bg active:scale-[0.98]'
                    }`}
                    onClick={() => { setLanguage(value); setShowLangModal(false) }}
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-[#E6FAF8] dark:bg-primary/15 text-[#0E7490] border border-primary/15">
                      <GlobeIcon size={18} />
                    </div>
                    <div className="flex-1 text-start">
                      <p className={`text-sm font-semibold ${selected ? 'text-[#0E7490]' : 'text-text'}`}>{label}</p>
                      <p className="text-xs text-muted">{code}</p>
                    </div>
                    {selected && <CheckIcon size={18} className="text-[#0E7490] shrink-0" />}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
