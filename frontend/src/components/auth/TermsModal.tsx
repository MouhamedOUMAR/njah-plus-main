'use client'
import { useState } from 'react'
import { ArrowLeftIcon, CheckIcon, ShieldCheckIcon } from 'lucide-react'
import Button from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export default function TermsModal({ isOpen, onClose }: Props) {
  const [accepted, setAccepted] = useState(false)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-0 md:p-4 animate-in fade-in duration-300">
      
      {/* ── Modal Container: Responsive width/height ─────────────────── */}
      <div className={cn(
        "bg-[#F8FAFC] text-[#111827] w-full h-[100dvh] md:h-auto md:max-h-[90dvh] md:max-w-[430px] md:rounded-lg overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom-8 duration-500",
      )}>
        
        {/* ── Header: Blue Gradient + Rounded Bottom ─────────────────── */}
        <div className="relative bg-gradient-to-br from-primary to-primary-dark pt-12 pb-16 px-6 overflow-hidden shrink-0">
          {/* Decorative background circle */}
          <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative flex items-center justify-between">
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-lg bg-white/15 backdrop-blur-md flex items-center justify-center text-white active:scale-90 transition-transform border border-white/20"
              aria-label="Retour"
            >
              <ArrowLeftIcon size={20} />
            </button>
            
            <h1 className="text-lg font-bold text-white tracking-tight">Conditions d'utilisation</h1>
            
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
              <ShieldCheckIcon size={20} className="text-white/80" />
            </div>
          </div>
        </div>

        {/* ── Main Content Area ─────────────────────────────────────── */}
        <div className="relative flex-1 -mt-8 flex flex-col min-h-0">
          <div className="flex-1 bg-white text-[#111827] rounded-t-[40px] flex flex-col min-h-0 overflow-hidden">
            
            {/* Scrollable text area */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 scrollbar-hide">
              
              <div className="space-y-3">
                <h2 className="text-lg font-bold text-[#111827]">Introduction</h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Bienvenue sur najah+. En accédant à notre plateforme, vous acceptez de vous conformer aux présentes conditions d'utilisation. Veuillez les lire attentivement avant de commencer votre apprentissage.
                </p>
              </div>

              <section className="space-y-3">
                <h3 className="text-[11px] font-extrabold text-primary uppercase tracking-[0.15em]">1. Objet du service</h3>
                <p className="text-[13px] text-slate-600 leading-relaxed">
                  najah+ est une plateforme pédagogique dédiée à la préparation de l'épreuve d'anglais au baccalauréat mauritanien. Nous fournissons des cours, des exercices et des outils de suivi.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-[11px] font-extrabold text-primary uppercase tracking-[0.15em]">2. Création de compte</h3>
                <p className="text-[13px] text-slate-600 leading-relaxed">
                  L'accès complet aux cours nécessite la création d'un compte personnel via un numéro de téléphone valide (+222). Vous êtes responsable du maintien de la confidentialité de votre compte.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-[11px] font-extrabold text-primary uppercase tracking-[0.15em]">3. Utilisation de la plateforme</h3>
                <p className="text-[13px] text-slate-600 leading-relaxed">
                  L'utilisation est strictement personnelle. Il est interdit de partager vos accès, de copier les contenus vidéos ou de tenter de perturber le fonctionnement technique de la plateforme.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-[11px] font-extrabold text-primary uppercase tracking-[0.15em]">4. Abonnement et accès</h3>
                <p className="text-[13px] text-slate-600 leading-relaxed">
                  Certains cours peuvent être soumis à un abonnement payant. L'accès aux contenus est limité à la durée de l'année scolaire en cours ou à la durée spécifiée lors de l'achat.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-[11px] font-extrabold text-primary uppercase tracking-[0.15em]">5. Protection des données</h3>
                <p className="text-[13px] text-slate-600 leading-relaxed">
                  Vos données sont traitées conformément à notre politique de confidentialité. Nous ne collectons que les informations nécessaires (nom, téléphone) pour assurer le suivi de votre progression.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-[11px] font-extrabold text-primary uppercase tracking-[0.15em]">6. Responsabilités</h3>
                <p className="text-[13px] text-slate-600 leading-relaxed">
                  L'Utilisateur est seul responsable de l'usage qu'il fait des informations fournies. najah+ ne garantit pas la réussite aux examens, qui dépend du travail personnel de l'élève.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-[11px] font-extrabold text-primary uppercase tracking-[0.15em]">7. Modification des conditions</h3>
                <p className="text-[13px] text-slate-600 leading-relaxed">
                  Nous nous réservons le droit de mettre à jour ces conditions. Toute modification importante sera notifiée aux utilisateurs via l'application.
                </p>
              </section>

              <section className="space-y-3 pb-4">
                <h3 className="text-[11px] font-extrabold text-primary uppercase tracking-[0.15em]">8. Contact</h3>
                <p className="text-[13px] text-slate-600 leading-relaxed">
                  Pour toute question concernant ces conditions, vous pouvez nous contacter via la section Aide de votre profil ou par email à support@najahplus.mr.                </p>
              </section>

            </div>

            {/* ── Footer: Sticky Checkbox + Accept Button ───────────────────── */}
            <div className="p-5 bg-white border-t border-slate-200 space-y-4 shadow-[0_-10px_20px_rgba(0,0,0,0.02)] shrink-0">
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative flex items-center justify-center mt-0.5">
                  <input
                    type="checkbox"
                    checked={accepted}
                    onChange={(e) => setAccepted(e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className={cn(
                    "w-5 h-5 rounded-lg border-2 transition-all duration-200",
                    accepted 
                      ? "bg-primary border-primary shadow-sm shadow-primary/30" 
                      : "bg-white border-slate-300 group-hover:border-primary/50"
                  )} />
                  <CheckIcon 
                    size={14} 
                    className={cn(
                      "absolute text-white transition-all duration-200",
                      accepted ? "opacity-100 scale-100" : "opacity-0 scale-50"
                    )} 
                  />
                </div>
                <span className="text-[13px] font-semibold text-[#111827] select-none leading-snug">
                  J'accepte les conditions d'utilisation
                </span>
              </label>

              <Button
                fullWidth
                size="lg"
                disabled={!accepted}
                onClick={onClose}
                className="font-bold tracking-wide shadow-lg shadow-primary/20 h-12"
              >
                Accepter
              </Button>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
