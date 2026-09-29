'use client'

import { useState, type FormEvent, type ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  LockIcon,
  ShieldCheckIcon,
  SmartphoneIcon,
  Trash2Icon,
  UserIcon,
  XIcon,
  type LucideIcon,
} from 'lucide-react'
import IconBox from '@/components/ui/IconBox'
import { useT } from '@/components/shared/LanguageProvider'
import { cn } from '@/lib/utils'

type RowVariant = 'primary' | 'success' | 'danger'

interface SecurityRowProps {
  icon: LucideIcon
  title: string
  subtitle: string
  variant?: RowVariant
  badge?: string
  href?: string
  onClick?: () => void
}

function SecurityRow({
  icon: Icon,
  title,
  subtitle,
  variant = 'primary',
  badge,
  href,
  onClick,
}: SecurityRowProps) {
  const iconVariant = variant === 'danger' ? 'danger' : variant === 'success' ? 'success' : 'soft'
  const isAction = Boolean(href || onClick)

  const content = (
    <>
      <IconBox icon={Icon} variant={iconVariant} size="sm" />
      <div className="min-w-0 flex-1">
        <p className={cn('text-sm font-semibold text-text', variant === 'danger' && 'text-red-500')}>
          {title}
        </p>
        <p className="mt-0.5 text-xs font-medium leading-relaxed text-muted">{subtitle}</p>
      </div>
      {badge && (
        <span className="shrink-0 rounded-full border border-green-500/10 bg-green-50 px-3 py-1 text-[11px] font-bold text-green-600 dark:bg-green-500/10 dark:text-green-400">
          {badge}
        </span>
      )}
      {isAction && (
        <ChevronRightIcon
          size={18}
          className={cn(
            'shrink-0 text-[#0E7490]/60 transition-transform rtl:rotate-180',
            variant === 'danger' && 'text-red-500/70',
          )}
        />
      )}
    </>
  )

  const className = 'flex w-full items-center gap-3 px-5 py-4 text-start transition-colors active:bg-bg/70'

  if (href) {
    return (
      <Link href={href} prefetch className={className}>
        {content}
      </Link>
    )
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {content}
      </button>
    )
  }

  return <div className="flex w-full items-center gap-3 px-5 py-4 text-start">{content}</div>
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted">{title}</h2>
      <div className="overflow-hidden rounded-lg border border-border/50 bg-card shadow-sm shadow-black/5 divide-y divide-border/50">
        {children}
      </div>
    </section>
  )
}

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

