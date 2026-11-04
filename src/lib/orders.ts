import "server-only";
import { createHmac, randomBytes } from "crypto";
import {
  MAX_PER_TYPE,
  MAX_TICKETS_PER_ORDER,
  getTicketType,
  type TicketTypeId,
} from "@/lib/event";
import {
  findCheckoutSessionsByReference,
  retrieveCheckoutSession,
} from "@/lib/wave";
import { verifyTransaction } from "@/lib/bictorys";
import { getSupabaseAdmin } from "@/lib/supabase";
import type {
  CartLine,
  CustomerInput,
  OrderItem,
  OrderRow,
  OrderStatus,
  TicketRow,
} from "@/lib/types";

/** Problème dans les données envoyées par le client → HTTP 400. */
export class OrderValidationError extends Error {}

// ─── Identifiants ─────────────────────────────────────────────────────────

// 32 symboles sans ambiguïté (ni 0/O ni 1/I) ; 256 % 32 = 0 → aucun biais.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomCode(length: number): string {
  return Array.from(randomBytes(length), (b) => ALPHABET[b % ALPHABET.length]).join("");
}

/** Référence de commande : sert aussi de lien privé vers les billets. */
export function generateOrderReference(): string {
  return `MH-${randomCode(12)}`;
}

export function generateTicketCode(): string {
  return `GALA-${randomCode(4)}-${randomCode(4)}`;
}

// ─── Validation des entrées ───────────────────────────────────────────────

export function parseCart(raw: unknown): CartLine[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new OrderValidationError("Sélectionnez au moins un billet.");
  }

  const totals = new Map<TicketTypeId, number>();
  for (const entry of raw) {
    const type = (entry as { type?: unknown })?.type;
    const quantity = (entry as { quantity?: unknown })?.quantity;
    if (typeof type !== "string" || !getTicketType(type)) {
      throw new OrderValidationError("Type de billet inconnu.");
    }
    if (typeof quantity !== "number" || !Number.isInteger(quantity) || quantity < 0) {
      throw new OrderValidationError("Quantité invalide.");
    }
    const id = type as TicketTypeId;
    totals.set(id, (totals.get(id) ?? 0) + quantity);
  }

  const lines: CartLine[] = [];
  let count = 0;
  for (const [type, quantity] of totals) {
    if (quantity === 0) continue;
    if (quantity > MAX_PER_TYPE) {
      throw new OrderValidationError(
        `Maximum ${MAX_PER_TYPE} billets par catégorie et par commande.`,
      );
    }
    count += quantity;
    lines.push({ type, quantity });
  }

  if (lines.length === 0) {
    throw new OrderValidationError("Sélectionnez au moins un billet.");
  }
  if (count > MAX_TICKETS_PER_ORDER) {
    throw new OrderValidationError(
      `Maximum ${MAX_TICKETS_PER_ORDER} billets par commande.`,
    );
  }
  return lines;
}

/** « 78 015 58 36 » → « +221780155836 ». Renvoie null si invalide. */
export function normalizePhone(input: string): string | null {
  let digits = input.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 9) digits = `221${digits}`;
  if (digits.length < 10 || digits.length > 15) return null;
  if (digits.startsWith("221") && digits.length !== 12) return null;
  return `+${digits}`;
}

export function parseCustomer(raw: unknown): CustomerInput {
  const obj = (raw ?? {}) as Record<string, unknown>;
  const name = typeof obj.name === "string" ? obj.name.trim().replace(/\s+/g, " ") : "";
  const email = typeof obj.email === "string" ? obj.email.trim().toLowerCase() : "";
  const phoneRaw = typeof obj.phone === "string" ? obj.phone : "";

  if (name.length < 2 || name.length > 100) {
    throw new OrderValidationError("Indiquez votre nom complet.");
  }
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    throw new OrderValidationError("Adresse e-mail invalide.");
  }
  const phone = normalizePhone(phoneRaw);
  if (!phone) {
    throw new OrderValidationError("Numéro de téléphone invalide (ex. 78 015 58 36).");
  }
  return { name, email, phone };
}

export async function consumeCheckoutAttempt(customer: CustomerInput): Promise<boolean> {
  const secret = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error("Supabase secret key is missing for checkout rate limiting.");

  const fingerprint = (kind: string, value: string) =>
    createHmac("sha256", secret).update(`${kind}:${value}`).digest("hex");
  const { data, error } = await getSupabaseAdmin().rpc("consume_checkout_attempt", {
    p_fingerprints: [
      fingerprint("email", customer.email),
      fingerprint("phone", customer.phone),
    ].sort(),
    p_limit: 5,
    p_window_seconds: 900,
  });
  if (error) throw new Error(`Supabase checkout rate limit: ${error.message}`);
  return data === true;
}

// ─── Statuts ──────────────────────────────────────────────────────────────

