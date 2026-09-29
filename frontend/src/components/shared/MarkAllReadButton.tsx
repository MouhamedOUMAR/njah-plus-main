'use client'
import { useTransition } from 'react'
import { markAllRead } from '@/actions/notifications'
import { useT } from '@/components/shared/LanguageProvider'

export default function MarkAllReadButton() {
  const [pending, startTransition] = useTransition()
  const t = useT()
  return (
    <button
      onClick={() => startTransition(() => markAllRead())}
      disabled={pending}
      className="text-xs font-semibold text-primary disabled:opacity-50"
    >
      {pending ? '…' : t.notifications.markAllRead}
    </button>
  )
}
