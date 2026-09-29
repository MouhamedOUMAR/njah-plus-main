'use client'
import { useState, useRef, useEffect, KeyboardEvent } from 'react'
import {
  ChevronLeftIcon, SendIcon, PaperclipIcon,
  HeadphonesIcon, MessageSquareIcon, ClockIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useT } from '@/components/shared/LanguageProvider'

type ChatItem = {
  id: number
  title: string
  preview: string
  time: string
  status: 'active' | 'ended'
  unread?: number
}

type Message = {
  id: number
  from: 'support' | 'user'
  text: string
  time: string
}

function nowTime() {
  const d = new Date()
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}

// ── Chat list ─────────────────────────────────────────────────────────────────

function ChatCard({ item, onClick }: { item: ChatItem; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-4 bg-card rounded-lg shadow-sm border border-border/40 p-4 w-full text-start active:scale-[0.98] transition-transform"
    >
      <div className="w-11 h-11 rounded-lg bg-[#E6FAF8] dark:bg-primary/15 border border-primary/15 flex items-center justify-center shrink-0">
        <HeadphonesIcon size={20} className="text-[#0E7490]" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <p className="text-sm font-semibold text-text truncate">{item.title}</p>
          <span className="text-xs text-muted shrink-0">{item.time}</span>
        </div>
        <p className="text-xs text-muted truncate">{item.preview}</p>
      </div>
      {item.unread ? (
        <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center shrink-0">
          {item.unread}
        </span>
      ) : null}
    </button>
  )
}

// ── Conversation ──────────────────────────────────────────────────────────────

