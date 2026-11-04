import Image from "next/image";
import Link from "next/link";
import {
  CalendarDays,
  Check,
  ChevronDown,
  CreditCard,
  MapPin,
  Phone,
  QrCode,
  Ticket,
} from "lucide-react";
import { Countdown } from "@/components/countdown";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Ornament } from "@/components/ui/ornament";
import { Container, Eyebrow, SectionHeading } from "@/components/ui/section";
import { EVENT, TICKET_TYPES } from "@/lib/event";
import { cn, formatNumber, formatXOF } from "@/lib/utils";

const steps = [
  {
    icon: Ticket,
    title: "Choisissez votre entrée",
    text: "Prévente ou VIP, une ou plusieurs places : composez votre commande en quelques secondes.",
  },
  {
    icon: CreditCard,
    title: "Payez en toute sécurité",
    text: "Payez votre réservation en toute sécurité avec Wave.",
  },
  {
    icon: QrCode,
    title: "Recevez votre billet",
    text: "Votre billet numérique avec QR code s'affiche dès la confirmation du paiement.",
  },
];

const faqs = [
  {
    q: "Comment recevoir mon billet ?",
    a: "Dès que votre paiement est confirmé, vos billets s'affichent sur la page de confirmation, avec un QR code unique par place. Conservez le lien de cette page, imprimez-la ou faites une capture d'écran.",
  },
  {
    q: "Puis-je acheter plusieurs billets en une commande ?",
    a: "Oui, jusqu'à 20 billets par commande, en mélangeant Prévente et VIP si vous le souhaitez. Chaque place reçoit son propre QR code.",
  },
  {
    q: "Mon paiement est débité mais je ne vois pas mon billet.",
    a: `Patientez quelques instants puis actualisez la page de confirmation. Si le problème persiste, contactez-nous au ${EVENT.phoneDisplay} en indiquant votre référence de commande (MH-…).`,
  },
  {
    q: "Que présenter à l'entrée ?",
    a: "Votre QR code, sur téléphone ou imprimé. Il est scanné et validé une seule fois à l'entrée du Foyer des jeunes.",
  },
];