/** Compatibility mapping for Bictorys checkouts created before the cutover. */
export function mapProviderStatus(status: string | undefined): OrderStatus | null {
  switch (status) {
    case "succeeded":
      return "succeeded";
    case "failed":
      return "failed";
    case "cancelled":
      return "cancelled";
    case "reversed":
      return "refunded";
    default:
      return null;
  }
}

function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  if (from === to) return false;
  if (from === "pending") return to !== "pending";
  if (from === "failed" || from === "cancelled") return to === "succeeded";
  if (from === "succeeded") return to === "refunded";
  return false;
}

// ─── Accès base de données ────────────────────────────────────────────────

/**
 * Recalcule le prix côté serveur depuis `lib/event.ts` (jamais depuis le
 * client) puis enregistre la commande `pending` dans Supabase.
 */
export async function createPendingOrder(
  cart: CartLine[],
  customer: CustomerInput,
): Promise<{ orderReference: string; amountTotal: number; ticketCount: number }> {
  let amountTotal = 0;
  let ticketCount = 0;
  const items: OrderItem[] = [];

  for (const line of cart) {
    const type = getTicketType(line.type);
    if (!type) throw new OrderValidationError("Type de billet inconnu.");
    amountTotal += type.price * line.quantity;
    ticketCount += line.quantity;
    items.push({
      type: type.id,
      name: type.name,
      unitPrice: type.price,
      quantity: line.quantity,
    });
  }

  const orderReference = generateOrderReference();
  const { error } = await getSupabaseAdmin().from("orders").insert({
    order_reference: orderReference,
    status: "pending",
    currency: "XOF",
    amount_total: amountTotal,
    ticket_count: ticketCount,
    items,
    customer_name: customer.name,
    customer_email: customer.email,
    customer_phone: customer.phone,
    provider: "wave",
  });
  if (error) throw new Error(`Supabase insert orders: ${error.message}`);

  return { orderReference, amountTotal, ticketCount };
}

export async function attachCharge(orderReference: string, chargeId: string) {
  const { error } = await getSupabaseAdmin()
    .from("orders")
    .update({ provider: "wave", provider_charge_id: chargeId })
    .eq("order_reference", orderReference);
  if (error) throw new Error(`Supabase update orders: ${error.message}`);
}

export async function markOrderFailed(orderReference: string) {
  await getSupabaseAdmin()
    .from("orders")
    .update({ status: "failed" })
    .eq("order_reference", orderReference)
    .eq("status", "pending");
}

export async function getOrder(orderReference: string): Promise<OrderRow | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("orders")
    .select("*")
    .eq("order_reference", orderReference)
    .maybeSingle<OrderRow>();
  if (error) throw new Error(`Supabase select orders: ${error.message}`);
  return data;
}

export async function getTickets(orderReference: string): Promise<TicketRow[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("tickets")
    .select("*")
    .eq("order_reference", orderReference)
    .order("seq", { ascending: true })
    .returns<TicketRow[]>();
  if (error) throw new Error(`Supabase select tickets: ${error.message}`);
  return data ?? [];
}

export async function logPaymentEvent(
  orderReference: string | undefined,
  status: string | undefined,
  payload: unknown,
  eventId?: string,
  provider = "wave",
) {
  const { error } = await getSupabaseAdmin().from("payment_events").upsert({
    order_reference: orderReference ?? null,
    provider,
    provider_event_id: eventId ?? null,
    event_status: status ?? null,
    payload,
  }, { onConflict: "provider,provider_event_id", ignoreDuplicates: true });
  if (error) console.error("[orders] payment_events insert:", error.message);
}

/**
 * Émet un billet (code unique + QR) par place payée. Idempotent : la
 * contrainte unique (order_reference, seq) empêche tout doublon, même si le
 * webhook est rejoué ou si deux requêtes arrivent en parallèle.
 */
export async function ensureTickets(order: OrderRow): Promise<TicketRow[]> {
  const existing = await getTickets(order.order_reference);
  if (order.status !== "succeeded" || existing.length >= order.ticket_count) {
    return existing;
  }

  const have = new Set(existing.map((t) => t.seq));
  const rows: Array<Pick<TicketRow, "code" | "order_reference" | "seq" | "ticket_type">> = [];
  let seq = 0;
  for (const item of order.items) {
    for (let n = 0; n < item.quantity; n++) {
      seq += 1;
      if (have.has(seq)) continue;
      rows.push({
        code: generateTicketCode(),
        order_reference: order.order_reference,
        seq,
        ticket_type: item.type,
      });
    }
  }

  if (rows.length > 0) {
    const { error } = await getSupabaseAdmin()
      .from("tickets")
      .upsert(rows, { onConflict: "order_reference,seq", ignoreDuplicates: true });
    if (error) throw new Error(`Supabase upsert tickets: ${error.message}`);
  }
  return getTickets(order.order_reference);
}