function Conversation({ onBack }: { onBack: () => void }) {
  const t = useT()
  const initialMessages: Message[] = [
    { id: 1, from: 'support', text: t.help.supportGreeting, time: '10:00' },
    { id: 2, from: 'user',    text: t.help.userSampleMessage, time: '10:01' },
    { id: 3, from: 'support', text: t.help.supportSampleReply, time: '10:02' },
  ]
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input,    setInput]    = useState('')
  const [typing,   setTyping]   = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMessages(initialMessages)
  }, [t])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  function send() {
    const text = input.trim()
    if (!text) return
    const time = nowTime()
    setMessages(m => [...m, { id: Date.now(), from: 'user', text, time }])
    setInput('')
    setTyping(true)
    setTimeout(() => {
      setTyping(false)
      setMessages(m => [
        ...m,
        {
          id: Date.now() + 1,
          from: 'support',
          text: t.help.supportAutoReply,
          time: nowTime(),
        },
      ])
    }, 1400)
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  return (
    <div className="flex flex-col" style={{ minHeight: 'calc(100svh - 190px)' }}>

      {/* Conversation header */}
      <div className="flex items-center gap-3 px-5 py-4 bg-card border-b border-border/50 sticky top-0 z-10">
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-full bg-bg flex items-center justify-center active:scale-90 transition-transform shrink-0"
          aria-label={t.common.back}
        >
          <ChevronLeftIcon size={18} className="text-[#0E7490] rtl:rotate-180" />
        </button>
        <div className="w-9 h-9 rounded-lg bg-[#E6FAF8] dark:bg-primary/15 border border-primary/15 flex items-center justify-center shrink-0">
          <HeadphonesIcon size={18} className="text-[#0E7490]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-text leading-none">{t.help.techSupport}</p>
          <p className="text-xs text-[#0E7490] mt-0.5">{t.help.online}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-bg">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={cn('flex gap-2', msg.from === 'user' ? 'justify-end' : 'justify-start')}
          >
            {msg.from === 'support' && (
              <div className="w-7 h-7 rounded-full bg-[#E6FAF8] dark:bg-primary/15 border border-primary/15 flex items-center justify-center shrink-0 mt-1">
                <HeadphonesIcon size={13} className="text-[#0E7490]" />
              </div>
            )}
            <div className={cn('max-w-[75%] space-y-1', msg.from === 'user' ? 'items-end' : 'items-start')}>
              <div
                className={cn(
                  'px-4 py-3 rounded-lg text-sm leading-relaxed',
                  msg.from === 'user'
                    ? 'bg-primary text-white rounded-tr-sm'
                    : 'bg-card border border-border/50 text-text rounded-tl-sm shadow-sm',
                )}
              >
                {msg.text}
              </div>
              <p className={cn('text-[10px] text-muted px-1', msg.from === 'user' ? 'text-end' : '')}>
                {msg.time}
              </p>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {typing && (
          <div className="flex gap-2 justify-start">
            <div className="w-7 h-7 rounded-full bg-[#E6FAF8] dark:bg-primary/15 border border-primary/15 flex items-center justify-center shrink-0 mt-1">
              <HeadphonesIcon size={13} className="text-[#0E7490]" />
            </div>
            <div className="bg-card border border-border/50 rounded-lg rounded-tl-sm px-4 py-3 shadow-sm">
              <div className="flex gap-1 items-center h-4">
                {[0, 1, 2].map(i => (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-muted/60 animate-bounce"
                    style={{ animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <div className="px-5 py-3 bg-card border-t border-border/50 flex items-center gap-3">
        <button className="w-9 h-9 rounded-full bg-bg flex items-center justify-center shrink-0 active:scale-90 transition-transform">
          <PaperclipIcon size={18} className="text-[#0E7490]" />
        </button>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={onKey}
          placeholder={t.help.messagePlaceholder}
          className="flex-1 bg-bg rounded-lg border border-border px-4 py-2.5 text-sm text-text placeholder:text-muted/60 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all text-start"
        />
        <button
          onClick={send}
          disabled={!input.trim()}
          className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shrink-0 active:scale-90 transition-transform disabled:opacity-40"
        >
          <SendIcon size={16} className="text-white" />
        </button>
      </div>

    </div>
  )
}

// ── Chat list view ────────────────────────────────────────────────────────────

export default function SupportSection() {
  const [activeChat, setActiveChat] = useState<number | null>(null)
  const t = useT()

  const activeChats: ChatItem[] = [
    {
      id: 1,
      title: t.help.techSupport,
      preview: t.help.supportPreview,
      time: t.help.twoHoursAgo,
      status: 'active',
      unread: 1,
    },
  ]

  const endedChats: ChatItem[] = [
    {
      id: 2,
      title: t.help.registrationHelp,
      preview: t.help.endedPreview,
      time: t.help.yesterday,
      status: 'ended',
    },
    {
      id: 3,
      title: t.help.courseQuestion,
      preview: t.help.downloadPreview,
      time: t.help.threeDaysAgo,
      status: 'ended',
    },
  ]

  if (activeChat !== null) {
    return <Conversation onBack={() => setActiveChat(null)} />
  }

  return (
    <div className="px-5 pt-5 pb-6 space-y-6">

      {/* Active chats */}
      {activeChats.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <MessageSquareIcon size={15} className="text-[#0E7490]" />
            <h3 className="text-sm font-bold text-text">{t.help.activeConversations}</h3>
          </div>
          <div className="space-y-3">
            {activeChats.map(chat => (
              <ChatCard key={chat.id} item={chat} onClick={() => setActiveChat(chat.id)} />
            ))}
          </div>
        </div>
      )}

      {/* Ended chats */}
      {endedChats.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <ClockIcon size={15} className="text-slate-500 dark:text-slate-400" />
            <h3 className="text-sm font-bold text-text">{t.help.endedConversations}</h3>
          </div>
          <div className="space-y-3">
            {endedChats.map(chat => (
              <ChatCard key={chat.id} item={chat} onClick={() => setActiveChat(chat.id)} />
            ))}
          </div>
        </div>
      )}

      {/* New chat CTA */}
      <button
        onClick={() => setActiveChat(1)}
        className="w-full py-4 rounded-lg bg-primary text-white font-bold text-sm shadow-sm active:scale-[0.98] transition-transform"
      >
        {t.help.newConversation}
      </button>

      <p className="text-center text-xs text-muted pb-2">
        {t.help.responseTime}
      </p>
    </div>
  )
}
