/**
 * Bictorys — passerelle de paiement (Sénégal, XOF), checkout hébergé.
 *
 * create_charge  → POST /pay/v1/charges  (clé PUBLIQUE, header X-Api-Key)
 *   → HTTP 202 { link, chargeId, opToken } : on redirige le client vers `link`,
 *     il choisit Wave / Orange Money / Free Money / carte sur la page Bictorys.
 * verify_transaction → GET /pay/v1/transactions/{id}/status (clé PRIVÉE, X-API-Key)
 * webhook → POST /api/webhooks/bictorys (signature HMAC ou X-Secret-Key)
 *
 * Règles critiques :
 * - successRedirectUrl / errorRedirectUrl doivent être en HTTPS (hors localhost),
 *   sinon Bictorys rejette la requête (E400-0).
 * - La redirection du client ne prouve RIEN (falsifiable). Seuls le webhook signé
 *   et la vérification serveur→serveur font foi pour valider une commande.
 * - Le webhook peut arriver plusieurs fois : les traitements sont idempotents.
 */
import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { ConfigError } from "@/lib/supabase";
import type { BictorysCheckoutLink, BictorysError } from "@/lib/types";

function baseUrl(): string {
  // Production par défaut. Sandbox : BICTORYS_API_BASE_URL=https://api.test.bictorys.com
  return process.env.BICTORYS_API_BASE_URL ?? "https://api.bictorys.com";
}

function publicKey(): string {
  const key = process.env.BICTORYS_API_KEY;
  if (!key) throw new ConfigError("Bictorys n'est pas configuré (BICTORYS_API_KEY).");
  return key;
}

function privateKey(): string | null {
  return process.env.BICTORYS_PRIVATE_KEY ?? null;
}

function webhookSecret(): string {
  const secret = process.env.BICTORYS_WEBHOOK_SECRET;
  if (!secret) {
    throw new ConfigError("Bictorys n'est pas configuré (BICTORYS_WEBHOOK_SECRET).");
  }
  return secret;
}

export function isBictorysConfigured(): boolean {
  return Boolean(process.env.BICTORYS_API_KEY);
}

interface CreateChargeInput {
  amount: number;
  paymentReference: string;
  successRedirectUrl: string;
  errorRedirectUrl: string;
  customer: { name: string; email: string; phone: string };
}

export async function createCharge(
  input: CreateChargeInput,
): Promise<BictorysCheckoutLink> {
  const phoneDigits = input.customer.phone.replace(/\D/g, "");

  const response = await fetch(`${baseUrl()}/pay/v1/charges`, {
    method: "POST",
    headers: {
      "X-Api-Key": publicKey(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: input.amount,
      currency: "XOF",
      country: "SN",
      paymentReference: input.paymentReference,
      successRedirectUrl: input.successRedirectUrl,
      errorRedirectUrl: input.errorRedirectUrl,
      customerObject: {
        name: input.customer.name,
        email: input.customer.email,
        country: "SN",
        ...(phoneDigits && { phone: Number(phoneDigits) }),
      },
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });

  if (!response.ok) {
    const error: BictorysError = await response.json().catch(() => ({}));
    throw new Error(
      `Bictorys create_charge ${response.status}: ${error.details ?? error.title ?? "erreur inconnue"}`,
    );
  }

  const data = (await response.json()) as BictorysCheckoutLink;
  if (!data?.link || !data?.chargeId) {
    throw new Error("Bictorys create_charge: réponse inattendue (link/chargeId manquant).");
  }
  return data;
}

export interface TransactionStatus {
  id?: string;
  status?: string;
  amount?: number;
  currency?: string;
  paymentReference?: string;
}

/** Vérification serveur→serveur (clé privée). Renvoie null si indisponible. */
export async function verifyTransaction(
  transactionId: string,
): Promise<TransactionStatus | null> {
  const key = privateKey();
  if (!key) return null;

  const response = await fetch(
    `${baseUrl()}/pay/v1/transactions/${encodeURIComponent(transactionId)}/status`,
    {
      method: "GET",
      headers: { "X-API-Key": key },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    },
  );
  if (!response.ok) return null;
  return (await response.json()) as TransactionStatus;
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

/**
 * Authentifie un webhook Bictorys. Privilégie la signature HMAC
 * (X-Webhook-Signature + X-Webhook-Timestamp, rejet au-delà de 5 min) ;
 * sinon retombe sur l'en-tête X-Secret-Key. Comparaisons à temps constant.
 */
export function verifyWebhookSignature(headers: Headers, rawBody: string): boolean {
  const secret = webhookSecret();
  const signature = headers.get("x-webhook-signature");
  const timestamp = headers.get("x-webhook-timestamp");

  if (signature && timestamp) {
    if (Math.abs(Date.now() - Number(timestamp)) > 300_000) return false;
    const expected = createHmac("sha256", secret)
      .update(`${timestamp}.${rawBody}`)
      .digest("hex");
    return safeEqual(expected, signature);
  }

  const secretHeader = headers.get("x-secret-key");
  if (!secretHeader) return false;
  return safeEqual(secret, secretHeader);
}
