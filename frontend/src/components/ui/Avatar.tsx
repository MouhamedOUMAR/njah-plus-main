import { cn, getInitials } from '@/lib/utils'
import { UserRoundIcon } from 'lucide-react'

interface AvatarProps {
  name?: string | null
  src?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  className?: string
  fallback?: 'initials' | 'profile-icon'
}

const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-base', xl: 'w-20 h-20 text-xl', '2xl': 'w-28 h-28 text-3xl' }
const profileIconSizes = { sm: 16, md: 19, lg: 25, xl: 36, '2xl': 48 }
const badgeSizes = {
  sm: 'h-4 min-w-4 px-1 text-[7px]',
  md: 'h-5 min-w-5 px-1 text-[8px]',
  lg: 'h-6 min-w-6 px-1.5 text-[9px]',
  xl: 'h-7 min-w-7 px-1.5 text-[10px]',
  '2xl': 'h-8 min-w-8 px-2 text-[11px]',
}

export default function Avatar({ name, src, size = 'md', className, fallback = 'initials' }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name ?? ''}
        width={112}
        height={112}
        loading="lazy"
        decoding="async"
        className={cn('rounded-full object-cover', sizes[size], className)}
      />
    )
  }

  if (fallback === 'profile-icon') {
    const initials = getInitials(name ?? null)
    return (
      <div className={cn(
        'relative flex items-center justify-center rounded-full border border-primary/15 bg-[#E6FAF8] text-[#0E7490] shadow-inner dark:bg-primary/15',
        sizes[size],
        className,
      )}>
        <UserRoundIcon size={profileIconSizes[size]} strokeWidth={1.8} />
        {initials && (
          <span className={cn(
            'absolute -bottom-1 -right-1 flex items-center justify-center rounded-full border-2 border-white bg-primary font-extrabold leading-none text-white shadow-sm',
            badgeSizes[size],
          )}>
            {initials}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className={cn('rounded-full bg-[#E6FAF8] dark:bg-primary/15 text-[#0E7490] font-bold flex items-center justify-center', sizes[size], className)}>
      {getInitials(name ?? null)}
    </div>
  )
}
