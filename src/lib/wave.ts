import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { ConfigError } from "@/lib/supabase";
import type { WaveCheckoutSession } from "@/lib/types";

const DEFAULT_API_BASE_URL = "https://api.wave.com";

export class WaveRequestError extends Error {
  constructor(
    message: string,
    readonly ambiguous = false,
  ) {
    super(message);
    this.name = "WaveRequestError";
  }
}

function apiKey(): string {
  const key = process.env.WAVE_API_KEY;
  if (!key) throw new ConfigError("Wave n'est pas configuré (WAVE_API_KEY).");
  return key;
}

function apiSigningSecret(): string {
  const secret = process.env.WAVE_API_SIGNING_SECRET;
  if (!secret) {
    throw new ConfigError("Wave n'est pas configuré (WAVE_API_SIGNING_SECRET).");
  }
  return secret;
}

function apiBaseUrl(): string {
  const baseUrl = process.env.WAVE_API_BASE_URL ?? DEFAULT_API_BASE_URL;
  const parsed = new URL(baseUrl);
  if (parsed.protocol !== "https:" && parsed.hostname !== "localhost") {
    throw new ConfigError("WAVE_API_BASE_URL doit utiliser HTTPS.");
  }
  return baseUrl.replace(/\/+$/, "");
}

export function isWaveConfigured(): boolean {
  return Boolean(
    process.env.WAVE_API_KEY &&
      process.env.WAVE_API_SIGNING_SECRET &&
      process.env.WAVE_WEBHOOK_SECRET,
  );
}

function safeEqualHex(expected: string, actual: string): boolean {
  if (!/^[\da-f]{64}$/i.test(actual)) return false;
  const expectedBytes = Buffer.from(expected, "hex");
  const actualBytes = Buffer.from(actual, "hex");
  return expectedBytes.length === actualBytes.length && timingSafeEqual(expectedBytes, actualBytes);
}

export function verifyWaveWebhookSignature(
  headers: Headers,
  rawBody: string,
  nowSeconds = Math.floor(Date.now() / 1000),
): boolean {
  const secret = process.env.WAVE_WEBHOOK_SECRET;
  if (!secret) throw new ConfigError("Wave n'est pas configuré (WAVE_WEBHOOK_SECRET).");

  const header = headers.get("wave-signature");
  if (!header) return false;

  const fields = header.split(",").map((part) => part.trim().split("=", 2));
  const timestampText = fields.find(([key]) => key === "t")?.[1];
  const signatures = fields.filter(([key]) => key === "v1").map(([, value]) => value);
  if (!timestampText || !/^\d+$/.test(timestampText) || signatures.length === 0) return false;

  const timestamp = Number(timestampText);
  if (!Number.isSafeInteger(timestamp) || timestamp < nowSeconds - 300 || timestamp > nowSeconds + 30) {
    return false;
  }

  const expected = createHmac("sha256", secret)
    .update(`${timestampText}${rawBody}`)
    .digest("hex");
  return signatures.some((signature) => safeEqualHex(expected, signature));
}

async function request<T>(path: string, method: "GET" | "POST", body?: string): Promise<T> {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const url = `${apiBaseUrl()}${path}`;
  const key = apiKey();
  const signature = createHmac("sha256", apiSigningSecret())
    .update(`${timestamp}${body ?? ""}`)
    .digest("hex");

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "Wave-Signature": `t=${timestamp},v1=${signature}`,
      },
      ...(body === undefined ? {} : { body }),
      cache: "no-store",
      signal: AbortSignal.timeout(method === "POST" ? 12_000 : 8_000),
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : "erreur réseau inconnue";
    throw new WaveRequestError(
      `Wave ${method} ${path}: ${reason}`,
      method === "POST",
    );
  }

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as
      | { code?: string; message?: string }
      | null;
    throw new WaveRequestError(
      `Wave ${method} ${path} ${response.status}: ${error?.code ?? error?.message ?? "erreur inconnue"}`,
      method === "POST" && response.status >= 500,
    );
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new WaveRequestError(
      `Wave ${method} ${path}: réponse JSON invalide`,
      method === "POST",
    );
  }
}

function assertSessionMatches(
  session: WaveCheckoutSession,
  expected?: { amount: number; clientReference: string },
): void {
  if (
    !session ||
    typeof session.id !== "string" ||
    !session.id.startsWith("cos-") ||
    typeof session.amount !== "string" ||
    typeof session.wave_launch_url !== "string" ||
    !["open", "complete", "expired"].includes(session.checkout_status) ||
    !["processing", "cancelled", "succeeded"].includes(session.payment_status)
  ) {
    throw new WaveRequestError("Wave a renvoyé une session de checkout invalide.", Boolean(expected));
  }

  if (
    expected &&
    (session.amount !== String(expected.amount) ||
      session.currency !== "XOF" ||
      session.client_reference !== expected.clientReference)
  ) {
    throw new WaveRequestError(
      "Les données de la session Wave ne correspondent pas à la commande.",
      true,
    );
  }

  try {
    const checkoutUrl = new URL(session.wave_launch_url);
    if (checkoutUrl.protocol !== "https:" || checkoutUrl.hostname !== "pay.wave.com") {
      throw new WaveRequestError(
        "Wave a renvoyé une URL de paiement invalide.",
        Boolean(expected),
      );
    }
  } catch (error) {
    if (error instanceof WaveRequestError) throw error;
    throw new WaveRequestError("Wave a renvoyé une URL de paiement invalide.", Boolean(expected));
  }
}

export async function createCheckoutSession(input: {
  amount: number;
  clientReference: string;
  successUrl: string;
  errorUrl: string;
}): Promise<WaveCheckoutSession> {
  const body = JSON.stringify({
    amount: String(input.amount),
    currency: "XOF",
    client_reference: input.clientReference,
    success_url: input.successUrl,
    error_url: input.errorUrl,
  });
  const session = await request<WaveCheckoutSession>("/v1/checkout/sessions", "POST", body);
  assertSessionMatches(session, {
    amount: input.amount,
    clientReference: input.clientReference,
  });
  return session;
}

export async function retrieveCheckoutSession(
  sessionId: string,
): Promise<WaveCheckoutSession> {
  const session = await request<WaveCheckoutSession>(
    `/v1/checkout/sessions/${encodeURIComponent(sessionId)}`,
    "GET",
  );
  assertSessionMatches(session);
  return session;
}

export async function findCheckoutSessionsByReference(
  clientReference: string,
  expectedAmount: number,
): Promise<WaveCheckoutSession[]> {
  const response = await request<{ result: WaveCheckoutSession[] }>(
    `/v1/checkout/sessions/search?client_reference=${encodeURIComponent(clientReference)}`,
    "GET",
  );
  if (!Array.isArray(response.result)) {
    throw new WaveRequestError("Wave a renvoyé une liste de sessions invalide.");
  }
  for (const session of response.result) {
    assertSessionMatches(session, { amount: expectedAmount, clientReference });
  }
  return response.result;
}