interface Props {
  label: string
  index?: number
}

export default function SectionHeader({ label, index = 0 }: Props) {
  return (
    <div
      className="flex items-center gap-3 mb-4"
      style={{
        animation: `nmFadeSlideUp 0.2s ease-out ${Math.min(index, 5) * 30}ms both`,
      }}
    >
      <span className="text-[11px] font-bold text-muted uppercase tracking-widest">
        {label}
      </span>
      <div className="flex-1 h-px bg-border/40" />
    </div>
  )
}

