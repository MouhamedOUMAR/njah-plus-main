'use client'
import { SearchIcon, SlidersHorizontalIcon } from 'lucide-react'
import { useT } from '@/components/shared/LanguageProvider'

interface Props {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  onFilter?: () => void
}

export default function SearchBar({
  value,
  onChange,
  placeholder,
  onFilter,
}: Props) {
  const t = useT()
  
  return (
    <div className="flex items-center gap-3">
      {/* Input */}
      <div
        className="flex-1 flex items-center gap-4 bg-card rounded-lg px-5 py-4 border border-border/50 shadow-sm"
      >
        <SearchIcon size={18} className="text-[#0E7490] shrink-0" />
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder || t.common.search}
          className="flex-1 text-[15px] text-text placeholder:text-muted/40 outline-none bg-transparent font-medium tracking-tight text-start"
        />
      </div>

      {/* Filter button */}
      <button
        onClick={onFilter}
        className="w-14 h-14 rounded-lg bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shrink-0 active:scale-95 transition-all shadow-lg shadow-primary/20 border border-primary/10"
        aria-label={t.common.filter}
      >
        <SlidersHorizontalIcon size={20} className="text-white" />
      </button>
    </div>
  )
}


