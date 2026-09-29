'use client'
import {
  PhoneIcon, GlobeIcon, MessageCircleIcon,
  ChevronRightIcon, MailIcon, Share2Icon, HeartIcon,
} from 'lucide-react'
import { useT } from '@/components/shared/LanguageProvider'
import { SUPPORT_WHATSAPP_DISPLAY, SUPPORT_WHATSAPP_URL } from '@/constants'

export default function ContactChannels() {
  const t = useT()
  const channels = [
    {
      Icon: PhoneIcon,
      label: t.help.customerService,
      desc: `+222 ${SUPPORT_WHATSAPP_DISPLAY}`,
      bg: 'bg-green-50 dark:bg-green-500/10 border border-green-500/10',
      color: 'text-green-600',
    },
    {
      Icon: MailIcon,
      label: 'Email',
      desc: 'support@najahplus.mr',
      bg: 'bg-[#E6FAF8] dark:bg-primary/15 border border-primary/15',
      color: 'text-[#0E7490]',
    },
    {
      Icon: GlobeIcon,
      label: t.help.website,
      desc: 'www.najahplus.mr',
      bg: 'bg-[#E6FAF8] dark:bg-primary/15 border border-primary/15',
      color: 'text-[#0E7490]',
    },
    {
      Icon: Share2Icon,
      label: 'Facebook',
      desc: '@najahplus',
      bg: 'bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-500/10',
      color: 'text-indigo-600',
    },
    {
      Icon: MessageCircleIcon,
      label: t.help.whatsapp,
      desc: `WhatsApp: ${SUPPORT_WHATSAPP_DISPLAY}`,
      href: SUPPORT_WHATSAPP_URL,
      bg: 'bg-green-50 dark:bg-green-500/10 border border-green-500/10',
      color: 'text-green-600',
    },
    {
      Icon: HeartIcon,
      label: 'Instagram',
      desc: '@najahplus',
      bg: 'bg-pink-50 dark:bg-pink-500/10 border border-pink-500/10',
      color: 'text-pink-600',
    },
  ]

  return (
    <div className="space-y-3 pb-6">
      <p className="text-xs text-muted mb-4 leading-relaxed">
        {t.help.contactIntro}
      </p>
      {channels.map(({ Icon, label, desc, bg, color, href }) => {
        const content = (
          <>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${bg}`}>
              <Icon size={18} className={color} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text">{label}</p>
              <p className="text-xs text-muted mt-0.5 truncate">{desc}</p>
            </div>
            <ChevronRightIcon size={16} className="text-[#0E7490]/50 shrink-0 rtl:rotate-180" />
          </>
        )

        const className = 'flex items-center gap-4 bg-card rounded-lg shadow-sm border border-border/40 p-4 w-full text-start active:scale-[0.98] transition-transform'

        return href ? (
          <a key={label} href={href} target="_blank" rel="noopener noreferrer" className={className}>
            {content}
          </a>
        ) : (
          <button key={label} type="button" className={className}>
            {content}
          </button>
        )
      })}
    </div>
  )
}
