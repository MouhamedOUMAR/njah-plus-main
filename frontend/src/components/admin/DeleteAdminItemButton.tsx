'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2Icon } from 'lucide-react'
import { deleteCourse } from '@/actions/courses'
import { deleteLesson } from '@/actions/lessons'
import { useAdminT } from '@/components/admin/AdminI18n'

interface Props {
  id: string
  title: string
  kind: 'course' | 'lesson'
}

export default function DeleteAdminItemButton({ id, title, kind }: Props) {
  const router = useRouter()
  const adminT = useAdminT()
  const [pending, startTransition] = useTransition()
  const [failed, setFailed] = useState(false)
  const label = adminT('common.delete')

  function handleDelete() {
    const confirmation = adminT(kind === 'course' ? 'courses.deleteConfirm' : 'lessons.deleteConfirm')
    if (!window.confirm(`${confirmation}\n\n${title}`)) return

    setFailed(false)
    startTransition(async () => {
      const result = kind === 'course' ? await deleteCourse(id) : await deleteLesson(id)
      if (!result.success) {
        setFailed(true)
        return
      }
      router.refresh()
    })
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={pending}
      className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors disabled:opacity-50 ${failed ? 'bg-red-500 text-white' : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'}`}
      aria-label={label}
      title={failed ? adminT('common.error') : label}
    >
      {pending ? <span className="text-xs">...</span> : <Trash2Icon size={14} />}
    </button>
  )
}
