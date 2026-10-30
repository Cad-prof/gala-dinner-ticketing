"use client";

import { useMemo, useState, type FormEvent } from "react";
import { AlertTriangle, Loader2, Lock, Minus, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import {
  EVENT,
  MAX_PER_TYPE,
  MAX_TICKETS_PER_ORDER,
  TICKET_TYPES,
  type TicketTypeId,
} from "@/lib/event";
import { cn, formatXOF } from "@/lib/utils";

type Quantities = Record<TicketTypeId, number>;
type Errors = Partial<Record<"items" | "name" | "email" | "phone", string>>;

export function CheckoutForm({
  initialType,
  paymentsReady,
}: {
  initialType: TicketTypeId;
  paymentsReady: boolean;
}) {
  const [qty, setQty] = useState<Quantities>({
    prevente: initialType === "prevente" ? 1 : 0,
    vip: initialType === "vip" ? 1 : 0,
  });
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { count, total } = useMemo(() => {
    let c = 0;
    let t = 0;
    for (const type of TICKET_TYPES) {
      c += qty[type.id];
      t += qty[type.id] * type.price;
    }
    return { count: c, total: t };
  }, [qty]);

  function change(id: TicketTypeId, delta: number) {
    setQty((prev) => {
      const next = Math.min(MAX_PER_TYPE, Math.max(0, prev[id] + delta));
      const others = TICKET_TYPES.filter((t) => t.id !== id).reduce(
        (sum, t) => sum + prev[t.id],
        0,
      );
      if (next + others > MAX_TICKETS_PER_ORDER) return prev;
      return { ...prev, [id]: next };
    });
    setErrors((e) => ({ ...e, items: undefined }));
  }

  function validate(): Errors {
    const e: Errors = {};
    if (count === 0) e.items = "Sélectionnez au moins un billet.";
    if (name.trim().length < 2) e.name = "Indiquez votre nom complet.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      e.email = "Adresse e-mail invalide.";
    }
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 9) e.phone = "Numéro de téléphone invalide (ex. 78 015 58 36).";
    return e;
  }

  async function onSubmit(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    setServerError(null);
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: TICKET_TYPES.filter((t) => qty[t.id] > 0).map((t) => ({
            type: t.id,
            quantity: qty[t.id],
          })),
          customer: { name, email, phone },
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        paymentUrl?: string;
        error?: string;
      };
      if (!res.ok || !data.paymentUrl) {
        setServerError(data.error ?? "Une erreur est survenue. Veuillez réessayer.");
        setLoading(false);
        return;
      }
      // Redirection vers le checkout sécurisé Bictorys.
      window.location.assign(data.paymentUrl);
    } catch {
      setServerError("Connexion impossible. Vérifiez votre réseau puis réessayez.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <div className="space-y-8">
        {!paymentsReady ? (
          <div
            className="flex items-start gap-3 rounded-2xl border border-warning/40 bg-warning/10 p-4 text-sm text-warning"
            role="status"
          >
            <AlertTriangle size={18} className="mt-0.5 shrink-0" />
            <p>
              Le paiement en ligne est en cours de mise en service. Pour réserver
              dès maintenant, contactez-nous au{" "}
              <a href={`tel:${EVENT.phoneTel}`} className="underline">
                {EVENT.phoneDisplay}
              </a>
              .
            </p>
          </div>
        ) : null}

        {/* 1 — Billets */}
        <Card>
          <CardBody>
            <h2 className="flex items-center gap-3 font-display text-3xl text-ivory-50">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold-gradient font-sans text-sm font-semibold text-ink-950">
                1
              </span>
              Vos billets
            </h2>

            <div className="mt-7 space-y-4">
              {TICKET_TYPES.map((t) => {
                const selected = qty[t.id] > 0;
                return (
                  <div
                    key={t.id}
                    className={cn(
                      "flex flex-col gap-5 rounded-2xl border p-5 transition-colors sm:flex-row sm:items-center sm:justify-between",
                      selected
                        ? "border-gold-400/70 bg-gold-500/5"
                        : "border-gold-500/20 bg-ink-900/60",
                    )}
                  >
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="font-display text-2xl text-ivory-50">{t.name}</h3>
                        {t.highlight ? <Badge>VIP</Badge> : null}
                      </div>
                      <p className="mt-1 text-sm text-ivory-400">{t.tagline}</p>
                      <p className="mt-3 font-display text-2xl text-gold-gradient">
                        {formatXOF(t.price)}
                      </p>
                    </div>

                    <div
                      className="flex items-center gap-4 self-start sm:self-center"
                      role="group"
                      aria-label={`Quantité ${t.name}`}
                    >
                      <button
                        type="button"
                        onClick={() => change(t.id, -1)}
                        disabled={qty[t.id] === 0}
                        aria-label={`Retirer un billet ${t.name}`}
                        className="flex h-11 w-11 items-center justify-center rounded-full border border-gold-500/40 text-gold-200 transition hover:bg-gold-500/10 disabled:opacity-30"
                      >
                        <Minus size={16} />
                      </button>
                      <span
                        className="w-8 text-center font-display text-3xl tabular-nums text-ivory-50"
                        aria-live="polite"
                      >
                        {qty[t.id]}
                      </span>
                      <button
                        type="button"
                        onClick={() => change(t.id, 1)}
                        disabled={qty[t.id] >= MAX_PER_TYPE || count >= MAX_TICKETS_PER_ORDER}
                        aria-label={`Ajouter un billet ${t.name}`}
                        className="flex h-11 w-11 items-center justify-center rounded-full border border-gold-500/40 text-gold-200 transition hover:bg-gold-500/10 disabled:opacity-30"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            {errors.items ? (
              <p className="mt-4 text-[13px] text-danger" role="alert">
                {errors.items}
              </p>
            ) : null}
          </CardBody>
        </Card>

        {/* 2 — Coordonnées */}
        <Card>
          <CardBody>
            <h2 className="flex items-center gap-3 font-display text-3xl text-ivory-50">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold-gradient font-sans text-sm font-semibold text-ink-950">
                2
              </span>
              Vos coordonnées
            </h2>

            <div className="mt-7 grid gap-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field label="Nom complet" htmlFor="name" error={errors.name}>
                  <Input
                    id="name"
                    name="name"
                    autoComplete="name"
                    placeholder="Prénom et nom"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    aria-invalid={Boolean(errors.name)}
                  />
                </Field>
              </div>
              <Field label="E-mail" htmlFor="email" error={errors.email}>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  placeholder="vous@exemple.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={Boolean(errors.email)}
                />
              </Field>
              <Field
                label="Téléphone"
                htmlFor="phone"
                error={errors.phone}
                hint="Numéro joignable, ex. 78 015 58 36"
              >
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  placeholder="+221 78 015 58 36"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  aria-invalid={Boolean(errors.phone)}
                />
              </Field>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* 3 — Récapitulatif */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <Card className="border-gold-400/40 shadow-gold">
          <CardBody>
            <h2 className="font-display text-3xl text-ivory-50">Récapitulatif</h2>

            <ul className="mt-6 space-y-3 text-[15px]">
              {TICKET_TYPES.filter((t) => qty[t.id] > 0).map((t) => (
                <li key={t.id} className="flex items-baseline justify-between gap-4">
                  <span className="text-ivory-200">
                    {t.name} <span className="text-ivory-500">× {qty[t.id]}</span>
                  </span>
                  <span className="tabular-nums text-ivory-50">
                    {formatXOF(t.price * qty[t.id])}
                  </span>
                </li>
              ))}
              {count === 0 ? (
                <li className="text-ivory-500">Aucun billet sélectionné.</li>
              ) : null}
            </ul>

            <div className="my-6 h-px bg-linear-to-r from-gold-500/50 via-gold-500/15 to-transparent" />

            <div className="flex items-baseline justify-between">
              <span className="text-[11px] uppercase tracking-[0.3em] text-gold-300">
                Total
              </span>
              <span className="font-display text-4xl font-bold tabular-nums text-gold-gradient">
                {formatXOF(total)}
              </span>
            </div>

            {serverError ? (
              <p
                className="mt-6 rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-danger"
                role="alert"
              >
                {serverError}
              </p>
            ) : null}

            <Button
              type="submit"
              size="lg"
              className="mt-6 w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Redirection…
                </>
              ) : (
                <>
                  <Lock size={16} /> Payer {formatXOF(total)}
                </>
              )}
            </Button>

            <div className="mt-6 text-center">
              <p className="text-[11px] uppercase tracking-[0.25em] text-ivory-500">
                Paiement sécurisé par Bictorys
              </p>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                {["Wave", "Orange Money", "Free Money", "Carte bancaire"].map((m) => (
                  <Badge key={m} tone="neutral" className="tracking-[0.12em]">
                    {m}
                  </Badge>
                ))}
              </div>
              <p className="mt-4 text-xs leading-relaxed text-ivory-500">
                Vous serez redirigé vers la page de paiement sécurisée pour choisir
                votre moyen de paiement.
              </p>
            </div>
          </CardBody>
        </Card>
      </aside>
    </form>
  );
}
