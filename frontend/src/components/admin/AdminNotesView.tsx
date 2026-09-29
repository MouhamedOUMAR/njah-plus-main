'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { EyeIcon, NotebookPenIcon, SearchIcon, Trash2Icon, XIcon } from 'lucide-react'
import { adminDeleteNote } from '@/actions/notes'
import { formatPhone, timeAgo } from '@/lib/utils'
import { useAdminT } from '@/components/admin/AdminI18n'
import type { AdminNote } from '@/types'

interface Props {
  initialNotes: AdminNote[]
}

export default function AdminNotesView({ initialNotes }: Props) {
  const router = useRouter()
  const adminT = useAdminT()
  const [search, setSearch] = useState('')
  const [courseFilter, setCourseFilter] = useState('all')
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')
  const [selectedNote, setSelectedNote] = useState<AdminNote | null>(null)
  const [noteToDelete, setNoteToDelete] = useState<AdminNote | null>(null)
  const [isDeleting, startDelete] = useTransition()

  const courses = useMemo(() => {
    const set = new Set(initialNotes.map(note => note.course_title).filter(Boolean))
    return Array.from(set).sort()
  }, [initialNotes])

  const filteredNotes = useMemo(() => {
    const list = initialNotes.filter(note => {
      const query = search.toLowerCase()
      const matchesSearch = !query ||
        (note.student_name || '').toLowerCase().includes(query) ||
        (note.student_phone || '').includes(query) ||
        (note.lesson_title || '').toLowerCase().includes(query) ||
        (note.content || '').toLowerCase().includes(query)

      const matchesCourse = courseFilter === 'all' || note.course_title === courseFilter
      return matchesSearch && matchesCourse
    })

    return list.sort((a, b) => {
      const first = new Date(a.created_at).getTime()
      const second = new Date(b.created_at).getTime()
      return sortOrder === 'newest' ? second - first : first - second
    })
  }, [initialNotes, search, courseFilter, sortOrder])

  async function handleDelete() {
    if (!noteToDelete) return
    startDelete(async () => {
      const result = await adminDeleteNote(noteToDelete.note_id)
      if (result.success) {
        setNoteToDelete(null)
        router.refresh()
      } else {
        alert(adminT('common.error'))
      }
    })
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
            <NotebookPenIcon className="text-primary" />
            {adminT('notes.title')}
          </h1>
          <p className="mt-1 text-sm text-slate-400">{filteredNotes.length} / {initialNotes.length}</p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="relative">
          <SearchIcon className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input
            type="text"
            placeholder={adminT('notes.search')}
            value={search}
            onChange={event => setSearch(event.target.value)}
            className="w-full rounded-xl border border-admin-border bg-admin-surface py-2.5 pe-4 ps-10 text-sm text-white outline-none transition-all focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <select
          value={courseFilter}
          onChange={event => setCourseFilter(event.target.value)}
          className="rounded-xl border border-admin-border bg-admin-surface px-4 py-2.5 text-sm text-white outline-none transition-all focus:ring-2 focus:ring-primary/20"
        >
          <option value="all">{adminT('common.course')}</option>
          {courses.map(course => (
            <option key={course} value={course}>{course}</option>
          ))}
        </select>

        <select
          value={sortOrder}
          onChange={event => setSortOrder(event.target.value as 'newest' | 'oldest')}
          className="rounded-xl border border-admin-border bg-admin-surface px-4 py-2.5 text-sm text-white outline-none transition-all focus:ring-2 focus:ring-primary/20"
        >
          <option value="newest">{adminT('common.createdAt')}</option>
          <option value="oldest">{adminT('common.createdAt')}</option>
        </select>
      </div>

      <div className="overflow-hidden overflow-x-auto rounded-lg border border-admin-border bg-admin-surface">
        {filteredNotes.length === 0 ? (
          <div className="py-20 text-center text-slate-500">
            <NotebookPenIcon className="mx-auto mb-4 opacity-20" size={48} />
            <p>{adminT('common.noResults')}</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-admin-border">
                <th className="px-6 py-4 text-start text-xs font-semibold uppercase tracking-wider text-slate-400">{adminT('common.student')}</th>
                <th className="px-6 py-4 text-start text-xs font-semibold uppercase tracking-wider text-slate-400">{adminT('notes.courseLesson')}</th>
                <th className="px-6 py-4 text-start text-xs font-semibold uppercase tracking-wider text-slate-400">{adminT('common.description')}</th>
                <th className="px-6 py-4 text-start text-xs font-semibold uppercase tracking-wider text-slate-400">{adminT('common.createdAt')}</th>
                <th className="px-6 py-4 text-end text-xs font-semibold uppercase tracking-wider text-slate-400">{adminT('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border">
              {filteredNotes.map(note => (
                <tr key={note.note_id} className="transition-colors hover:bg-white/5">
                  <td className="px-6 py-4">
                    <p className="font-medium text-white">{note.student_name}</p>
                    <p className="text-xs text-slate-500">{formatPhone(note.student_phone)}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs font-medium text-primary">{note.course_title}</p>
                    <p className="max-w-[200px] truncate text-white">{note.lesson_title}</p>
                  </td>
                  <td className="max-w-[300px] px-6 py-4">
                    <p className="line-clamp-2 leading-relaxed text-slate-300">{note.content}</p>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-slate-400">{timeAgo(note.created_at)}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-end">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setSelectedNote(note)}
                        className="rounded-lg p-2 text-slate-400 transition-all hover:bg-white/10 hover:text-white"
                        title={adminT('common.view')}
                      >
                        <EyeIcon size={18} />
                      </button>
                      <button
                        onClick={() => setNoteToDelete(note)}
                        className="rounded-lg p-2 text-slate-400 transition-all hover:bg-red-500/10 hover:text-red-400"
                        title={adminT('common.delete')}
                      >
                        <Trash2Icon size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-admin-border bg-admin-surface shadow-2xl">
            <div className="flex items-center justify-between border-b border-admin-border p-6">
              <div>
                <h3 className="text-lg font-bold text-white">{adminT('notes.title')}</h3>
                <p className="text-xs text-slate-400">{selectedNote.student_name} - {selectedNote.lesson_title}</p>
              </div>
              <button onClick={() => setSelectedNote(null)} className="rounded-lg p-2 transition-colors hover:bg-white/10">
                <XIcon size={20} className="text-slate-400" />
              </button>
            </div>
            <div className="overflow-y-auto p-6">
              <div className="mb-6 rounded-xl border border-admin-border bg-admin-bg/50 p-5">
                <p className="whitespace-pre-wrap leading-relaxed text-white">{selectedNote.content}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="mb-1 text-slate-500">{adminT('common.createdAt')}</p>
                  <p className="text-slate-300">{new Date(selectedNote.created_at).toLocaleString('fr-FR')}</p>
                </div>
                <div>
                  <p className="mb-1 text-slate-500">{adminT('common.update')}</p>
                  <p className="text-slate-300">{new Date(selectedNote.updated_at).toLocaleString('fr-FR')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {noteToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-lg border border-admin-border bg-admin-surface p-6 shadow-2xl">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-500">
              <Trash2Icon size={24} />
            </div>
            <h3 className="mb-2 text-center text-lg font-bold text-white">{adminT('notes.deleteNote')}</h3>
            <p className="mb-6 text-center text-sm text-slate-400">{adminT('notes.deleteConfirm')}</p>
            <div className="flex gap-3">
              <button
                disabled={isDeleting}
                onClick={() => setNoteToDelete(null)}
                className="flex-1 rounded-xl bg-white/5 px-4 py-2.5 font-medium text-slate-300 transition-colors hover:bg-white/10 disabled:opacity-50"
              >
                {adminT('common.cancel')}
              </button>
              <button
                disabled={isDeleting}
                onClick={handleDelete}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? adminT('notes.deleting') : adminT('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
