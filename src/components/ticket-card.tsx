import { LogoMark } from "@/components/ui/logo";
import { Badge } from "@/components/ui/badge";
import { EVENT, getTicketType } from "@/lib/event";
import type { TicketRow } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Billet numérique : QR code unique, validé une seule fois à l'entrée. */
export function TicketCard({
  ticket,
  holder,
  qrSvg,
  index,
  total,
}: {
  ticket: TicketRow;
  holder: string;
  qrSvg: string;
  index: number;
  total: number;
}) {
  const type = getTicketType(ticket.ticket_type);
  const isVip = ticket.ticket_type === "vip";

  return (
    <article
      className={cn(
        "print-ticket relative overflow-hidden rounded-3xl border shadow-gold",
        isVip
          ? "border-gold-400/70 bg-linear-to-br from-bordeaux-900 via-ink-800 to-ink-900"
          : "border-gold-500/40 bg-linear-to-br from-ink-700 via-ink-800 to-ink-900",
      )}
    >
      <div className="grid sm:grid-cols-[1fr_auto]">
        {/* Partie gauche */}
        <div className="relative p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <LogoMark className="h-8" />
              <span className="font-display text-sm font-bold uppercase tracking-[0.18em] text-ivory-50">
                Mboro Horizons
              </span>
            </div>
            <Badge tone={isVip ? "gold" : "neutral"}>{type?.name ?? ticket.ticket_type}</Badge>
          </div>

          <p className="mt-8 text-[11px] uppercase tracking-[0.4em] text-gold-400">
            Billet d&apos;entrée · {index}/{total}
          </p>
          <h3 className="mt-2 font-display text-4xl font-bold leading-none text-gold-gradient sm:text-5xl">
            Dîner de Gala
          </h3>

          <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5 text-sm">
            <div>
              <dt className="text-[10px] uppercase tracking-[0.3em] text-gold-400">Date</dt>
              <dd className="mt-1 font-display text-xl text-ivory-50">{EVENT.dateLabel}</dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-[0.3em] text-gold-400">Lieu</dt>
              <dd className="mt-1 font-display text-xl text-ivory-50">
                {EVENT.venue}, {EVENT.city}
              </dd>
            </div>
            <div className="col-span-2">
              <dt className="text-[10px] uppercase tracking-[0.3em] text-gold-400">Titulaire</dt>
              <dd className="mt-1 font-display text-xl text-ivory-50">{holder}</dd>
            </div>
          </dl>
        </div>

        {/* Perforation */}
        <div className="relative hidden sm:block" aria-hidden>
          <div className="absolute inset-y-0 left-0 border-l-2 border-dashed border-gold-500/40" />
          <span className="absolute -left-3 -top-3 h-6 w-6 rounded-full bg-ink-950" />
          <span className="absolute -bottom-3 -left-3 h-6 w-6 rounded-full bg-ink-950" />
        </div>
        <div className="border-t-2 border-dashed border-gold-500/40 sm:hidden" aria-hidden />

        {/* Partie droite : QR */}
        <div className="flex flex-col items-center justify-center gap-4 p-6 sm:w-64 sm:p-8">
          <div
            className="h-40 w-40 overflow-hidden rounded-2xl border-4 border-ivory-100 bg-ivory-100 [&>svg]:h-full [&>svg]:w-full"
            role="img"
            aria-label={`QR code du billet ${ticket.code}`}
            dangerouslySetInnerHTML={{ __html: qrSvg }}
          />
          <p className="font-mono text-sm font-medium tracking-[0.18em] text-gold-200">
            {ticket.code}
          </p>
          <p className="text-center text-[11px] uppercase tracking-[0.2em] text-ivory-500">
            À présenter à l&apos;entrée
          </p>
        </div>
      </div>
    </article>
  );
}
