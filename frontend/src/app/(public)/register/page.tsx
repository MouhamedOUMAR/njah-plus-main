'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  UserIcon,
} from 'lucide-react'
import AuthAlert, { friendlyError } from '@/components/auth/AuthAlert'
import PasswordField from '@/components/auth/PasswordField'
import PhoneField from '@/components/auth/PhoneField'
import Button from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

type Step = 1 | 2 | 3 | 4

const STEPS: { number: Step; label: string }[] = [
  { number: 1, label: 'Téléphone' },
  { number: 2, label: 'Confirmation SMS' },
  { number: 3, label: 'Nom' },
  { number: 4, label: 'Mot de passe' },
]

function OtpInput({
  value,
  onChange,
  onComplete,
  disabled,
}: {
  value: string[]
  onChange: (value: string[]) => void
  onComplete: (code: string) => void
  disabled: boolean
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([])

  function commit(next: string[]) {
    onChange(next)
    const code = next.join('')
    if (code.length === 6 && !next.includes('')) onComplete(code)
  }

  function handleChange(index: number, raw: string) {
    if (!/^\d*$/.test(raw)) return
    const next = [...value]
    next[index] = raw.slice(-1)
    commit(next)
    if (raw && index < 5) refs.current[index + 1]?.focus()
  }

  function handleKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Backspace') return
    if (value[index]) {
      const next = [...value]
      next[index] = ''
      commit(next)
    } else if (index > 0) {
      refs.current[index - 1]?.focus()
    }
  }

  function handlePaste(event: React.ClipboardEvent<HTMLDivElement>) {
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pasted) return
    const next = Array(6).fill('')
    pasted.split('').forEach((digit, index) => { next[index] = digit })
    commit(next)
    refs.current[Math.min(pasted.length, 5)]?.focus()
    event.preventDefault()
  }

  return (
    <div className="grid grid-cols-6 gap-1.5" onPaste={handlePaste}>
      {value.map((digit, index) => (
        <input
          key={index}
          ref={element => { refs.current[index] = element }}
          value={digit}
          onChange={event => handleChange(index, event.target.value)}
          onKeyDown={event => handleKeyDown(index, event)}
          disabled={disabled}
          type="text"
          inputMode="numeric"
          maxLength={1}
          autoFocus={index === 0}
          aria-label={`Chiffre ${index + 1} du code`}
          className={cn(
            'h-12 min-w-0 rounded-lg border bg-white text-center text-lg font-extrabold text-[#111827] outline-none transition-colors',
            digit ? 'border-primary ring-2 ring-primary/10' : 'border-slate-300',
            'focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:opacity-50',
          )}
        />
      ))}
    </div>
  )
}

