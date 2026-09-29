'use client'
import { useRouter } from 'next/navigation'
import { ChevronLeftIcon } from 'lucide-react'
import { useT } from '@/components/shared/LanguageProvider'

interface LessonBackButtonProps {
  courseId?: string | null
}

export default function LessonBackButton({ courseId }: LessonBackButtonProps) {
  const router = useRouter()
  const t = useT()

  function handleBack() {
    if (window.history.length > 1) {
      router.back()
    } else {
      router.replace(courseId ? `/courses/${courseId}` : '/courses')
    }
  }

  return (
    <button
      onClick={handleBack}
      className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white shadow-sm transition-all duration-150 active:scale-95"
      aria-label={t.common.back}
    >
      <ChevronLeftIcon size={20} className="text-white rtl:rotate-180" />
    </button>
  )
}
