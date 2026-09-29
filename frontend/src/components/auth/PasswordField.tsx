'use client'
import { useState } from 'react'
import { LockIcon, EyeIcon, EyeOffIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PasswordFieldProps {
  value:       string
  onChange:    (v: string) => void
  onEnter?:    () => void
  label?:      string
  placeholder?: string
  error?:      string
  autoFocus?:  boolean
  disabled?:   boolean
  autoComplete?: string
}

export default function PasswordField({
  value, onChange, onEnter, label, placeholder = '••••••••',
  error, autoFocus, disabled, autoComplete = 'current-password',
}: PasswordFieldProps) {
  const [show, setShow] = useState(false)

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-semibold text-[#111827]">{label}</label>
      )}
      <div
        className={cn(
          'flex items-stretch rounded-lg border bg-white overflow-hidden text-[#111827] transition-all duration-150',
          error
            ? 'border-danger ring-2 ring-danger/10'
            : 'border-slate-300 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10',
          disabled && 'opacity-50'
        )}
      >
        {/* Lock icon prefix */}
        <div className="flex items-center pl-3.5 pr-3 border-r border-slate-300 shrink-0 bg-white">
          <LockIcon size={16} className="text-slate-500" aria-hidden />
        </div>

        {/* Input */}
        <input
          type={show ? 'text' : 'password'}
          inputMode="numeric"
          pattern="[0-9]*"
          value={value}
          onChange={e => {
            const val = e.target.value.replace(/\D/g, '')
            onChange(val)
          }}
          onKeyDown={e => e.key === 'Enter' && onEnter?.()}
          disabled={disabled}
          autoFocus={autoFocus}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="flex-1 min-w-0 px-3.5 py-3.5 text-base text-[#111827] bg-white outline-none placeholder:text-slate-400 caret-primary"
        />


        {/* Show / hide toggle */}
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShow(s => !s)}
          disabled={disabled}
          aria-label={show ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          className="flex items-center px-3.5 text-slate-500 hover:text-[#111827] bg-white transition-colors disabled:pointer-events-none"
        >
          {show ? <EyeOffIcon size={16} aria-hidden /> : <EyeIcon size={16} aria-hidden />}
        </button>
      </div>

      {error && (
        <p className="text-sm text-danger px-0.5">{error}</p>
      )}
    </div>
  )
}
