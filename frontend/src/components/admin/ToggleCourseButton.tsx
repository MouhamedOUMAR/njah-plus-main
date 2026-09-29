'use client'
import { useTransition } from 'react'
import { toggleCoursePublished } from '@/actions/courses'
import { useAdminT } from '@/components/admin/AdminI18n'

export default function ToggleCourseButton({ id, isPublished }: { id: string; isPublished: boolean }) {
  const [pending, start] = useTransition()
  const adminT = useAdminT()
  return (
    <button
      onClick={() => start(async () => {
        await toggleCoursePublished(id, isPublished)
      })}
      disabled={pending}
      className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
        isPublished
          ? 'bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20'
          : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
      }`}
    >
      {pending ? '...' : isPublished ? adminT('common.unpublish') : adminT('common.publish')}
    </button>
  )
}
