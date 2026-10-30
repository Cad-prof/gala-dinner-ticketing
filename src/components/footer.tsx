import Link from "next/link";
import { MapPin, Phone, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { Ornament } from "@/components/ui/ornament";
import { EVENT } from "@/lib/event";

export function Footer() {
  return (
    <footer className="no-print relative border-t border-gold-500/15 bg-ink-950">
      <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8">
        <div className="flex flex-col items-center text-center">
          <Logo />
          <Ornament className="mt-8" />
          <p className="mt-6 max-w-xl font-display text-2xl italic leading-snug text-ivory-200">
            « {EVENT.theme} »
          </p>
        </div>

        <div className="mt-14 grid gap-8 border-t border-gold-500/15 pt-10 text-sm text-ivory-300 sm:grid-cols-3">
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 shrink-0 text-gold-400" size={18} />
            <div>
              <p className="text-[11px] uppercase tracking-[0.25em] text-gold-300">Lieu</p>
              <p className="mt-1.5">
                {EVENT.venue}, {EVENT.city}
              </p>
              <p className="text-ivory-400">{EVENT.dateLabel}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Phone className="mt-0.5 shrink-0 text-gold-400" size={18} />
            <div>
              <p className="text-[11px] uppercase tracking-[0.25em] text-gold-300">
                Pour plus d&apos;infos
              </p>
              <a
                href={`tel:${EVENT.phoneTel}`}
                className="mt-1.5 block transition-colors hover:text-gold-200"
              >
                {EVENT.phoneDisplay}
              </a>
              <a
                href={EVENT.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="text-ivory-400 transition-colors hover:text-gold-200"
              >
                Écrire sur WhatsApp
              </a>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 shrink-0 text-gold-400" size={18} />
            <div>
              <p className="text-[11px] uppercase tracking-[0.25em] text-gold-300">
                Paiement sécurisé
              </p>
              <p className="mt-1.5">Transactions traitées par Bictorys</p>
              <p className="text-ivory-400">Wave · Orange Money · Carte bancaire</p>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-gold-500/10 pt-6 text-xs text-ivory-500 sm:flex-row">
          <p>© {new Date().getFullYear()} Mboro Horizons — Tous droits réservés.</p>
          <div className="flex items-center gap-5">
            <Link href="/billetterie" className="hover:text-gold-200">
              Billetterie
            </Link>
            <Link href="/admin" className="hover:text-gold-200">
              Espace organisateur
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
