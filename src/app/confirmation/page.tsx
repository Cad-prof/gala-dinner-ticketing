import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import QRCode from "qrcode";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { PrintButton } from "@/components/print-button";
import { TicketCard } from "@/components/ticket-card";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Container } from "@/components/ui/section";
import { EVENT } from "@/lib/event";
import { ensureTickets, getOrder, reconcileOrder } from "@/lib/orders";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { OrderRow, OrderStatus, TicketRow } from "@/lib/types";
import { resolveBaseUrl } from "@/lib/url";
import { formatXOF } from "@/lib/utils";
import { OrderPoller } from "./order-poller";

export const metadata: Metadata = {
  title: "Confirmation de commande",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

const STATUS_VIEW: Record<
  OrderStatus,
  {
    icon: typeof Clock;
    color: string;
    title: string;
    text: string;
  }
> = {
  pending: {
    icon: Clock,
    color: "text-warning",
    title: "Paiement en cours de confirmation",
    text: "Nous attendons la confirmation de votre paiement. Cette page se met à jour automatiquement.",
  },
  succeeded: {
    icon: CheckCircle2,
    color: "text-success",
    title: "Paiement confirmé — merci !",
    text: "Votre commande est validée. Vos billets sont prêts ci-dessous.",
  },
  failed: {
    icon: XCircle,
    color: "text-danger",
    title: "Le paiement n'a pas abouti",
    text: "Aucun montant n'a été prélevé. Vous pouvez recommencer votre réservation.",
  },
  cancelled: {
    icon: XCircle,
    color: "text-danger",
    title: "Paiement annulé",
    text: "La transaction a été annulée. Vous pouvez recommencer votre réservation.",
  },
  refunded: {
    icon: XCircle,
    color: "text-warning",
    title: "Commande remboursée",
    text: "Ce paiement a été remboursé : les billets associés ne sont plus valides.",
  },
};

function Unavailable() {
  return (
    <Container className="py-24">
      <Card className="mx-auto max-w-lg text-center">
        <CardBody>
          <h1 className="font-display text-3xl text-ivory-50">Service momentanément indisponible</h1>
          <p className="mt-4 text-ivory-300">
            Impossible de récupérer votre commande pour le moment. Réessayez dans
            un instant ou contactez-nous au {EVENT.phoneDisplay}.
          </p>
          <Link href="/" className={buttonStyles({ variant: "outline", className: "mt-8" })}>
            Retour à l&apos;accueil
          </Link>
        </CardBody>
      </Card>
    </Container>
  );
}

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;
  if (!ref || !/^MH-[A-Z0-9]{12}$/.test(ref)) redirect("/billetterie");
  if (!isSupabaseConfigured()) return <Unavailable />;

  let order: OrderRow | null;
  let tickets: TicketRow[] = [];
  try {
    order = await getOrder(ref);
    if (!order) notFound();
    // Filet de sécurité si le webhook tarde.
    order = await reconcileOrder(order);
    if (order.status === "succeeded") tickets = await ensureTickets(order);
  } catch (err) {
    // notFound() lève une erreur spéciale qu'il faut laisser remonter.
    if (err && typeof err === "object" && "digest" in err) throw err;
    console.error("[confirmation]", err instanceof Error ? err.message : err);
    return <Unavailable />;
  }

  const view = STATUS_VIEW[order.status];
  const StatusIcon = view.icon;
  const baseUrl = resolveBaseUrl(await headers());

  const qrs = await Promise.all(
    tickets.map((t) =>
      QRCode.toString(`${baseUrl}/admin?code=${encodeURIComponent(t.code)}`, {
        type: "svg",
        margin: 1,
        errorCorrectionLevel: "M",
        color: { dark: "#0a0806", light: "#f3ecdb" },
      }),
    ),
  );

  return (
    <div className="bg-spotlight">
      <Container className="max-w-4xl py-14 sm:py-20">
        <div className="no-print text-center">
          <StatusIcon className={`mx-auto ${view.color}`} size={56} strokeWidth={1.3} />
          <h1 className="mt-6 font-display text-4xl leading-tight text-ivory-50 sm:text-5xl">
            {view.title}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-[17px] leading-relaxed text-ivory-300">
            {view.text}
          </p>
          {order.status === "pending" ? (
            <div className="mt-8">
              <OrderPoller orderRef={order.order_reference} />
            </div>
          ) : null}
        </div>

        {/* Billets */}
        {order.status === "succeeded" ? (
          <section className="mt-12 space-y-8" aria-label="Vos billets">
            {tickets.map((t, i) => (
              <TicketCard
                key={t.id}
                ticket={t}
                holder={order.customer_name}
                qrSvg={qrs[i]}
                index={i + 1}
                total={tickets.length}
              />
            ))}
            {tickets.length < order.ticket_count ? (
              <p className="text-center text-sm text-ivory-400">
                Génération des billets en cours — actualisez la page dans un instant.
              </p>
            ) : null}
          </section>
        ) : null}

        {/* Récapitulatif */}
        <Card className="no-print mx-auto mt-12 max-w-xl">
          <CardBody>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl text-ivory-50">Votre commande</h2>
              <Badge
                tone={
                  order.status === "succeeded"
                    ? "success"
                    : order.status === "pending"
                      ? "warning"
                      : "danger"
                }
              >
                {order.status === "succeeded"
                  ? "Payée"
                  : order.status === "pending"
                    ? "En attente"
                    : order.status === "refunded"
                      ? "Remboursée"
                      : "Non payée"}
              </Badge>
            </div>

            <dl className="mt-6 space-y-3 text-[15px]">
              <div className="flex justify-between gap-4">
                <dt className="text-ivory-400">Référence</dt>
                <dd className="font-mono tracking-wider text-gold-200">{order.order_reference}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-ivory-400">Titulaire</dt>
                <dd className="text-right text-ivory-50">{order.customer_name}</dd>
              </div>
              {order.items.map((item) => (
                <div key={item.type} className="flex justify-between gap-4">
                  <dt className="text-ivory-400">
                    {item.name} × {item.quantity}
                  </dt>
                  <dd className="tabular-nums text-ivory-50">
                    {formatXOF(item.unitPrice * item.quantity)}
                  </dd>
                </div>
              ))}
              <div className="flex justify-between gap-4 border-t border-gold-500/20 pt-4">
                <dt className="font-medium text-ivory-100">Total</dt>
                <dd className="font-display text-2xl font-semibold tabular-nums text-gold-gradient">
                  {formatXOF(order.amount_total)}
                </dd>
              </div>
            </dl>

            <p className="mt-6 text-xs leading-relaxed text-ivory-500">
              Conservez cette page : elle est votre accès à vos billets. Une
              question ? Appelez-nous au {EVENT.phoneDisplay} avec votre référence.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {order.status === "succeeded" ? <PrintButton /> : null}
              {order.status === "failed" || order.status === "cancelled" ? (
                <Link href="/billetterie" className={buttonStyles()}>
                  Recommencer ma réservation
                </Link>
              ) : null}
              <Link href="/" className={buttonStyles({ variant: "ghost" })}>
                Retour à l&apos;accueil
              </Link>
            </div>
          </CardBody>
        </Card>
      </Container>
    </div>
  );
}