export default function HomePage() {
  return (
    <>
      {/* ─── HERO ─────────────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden">
        <Image
          src="/images/hero.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="-z-30 object-cover object-[72%_center]"
        />
        <div className="absolute inset-0 -z-20 bg-linear-to-b from-ink-950/80 via-ink-950/45 to-ink-950" />
        <div className="absolute inset-0 -z-20 bg-[radial-gradient(ellipse_at_50%_45%,transparent_0%,rgb(5_4_3/0.55)_70%)]" />
        <div className="gold-dust absolute inset-0 -z-10 opacity-60" aria-hidden />

        <Container className="flex min-h-[calc(100dvh-4.5rem)] flex-col items-center justify-center py-16 text-center">
          <p className="animate-fade-up text-[11px] font-medium uppercase tracking-[0.5em] text-gold-300 sm:text-xs">
            Mboro Horizons présente
          </p>

          <h1 className="mt-7 flex flex-col items-center leading-none">
            <span
              className="animate-fade-up font-display text-3xl font-bold uppercase tracking-[0.2em] text-gold-gradient sm:text-5xl"
              style={{ animationDelay: "120ms" }}
            >
              Dîner de
            </span>
            <span
              className="animate-fade-up -mt-1 pb-4 font-display text-[clamp(6.5rem,24vw,16rem)] font-bold leading-[0.82] tracking-tight text-gold-shimmer drop-shadow-[0_8px_40px_rgba(201,150,43,0.35)]"
              style={{ animationDelay: "240ms" }}
            >
              GALA
            </span>
          </h1>

          <div className="animate-fade-up" style={{ animationDelay: "360ms" }}>
            <Ornament />
          </div>

          <div
            className="animate-fade-up mt-9 flex flex-col items-center gap-8 sm:flex-row sm:gap-10"
            style={{ animationDelay: "480ms" }}
          >
            <div className="rounded-3xl border border-gold-400/70 bg-ink-950/70 px-9 py-5 shadow-gold backdrop-blur-sm">
              <p className="text-[11px] font-medium uppercase tracking-[0.4em] text-ivory-100">
                Prévu le
              </p>
              <p className="font-display text-7xl font-bold leading-none text-gold-gradient">
                {EVENT.day}
              </p>
              <p className="mt-1 text-sm font-medium uppercase tracking-[0.35em] text-ivory-100">
                {EVENT.month} {EVENT.year}
              </p>
            </div>

            <div className="max-w-sm text-left">
              <p className="flex items-center gap-2 text-sm uppercase tracking-[0.25em] text-gold-200">
                <MapPin size={16} className="text-gold-400" />
                {EVENT.venue}, {EVENT.city}
              </p>
              <p className="mt-4 font-display text-[22px] italic leading-snug text-ivory-100 sm:text-2xl">
                « {EVENT.theme} »
              </p>
            </div>
          </div>

          <div
            className="animate-fade-up mt-11 flex flex-col items-center gap-4 sm:flex-row"
            style={{ animationDelay: "600ms" }}
          >
            <Link href="/billetterie" className={buttonStyles({ size: "lg" })}>
              Réserver ma place
            </Link>
            <Link
              href="/#billets"
              className={buttonStyles({ variant: "outline", size: "lg" })}
            >
              Voir les tarifs
            </Link>
          </div>

          <div
            className="animate-fade-up mt-14"
            style={{ animationDelay: "720ms" }}
          >
            <Countdown targetISO={EVENT.dateISO} />
          </div>
        </Container>
      </section>

      {/* ─── L'ÉVÉNEMENT ──────────────────────────────────────────────── */}
      <section id="evenement" className="relative py-24 sm:py-32">
        <Container className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div className="absolute -inset-3 rounded-[2rem] border border-gold-500/25" aria-hidden />
            <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-gold-500/30 shadow-card">
              <Image
                src="/images/ambiance.jpg"
                alt="Verres en cristal et lumières dorées lors d'un dîner de gala"
                fill
                sizes="(min-width: 1024px) 480px, 90vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-linear-to-t from-ink-950/70 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <Badge>Une soirée d&apos;exception</Badge>
              </div>
            </div>
          </div>

          <div>
            <Eyebrow>Le thème</Eyebrow>
            <h2 className="mt-4 font-display text-4xl leading-[1.08] text-ivory-50 sm:text-5xl">
              Honorer ceux qui ont marqué{" "}
              <span className="italic text-gold-gradient">Mboro</span>, inspirer
              ceux qui construiront son avenir
            </h2>
            <p className="mt-6 text-[17px] leading-relaxed text-ivory-300">
              Le Dîner de Gala de Mboro Horizons réunit la communauté le temps
              d&apos;une soirée d&apos;élégance et de reconnaissance : rendre
              hommage aux personnalités et aux initiatives qui ont écrit
              l&apos;histoire de Mboro, et donner envie à la jeunesse
              d&apos;en bâtir la suite.
            </p>

            <dl className="mt-10 grid gap-4 sm:grid-cols-2">
              {[
                {
                  icon: CalendarDays,
                  label: "Date",
                  value: EVENT.dateLabel,
                },
                {
                  icon: MapPin,
                  label: "Lieu",
                  value: `${EVENT.venue}, ${EVENT.city}`,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-4 rounded-2xl border border-gold-500/20 bg-ink-800/60 p-5"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gold-500/40 text-gold-300">
                    <item.icon size={19} />
                  </span>
                  <div>
                    <dt className="text-[10px] uppercase tracking-[0.3em] text-gold-400">
                      {item.label}
                    </dt>
                    <dd className="mt-1 font-display text-xl text-ivory-50">
                      {item.value}
                    </dd>
                  </div>
                </div>
              ))}
            </dl>
          </div>
        </Container>
      </section>

      {/* ─── BILLETS ──────────────────────────────────────────────────── */}
      <section
        id="billets"
        className="bg-spotlight relative border-y border-gold-500/10 bg-ink-900 py-24 sm:py-32"
      >
        <Container>
          <SectionHeading
            eyebrow="Billetterie"
            title="Choisissez votre entrée"
            subtitle="Deux formules pour vivre la soirée. Paiement en ligne sécurisé, billet numérique immédiat."
          />

          <div className="mx-auto mt-16 grid max-w-4xl gap-8 md:grid-cols-2">
            {TICKET_TYPES.map((t) => (
              <article
                key={t.id}
                className={cn(
                  "relative flex flex-col rounded-3xl p-8 sm:p-10",
                  t.highlight
                    ? "border border-gold-400/60 bg-linear-to-b from-bordeaux-700/50 via-ink-800 to-ink-900 shadow-gold"
                    : "surface",
                )}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-3xl text-ivory-50">{t.name}</h3>
                  <Badge tone={t.highlight ? "gold" : "neutral"}>
                    {t.highlight ? "Expérience VIP" : "Tarif de prévente"}
                  </Badge>
                </div>
                <p className="mt-3 min-h-12 text-[15px] leading-relaxed text-ivory-300">
                  {t.tagline}
                </p>

                <p className="mt-7 flex items-baseline gap-2">
                  <span className="font-display text-6xl font-bold leading-none text-gold-gradient">
                    {formatNumber(t.price)}
                  </span>
                  <span className="text-sm uppercase tracking-[0.25em] text-gold-300">
                    FCFA
                  </span>
                </p>
                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-ivory-500">
                  par personne
                </p>

                <div className="my-8 h-px bg-linear-to-r from-gold-500/40 via-gold-500/10 to-transparent" />

                <ul className="flex-1 space-y-3.5">
                  {t.perks.map((perk) => (
                    <li key={perk} className="flex items-start gap-3 text-[15px] text-ivory-200">
                      <Check size={17} className="mt-0.5 shrink-0 text-gold-400" />
                      {perk}
                    </li>
                  ))}
                </ul>

                <Link
                  href={`/billetterie?offre=${t.id}`}
                  className={buttonStyles({
                    variant: t.highlight ? "gold" : "outline",
                    size: "lg",
                    className: "mt-10 w-full",
                  })}
                >
                  Réserver — {formatXOF(t.price)}
                </Link>
              </article>
            ))}
          </div>
        </Container>
      </section>

      {/* ─── DÉROULEMENT ──────────────────────────────────────────────── */}
      <section id="deroulement" className="py-24 sm:py-32">
        <Container>
          <SectionHeading
            eyebrow="Réservation"
            title="Simple, rapide, sécurisé"
            subtitle="Trois étapes, sans création de compte."
          />
          <ol className="mt-16 grid gap-10 md:grid-cols-3">
            {steps.map((s, i) => (
              <li key={s.title} className="relative text-center">
                <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-gold-500/40 bg-ink-800 text-gold-300 shadow-gold">
                  <s.icon size={28} strokeWidth={1.4} />
                  <span className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-gold-gradient font-display text-sm font-bold text-ink-950">
                    {i + 1}
                  </span>
                </div>
                <h3 className="mt-6 font-display text-2xl text-ivory-50">{s.title}</h3>
                <p className="mx-auto mt-3 max-w-xs text-[15px] leading-relaxed text-ivory-300">
                  {s.text}
                </p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* ─── BANDEAU CTA ──────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden border-y border-gold-500/15">
        <Image
          src="/images/table.jpg"
          alt=""
          fill
          sizes="100vw"
          className="-z-20 object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-ink-950/75" />
        <Container className="py-24 text-center sm:py-28">
          <p className="font-display text-4xl italic leading-tight text-ivory-50 sm:text-5xl">
            Une table vous attend,
            <br />
            <span className="text-gold-gradient">le 30 décembre.</span>
          </p>
          <div className="mt-10 flex justify-center">
            <Link href="/billetterie" className={buttonStyles({ size: "lg" })}>
              Réserver maintenant
            </Link>
          </div>
        </Container>
      </section>

      {/* ─── INFOS PRATIQUES + FAQ ────────────────────────────────────── */}
      <section id="infos" className="py-24 sm:py-32">
        <Container className="grid gap-16 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Eyebrow>Infos pratiques</Eyebrow>
            <h2 className="mt-4 font-display text-4xl text-ivory-50 sm:text-5xl">
              Une question ?
            </h2>
            <p className="mt-5 text-[17px] leading-relaxed text-ivory-300">
              Notre équipe vous répond directement pour toute information sur
              la soirée ou votre réservation.
            </p>

            <div className="mt-8 space-y-4">
              <div className="surface rounded-2xl p-5">
                <p className="flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-gold-400">
                  <Phone size={14} /> Téléphone / WhatsApp
                </p>
                <a
                  href={`tel:${EVENT.phoneTel}`}
                  className="mt-2 block font-display text-3xl text-ivory-50 transition-colors hover:text-gold-200"
                >
                  {EVENT.phoneDisplay}
                </a>
                <a
                  href={EVENT.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonStyles({
                    variant: "outline",
                    size: "sm",
                    className: "mt-4",
                  })}
                >
                  Écrire sur WhatsApp
                </a>
              </div>
              <div className="surface rounded-2xl p-5">
                <p className="flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-gold-400">
                  <MapPin size={14} /> Lieu de la soirée
                </p>
                <p className="mt-2 font-display text-2xl text-ivory-50">
                  {EVENT.venue}, {EVENT.city}
                </p>
                <p className="text-sm text-ivory-400">{EVENT.dateLabel}</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="divide-y divide-gold-500/15 rounded-3xl border border-gold-500/20 bg-ink-800/50">
              {faqs.map((f) => (
                <details key={f.q} className="group p-6 sm:p-7">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-display text-xl text-ivory-50 [&::-webkit-details-marker]:hidden">
                    {f.q}
                    <ChevronDown
                      size={20}
                      className="shrink-0 text-gold-400 transition-transform duration-300 group-open:rotate-180"
                    />
                  </summary>
                  <p className="mt-4 text-[15px] leading-relaxed text-ivory-300">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
