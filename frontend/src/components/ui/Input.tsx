'use client'
import { cn } from '@/lib/utils'
import { forwardRef, type InputHTMLAttributes } from 'react'

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label?: string
  error?: string
  prefix?: React.ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, prefix, ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-text">{label}</label>}
      <div className="relative">
        {prefix && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted">{prefix}</span>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3.5 text-base text-[#111827] dark:text-white placeholder:text-gray-500 dark:placeholder:text-slate-400 outline-none transition-all',
            'focus:border-primary focus:ring-2 focus:ring-primary/10',
            error && 'border-danger focus:border-danger focus:ring-danger/10',
            prefix && 'pl-14',
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  )
)
Input.displayName = 'Input'
export default Input