export default function SecurityPage() {
  const router = useRouter()
  const t = useT()
  const [modal, setModal] = useState<'password' | 'devices' | 'delete' | null>(null)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false)
  const [deleteRequested, setDeleteRequested] = useState(false)

  function closeModal() {
    setModal(null)
    setPasswordError('')
    setPasswordSuccess('')
    setDeleteRequested(false)
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')

    if (!currentPassword) {
      setPasswordError(t.securityPage.currentPasswordRequired)
      return
    }

    if (newPassword.length < 8) {
      setPasswordError(t.securityPage.newPasswordTooShort)
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(t.securityPage.passwordsDoNotMatch)
      return
    }

    setIsSubmittingPassword(true)
    try {
      const response = await fetch('/api/account/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data?.success) {
        setPasswordError(
          data?.error === 'invalid_current_password'
            ? t.securityPage.currentPasswordInvalid
            : t.securityPage.passwordUpdateFailed,
        )
        return
      }

      setPasswordSuccess(t.securityPage.passwordUpdated)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch {
      setPasswordError(t.securityPage.passwordUpdateFailed)
    } finally {
      setIsSubmittingPassword(false)
    }
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
              {t.securityPage.title}
            </h1>
          </div>
        </header>

        <main className="space-y-6 px-5 py-6">
          <Section title={t.securityPage.account}>
            <SecurityRow
              icon={LockIcon}
              title={t.securityPage.password}
              subtitle={t.securityPage.passwordSubtitle}
              onClick={() => setModal('password')}
            />
          </Section>

          <Section title={t.securityPage.login}>
            <SecurityRow
              icon={SmartphoneIcon}
              title={t.securityPage.connectedDevices}
              subtitle={t.securityPage.connectedDevicesSubtitle}
              onClick={() => setModal('devices')}
            />
          </Section>

          <Section title={t.securityPage.protection}>
            <SecurityRow
              icon={ShieldCheckIcon}
              title={t.securityPage.accountProtection}
              subtitle={t.securityPage.accountProtected}
              variant="success"
              badge={t.securityPage.active}
            />
          </Section>

          <Section title={t.securityPage.privacy}>
            <SecurityRow
              icon={UserIcon}
              title={t.securityPage.personalData}
              subtitle={t.securityPage.personalDataSubtitle}
              href="/settings/security/personal-data"
            />
            <SecurityRow
              icon={Trash2Icon}
              title={t.securityPage.deleteAccount}
              subtitle={t.securityPage.deleteAccountSubtitle}
              variant="danger"
              onClick={() => setModal('delete')}
            />
          </Section>
        </main>
      </div>

      {modal === 'password' && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm dark:bg-black/60"
          onClick={closeModal}
        >
          <div
            className="w-[90vw] max-w-md max-h-[85vh] overflow-y-auto rounded-lg border border-border bg-card p-6 text-text shadow-2xl"
            onClick={event => event.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between gap-4">
              <IconBox icon={LockIcon} variant="soft" size="sm" />
              <button
                type="button"
                onClick={closeModal}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-bg text-muted transition-colors active:scale-95"
                aria-label={t.common.close}
              >
                <XIcon size={18} />
              </button>
            </div>
            <h2 className="text-lg font-bold text-text">{t.securityPage.changePassword}</h2>
            <form onSubmit={handlePasswordSubmit} className="mt-5 space-y-4">
              <PasswordInput
                label={t.securityPage.currentPassword}
                value={currentPassword}
                onChange={setCurrentPassword}
                autoComplete="current-password"
              />
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

              {passwordError && (
                <p className="rounded-lg border border-red-500/10 bg-red-50 px-4 py-3 text-sm font-semibold text-red-500 dark:bg-red-500/10">
                  {passwordError}
                </p>
              )}
              {passwordSuccess && (
                <p className="rounded-lg border border-green-500/10 bg-green-50 px-4 py-3 text-sm font-semibold text-green-600 dark:bg-green-500/10 dark:text-green-400">
                  {passwordSuccess}
                </p>
              )}

              <Link
                href="/forgot-password"
                className="inline-flex text-sm font-bold text-[#0E7490] transition-colors active:opacity-70"
              >
                {t.securityPage.forgotPassword}
              </Link>

              <button
                type="submit"
                disabled={isSubmittingPassword}
                className="w-full rounded-lg bg-primary px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-transform active:scale-95 disabled:opacity-60"
              >
                {t.securityPage.savePassword}
              </button>
            </form>
          </div>
        </div>
      )}

      {modal === 'devices' && (
        <InfoModal
          icon={SmartphoneIcon}
          title={t.securityPage.connectedDevices}
          message={t.securityPage.connectedDevicesSoon}
          closeLabel={t.common.close}
          onClose={closeModal}
        />
      )}

      {modal === 'delete' && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm dark:bg-black/60"
          onClick={closeModal}
        >
          <div
            className="w-[90vw] max-w-sm rounded-lg border border-border bg-card p-6 text-text shadow-2xl"
            onClick={event => event.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between gap-4">
              <IconBox icon={Trash2Icon} variant="danger" size="sm" />
              <button
                type="button"
                onClick={closeModal}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-bg text-muted transition-colors active:scale-95"
                aria-label={t.common.close}
              >
                <XIcon size={18} />
              </button>
            </div>
            <h2 className="text-lg font-bold text-text">{t.securityPage.deleteAccountTitle}</h2>
            <p className="mt-2 text-sm font-medium leading-relaxed text-muted">
              {deleteRequested ? t.securityPage.deletionRequestRecorded : t.securityPage.deleteAccountWarning}
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg border border-border bg-bg px-4 py-3.5 text-sm font-bold text-muted transition-transform active:scale-95"
              >
                {t.common.cancel}
              </button>
              <button
                type="button"
                onClick={() => setDeleteRequested(true)}
                className="rounded-lg bg-red-500 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-red-500/20 transition-transform active:scale-95"
              >
                {t.securityPage.requestDeletion}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function InfoModal({
  icon,
  title,
  message,
  closeLabel,
  onClose,
}: {
  icon: LucideIcon
  title: string
  message: string
  closeLabel: string
  onClose: () => void
}) {
  const Icon = icon

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm dark:bg-black/60"
      onClick={onClose}
    >
      <div
        className="w-[90vw] max-w-sm rounded-lg border border-border bg-card p-6 text-text shadow-2xl"
        onClick={event => event.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between gap-4">
          <IconBox icon={Icon} variant="soft" size="sm" />
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-bg text-muted transition-colors active:scale-95"
            aria-label={closeLabel}
          >
            <XIcon size={18} />
          </button>
        </div>
        <h2 className="text-lg font-bold text-text">{title}</h2>
        <p className="mt-2 text-sm font-medium leading-relaxed text-muted">{message}</p>
        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-lg bg-primary px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-transform active:scale-95"
        >
          {closeLabel}
        </button>
      </div>
    </div>
  )
}
