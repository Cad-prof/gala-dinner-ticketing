import { NextRequest, NextResponse } from "next/server";
import {
  createCheckoutSession,
  findCheckoutSessionsByReference,
  isWaveConfigured,
  WaveRequestError,
} from "@/lib/wave";
import {
  applyPaymentResult,
  consumeCheckoutAttempt,
  OrderValidationError,
  attachCharge,
  createPendingOrder,
  markOrderFailed,
  parseCart,
  parseCustomer,
} from "@/lib/orders";
import { ConfigError, isSupabaseConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * 1. valide le panier + les coordonnées ;
 * 2. recalcule le montant côté serveur et enregistre la commande `pending`
 *    dans Supabase ;
 * 3. crée une session Wave et renvoie l'URL du checkout hébergé.
 */
export async function POST(request: NextRequest) {
  let orderReference: string | null = null;
  let preservePendingOrder = false;

  try {
    const body = (await request.json().catch(() => null)) as {
      items?: unknown;
      customer?: unknown;
    } | null;
    if (!body) {
      throw new OrderValidationError("Requête invalide.");
    }

    const cart = parseCart(body.items);
    const customer = parseCustomer(body.customer);

    if (!isSupabaseConfigured() || !isWaveConfigured()) {
      throw new ConfigError("Le paiement en ligne n'est pas encore configuré.");
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    if (!baseUrl) {
      throw new ConfigError("NEXT_PUBLIC_BASE_URL doit être configurée pour Wave.");
    }
    const parsedBaseUrl = new URL(baseUrl);
    if (
      parsedBaseUrl.protocol !== "https:" ||
      parsedBaseUrl.username ||
      parsedBaseUrl.password ||
      parsedBaseUrl.search ||
      parsedBaseUrl.hash
    ) {
      throw new ConfigError("Wave nécessite une URL publique HTTPS valide (NEXT_PUBLIC_BASE_URL).");
    }

    if (!(await consumeCheckoutAttempt(customer))) {
      return NextResponse.json(
        { error: "Trop de tentatives de paiement. Veuillez réessayer dans 15 minutes." },
        { status: 429, headers: { "Retry-After": "900" } },
      );
    }

    const order = await createPendingOrder(cart, customer);
    orderReference = order.orderReference;

    const resultUrl = `${baseUrl.replace(/\/+$/, "")}/confirmation?ref=${order.orderReference}`;
    let session;
    try {
      session = await createCheckoutSession({
        amount: order.amountTotal,
        clientReference: order.orderReference,
        successUrl: resultUrl,
        errorUrl: resultUrl,
      });
    } catch (error) {
      if (!(error instanceof WaveRequestError) || !error.ambiguous) throw error;

      preservePendingOrder = true;
      const sessions = await findCheckoutSessionsByReference(
        order.orderReference,
        order.amountTotal,
      ).catch(() => []);
      if (sessions.length !== 1 || sessions[0].checkout_status !== "open") throw error;
      session = sessions[0];
    }

    preservePendingOrder = true;
    await attachCharge(order.orderReference, session.id);

    if (session.checkout_status === "complete" && session.payment_status === "succeeded") {
      await applyPaymentResult(order.orderReference, "succeeded", {
        transactionId: session.transaction_id ?? undefined,
        amount: Number(session.amount),
        currency: session.currency,
      });
      return NextResponse.json({ paymentUrl: resultUrl, orderReference: order.orderReference });
    }

    return NextResponse.json({
      paymentUrl: session.wave_launch_url,
      orderReference: order.orderReference,
    });
  } catch (err) {
    if (err instanceof OrderValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    if (err instanceof ConfigError) {
      console.error("[checkout] configuration:", err.message);
      return NextResponse.json(
        {
          error:
            "Le paiement en ligne est momentanément indisponible. Contactez-nous au +221 78 015 58 36.",
        },
        { status: 503 },
      );
    }

    console.error("[checkout]", err instanceof Error ? err.message : err);
    if (orderReference && !preservePendingOrder) {
      await markOrderFailed(orderReference).catch((cleanupError) => {
        console.error(
          "[checkout] failed to mark order as failed:",
          cleanupError instanceof Error ? cleanupError.message : "Unknown error",
        );
      });
    }
    return NextResponse.json(
      {
        error:
          "Impossible d'initier le paiement pour le moment. Veuillez réessayer dans un instant.",
      },
      { status: 502 },
    );
  }
}
