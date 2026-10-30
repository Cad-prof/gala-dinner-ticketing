import type { Metadata } from "next";
import {
  CheckCircle2,
  LogOut,
  QrCode,
  Search,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Container, Eyebrow } from "@/components/ui/section";
import { isAdmin, isAdminConfigured } from "@/lib/admin-auth";
import { TICKET_TYPES, getTicketType } from "@/lib/event";
import { getOrder } from "@/lib/orders";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import type { OrderRow, OrderStatus, TicketRow } from "@/lib/types";
import { formatDateTime, formatXOF } from "@/lib/utils";
import { checkInAction, loginAction, logoutAction } from "./actions";

export const metadata: Metadata = {
  title: "Espace organisateur",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const STATUS_TONE: Record<OrderStatus, "success" | "warning" | "danger" | "neutral"> = {
  succeeded: "success",
  pending: "warning",
  failed: "danger",
  cancelled: "danger",
  refunded: "neutral",
};

const STATUS_LABEL: Record<OrderStatus, string> = {
  succeeded: "Payée",
  pending: "En attente",
  failed: "Échec",
  cancelled: "Annulée",
  refunded: "Remboursée",
};

function Notice({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Container className="max-w-xl py-24">
      <Card>
        <CardBody className="text-center">
          <ShieldAlert className="mx-auto text-gold-400" size={40} strokeWidth={1.3} />
          <h1 className="mt-5 font-display text-3xl text-ivory-50">{title}</h1>
          <div className="mt-4 text-[15px] leading-relaxed text-ivory-300">{children}</div>
        </CardBody>
      </Card>
    </Container>
  );
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; error?: string; result?: string }>;
}) {
  const { code: rawCode, error, result } = await searchParams;
  const code = rawCode?.trim().toUpperCase().slice(0, 32) ?? "";

  if (!isAdminConfigured()) {
    return (
      <Notice title="Espace organisateur désactivé">
        Définissez la variable d&apos;environnement{" "}
        <code className="rounded bg-ink-600 px-1.5 py-0.5 text-gold-200">ADMIN_PASSWORD</code>{" "}
        pour activer cet espace.
      </Notice>
    );
  }

  if (!(await isAdmin())) {
    return (
      <Container className="max-w-md py-20">
        <Card>
          <CardBody>
            <Eyebrow>Espace organisateur</Eyebrow>
            <h1 className="mt-3 font-display text-4xl text-ivory-50">Connexion</h1>
            <form action={loginAction} className="mt-8 space-y-6">
              {code ? <input type="hidden" name="code" value={code} /> : null}
              <div>
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  autoFocus
                />
                {error ? (
                  <p className="mt-2 text-[13px] text-danger" role="alert">
                    Mot de passe incorrect.
                  </p>
                ) : null}
              </div>
              <Button type="submit" size="lg" className="w-full">
                Se connecter
              </Button>
            </form>
          </CardBody>
        </Card>
      </Container>
    );
  }

  if (!isSupabaseConfigured()) {
    return (
      <Notice title="Supabase non configuré">
        Renseignez <code className="text-gold-200">NEXT_PUBLIC_SUPABASE_URL</code> et{" "}
        <code className="text-gold-200">SUPABASE_SECRET_KEY</code> pour afficher les commandes.
      </Notice>
    );
  }

  const db = getSupabaseAdmin();

  const [ordersRes, checkedInRes] = await Promise.all([
    db
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500)
      .returns<OrderRow[]>(),
    db
      .from("tickets")
      .select("id", { count: "exact", head: true })
      .not("checked_in_at", "is", null),
  ]);

  if (ordersRes.error) {
    return (
      <Notice title="Erreur de base de données">
        {ordersRes.error.message}. Avez-vous exécuté{" "}
        <code className="text-gold-200">supabase/migrations/0001_init.sql</code> ?
      </Notice>
    );
  }

  const orders = ordersRes.data ?? [];
  const paid = orders.filter((o) => o.status === "succeeded");
  const revenue = paid.reduce((sum, o) => sum + o.amount_total, 0);
  const sold = Object.fromEntries(TICKET_TYPES.map((t) => [t.id, 0])) as Record<string, number>;
  for (const o of paid) for (const item of o.items) sold[item.type] = (sold[item.type] ?? 0) + item.quantity;
  const totalSold = Object.values(sold).reduce((a, b) => a + b, 0);
  const pendingCount = orders.filter((o) => o.status === "pending").length;
  const checkedIn = checkedInRes.count ?? 0;

  // Recherche d'un billet (scan du QR ou saisie manuelle).
  let ticket: TicketRow | null = null;
  let ticketOrder: OrderRow | null = null;
  if (code) {
    const { data } = await db
      .from("tickets")
      .select("*")
      .eq("code", code)
      .maybeSingle<TicketRow>();
    ticket = data;
    if (ticket) ticketOrder = await getOrder(ticket.order_reference);
  }
  const ticketValid = ticket && ticketOrder?.status === "succeeded";

  return (
    <Container className="py-12 sm:py-16">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <Eyebrow>Espace organisateur</Eyebrow>
          <h1 className="mt-3 font-display text-5xl text-ivory-50">Tableau de bord</h1>
        </div>
        <form action={logoutAction}>
          <Button type="submit" variant="outline" size="sm">
            <LogOut size={14} /> Déconnexion
          </Button>
        </form>
      </div>

      {/* Contrôle d'entrée */}
      <Card className="mt-10">
        <CardBody>
          <h2 className="flex items-center gap-3 font-display text-3xl text-ivory-50">
            <QrCode className="text-gold-400" size={26} strokeWidth={1.4} /> Contrôle à l&apos;entrée
          </h2>
          <p className="mt-2 text-sm text-ivory-400">
            Scannez le QR code d&apos;un billet avec l&apos;appareil photo du téléphone, ou saisissez son code.
          </p>

          <form method="GET" action="/admin" className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Input
              name="code"
              defaultValue={code}
              placeholder="GALA-XXXX-XXXX"
              className="font-mono uppercase tracking-widest sm:max-w-sm"
              autoComplete="off"
              autoCapitalize="characters"
            />
            <Button type="submit" variant="outline">
              <Search size={15} /> Vérifier
            </Button>
          </form>

          {code ? (
            <div className="mt-8">
              {!ticket ? (
                <div className="flex items-center gap-4 rounded-2xl border border-danger/40 bg-danger/10 p-5">
                  <XCircle className="shrink-0 text-danger" size={32} />
                  <div>
                    <p className="font-display text-2xl text-danger">Billet introuvable</p>
                    <p className="text-sm text-ivory-300">
                      Le code <span className="font-mono">{code}</span> n&apos;existe pas.
                    </p>
                  </div>
                </div>
              ) : !ticketValid ? (
                <div className="flex items-center gap-4 rounded-2xl border border-danger/40 bg-danger/10 p-5">
                  <XCircle className="shrink-0 text-danger" size={32} />
                  <div>
                    <p className="font-display text-2xl text-danger">Billet non valide</p>
                    <p className="text-sm text-ivory-300">
                      Commande {ticketOrder ? STATUS_LABEL[ticketOrder.status].toLowerCase() : "introuvable"}.
                    </p>
                  </div>
                </div>
              ) : ticket.checked_in_at ? (
                <div className="flex items-center gap-4 rounded-2xl border border-warning/40 bg-warning/10 p-5">
                  <XCircle className="shrink-0 text-warning" size={32} />
                  <div>
                    <p className="font-display text-2xl text-warning">
                      {result === "already" ? "Déjà validé à l'instant" : "Billet déjà utilisé"}
                    </p>
                    <p className="text-sm text-ivory-300">
                      Entrée enregistrée le {formatDateTime(ticket.checked_in_at)} —{" "}
                      {ticketOrder?.customer_name}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-success/40 bg-success/10 p-5">
                  <div className="flex items-center gap-4">
                    <CheckCircle2 className="shrink-0 text-success" size={32} />
                    <div>
                      <p className="font-display text-2xl text-success">Billet valide</p>
                      <p className="text-sm text-ivory-200">
                        {ticketOrder?.customer_name} · {getTicketType(ticket.ticket_type)?.name} ·{" "}
                        <span className="font-mono">{ticket.code}</span>
                      </p>
                    </div>
                  </div>
                  <form action={checkInAction} className="mt-5">
                    <input type="hidden" name="code" value={ticket.code} />
                    <Button type="submit" size="lg" className="w-full sm:w-auto">
                      Valider l&apos;entrée
                    </Button>
                  </form>
                </div>
              )}

              {result === "error" ? (
                <p className="mb-4 flex items-center gap-2 text-sm text-danger" role="alert">
                  <XCircle size={16} /> L&apos;entrée n&apos;a pas pu être enregistrée. Réessayez.
                </p>
              ) : null}

              {result === "ok" && ticket?.checked_in_at ? (
                <p className="mt-4 flex items-center gap-2 text-sm text-success">
                  <CheckCircle2 size={16} /> Entrée validée.
                </p>
              ) : null}
            </div>
          ) : null}
        </CardBody>
      </Card>

      {/* Statistiques */}
      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Billets vendus", value: String(totalSold), sub: TICKET_TYPES.map((t) => `${t.name} ${sold[t.id] ?? 0}`).join(" · ") },
          { label: "Recettes", value: formatXOF(revenue), sub: `${paid.length} commande(s) payée(s)` },
          { label: "Entrées validées", value: `${checkedIn}/${totalSold}`, sub: "Billets scannés" },
          { label: "En attente", value: String(pendingCount), sub: "Paiements non confirmés" },
        ].map((s) => (
          <div key={s.label} className="surface rounded-2xl p-5">
            <p className="text-[10px] uppercase tracking-[0.28em] text-gold-400">{s.label}</p>
            <p className="mt-2 font-display text-3xl font-semibold text-gold-gradient sm:text-4xl">
              {s.value}
            </p>
            <p className="mt-1 text-xs text-ivory-500">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Commandes */}
      <Card className="mt-8 overflow-hidden">
        <div className="border-b border-gold-500/15 p-6 sm:p-8">
          <h2 className="font-display text-3xl text-ivory-50">Dernières commandes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-gold-500/15 text-[10px] uppercase tracking-[0.25em] text-gold-400">
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Référence</th>
                <th className="px-6 py-4 font-medium">Client</th>
                <th className="px-6 py-4 font-medium">Billets</th>
                <th className="px-6 py-4 text-right font-medium">Montant</th>
                <th className="px-6 py-4 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gold-500/10">
              {orders.slice(0, 60).map((o) => (
                <tr key={o.id} className="text-ivory-200">
                  <td className="whitespace-nowrap px-6 py-4 text-ivory-400">
                    {formatDateTime(o.created_at)}
                  </td>
                  <td className="px-6 py-4 font-mono text-xs tracking-wider text-gold-200">
                    {o.order_reference}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-ivory-50">{o.customer_name}</p>
                    <p className="text-xs text-ivory-500">
                      {o.customer_phone} · {o.customer_email}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    {o.items.map((i) => `${i.name} ×${i.quantity}`).join(", ")}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right tabular-nums text-ivory-50">
                    {formatXOF(o.amount_total)}
                  </td>
                  <td className="px-6 py-4">
                    <Badge tone={STATUS_TONE[o.status]}>{STATUS_LABEL[o.status]}</Badge>
                  </td>
                </tr>
              ))}
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-ivory-500">
                    Aucune commande pour le moment.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>
    </Container>
  );
}
