'use client'
import { isValidElement, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import IconBox from '@/components/ui/IconBox'

interface Props {
  icon: any
  title: string
  subtitle?: string
  right?: ReactNode
  active?: boolean
  index?: number
  onClick?: () => void
  iconBg?: string
  iconShadow?: string
}

export function CardItem({
  icon: Icon,
  title,
  subtitle,
  right,
  active = false,
  index = 0,
  onClick,
  iconBg,
  iconShadow,
}: Props) {
  const customIconStyle = iconBg || iconShadow
    ? { backgroundColor: iconBg, boxShadow: iconShadow }
    : undefined
  const hasRenderedIcon = isValidElement(Icon)

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      className={cn(
        "flex items-center gap-4 rounded-lg p-4 cursor-pointer active:scale-[0.98] transition-all border shadow-sm group",
        active ? "bg-[#E6FAF8] dark:bg-primary/15 border-primary/25" : "bg-card border-border/40"
      )}
      style={{
        animation: `nmFadeSlideUp 0.22s ease-out ${Math.min(index, 6) * 35}ms both`,
      }}
    >
      {/* Icon */}
      {hasRenderedIcon ? (
        <div className={cn(
          "w-14 h-14 rounded-lg flex items-center justify-center shrink-0 border overflow-hidden",
          active
            ? "bg-[#E6FAF8] dark:bg-primary/15 text-[#0E7490] border-primary/15 shadow-lg shadow-primary/20"
            : "bg-[#E6FAF8] dark:bg-primary/15 text-[#0E7490] border-primary/15"
        )} style={customIconStyle}>
          {Icon}
        </div>
      ) : (
        <IconBox 
          icon={Icon} 
          variant={active ? 'primary' : 'soft'} 
          size="md" 
          fill={!active}
          className={active ? "shadow-lg shadow-primary/20" : ""}
        />
      )}

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-[15px] font-bold truncate leading-snug tracking-tight",
          active ? "text-[#0E7490]" : "text-text"
        )}>
          {title}
        </p>
        {subtitle && (
          <p className="text-[11px] font-bold text-muted mt-1 uppercase tracking-wider truncate">
            {subtitle}
          </p>
        )}
      </div>

      {/* Right slot */}
      {right && <div className="shrink-0 group-hover:ltr:translate-x-1 group-hover:rtl:-translate-x-1 transition-transform">{right}</div>}
    </div>
  )
}


