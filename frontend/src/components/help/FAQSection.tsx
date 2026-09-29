'use client'
import { useState } from 'react'
import { SearchIcon, ChevronDownIcon, ChevronUpIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import ContactChannels from './ContactChannels'
import { useT } from '@/components/shared/LanguageProvider'

type SubTab  = 'faq' | 'contact'
type Category = 'all' | 'general' | 'account' | 'services'

export default function FAQSection() {
  const [subTab,   setSubTab]   = useState<SubTab>('faq')
  const [category, setCategory] = useState<Category>('all')
  const [search,   setSearch]   = useState('')
  const [expanded, setExpanded] = useState<number | null>(null)
  const t = useT()

  const faqs = [
    { id: 1, cat: 'general', q: t.help.questionLogin,         a: t.help.answerLogin },
    { id: 2, cat: 'general', q: t.help.questionCompleteLesson, a: t.help.answerCompleteLesson },
    { id: 3, cat: 'services', q: t.help.questionDownloadCourses, a: t.help.answerDownloadCourses },
    { id: 4, cat: 'account', q: t.help.questionSaveNotes,     a: t.help.answerSaveNotes },
    { id: 6, cat: 'account', q: t.help.questionSmsCode,       a: t.help.answerSmsCode },
    { id: 7, cat: 'account', q: t.help.questionChangeName,    a: t.help.answerChangeName },
    { id: 8, cat: 'general', q: t.help.questionFreePlatform,  a: t.help.answerFreePlatform },
  ] as { id: number; cat: Category; q: string; a: string }[]

  const categories: { key: Category; label: string }[] = [
    { key: 'all',      label: t.help.all },
    { key: 'general',  label: t.help.general },
    { key: 'account',  label: t.help.account },
    { key: 'services', label: t.help.services },
  ]

  const filtered = faqs.filter(f => {
    const matchCat    = category === 'all' || f.cat === category
    const needle = search.toLowerCase()
    const matchSearch = !search || f.q.toLowerCase().includes(needle) || f.a.toLowerCase().includes(needle)
    return matchCat && matchSearch
  })

  return (
    <div className="px-5 pt-5">

      {/* Sub-tab pills */}
      <div className="flex gap-2 mb-5">
        {([
          { key: 'faq',     label: t.help.faq },
          { key: 'contact', label: t.help.contactUs },
        ] as { key: SubTab; label: string }[]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setSubTab(key)}
            className={cn(
              'px-5 py-2.5 rounded-lg text-sm font-semibold transition-all active:scale-95',
              subTab === key
                ? 'bg-primary text-white shadow-sm'
                : 'bg-card border border-border/50 text-muted',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {subTab === 'faq' ? (
        <>
          {/* Category pills */}
          <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide pb-1">
            {categories.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setCategory(key)}
                className={cn(
                  'shrink-0 px-4 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95',
                  category === key
                    ? 'bg-[#E6FAF8] dark:bg-primary/15 text-[#0E7490] border border-primary/15'
                    : 'bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400',
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative mb-5">
            <SearchIcon size={16} className="absolute start-4 top-1/2 -translate-y-1/2 text-[#0E7490] pointer-events-none" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t.help.searchQuestion}
              className="w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 ps-11 pe-4 py-3 text-sm text-[#111827] dark:text-white placeholder:text-gray-500 dark:placeholder:text-slate-400 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all text-start"
            />
          </div>

          {/* Accordion */}
          <div className="space-y-3 pb-6">
            {filtered.length === 0 ? (
              <p className="text-center text-muted text-sm py-10">{t.help.noQuestions}</p>
            ) : (
              filtered.map(({ id, q, a }) => (
                <div
                  key={id}
                  className="bg-card rounded-lg border border-border/50 overflow-hidden shadow-sm"
                >
                  <button
                    onClick={() => setExpanded(expanded === id ? null : id)}
                    className="flex items-center gap-3 w-full px-4 py-4 text-start"
                  >
                    <span className="flex-1 text-sm font-semibold text-text leading-snug">{q}</span>
                    {expanded === id
                      ? <ChevronUpIcon   size={16} className="text-[#0E7490] shrink-0" />
                      : <ChevronDownIcon size={16} className="text-[#0E7490]/50 shrink-0" />
                    }
                  </button>
                  {expanded === id && (
                    <div className="px-4 pb-4 text-sm text-muted leading-relaxed border-t border-border/40 pt-3">
                      {a}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        <ContactChannels />
      )}
    </div>
  )
}
