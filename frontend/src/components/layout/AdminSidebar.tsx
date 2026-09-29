'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BarChart2Icon, BellIcon, BookOpenIcon, CreditCardIcon, LayoutDashboardIcon,
  LogOutIcon, NotebookPenIcon, UsersIcon, VideoIcon,
} from 'lucide-react'
import AppLogo from '@/components/brand/AppLogo'
import { AdminLanguageSelector, useAdminT } from '@/components/admin/AdminI18n'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/admin', labelKey: 'nav.dashboard', Icon: LayoutDashboardIcon, exact: true },
  { href: '/admin/students', labelKey: 'nav.students', Icon: UsersIcon },
  { href: '/admin/abonnements', labelKey: 'nav.subscriptions', Icon: CreditCardIcon },
  { href: '/admin/courses', labelKey: 'nav.courses', Icon: BookOpenIcon },
  { href: '/admin/lessons', labelKey: 'nav.lessons', Icon: VideoIcon },
  { href: '/admin/notes', labelKey: 'nav.notes', Icon: NotebookPenIcon },
  { href: '/admin/notifications', labelKey: 'nav.notifications', Icon: BellIcon },
  { href: '/admin/analytics', labelKey: 'nav.analytics', Icon: BarChart2Icon },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const adminT = useAdminT()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between border-b border-admin-border bg-admin-bg px-4 md:hidden">
        <AppLogo size="sm" withText textClassName="text-white" />
        <span className="rounded-lg border border-admin-border bg-admin-surface px-2.5 py-1 text-xs font-bold text-cyan-300">Admin</span>
      </header>

      <aside className="fixed inset-y-0 start-0 z-40 hidden w-60 flex-col border-e border-admin-border bg-admin-bg md:flex">
        <div className="flex h-20 items-center border-b border-admin-border px-5">
          <AppLogo size="sm" withText textClassName="text-white" />
          <span className="ms-auto rounded-lg bg-primary/15 px-2 py-1 text-[10px] font-bold uppercase text-cyan-300">Admin</span>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
          {NAV.map(({ href, labelKey, Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href)
            return (
              <Link key={href} href={href} className={cn(
                'flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors',
                active ? 'bg-primary text-white' : 'text-slate-400 hover:bg-admin-surface hover:text-white',
              )}>
                <Icon size={18} className="shrink-0" />
                <span>{adminT(labelKey)}</span>
              </Link>
            )
          })}
        </nav>
        <div className="border-t border-admin-border p-3">
          <AdminLanguageSelector />
          <button onClick={handleLogout} className="mt-2 flex h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-slate-400 transition-colors hover:bg-admin-surface hover:text-white">
            <LogOutIcon size={18} /> {adminT('nav.logout')}
          </button>
        </div>
      </aside>

      <footer className="fixed inset-x-0 bottom-0 z-50 border-t border-admin-border bg-admin-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <nav className="flex h-18 items-stretch gap-1 overflow-x-auto px-2 scrollbar-hide" aria-label="Navigation administration">
          {NAV.map(({ href, labelKey, Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href)
            return (
              <Link key={href} href={href} className={cn(
                'flex min-w-[68px] flex-col items-center justify-center gap-1 rounded-lg px-2 text-[9px] font-semibold transition-colors',
                active ? 'bg-primary text-white' : 'text-slate-400',
              )}>
                <Icon size={18} />
                <span className="max-w-full truncate">{adminT(labelKey)}</span>
              </Link>
            )
          })}
          <button onClick={handleLogout} className="flex min-w-[68px] flex-col items-center justify-center gap-1 rounded-lg px-2 text-[9px] font-semibold text-slate-400">
            <LogOutIcon size={18} />
            <span>{adminT('nav.logout')}</span>
          </button>
        </nav>
      </footer>
    </>
  )
}
