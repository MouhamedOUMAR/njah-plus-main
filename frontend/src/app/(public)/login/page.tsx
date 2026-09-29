'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeftIcon, ArrowRightIcon, MessageCircleIcon, RefreshCwIcon,
} from 'lucide-react'
import Button from '@/components/ui/Button'
import AuthAlert, { friendlyError } from '@/components/auth/AuthAlert'
import PhoneField from '@/components/auth/PhoneField'
import PasswordField from '@/components/auth/PasswordField'
import TermsModal from '@/components/auth/TermsModal'
import AppLogo from '@/components/brand/AppLogo'
import { createClient } from '@/lib/supabase/client'
import { SUPPORT_WHATSAPP_URL } from '@/constants'

export default function LoginPage() {
  const phoneRef = useRef<HTMLInputElement>(null)
  const [phoneDigits, setPhoneDigits] = useState('')
  const [password, setPassword]       = useState('')
  const [error, setError]             = useState<string | null>(null)
  const [loading, setLoading]         = useState(false)
  const [showTerms, setShowTerms]     = useState(false)
  const supabase = createClient()

  const normalizedPhone = phoneDigits ? `222${phoneDigits}` : ''

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault()

    if (!/^[234678]\d{7}$/.test(phoneDigits)) {
      setError('Numero invalide. Exemple : 36 00 00 00')
      return
    }
    if (!password) {
      setError('Saisis ton code ou mot de passe.')
      return
    }

    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: normalizedPhone, password }),
      })

      const data = await res.json()

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || 'login_failed')
      }

      const session = data.session as { access_token: string; refresh_token: string } | null
      if (!session?.access_token || !session?.refresh_token) {
        throw new Error('login_failed')
      }

      const { error: sessionErr } = await supabase.auth.setSession({
        access_token:  session.access_token,
        refresh_token: session.refresh_token,
      })
      if (sessionErr) throw new Error(sessionErr.message)

      const { data: profile } = await supabase.rpc('get_my_auth_status')
      const dest = (profile as { role?: string } | null)?.role === 'admin' ? '/admin' : '/dashboard'
      window.location.href = dest
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'login_failed'
      if (msg === 'legacy_account_needs_reset') {
        window.location.href = `/register?phone=${encodeURIComponent(phoneDigits)}`
        return
      }
      setError(friendlyError(msg))
    } finally {
      setLoading(false)
    }
  }

  function changeAccount() {
    setPhoneDigits('')
    setPassword('')
    setError(null)
    window.setTimeout(() => phoneRef.current?.focus(), 0)
  }

  return (
    <main className="min-h-[100dvh] w-full overflow-x-hidden bg-primary-dark text-[#111827]">
      <section className="relative min-h-[36dvh] overflow-hidden">
        <img
          src="/najah-campus-hero.png"
          alt="Etudiants mauritaniens sur le campus"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-primary-dark/65" />

        <header className="relative z-10 flex items-center justify-between px-4 pt-[calc(1rem+env(safe-area-inset-top))]">
          <Link
            href="/landing"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white transition active:scale-95"
            aria-label="Retour"
          >
            <ArrowLeftIcon size={18} />
          </Link>
          <div className="rounded-lg bg-white px-3 py-2 shadow-lg">
            <AppLogo size="sm" withText textClassName="text-[#111827]" />
          </div>
          <a
            href={SUPPORT_WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white transition active:scale-95"
            aria-label="WhatsApp"
          >
            <MessageCircleIcon size={18} />
          </a>
        </header>

        <div className="absolute inset-x-0 bottom-0 z-10 px-5 pb-7 text-white">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-accent-warm">
            Connexion rapide
          </p>
          <h1 className="mt-2 max-w-xs text-3xl font-black leading-tight">
            Connecte-toi a najah+
          </h1>
          <p className="mt-2 max-w-sm text-sm font-medium leading-relaxed text-white/75">
            Reprends tes cours exactement la ou tu les as laisses.
          </p>
        </div>
      </section>

      <section className="flex min-h-[64dvh] flex-col bg-primary-dark px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-5">
        <div className="rounded-lg bg-white p-4 shadow-2xl shadow-black/20">
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <PhoneField
              ref={phoneRef}
              digits={phoneDigits}
              onChange={v => { setPhoneDigits(v); setError(null) }}
              onEnter={handleSubmit}
              autoFocus
              disabled={loading}
            />

            <PasswordField
              value={password}
              onChange={v => { setPassword(v); setError(null) }}
              onEnter={handleSubmit}
              label="Code / mot de passe"
              placeholder="Ton code"
              autoComplete="current-password"
              disabled={loading}
            />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <Link
                href="/forgot-password"
                className="text-xs font-extrabold text-primary transition active:opacity-70"
              >
                Code oublie ? Utiliser OTP
              </Link>
              <button
                type="button"
                onClick={changeAccount}
                disabled={loading}
                className="inline-flex items-center gap-1.5 text-xs font-extrabold text-slate-500 transition active:scale-95 disabled:opacity-50"
              >
                <RefreshCwIcon size={13} />
                Changer de compte
              </button>
            </div>

            {error && <AuthAlert message={error} />}

            <Button
              type="submit"
              fullWidth
              size="lg"
              loading={loading}
              className="min-h-13 rounded-lg text-base font-black"
            >
              <span className="flex items-center gap-2">
                Se connecter <ArrowRightIcon size={18} />
              </span>
            </Button>
          </form>

          <div className="my-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-[10px] font-bold text-slate-400">ou</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <Link
            href="/register"
            className="flex min-h-12 w-full items-center justify-center rounded-lg border border-primary/20 bg-primary-light text-sm font-extrabold text-primary-dark transition active:scale-[0.98]"
          >
            Creer un compte gratuit
          </Link>
        </div>

        <p className="mt-5 text-center text-[11px] font-medium leading-relaxed text-white/65">
          En continuant, tu acceptes nos{' '}
          <button
            type="button"
            onClick={() => setShowTerms(true)}
            className="font-extrabold text-white underline underline-offset-2"
          >
            conditions d'utilisation
          </button>
          .
        </p>
      </section>

      <TermsModal isOpen={showTerms} onClose={() => setShowTerms(false)} />
    </main>
  )
}
