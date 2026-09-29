'use client'

import { memo, useMemo } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { GraduationCapIcon, HomeIcon, UserIcon, type LucideIcon } from 'lucide-react'
import { useT } from '@/components/shared/LanguageProvider'
import { cn } from '@/lib/utils'

type NavKey = 'home' | 'courses' | 'profile'

const NAV_ITEMS: { href: string; labelKey: NavKey; Icon: LucideIcon }[] = [
  { href: '/dashboard', labelKey: 'home', Icon: HomeIcon },
  { href: '/courses', labelKey: 'courses', Icon: GraduationCapIcon },
  { href: '/profile', labelKey: 'profile', Icon: UserIcon },
]

function isActivePath(pathname: string, href: string) {
  return pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
}

function BottomNav() {
  const pathname = usePathname()
  const t = useT()
  const nav = useMemo(
    () => NAV_ITEMS.map(item => ({ ...item, label: t.nav[item.labelKey] })),
    [t],
  )

  return (
    <footer className="bottom-nav fixed bottom-0 left-1/2 z-50 w-full max-w-md -translate-x-1/2 border-x border-t border-border/70 bg-card/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur">
      <nav className="grid h-[4.5rem] w-full grid-cols-3 px-3" aria-label="Navigation principale">
        {nav.map(({ href, label, Icon }) => {
          const active = isActivePath(pathname, href)
          return (
            <Link
              key={href}
              href={href}
              prefetch
              aria-current={active ? 'page' : undefined}
              className={cn(
                'relative flex min-w-0 flex-col items-center justify-center gap-1 text-[10px] font-bold transition-colors',
                active ? 'text-primary' : 'text-muted',
              )}
            >
              <span className={cn(
                'flex h-9 w-12 items-center justify-center rounded-lg transition-colors',
                active && 'bg-primary text-white shadow-sm shadow-primary/25',
              )}>
                <Icon size={20} strokeWidth={active ? 2.5 : 2} />
              </span>
              <span className="max-w-full truncate px-1">{label}</span>
            </Link>
          )
        })}
      </nav>
    </footer>
  )
}

export default memo(BottomNav)