export default function RegisterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [step, setStep] = useState<Step>(1)
  const [phoneDigits, setPhoneDigits] = useState(searchParams.get('phone') ?? '')
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''))
  const [phoneVerifiedToken, setPhoneVerifiedToken] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const fullPhone = phoneDigits ? `222${phoneDigits}` : ''
  const displayPhone = phoneDigits.replace(/(\d{2})(?=\d)/g, '$1 ')

  useEffect(() => () => {
    if (countdownRef.current) clearInterval(countdownRef.current)
  }, [])

  function startCountdown() {
    if (countdownRef.current) clearInterval(countdownRef.current)
    setCountdown(60)
    countdownRef.current = setInterval(() => {
      setCountdown(current => {
        if (current <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current)
          countdownRef.current = null
          return 0
        }
        return current - 1
      })
    }, 1000)
  }

  function goBack() {
    setError('')
    if (step === 1) {
      router.push('/landing')
      return
    }
    setStep((step - 1) as Step)
  }

  function openCompletedStep(next: Step) {
    if (next >= step || loading) return
    setError('')
    setStep(next)
  }

  async function sendOtp() {
    if (!/^[234678]\d{7}$/.test(phoneDigits)) {
      setError('Numéro invalide. Exemple : 36 00 00 00')
      return
    }

    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fullPhone }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok || data?.error) {
        setError(friendlyError(data?.error || 'Erreur réseau'))
        return
      }

      setOtp(Array(6).fill(''))
      setPhoneVerifiedToken('')
      setStep(2)
      startCountdown()
    } finally {
      setLoading(false)
    }
  }

  async function verifyOtp(autoCode?: string) {
    const code = autoCode ?? otp.join('')
    if (code.length !== 6) {
      setError('Entre les 6 chiffres du code.')
      return
    }

    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fullPhone, code }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok || !data?.phone_verified_token) {
        setError(friendlyError(data?.error || 'Erreur lors de la vérification'))
        return
      }

      setPhoneVerifiedToken(data.phone_verified_token)
      setStep(3)
    } finally {
      setLoading(false)
    }
  }

  async function resendOtp() {
    if (countdown > 0) return
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fullPhone }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok || data?.error) {
        setError(friendlyError(data?.error || 'Erreur réseau'))
        return
      }
      setOtp(Array(6).fill(''))
      startCountdown()
    } finally {
      setLoading(false)
    }
  }

  function confirmName() {
    const trimmed = name.trim()
    if (trimmed.length < 3) {
      setError('Saisis ton prénom et ton nom.')
      return
    }
    if (!trimmed.includes(' ')) {
      setError('Saisis aussi ton nom de famille.')
      return
    }
    setError('')
    setStep(4)
  }

  async function finalizeRegistration() {
    if (!phoneVerifiedToken) {
      setError('Confirme d’abord ton numéro de téléphone.')
      setStep(2)
      return
    }
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 chiffres.')
      return
    }
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }

    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/auth/finalize-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_verified_token: phoneVerifiedToken,
          password,
          name: name.trim(),
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok || !data?.success || !data?.session) {
        setError(friendlyError(data?.error || 'Erreur de création de compte'))
        return
      }

      const { error: sessionError } = await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      })
      if (sessionError) {
        setError('Impossible d’établir la session. Réessaie.')
        return
      }

      const { data: profile } = await supabase.rpc('get_my_auth_status')
      const destination = (profile as { role?: string } | null)?.role === 'admin' ? '/admin' : '/dashboard'
      window.location.href = destination
    } catch {
      setError('Problème de connexion réseau. Vérifie internet et réessaie.')
    } finally {
      setLoading(false)
    }
  }

  function renderActiveStep(number: Step) {
    if (number === 1) {
      return (
        <div className="space-y-4">
          <PhoneField
            digits={phoneDigits}
            onChange={value => {
              setPhoneDigits(value)
              setPhoneVerifiedToken('')
              setError('')
            }}
            onEnter={sendOtp}
            disabled={loading}
            autoFocus
          />
          {error && <AuthAlert message={error} />}
          <Button fullWidth size="lg" loading={loading} onClick={sendOtp} className="rounded-lg font-extrabold">
            <span className="flex items-center gap-2">Suivant <ArrowRightIcon size={17} /></span>
          </Button>
        </div>
      )
    }

    if (number === 2) {
      return (
        <div className="space-y-4">
          <p className="text-xs font-medium text-slate-500">Code envoyé au +222 {displayPhone}</p>
          <OtpInput
            value={otp}
            onChange={value => { setOtp(value); setError('') }}
            onComplete={verifyOtp}
            disabled={loading}
          />
          <div className="flex items-center justify-between gap-3 text-xs">
            <button type="button" onClick={() => setStep(1)} className="font-bold text-slate-500">
              Modifier le numéro
            </button>
            {countdown > 0 ? (
              <span className="font-semibold tabular-nums text-slate-400">Renvoyer dans {countdown}s</span>
            ) : (
              <button type="button" onClick={resendOtp} disabled={loading} className="font-extrabold text-primary disabled:opacity-50">
                Renvoyer le code
              </button>
            )}
          </div>
          {error && <AuthAlert message={error} />}
          <Button fullWidth size="lg" loading={loading} onClick={() => verifyOtp()} className="rounded-lg font-extrabold">
            Confirmer
          </Button>
        </div>
      )
    }

    if (number === 3) {
      return (
        <div className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-[#111827]">Prénom et nom</span>
            <span className="flex overflow-hidden rounded-lg border border-slate-300 bg-white focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10">
              <span className="flex items-center border-r border-slate-200 px-3 text-slate-500">
                <UserIcon size={17} />
              </span>
              <input
                value={name}
                onChange={event => { setName(event.target.value); setError('') }}
                onKeyDown={event => { if (event.key === 'Enter') confirmName() }}
                type="text"
                autoComplete="name"
                autoFocus
                placeholder="Mohamed Ahmed"
                className="min-w-0 flex-1 bg-white px-3.5 py-3.5 text-base text-[#111827] outline-none placeholder:text-slate-400"
              />
            </span>
          </label>
          {error && <AuthAlert message={error} />}
          <Button fullWidth size="lg" onClick={confirmName} className="rounded-lg font-extrabold">
            <span className="flex items-center gap-2">Suivant <ArrowRightIcon size={17} /></span>
          </Button>
        </div>
      )
    }

    return (
      <div className="space-y-3">
        <PasswordField
          label="Mot de passe"
          value={password}
          onChange={value => { setPassword(value); setError('') }}
          placeholder="Minimum 8 chiffres"
          autoComplete="new-password"
          disabled={loading}
          autoFocus
        />
        <PasswordField
          label="Confirmer le mot de passe"
          value={confirmPassword}
          onChange={value => { setConfirmPassword(value); setError('') }}
          onEnter={finalizeRegistration}
          placeholder="Répète le mot de passe"
          autoComplete="new-password"
          disabled={loading}
        />
        {error && <AuthAlert message={error} />}
        <Button fullWidth size="lg" loading={loading} onClick={finalizeRegistration} className="rounded-lg font-extrabold">
          Créer mon compte
        </Button>
      </div>
    )
  }

  function summaryFor(number: Step) {
    if (number === 1) return `+222 ${displayPhone}`
    if (number === 2) return 'Numéro confirmé'
    if (number === 3) return name.trim()
    return ''
  }

  return (
    <main className="min-h-[100dvh] w-full bg-white text-[#111827]">
      <header className="flex items-center gap-3 px-5 pb-4 pt-[calc(1rem+env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={goBack}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-primary transition active:scale-90"
          aria-label="Retour"
        >
          <ArrowLeftIcon size={21} />
        </button>
        <h1 className="flex-1 text-lg font-extrabold">Inscription</h1>
        <Link href="/login" className="text-xs font-extrabold text-primary">Connexion</Link>
      </header>

      <div className="px-6 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-5">
        <div className="space-y-0">
          {STEPS.map(({ number, label }) => {
            const active = step === number
            const complete = step > number
            return (
              <section key={number} className="flex gap-3">
                <div className="flex w-8 shrink-0 flex-col items-center">
                  <button
                    type="button"
                    onClick={() => openCompletedStep(number)}
                    disabled={!complete || loading}
                    className={cn(
                      'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-extrabold transition-colors',
                      active && 'bg-primary text-white ring-4 ring-primary/10',
                      complete && 'bg-primary text-white',
                      !active && !complete && 'bg-slate-400 text-white',
                    )}
                    aria-label={`${label}, étape ${number}`}
                  >
                    {complete ? <CheckIcon size={14} strokeWidth={3} /> : number}
                  </button>
                  {number < 4 && (
                    <span className={cn('my-2 min-h-8 w-px flex-1', complete ? 'bg-primary' : 'bg-slate-300')} />
                  )}
                </div>

                <div className={cn('min-w-0 flex-1', number < 4 ? 'pb-6' : 'pb-2')}>
                  <button
                    type="button"
                    onClick={() => openCompletedStep(number)}
                    disabled={!complete || loading}
                    className="w-full text-start"
                  >
                    <span className={cn(
                      'block text-xl font-extrabold leading-7 transition-colors',
                      active ? 'text-[#111827]' : complete ? 'text-primary' : 'text-slate-400',
                    )}>
                      {label}
                    </span>
                    {complete && <span className="mt-0.5 block truncate text-xs font-semibold text-slate-500">{summaryFor(number)}</span>}
                  </button>

                  {active && (
                    <div className="mt-4 animate-slide-up">
                      {renderActiveStep(number)}
                    </div>
                  )}
                </div>
              </section>
            )
          })}
        </div>

        <p className="mt-7 text-center text-sm text-slate-500">
          Déjà inscrit ?{' '}
          <Link href="/login" className="font-extrabold text-primary">Se connecter</Link>
        </p>
      </div>
    </main>
  )
}
