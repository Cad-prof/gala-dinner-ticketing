import { NextRequest, NextResponse } from "next/server";
import { createCharge, isBictorysConfigured } from "@/lib/bictorys";
import {
  OrderValidationError,
  attachCharge,
  createPendingOrder,
  markOrderFailed,
  parseCart,
  parseCustomer,
} from "@/lib/orders";
import { ConfigError, isSupabaseConfigured } from "@/lib/supabase";
import { resolveBaseUrl } from "@/lib/url";

export const dynamic = "force-dynamic";

/**
 * 1. valide le panier + les coordonnées ;
 * 2. recalcule le montant côté serveur et enregistre la commande `pending`
 *    dans Supabase ;
 * 3. crée le paiement Bictorys et renvoie l'URL du checkout hébergé.
 */
export async function POST(request: NextRequest) {
  let orderReference: string | null = null;

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

    if (!isSupabaseConfigured() || !isBictorysConfigured()) {
      throw new ConfigError("Le paiement en ligne n'est pas encore configuré.");
    }

    const order = await createPendingOrder(cart, customer);
    orderReference = order.orderReference;

    const baseUrl = resolveBaseUrl(request.headers, request.nextUrl.origin);
    const resultUrl = `${baseUrl}/confirmation?ref=${order.orderReference}`;

    const charge = await createCharge({
      amount: order.amountTotal,
      paymentReference: order.orderReference,
      successRedirectUrl: resultUrl,
      errorRedirectUrl: resultUrl,
      customer,
    });

    await attachCharge(order.orderReference, charge.chargeId);

    return NextResponse.json({
      paymentUrl: charge.link,
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
    if (orderReference) await markOrderFailed(orderReference).catch(() => undefined);
    return NextResponse.json(
      {
        error:
          "Impossible d'initier le paiement pour le moment. Veuillez réessayer dans un instant.",
      },
      { status: 502 },
    );
  }
}
