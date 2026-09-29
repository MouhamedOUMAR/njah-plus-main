'use client'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface IconBoxProps {
  icon: LucideIcon
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral' | 'soft' | 'white' | 'ghost'
  size?: 'sm' | 'md' | 'lg' | 'xs'
  shape?: 'rounded' | 'circle'
  className?: string
  iconClassName?: string
  fill?: boolean
}

export default function IconBox({
  icon: Icon,
  variant = 'primary',
  size = 'md',
  shape = 'rounded',
  className,
  iconClassName,
  fill = false
}: IconBoxProps) {
  
  const sizeStyles = {
    xs: 'w-8 h-8',
    sm: 'w-10 h-10',
    md: 'w-12 h-12',
    lg: 'w-14 h-14'
  }

  const roundedStyles = {
    xs: 'rounded-lg',
    sm: 'rounded-xl',
    md: 'rounded-lg',
    lg: 'rounded-lg'
  }

  const iconSizes = {
    xs: 16,
    sm: 18,
    md: 22,
    lg: 26
  }

  const variantStyles = {
    primary: 'bg-[#E6FAF8] dark:bg-primary/15 text-[#0E7490] border border-primary/15',
    success: 'bg-green-50 dark:bg-green-500/10 text-green-600 border border-green-500/10',
    warning: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 border border-amber-500/10',
    danger: 'bg-red-50 dark:bg-red-500/10 text-red-500 border border-red-500/10',
    neutral: 'bg-slate-100 dark:bg-slate-700/60 text-slate-500 dark:text-slate-300 border border-slate-200 dark:border-slate-600',
    soft: 'bg-[#E6FAF8] dark:bg-primary/15 text-[#0E7490] border border-primary/15',
    white: 'bg-white dark:bg-slate-900 text-[#0E7490] shadow-sm border border-border/50',
    ghost: 'bg-transparent text-[#0E7490]'
  }

  return (
    <div className={cn(
      'flex items-center justify-center shrink-0 transition-all duration-300',
      sizeStyles[size],
      shape === 'circle' ? 'rounded-full' : roundedStyles[size],
      variantStyles[variant],
      className
    )}>
      <Icon 
        size={iconSizes[size]} 
        className={cn(
          fill && 'fill-current [fill-opacity:0.14]',
          iconClassName,
        )} 
        strokeWidth={2.5}
      />
    </div>
  )
}
