import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'blue' | 'green' | 'yellow' | 'red' | 'gray' | 'white'
  className?: string
}

const variants = {
  blue: 'bg-[#E6FAF8] dark:bg-primary/15 text-[#0E7490] border-primary/15',
  green: 'bg-green-50 dark:bg-green-500/10 text-green-600 border-green-500/10',
  yellow: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 border-amber-500/10',
  red: 'bg-red-50 dark:bg-red-500/10 text-red-500 border-red-500/10',
  gray: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
  white: 'bg-white/20 backdrop-blur-md text-white border-white/20',
}

export default function Badge({ children, variant = 'blue', className }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border', 
      variants[variant], 
      className
    )}>
      {children}
    </span>
  )
}

