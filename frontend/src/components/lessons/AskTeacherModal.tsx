'use client'
import { MessageCircleIcon, XIcon } from 'lucide-react'
import { useT } from '@/components/shared/LanguageProvider'
import { SUPPORT_WHATSAPP_URL } from '@/constants'

interface Props {
  onClose: () => void
  lessonTitle?: string
}

export default function AskTeacherModal({ onClose, lessonTitle }: Props) {
  const t = useT()
  const message = encodeURIComponent(
    `${t.lesson.askTeacherMessage} "${lessonTitle ?? t.lesson.fallbackLesson}" de najah+.`,
  )
  const whatsappHref = `${SUPPORT_WHATSAPP_URL}?text=${message}`

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/40 dark:bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-lg p-8 w-full max-w-sm shadow-[0_25px_60px_rgba(0,0,0,0.2)] animate-scale-in relative border border-border/30"
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-6 end-6 w-11 h-11 rounded-full bg-bg flex items-center justify-center text-muted/40 hover:text-text transition-all active:scale-90"
          aria-label={t.common.close}
        >
          <XIcon size={22} />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-green-50 dark:bg-green-500/10 flex items-center justify-center relative shadow-inner">
            <div className="absolute inset-0 rounded-full bg-green-100 dark:bg-green-500 animate-ping opacity-20" />
            <MessageCircleIcon size={35} className="text-green-600 relative z-10" />
          </div>
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-text text-center tracking-tight">
          {t.lesson.askTeacherTitle}
        </h3>
        <p className="text-[15px] text-muted text-center mt-3 leading-relaxed px-2 font-medium tracking-tight">
          {t.lesson.askTeacherDescription}
        </p>

        {/* CTA */}
        <div className="flex flex-col gap-3 mt-8">
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-4.5 rounded-lg bg-green-600 text-white font-bold text-[16px] text-center active:scale-95 transition-all flex items-center justify-center gap-2.5 shadow-xl shadow-green-500/20"
          >
            <MessageCircleIcon size={20} />
            {t.lesson.openWhatsapp}
          </a>
          <button
            onClick={onClose}
            className="w-full py-4.5 rounded-lg bg-bg text-muted font-bold text-[16px] active:scale-95 transition-all border border-border/40"
          >
            {t.common.cancel}
          </button>
        </div>
      </div>
    </div>
  )
}
