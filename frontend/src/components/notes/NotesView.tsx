'use client'
import { useState, useMemo, useTransition } from 'react'
import Link from 'next/link'
import { FileTextIcon, Trash2Icon, ChevronRightIcon } from 'lucide-react'
import { deleteNote } from '@/actions/notes'
import { timeAgo } from '@/lib/utils'
import type { Note } from '@/types'
import AppHeader    from '@/components/shared/AppHeader'
import SearchBar    from '@/components/shared/SearchBar'
import SectionHeader from '@/components/shared/SectionHeader'
import { CardItem } from '@/components/shared/CardItem'
import { useLanguage, useT } from '@/components/shared/LanguageProvider'

type NoteWithLesson = Note & {
  lesson?: { id: string; title: string; course_id: string; course?: { id: string; title: string } } | null
}
interface Props { notes: NoteWithLesson[] }

function groupByDate(notes: NoteWithLesson[], labels: { today: string; yesterday: string }, language: string) {
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
  const yesterdayStart = new Date(todayStart); yesterdayStart.setDate(yesterdayStart.getDate() - 1)
  const fmt = (d: Date) => d.toLocaleDateString(language === 'ar' ? 'ar' : language === 'fr' ? 'fr-FR' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const today     = notes.filter(n => new Date(n.updated_at) >= todayStart)
  const yesterday = notes.filter(n => { const d = new Date(n.updated_at); return d >= yesterdayStart && d < todayStart })
  const olderRaw  = notes.filter(n => new Date(n.updated_at) < yesterdayStart)
  const olderMap  = new Map<string, NoteWithLesson[]>()
  for (const n of olderRaw) {
    const key = fmt(new Date(n.updated_at))
    if (!olderMap.has(key)) olderMap.set(key, [])
    olderMap.get(key)!.push(n)
  }
  return [
    ...(today.length     ? [{ label: labels.today,     notes: today }]     : []),
    ...(yesterday.length ? [{ label: labels.yesterday, notes: yesterday }] : []),
    ...[...olderMap.entries()].map(([label, notes]) => ({ label, notes })),
  ]
}

function NoteCard({ note, index }: { note: NoteWithLesson; index: number }) {
  const [deleted, setDeleted] = useState(false)
  const [, startTransition]   = useTransition()
  const t = useT()
  const { language } = useLanguage()
  if (deleted) return null
  const lessonHref = note.lesson ? `/lessons/${note.lesson.id}` : '#'
  const subtitle   = note.lesson?.course?.title ?? note.lesson?.title

  function handleDelete(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation()
    if (!confirm(t.notes.deleteNote)) return
    setDeleted(true)
    startTransition(() => deleteNote(note.id))
  }

  return (
    <Link href={lessonHref} prefetch={!!note.lesson}>
      <CardItem
        index={index}
        title={note.content.slice(0, 60) + (note.content.length > 60 ? '…' : '')}
        subtitle={subtitle}
        icon={<FileTextIcon size={20} className="text-[#0E7490]" />}
        right={
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-gray-500 dark:text-slate-400">{timeAgo(note.updated_at, language)}</span>
            <button
              onClick={handleDelete}
              className="w-7 h-7 rounded-full flex items-center justify-center text-red-500/70 hover:text-red-500 active:scale-90 transition-all"
              aria-label={t.notes.delete}
            >
              <Trash2Icon size={13} />
            </button>
          </div>
        }
      />
    </Link>
  )
}

export default function NotesView({ notes }: Props) {
  const [search, setSearch] = useState('')
  const t = useT()
  const { language } = useLanguage()
  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    if (!needle) return notes
    return notes.filter(n =>
      n.content.toLowerCase().includes(needle) ||
      n.lesson?.title?.toLowerCase().includes(needle),
    )
  }, [notes, search])
  const groups  = useMemo(
    () => groupByDate(filtered, { today: t.notes.today, yesterday: t.notes.yesterday }, language),
    [filtered, language, t],
  )
  const isEmpty = notes.length === 0

  return (
    <div className="min-h-[100dvh] w-full page-enter bg-bg">
      <div className="w-full px-4 pb-24">
        <AppHeader
          title={t.notes.title}
          subtitle={!isEmpty ? `${notes.length} ${notes.length === 1 ? t.notes.note : t.notes.notes}` : undefined}
        />

        <div className="mb-6">
          <SearchBar value={search} onChange={setSearch} />
        </div>

        {isEmpty ? (
          <DemoSection search={search} />
        ) : filtered.length === 0 ? (
          <p className="text-center text-sm py-12 text-gray-500 dark:text-slate-400">
            {t.notes.noResultsFor} &quot;{search}&quot;
          </p>
        ) : (
          <div className="space-y-6">
            {groups.map((group, gi) => (
              <div key={group.label}>
                <SectionHeader label={group.label} index={gi} />
                <div className="space-y-3">
                  {group.notes.map((note, i) => <NoteCard key={note.id} note={note} index={i} />)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function DemoSection({ search }: { search: string }) {
  const t = useT()
  const demoGroups = [
    { label: t.notes.today,       notes: [{ id: 'n1', title: 'Note 1', subtitle: 'tenses courses',        active: false }, { id: 'n2', title: 'Note 2', subtitle: 'tenses courses',     active: true  }, { id: 'n3', title: 'Note 3', subtitle: 'vocabulary courses', active: false }] },
    { label: t.notes.yesterday,   notes: [{ id: 'n4', title: 'Note 4', subtitle: 'vocabulary courses',    active: false }, { id: 'n5', title: 'Note 5', subtitle: 'tenses courses',     active: false }] },
    { label: 'Jul 20, 2025', notes: [{ id: 'n6', title: 'Note 6', subtitle: 'comprehension courses', active: false }] },
  ]
  const groups = demoGroups
    .map(g => ({ ...g, notes: g.notes.filter(n => !search || n.title.toLowerCase().includes(search.toLowerCase())) }))
    .filter(g => g.notes.length > 0)
  let idx = 0
  return (
    <div className="space-y-6">
      {groups.map((group, gi) => (
        <div key={group.label}>
          <SectionHeader label={group.label} index={gi} />
          <div className="space-y-3">
            {group.notes.map(item => {
              const i = idx++
              return (
                <Link key={item.id} href="/courses" prefetch>
                  <CardItem
                    index={i} active={item.active}
                    title={item.title} subtitle={item.subtitle}
                    icon={<FileTextIcon size={20} className="text-[#0E7490]" />}
                    right={<ChevronRightIcon size={14} className="text-[#0E7490]/60 rtl:rotate-180" />}
                  />
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
