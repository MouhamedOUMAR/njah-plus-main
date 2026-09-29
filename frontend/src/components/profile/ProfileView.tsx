'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronLeftIcon, ChevronRightIcon,
  BellIcon, UserRoundPenIcon, GraduationCapIcon,
  LifeBuoyIcon, LogOutIcon, ShieldCheckIcon, SlidersHorizontalIcon,
  type LucideIcon,
} from 'lucide-react'
import Avatar from '@/components/ui/Avatar'
import IconBox from '@/components/ui/IconBox'
import ProfileEditForm from '@/components/shared/ProfileEditForm'
import { formatPhone } from '@/lib/utils'
import type { Profile } from '@/types'
import { useT } from '@/components/shared/LanguageProvider'

interface Props { profile: Profile }

type MenuItem = {
  icon: LucideIcon
  label: string
  danger?: boolean
} & ({ href: string; onClick?: never } | { onClick: () => void; href?: never })

export default function ProfileView({ profile }: Props) {
  const router = useRouter()
  const [showEdit,   setShowEdit]   = useState(false)
  const [showModal,  setShowModal]  = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const t = useT()

  async function confirmLogout() {
    setLoggingOut(true)
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/landing'
  }

  const MENU: MenuItem[] = [
    { icon: UserRoundPenIcon, label: t.profile.editProfile, onClick: () => setShowEdit(v => !v) },
    { icon: ShieldCheckIcon, label: t.profile.security,    href: '/settings/security' },
    { icon: SlidersHorizontalIcon, label: t.profile.settings, href: '/settings' },
    { icon: LifeBuoyIcon,    label: t.profile.helpSupport, href: '/help' },
    { icon: LogOutIcon,      label: t.profile.logout,      onClick: () => setShowModal(true), danger: true },
  ]

  return (
    <div className="min-h-[100dvh] w-full page-enter overflow-x-hidden bg-bg">
      <div className="flex min-h-[100dvh] w-full flex-col">

        {/* ── Scrollable body ──────────────────────────────────── */}
        <div className="flex-1 pb-24">

          {/* ── Header ──────────────────────────────── */}
          <header className="bg-primary-dark px-4 pb-16 pt-[calc(1rem+env(safe-area-inset-top))] text-white">
            <div className="flex items-center justify-between">
              <button
                onClick={() => router.back()}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/10 transition-transform active:scale-90"
                aria-label={t.common.back}
              >
                <ChevronLeftIcon size={20} className="text-white rtl:rotate-180" />
              </button>

              <span className="text-lg font-bold text-white">{t.nav.profile}</span>

              <Link
                href="/notifications"
                prefetch
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/10 transition-transform active:scale-90"
                aria-label={t.common.notifications}
              >
                <BellIcon size={18} className="text-white" />
              </Link>
            </div>

            <div className="mt-6 flex items-center gap-5">
              <div className="rounded-full bg-white p-1.5 shadow-lg shadow-black/15 ring-2 ring-white/25">
                <Avatar name={profile.full_name} src={profile.avatar_url} size="2xl" fallback="profile-icon" />
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-xl font-bold leading-tight text-white">
                  {profile.full_name ?? t.profile.studentFallback}
                </h2>
                <p className="mt-1 text-sm font-medium text-white/65">
                  {formatPhone(profile.phone ?? '')}
                </p>
              </div>
            </div>
          </header>

          {/* ── Profile Content Card (Overlapping) ────────────────────── */}
          <div className="relative z-10 -mt-8 px-4">
            <div className="rounded-lg border border-border/70 bg-card p-4 shadow-sm">
              {/* Edit form (collapsible) */}
              {showEdit && (
                <div className="mb-4 animate-slide-up border-b border-border/40 pb-4 text-left">
                  <ProfileEditForm profile={profile} />
                </div>
              )}

              {/* Menu items */}
              <div className="space-y-1">
                {MENU.map(item => {
                  const { icon: Icon, label, danger } = item

                  const content = (
                    <div className="group flex min-h-14 cursor-pointer items-center gap-3 py-2.5 transition-all active:scale-[0.98]">
                      <IconBox 
                        icon={Icon} 
                        variant={danger ? 'danger' : 'soft'} 
                        size="md"
                        shape="circle"
                        className="shadow-[0_3px_10px_rgba(14,116,144,0.05)]"
                      />
                      <span className={`flex-1 text-start text-[14px] font-bold ${danger ? 'text-danger' : 'text-text'}`}>
                        {label}
                      </span>
                      <ChevronRightIcon size={18} className="text-[#0E7490]/50 shrink-0 group-hover:ltr:translate-x-1 group-hover:rtl:-translate-x-1 transition-transform rtl:rotate-180" />
                    </div>
                  )

                  if (item.href) {
                    return (
                      <Link key={label} href={item.href} prefetch={item.href !== '/settings/security'} className="block border-b border-border/30 last:border-0">
                        {content}
                      </Link>
                    )
                  }

                  return (
                    <button key={label} onClick={item.onClick} className="w-full border-b border-border/30 last:border-0">
                      {content}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* ── Secondary Info Card (Subscription) ────────────────────────── */}
          <div className="mx-4 mt-4 rounded-lg border border-border/70 bg-card p-4 shadow-sm">
            <h3 className="text-[13px] font-bold text-muted uppercase tracking-[0.15em] mb-4 px-1">{t.profile.subscription}</h3>
            {profile.subscription_status === 'active' ? (
              <div className="flex items-center gap-4 rounded-lg border border-primary/15 bg-[#E6FAF8] p-4 dark:bg-primary/15">
                <IconBox icon={GraduationCapIcon} variant="primary" size="sm" fill />
                <div className="flex-1">
                  <p className="text-[15px] font-bold text-[#0E7490] tracking-tight">{t.profile.unlimitedAccess}</p>
                  <p className="text-[11px] font-bold text-muted mt-0.5 uppercase tracking-wider">
                    {profile.subscription_plan === 'monthly' ? t.profile.monthly :
                     profile.subscription_plan === '3_months' ? t.profile.quarterly :
                     profile.subscription_plan === 'yearly' ? t.profile.yearly : t.profile.standard}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4 rounded-lg border border-amber-500/10 bg-amber-50/50 p-4 dark:bg-amber-500/10">
                <IconBox icon={ShieldCheckIcon} variant="warning" size="sm" />
                <div className="flex-1 text-start">
                  <p className="text-[15px] font-bold text-amber-700 dark:text-amber-400 tracking-tight">{t.profile.nonSubscribed}</p>
                  <p className="text-[11px] font-bold text-amber-600/70 dark:text-amber-400/70 mt-0.5 uppercase tracking-wider">
                    {t.profile.standardAccount}
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ── Logout confirmation modal ───────────────────────────────────── */}
      {showModal && (
        <div
          className="fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] top-0 z-40 flex items-end justify-center bg-black/45 backdrop-blur-sm animate-fade-in"
          onClick={() => !loggingOut && setShowModal(false)}
        >
          <div
            className="w-full max-w-md rounded-t-lg bg-card p-5 pb-6 shadow-[0_-18px_45px_rgba(0,0,0,0.18)] animate-slide-up"
            onClick={event => event.stopPropagation()}
          >
            <div className="mb-4 flex justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-light dark:bg-primary/15">
                <LogOutIcon size={23} className="text-primary rtl:rotate-180" />
              </div>
            </div>

            <h3 className="text-center text-lg font-bold text-text">{t.profile.logoutTitle}</h3>
            <p className="mt-2 px-4 text-center text-sm font-medium leading-relaxed text-muted">
              {t.profile.logoutConfirm}
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowModal(false)}
                disabled={loggingOut}
                className="w-full rounded-lg border border-border/60 bg-bg py-3.5 text-sm font-bold text-muted transition-all active:scale-95 disabled:opacity-40"
              >
                {t.common.cancel}
              </button>
              <button
                onClick={confirmLogout}
                disabled={loggingOut}
                className="w-full rounded-lg bg-primary py-3.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-60"
              >
                {loggingOut ? t.profile.loggingOut : t.profile.logoutConfirmAction}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
