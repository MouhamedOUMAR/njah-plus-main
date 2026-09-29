'use client'

import Link from 'next/link'
import {
  ArrowRightIcon, MessageCircleIcon,
} from 'lucide-react'
import AppLogo from '@/components/brand/AppLogo'
import { SUPPORT_WHATSAPP_DISPLAY, SUPPORT_WHATSAPP_URL } from '@/constants'

export default function LandingView() {
  return (
    <main className="min-h-[100dvh] w-full overflow-x-hidden bg-bg text-text">
      <section className="relative min-h-[82svh] overflow-hidden bg-primary-dark text-white">
        <img
          src="/najah-campus-hero.png"
          alt="Étudiants universitaires travaillant ensemble"
          className="absolute inset-0 h-full w-full object-cover object-[62%_center]"
        />
        <div className="absolute inset-0 bg-primary-dark/68" />

        <div className="relative flex min-h-[82svh] w-full flex-col px-5 pb-12 pt-5">
          <header className="flex items-center justify-between gap-4">
            <AppLogo size="md" withText textClassName="text-white" />
            <Link
              href="/login"
              className="inline-flex h-10 items-center rounded-lg border border-white/35 bg-white/10 px-4 text-sm font-bold text-white backdrop-blur transition-colors hover:bg-white/20"
            >
              Connexion
            </Link>
          </header>

          <div className="flex flex-1 items-end py-10">
            <div className="max-w-xl text-start">
              <p className="mb-4 text-xs font-bold uppercase text-accent-warm">Université · Licence L1 à L3</p>
              <h1 className="text-4xl font-black leading-tight">najah+</h1>
              <p className="mt-4 max-w-lg text-base font-medium leading-relaxed text-white/85">
                Tes cours, vidéos et audios organisés par année et par semestre, dans une seule application.
              </p>
              <div className="mt-7 flex flex-col gap-3">
                <Link
                  href="/register"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-extrabold text-white shadow-lg transition-colors hover:bg-[#0F5F78]"
                >
                  Créer un compte
                  <ArrowRightIcon size={17} />
                </Link>
                <a
                  href={SUPPORT_WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-white/35 bg-white/10 px-5 text-sm font-bold text-white backdrop-blur transition-colors hover:bg-white/20"
                >
                  <MessageCircleIcon size={17} />
                  {SUPPORT_WHATSAPP_DISPLAY}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

    </main>
  )
}
