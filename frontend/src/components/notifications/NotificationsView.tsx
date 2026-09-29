'use client'
import { BellIcon } from 'lucide-react'
import EmptyState from '@/components/ui/EmptyState'
import MarkAllReadButton from '@/components/shared/MarkAllReadButton'
import { cn, timeAgo } from '@/lib/utils'
import { useLanguage, useT } from '@/components/shared/LanguageProvider'
import type { Notification } from '@/types'

interface Props {
  notifications: Notification[]
}

export default function NotificationsView({ notifications }: Props) {
  const t = useT()
  const { language } = useLanguage()
  const unread = notifications.filter(n => !n.is_read).length

  return (
    <div className="min-h-[100dvh] w-full page-enter bg-bg">
      <div className="w-full pb-24">
        <header className="mb-6 border-b border-white/15 bg-primary-dark px-4 pb-6 pt-8 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-xl font-bold text-white tracking-tight min-w-0 truncate">
              {t.notifications.title}
            </h1>
            {unread > 0 && <MarkAllReadButton />}
          </div>
          <p className="text-xs text-white/70 font-medium mt-1">
            {unread > 0
              ? `${unread} ${unread === 1 ? t.notifications.unread : t.notifications.unreadPlural}`
              : t.notifications.allRead}
          </p>
        </header>

        <div className="px-5 space-y-3">
          {notifications.length === 0 ? (
            <div className="py-20">
              <EmptyState
                icon={<BellIcon size={36} className="text-[#0E7490]/60" />}
                title={t.notifications.emptyTitle}
                description={t.notifications.emptyDescription}
              />
            </div>
          ) : (
            notifications.map(n => (
              <div
                key={n.id}
                className={cn(
                  'bg-card rounded-lg border p-4 transition-all',
                  n.is_read
                    ? 'border-border/40 opacity-80'
                    : 'border-primary/20 shadow-sm shadow-primary/5 bg-white dark:bg-slate-900',
                )}
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 mt-0.5 bg-[#E6FAF8] dark:bg-primary/15 border border-primary/15">
                    <BellIcon
                      size={16}
                      className="text-[#0E7490]"
                    />
                  </div>
                  <div className="flex-1 min-w-0 text-start">
                    <p className={cn('text-sm leading-snug', n.is_read ? 'font-medium text-muted' : 'font-bold text-text')}>
                      {n.title}
                    </p>
                    <p className="text-xs text-muted mt-1 leading-relaxed">{n.message}</p>
                    <p className="text-[10px] font-medium text-muted/60 mt-2 flex items-center gap-1 uppercase tracking-wider">
                      {timeAgo(n.created_at, language)}
                    </p>
                  </div>
                  {!n.is_read && (
                    <div className="w-2 h-2 rounded-full bg-[#0E7490] shrink-0 mt-2 ring-4 ring-primary/15" />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
