'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRightIcon, CheckCircle2Icon, ChevronLeftIcon, LockIcon, PhoneIcon, ShieldCheckIcon } from 'lucide-react'
import AppLogo from '@/components/brand/AppLogo'
import IconBox from '@/components/ui/IconBox'
import { useT } from '@/components/shared/LanguageProvider'

type ResetStep = 'phone' | 'code' | 'password' | 'done'

function PasswordInput({
  label,
  value,
  onChange,
  autoComplete,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  autoComplete: string
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-text">{label}</span>
      <input
        type="password"
        value={value}
        onChange={event => onChange(event.target.value)}
        autoComplete={autoComplete}
        className="mt-2 w-full rounded-lg border border-border bg-bg px-4 py-3.5 text-base font-semibold text-text outline-none transition-all placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/10"
      />
    </label>
  )
}

export default function ForgotPasswordPage() {
  const t = useT()
  const [step, setStep] = useState<ResetStep>('phone')
  const [phoneDigits, setPhoneDigits] = useState('')
  const [code, setCode] = useState('')
  const [phoneVerifiedToken, setPhoneVerifiedToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const fullPhone = phoneDigits ? `222${phoneDigits}` : ''

  function updatePhone(value: string) {
    setPhoneDigits(value.replace(/\D/g, '').slice(0, 8))
    setError('')
  }

  async function sendCode() {
    if (!/^[234678]\d{7}$/.test(phoneDigits)) {
      setError(t.securityPage.phoneInvalid)
      return
    }

    setLoading(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fullPhone }),
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok || data?.error) {
        setError(t.securityPage.resetFailed)
        return
      }

      setMessage(t.securityPage.otpSent)
      setStep('code')
    } catch {
      setError(t.securityPage.resetFailed)
    } finally {
      setLoading(false)
    }
  }

  async function verifyCode() {
    if (!/^\d{6}$/.test(code)) {
      setError(t.securityPage.codeRequired)
      return
    }

    setLoading(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fullPhone, code }),
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data?.phone_verified_token) {
        setError(t.securityPage.verificationFailed)
        return
      }

      setPhoneVerifiedToken(data.phone_verified_token)
      setStep('password')
    } catch {
      setError(t.securityPage.verificationFailed)
    } finally {
      setLoading(false)
    }
  }

  async function resetPassword() {
    if (newPassword.length < 8) {
      setError(t.securityPage.newPasswordTooShort)
      return
    }

    if (newPassword !== confirmPassword) {
      setError(t.securityPage.passwordsDoNotMatch)
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/account/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneVerifiedToken, newPassword }),
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data?.success) {
        setError(t.securityPage.resetFailed)
        return
      }

      setStep('done')
    } catch {
      setError(t.securityPage.resetFailed)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-[100dvh] w-full bg-bg px-4 py-[calc(1rem+env(safe-area-inset-top))] text-text sm:px-5 sm:py-[calc(1.25rem+env(safe-area-inset-top))]">
      <div className="mx-auto flex min-h-[calc(100dvh-2rem)] w-full max-w-md flex-col sm:min-h-[calc(100dvh-2.5rem)]">
        <div className="flex items-center justify-between">
          <Link
            href="/login"
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-card text-[#0E7490] shadow-sm active:scale-95"
            aria-label={t.common.back}
          >
            <ChevronLeftIcon size={20} className="rtl:rotate-180" />
          </Link>
          <span className="text-sm font-bold text-[#0E7490]">{t.securityPage.resetPassword}</span>
        </div>

        <div className="flex flex-1 flex-col justify-center py-8">
          <div className="mb-8 flex flex-col items-center text-center">
            <AppLogo size="lg" />
            <h1 className="mt-5 text-2xl font-black tracking-tight text-text">{t.securityPage.resetPassword}</h1>
          </div>

          <section className="rounded-lg border border-border bg-card p-6 shadow-xl shadow-black/5">
            {step === 'phone' && (
              <div className="space-y-5">
                <IconBox icon={PhoneIcon} variant="soft" size="lg" />
                <label className="block">
                  <span className="text-sm font-semibold text-text">{t.securityPage.phone}</span>
                  <div className="mt-2 flex overflow-hidden rounded-lg border border-border bg-bg focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10">
                    <div className="flex items-center gap-2 border-e border-border px-3">
                      <span className="rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold text-white">MR</span>
                      <span className="text-sm font-bold text-muted">+222</span>
                    </div>
                    <input
                      value={phoneDigits}
                      onChange={event => updatePhone(event.target.value)}
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel"
                      placeholder="36 00 00 00"
                      className="min-w-0 flex-1 bg-transparent px-4 py-3.5 text-base font-semibold text-text outline-none placeholder:text-muted"
                    />
                  </div>
                </label>
                <button
                  type="button"
                  onClick={sendCode}
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-4 text-sm font-bold text-white shadow-lg shadow-primary/20 active:scale-95 disabled:opacity-60"
                >
                  {t.securityPage.sendCode}
                  <ArrowRightIcon size={16} className="rtl:rotate-180" />
                </button>
              </div>
            )}

            {step === 'code' && (
              <div className="space-y-5">
                <IconBox icon={ShieldCheckIcon} variant="soft" size="lg" />
                <label className="block">
                  <span className="text-sm font-semibold text-text">{t.securityPage.verificationCode}</span>
                  <input
                    value={code}
                    onChange={event => {
                      setCode(event.target.value.replace(/\D/g, '').slice(0, 6))
                      setError('')
                    }}
                    type="tel"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="000000"
                    className="mt-2 w-full rounded-lg border border-border bg-bg px-4 py-3.5 text-center text-xl font-black tracking-[0.3em] text-text outline-none transition-all placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                </label>
                <button
                  type="button"
                  onClick={verifyCode}
                  disabled={loading}
                  className="w-full rounded-lg bg-primary px-4 py-4 text-sm font-bold text-white shadow-lg shadow-primary/20 active:scale-95 disabled:opacity-60"
                >
                  {t.securityPage.verifyCode}
                </button>
              </div>
            )}

            {step === 'password' && (
              <div className="space-y-5">
                <IconBox icon={LockIcon} variant="soft" size="lg" />
                <PasswordInput
                  label={t.securityPage.newPassword}
                  value={newPassword}
                  onChange={setNewPassword}
                  autoComplete="new-password"
                />
                <PasswordInput
                  label={t.securityPage.confirmPassword}
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={resetPassword}
                  disabled={loading}
                  className="w-full rounded-lg bg-primary px-4 py-4 text-sm font-bold text-white shadow-lg shadow-primary/20 active:scale-95 disabled:opacity-60"
                >
                  {t.securityPage.setNewPassword}
                </button>
              </div>
            )}

            {step === 'done' && (
              <div className="space-y-5 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-lg bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400">
                  <CheckCircle2Icon size={30} />
                </div>
                <p className="text-sm font-semibold text-text">{t.securityPage.resetSuccess}</p>
                <Link
                  href="/login"
                  className="flex w-full items-center justify-center rounded-lg bg-primary px-4 py-4 text-sm font-bold text-white shadow-lg shadow-primary/20 active:scale-95"
                >
                  {t.securityPage.backToLogin}
                </Link>
              </div>
            )}

            {message && step !== 'done' && (
              <p className="mt-5 rounded-lg border border-green-500/10 bg-green-50 px-4 py-3 text-sm font-semibold text-green-600 dark:bg-green-500/10 dark:text-green-400">
                {message}
              </p>
            )}
            {error && (
              <p className="mt-5 rounded-lg border border-red-500/10 bg-red-50 px-4 py-3 text-sm font-semibold text-red-500 dark:bg-red-500/10">
                {error}
              </p>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}
