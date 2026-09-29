'use client'

import { useState, useTransition } from 'react'
import { sendNotificationToAll } from '@/actions/notifications'
import { useAdminT } from '@/components/admin/AdminI18n'

export default function AdminNotificationForm() {
  const adminT = useAdminT()
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  const [pending, start] = useTransition()

  function handleSend(event: React.FormEvent) {
    event.preventDefault()
    if (!title.trim() || !message.trim()) return
    start(async () => {
      await sendNotificationToAll(title, message)
      setSent(true)
      setTitle('')
      setMessage('')
      setTimeout(() => setSent(false), 3000)
    })
  }

  const field = 'w-full rounded-xl border border-admin-border bg-admin-bg text-white px-4 py-3 text-sm placeholder:text-slate-500 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary'

  return (
    <form onSubmit={handleSend} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-slate-400">{adminT('common.title')} *</label>
        <input
          value={title}
          onChange={event => setTitle(event.target.value)}
          placeholder={adminT('notifications.notificationTitle')}
          required
          className={field}
        />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-slate-400">{adminT('notifications.message')} *</label>
        <textarea
          value={message}
          onChange={event => setMessage(event.target.value)}
          placeholder={adminT('notifications.messageContent')}
          rows={4}
          required
          className={`${field} resize-none`}
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
      >
        {pending ? adminT('common.sending') : sent ? `✓ ${adminT('notifications.sentAll')}` : adminT('notifications.sendAll')}
      </button>
    </form>
  )
}
