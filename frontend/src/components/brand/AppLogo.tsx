'use client'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { APP_ICON, APP_NAME } from '@/constants'

interface AppLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  withText?: boolean
  className?: string
  textClassName?: string
}

export default function AppLogo({
  size = 'md',
  withText = false,
  className,
  textClassName,
}: AppLogoProps) {
  const sizeMap = {
    sm: 32,
    md: 48,
    lg: 64,
    xl: 96,
    '2xl': 128
  }

  const dimension = sizeMap[size]

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className={cn(
        'relative flex items-center justify-center overflow-hidden rounded-xl',
        size === 'xl' || size === '2xl' ? 'rounded-lg' : 'rounded-xl'
      )} style={{ width: dimension, height: dimension }}>
        <Image
          src={APP_ICON}
          alt={`${APP_NAME} Logo`}
          fill
          sizes={`${dimension}px`}
          className="rounded-[inherit] object-cover"
          priority
        />
      </div>
      
      {withText && (
        <span className={cn(
          'font-extrabold text-slate-900',
          size === 'sm' && 'text-lg',
          size === 'md' && 'text-xl',
          size === 'lg' && 'text-2xl',
          size === 'xl' && 'text-4xl',
          size === '2xl' && 'text-5xl',
          textClassName
        )}>
          {APP_NAME}
        </span>
      )}
    </div>
  )
}
