'use client'
import { useState, useTransition, useEffect } from 'react'
import AskTeacherModal from './AskTeacherModal'
import {
  MessageCircleIcon, PlusIcon, Trash2Icon, NotebookPenIcon, ChevronRightIcon,
} from 'lucide-react'
import IconBox from '@/components/ui/IconBox'

import { addNote, deleteNote } from '@/actions/notes'
import type { Note } from '@/types'
import { useT } from '@/components/shared/LanguageProvider'

interface LessonActionsProps {
  lessonId: string
  lessonTitle?: string
  canAccess?: boolean
  isDownloadable?: boolean
  initialNotes?: Note[]
}

export default function LessonActions({
  lessonId,
  lessonTitle,
  canAccess = false,
  isDownloadable = false,
  initialNotes = [],
}: LessonActionsProps) {
  const [showModal, setShowModal]     = useState(false)
  const [notes, setNotes]             = useState<Note[]>(initialNotes)
  const [noteText, setNoteText]       = useState('')

  const [isPending, startTransition]  = useTransition()
  const t = useT()

  useEffect(() => {
    setNotes(initialNotes)
  }, [initialNotes])

  function handleAddNote() {

    const content = noteText.trim()
    if (!content) return
    setNoteText('')
    startTransition(async () => {
      const note = await addNote(lessonId, content)
      if (note) setNotes(prev => [...prev, note])
    })
  }

  function handleDeleteNote(noteId: string) {
    setNotes(prev => prev.filter(n => n.id !== noteId))
    startTransition(() => deleteNote(noteId))
  }

  return (
    <>
      <div className="space-y-5 pb-8">

        {/* ── Notes section (only when access granted) ─────── */}
        {canAccess && (
          <div className="bg-card rounded-lg p-6 border border-border/40 shadow-sm space-y-5">
            <div className="flex items-center gap-3 px-1">
              <IconBox icon={NotebookPenIcon} variant="soft" size="sm" fill />
              <span className="text-[12px] font-bold text-muted uppercase tracking-[0.15em]">{t.notes.personalNotes}</span>
            </div>

            {notes.length > 0 && (
              <div className="space-y-3">
                {notes.map(note => (
                  <div
                    key={note.id}
                    className="flex items-start gap-4 bg-[#E6FAF8]/40 dark:bg-primary/15 border border-primary/15 rounded-lg p-4 group transition-all"
                  >
                    <p className="text-[14px] text-text flex-1 leading-relaxed whitespace-pre-wrap font-medium tracking-tight">
                      {note.content}
                    </p>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="shrink-0 text-red-500/70 hover:text-red-500 transition-colors p-1 active:scale-90"
                      aria-label={t.notes.delete}
                    >
                      <Trash2Icon size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3 px-1">
              <textarea
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleAddNote()
                  }
                }}
                placeholder={t.notes.writeNote}
                rows={2}
                className="flex-1 text-[14px] bg-bg border border-border/40 rounded-lg px-5 py-4 resize-none outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all placeholder:text-muted/40 font-medium tracking-tight"
              />
              <button
                onClick={handleAddNote}
                disabled={!noteText.trim() || isPending}
                className="self-end w-14 h-14 rounded-lg bg-primary flex items-center justify-center text-white disabled:opacity-40 active:scale-95 transition-all shadow-xl shadow-primary/20"
                aria-label={t.notes.add}
              >
                <PlusIcon size={24} strokeWidth={3} />
              </button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {/* ── Ask teacher ──────────────────────────────────── */}
          <button
            onClick={() => setShowModal(true)}
            className="group flex min-h-16 w-full items-center gap-3 rounded-lg border border-primary/15 bg-card p-3 text-sm font-bold text-primary-dark shadow-sm transition-all active:scale-[0.98] dark:bg-primary/10 dark:text-primary-light"
          >
            <IconBox 
              icon={MessageCircleIcon} 
              variant="primary"
              size="md" 
              fill
            />
            <span className="flex-1 text-start">{t.lesson.askTeacher}</span>
            <ChevronRightIcon size={18} className="text-primary/60 transition-transform group-hover:ltr:translate-x-1 group-hover:rtl:-translate-x-1 rtl:rotate-180" />
          </button>
        </div>

      </div>

      {showModal && (
        <AskTeacherModal
          onClose={() => setShowModal(false)}
          lessonTitle={lessonTitle}
        />
      )}
    </>
  )
}
