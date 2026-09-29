import { ExternalLinkIcon, FileTextIcon, ImageIcon } from 'lucide-react'
import I18nText from '@/components/shared/I18nText'

interface Props {
  lessonId: string
  type: 'image' | 'pdf'
  name?: string | null
}

export default function LessonAttachment({ lessonId, type, name }: Props) {
  const href = `/api/lesson-attachment/${lessonId}`

  if (type === 'image') {
    return (
      <section className="overflow-hidden rounded-lg border border-border/70 bg-card shadow-sm">
        <div className="flex items-center gap-2 border-b border-border/50 px-4 py-3 text-xs font-bold text-text">
          <ImageIcon size={16} className="text-primary" />
          <I18nText path="lesson.lessonMaterial" />
        </div>
        <img
          src={href}
          alt={name || 'Image de la leçon'}
          className="max-h-[28rem] w-full bg-white object-contain"
          loading="lazy"
          decoding="async"
        />
      </section>
    )
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex min-h-20 items-center gap-3 rounded-lg border border-primary/15 bg-card p-4 shadow-sm transition active:scale-[0.99]"
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary dark:bg-primary/15">
        <FileTextIcon size={23} />
      </span>
      <span className="min-w-0 flex-1 text-start">
        <span className="block text-xs font-bold text-text"><I18nText path="lesson.lessonMaterial" /></span>
        <span className="mt-1 block truncate text-[11px] text-muted">{name || 'PDF'}</span>
      </span>
      <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-bold text-primary">
        <I18nText path="lesson.openPdf" />
        <ExternalLinkIcon size={13} />
      </span>
    </a>
  )
}
