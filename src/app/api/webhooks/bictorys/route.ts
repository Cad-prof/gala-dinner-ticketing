import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/bictorys";
import {
  applyPaymentResult,
  logPaymentEvent,
  mapProviderStatus,
} from "@/lib/orders";
import { ConfigError } from "@/lib/supabase";
import type { BictorysWebhookPayload } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * Webhook Bictorys — SEULE source de vérité pour valider un paiement.
 * Déclarer dans le dashboard Bictorys : https://VOTRE-DOMAINE/api/webhooks/bictorys
 * Répond 200 dès que l'événement est traité (Bictorys retente sur non-2xx).
 */
export async function POST(request: NextRequest) {
  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch (err) {
    console.error(
      "[bictorys/webhook] body read:",
      err instanceof Error ? err.message : "Unknown error",
    );
    return new NextResponse(null, { status: 500 });
  }

  try {
    if (!verifyWebhookSignature(request.headers, rawBody)) {
      console.error("[bictorys/webhook] signature invalide — requête ignorée");
      return new NextResponse(null, { status: 401 });
    }
  } catch (err) {
    if (err instanceof ConfigError) {
      console.error("[bictorys/webhook]", err.message);
      return new NextResponse(null, { status: 503 });
    }
    console.error(
      "[bictorys/webhook] signature verification:",
      err instanceof Error ? err.message : "Unknown error",
    );
    return new NextResponse(null, { status: 500 });
  }

  let payload: BictorysWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as BictorysWebhookPayload;
  } catch {
    console.error("[bictorys/webhook] JSON invalide");
    return new NextResponse(null, { status: 200 });
  }

  try {
    // Journal brut (audit) — n'empêche jamais le traitement.
    await logPaymentEvent(payload.paymentReference, payload.status, payload, undefined, "bictorys").catch((err) => {
      console.error(
        "[bictorys/webhook] event logging:",
        err instanceof Error ? err.message : "Unknown error",
      );
    });

    const next = mapProviderStatus(payload.status);
    if (!next || !payload.paymentReference) {
      return new NextResponse(null, { status: 200 });
    }

    const result = await applyPaymentResult(payload.paymentReference, next, {
      transactionId: payload.id,
      amount: payload.amount,
      currency: payload.currency,
    });

    if (result === "unknown") {
      console.error("[bictorys/webhook] paymentReference inconnue:", payload.paymentReference);
    }
    return new NextResponse(null, { status: 200 });
  } catch (err) {
    // Erreur transitoire (ex. Supabase) → 500 pour que Bictorys réessaie.
    console.error("[bictorys/webhook] traitement:", err instanceof Error ? err.message : err);
    return new NextResponse(null, { status: 500 });
  }
}
