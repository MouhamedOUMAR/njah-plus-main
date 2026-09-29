'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronLeftIcon,
  AlertCircleIcon,
  CheckCircle2Icon,
  IdCardIcon,
  PhoneIcon,
  ShieldCheckIcon,
  type LucideIcon,
} from 'lucide-react'
import IconBox from '@/components/ui/IconBox'
import { useT } from '@/components/shared/LanguageProvider'
import { createClient } from '@/lib/supabase/client'
import { formatPhone } from '@/lib/utils'
import type { Profile } from '@/types'

function DataRow({
  icon,
  label,
  value,
  hint,
}: {
  icon: LucideIcon
  label: string
  value: string
  hint?: string
}) {
  return (
    <div className="flex items-start gap-3 px-5 py-4">
      <IconBox icon={icon} variant="soft" size="sm" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold uppercase tracking-wider text-muted">{label}</p>
        <p className="mt-1 break-words text-sm font-semibold text-text">{value}</p>
        {hint && <p className="mt-1 text-xs font-medium leading-relaxed text-muted">{hint}</p>}
      </div>
    </div>
  )
}

export default function PersonalDataView({ profile }: { profile: Profile }) {
  const router = useRouter()
  const t = useT()
  const [fullName, setFullName] = useState(profile.full_name ?? '')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [failed, setFailed] = useState(false)

  async function saveFullName() {
    setSaving(true)
    setMessage('')
    setFailed(false)

    const safeName = fullName.trim()
    if (safeName.length < 2 || safeName.length > 120) {
      setMessage(t.profile.invalidName)
      setFailed(true)
      setSaving(false)
      return
    }

    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: safeName })
      .eq('id', profile.id)

    setSaving(false)
    if (error) {
      setMessage(t.profile.updateFailed)
      setFailed(true)
      return
    }

    setFullName(safeName)
    setMessage(t.securityPage.informationSaved)
    router.refresh()
    setTimeout(() => setMessage(''), 2500)
  }

  return (
    <div className="min-h-[100dvh] w-full page-enter bg-bg text-text pb-[calc(7rem+env(safe-area-inset-bottom))]">
      <div className="mx-auto min-h-[100dvh] w-full max-w-lg">
        <header className="sticky top-0 z-40 border-b border-border/10 bg-bg/80 px-5 py-5 backdrop-blur-md">
          <div className="relative flex min-h-10 items-center justify-center">
            <button
              type="button"
              onClick={() => router.back()}
              className="absolute left-0 active:scale-90 transition-transform"
              aria-label={t.common.back}
            >
              <IconBox icon={ChevronLeftIcon} variant="white" size="sm" iconClassName="rtl:rotate-180" />
            </button>
            <h1 className="max-w-[70%] truncate text-center text-[18px] font-bold tracking-tight text-text">
              {t.securityPage.personalInformation}
            </h1>
          </div>
        </header>

        <main className="space-y-6 px-5 py-6">
          <section>
            <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted">
              {t.securityPage.personalInformation}
            </h2>
            <div className="overflow-hidden rounded-lg border border-border/50 bg-card shadow-sm shadow-black/5 divide-y divide-border/50">
              <div className="px-5 py-4">
                <label className="text-xs font-bold uppercase tracking-wider text-muted">
                  {t.securityPage.fullName}
                </label>
                <div className="mt-3 flex gap-3">
                  <input
                    value={fullName}
                    onChange={event => setFullName(event.target.value)}
                    maxLength={120}
                    className="min-w-0 flex-1 rounded-lg border border-border bg-bg px-4 py-3.5 text-sm font-semibold text-text outline-none transition-all placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/10"
                    placeholder={t.profile.fullNamePlaceholder}
                  />
                  <button
                    type="button"
                    onClick={saveFullName}
                    disabled={saving}
                    className="shrink-0 rounded-lg bg-primary px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-transform active:scale-95 disabled:opacity-60"
                  >
                    {saving ? '...' : t.securityPage.saveInformation}
                  </button>
                </div>
                {message && (
                  <p className={`mt-3 flex items-center gap-2 text-xs font-semibold ${failed ? 'text-danger' : 'text-green-600 dark:text-green-400'}`}>
                    {failed ? <AlertCircleIcon size={14} /> : <CheckCircle2Icon size={14} />}
                    {message}
                  </p>
                )}
              </div>

              <DataRow
                icon={PhoneIcon}
                label={t.securityPage.phoneNumber}
                value={formatPhone(profile.phone ?? '')}
                hint={t.securityPage.phoneChangeLater}
              />
              <DataRow
                icon={ShieldCheckIcon}
                label={t.securityPage.accountStatus}
                value={profile.is_active ? t.securityPage.active : t.securityPage.inactive}
              />
              <DataRow
                icon={IdCardIcon}
                label={t.securityPage.role}
                value={profile.role === 'student' ? t.securityPage.student : profile.role}
              />
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
