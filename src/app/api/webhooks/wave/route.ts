import { NextRequest, NextResponse } from "next/server";
import { verifyWaveWebhookSignature } from "@/lib/wave";
import {
  applyPaymentResult,
  attachCharge,
  getOrder,
  logPaymentEvent,
} from "@/lib/orders";
import { ConfigError } from "@/lib/supabase";
import type { WaveWebhookEvent } from "@/lib/types";

export const dynamic = "force-dynamic";
const MAX_WEBHOOK_BYTES = 64 * 1024;

export async function POST(request: NextRequest) {
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_WEBHOOK_BYTES) {
    return new NextResponse(null, { status: 413 });
  }
  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    return new NextResponse(null, { status: 415 });
  }

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch (error) {
    console.error("[wave/webhook] body read:", error instanceof Error ? error.message : error);
    return new NextResponse(null, { status: 500 });
  }
  if (Buffer.byteLength(rawBody, "utf8") > MAX_WEBHOOK_BYTES) {
    return new NextResponse(null, { status: 413 });
  }

  try {
    if (!verifyWaveWebhookSignature(request.headers, rawBody)) {
      return new NextResponse(null, { status: 401 });
    }
  } catch (error) {
    if (error instanceof ConfigError) {
      console.error("[wave/webhook]", error.message);
      return new NextResponse(null, { status: 503 });
    }
    console.error("[wave/webhook] signature verification:", error);
    return new NextResponse(null, { status: 500 });
  }

  let event: WaveWebhookEvent;
  try {
    event = JSON.parse(rawBody) as WaveWebhookEvent;
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  if (
    !event ||
    typeof event.id !== "string" ||
    event.id.length === 0 ||
    event.id.length > 200 ||
    typeof event.type !== "string" ||
    !event.data ||
    typeof event.data !== "object"
  ) {
    return new NextResponse(null, { status: 400 });
  }

  const session = event.data;
  const orderReference = session.client_reference ?? undefined;
  try {
    await logPaymentEvent(orderReference, event.type, event, event.id);

    if (event.type === "checkout.session.payment_failed") {
      return new NextResponse(null, { status: 200 });
    }
    if (
      event.type !== "checkout.session.completed" ||
      session.checkout_status !== "complete" ||
      session.payment_status !== "succeeded" ||
      !orderReference ||
      !/^MH-[A-Z0-9]{12}$/.test(orderReference) ||
      typeof session.id !== "string" ||
      typeof session.amount !== "string" ||
      typeof session.currency !== "string"
    ) {
      return new NextResponse(null, { status: 200 });
    }

    const order = await getOrder(orderReference);
    if (!order || order.provider !== "wave") {
      console.warn("[wave/webhook] order not found or wrong provider:", orderReference);
      return new NextResponse(null, { status: 200 });
    }
    if (order.provider_charge_id && order.provider_charge_id !== session.id) {
      console.warn("[wave/webhook] checkout session mismatch:", orderReference);
      return new NextResponse(null, { status: 200 });
    }
    if (session.amount !== String(order.amount_total) || session.currency !== order.currency) {
      console.error("[wave/webhook] amount/currency mismatch:", orderReference);
      return new NextResponse(null, { status: 200 });
    }
    if (!order.provider_charge_id) await attachCharge(orderReference, session.id);

    const result = await applyPaymentResult(orderReference, "succeeded", {
      transactionId: session.transaction_id ?? undefined,
      amount: Number(session.amount),
      currency: session.currency,
    });
    if (result === "mismatch") {
      console.error("[wave/webhook] amount/currency mismatch:", orderReference);
    }
    return new NextResponse(null, { status: 200 });
  } catch (error) {
    console.error("[wave/webhook] processing:", error instanceof Error ? error.message : error);
    return new NextResponse(null, { status: 500 });
  }
}