export type PaymentResult = "applied" | "ignored" | "mismatch" | "unknown";

/**
 * Applique un résultat de paiement de façon idempotente et sûre :
 * - vérifie montant/devise contre NOTRE commande (anti-falsification) ;
 * - n'autorise que les transitions logiques (pending→*, failed→succeeded,
 *   succeeded→refunded) ; un paiement réussi n'est jamais « dégradé » en échec ;
 * - émet les billets quand la commande passe à `succeeded`.
 */
export async function applyPaymentResult(
  orderReference: string,
  next: OrderStatus,
  meta: { transactionId?: string; amount?: number; currency?: string } = {},
): Promise<PaymentResult> {
  const order = await getOrder(orderReference);
  if (!order) return "unknown";

  if (
    (meta.amount !== undefined && meta.amount !== order.amount_total) ||
    (meta.currency !== undefined && meta.currency !== order.currency)
  ) {
    console.error("[orders] montant/devise incohérents pour", orderReference);
    return "mismatch";
  }

  if (!canTransition(order.status, next)) {
    // Webhook rejoué : s'assurer au passage que les billets existent bien.
    if (order.status === "succeeded") await ensureTickets(order);
    return "ignored";
  }

  const patch: Record<string, unknown> = { status: next };
  if (meta.transactionId) patch.provider_transaction_id = meta.transactionId;
  if (next === "succeeded") patch.paid_at = new Date().toISOString();

  // Mise à jour conditionnelle : si une requête concurrente a déjà changé
  // le statut, celle-ci n'écrase rien.
  const { data, error } = await getSupabaseAdmin()
    .from("orders")
    .update(patch)
    .eq("order_reference", orderReference)
    .eq("status", order.status)
    .select("*")
    .returns<OrderRow[]>();
  if (error) throw new Error(`Supabase update orders: ${error.message}`);

  const updated = data?.[0];
  if (!updated) return "ignored";

  if (next === "succeeded") await ensureTickets(updated);
  return "applied";
}

/**
 * Filet de sécurité si le webhook tarde : interroge Wave de serveur à serveur.
 */
export async function reconcileOrder(order: OrderRow): Promise<OrderRow> {
  if (order.status !== "pending") return order;
  if (Date.now() - new Date(order.created_at).getTime() < 10_000) return order;

  try {
    const now = new Date();
    const { data: claim, error: claimError } = await getSupabaseAdmin()
      .from("orders")
      .update({ provider_checked_at: now.toISOString() })
      .eq("order_reference", order.order_reference)
      .eq("status", "pending")
      .or(`provider_checked_at.is.null,provider_checked_at.lt.${new Date(now.getTime() - 10_000).toISOString()}`)
      .select("order_reference")
      .maybeSingle();
    if (claimError) throw new Error(`Supabase claim provider check: ${claimError.message}`);
    if (!claim) return order;

    if (order.provider === "bictorys") {
      const transactionId = order.provider_transaction_id ?? order.provider_charge_id;
      if (!transactionId) return order;
      const transaction = await verifyTransaction(transactionId);
      if (transaction?.status !== "succeeded") return order;
      const result = await applyPaymentResult(order.order_reference, "succeeded", {
        amount: transaction.amount,
        currency: transaction.currency,
        transactionId: transaction.id,
      });
      return result === "applied" ? (await getOrder(order.order_reference)) ?? order : order;
    }
    if (order.provider && order.provider !== "wave") return order;

    let session;
    if (order.provider_charge_id) {
      session = await retrieveCheckoutSession(order.provider_charge_id);
    } else {
      const sessions = await findCheckoutSessionsByReference(
        order.order_reference,
        order.amount_total,
      );
      if (sessions.length !== 1) return order;
      session = sessions[0];
      await attachCharge(order.order_reference, session.id);
    }

    if (session.client_reference !== order.order_reference) return order;
    if (session.amount !== String(order.amount_total) || session.currency !== order.currency) {
      return order;
    }
    if (session.checkout_status === "expired") {
      await applyPaymentResult(order.order_reference, "cancelled", {
        amount: Number(session.amount),
        currency: session.currency,
      });
      return (await getOrder(order.order_reference)) ?? order;
    }
    if (session.checkout_status !== "complete" || session.payment_status !== "succeeded") {
      return order;
    }

    const result = await applyPaymentResult(order.order_reference, "succeeded", {
      amount: Number(session.amount),
      currency: session.currency,
      transactionId: session.transaction_id ?? undefined,
    });
    if (result === "applied") {
      return (await getOrder(order.order_reference)) ?? order;
    }
  } catch (err) {
    console.warn("[orders] reconcile:", err instanceof Error ? err.message : err);
  }
  return order;
}
