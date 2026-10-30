import { NextResponse } from "next/server";
import { getOrder, reconcileOrder } from "@/lib/orders";

export const dynamic = "force-dynamic";

/** Statut d'une commande (interrogé par la page de confirmation). */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ ref: string }> },
) {
  const { ref } = await params;
  if (!/^MH-[A-Z0-9]{12}$/.test(ref)) {
    return NextResponse.json({ error: "Référence invalide." }, { status: 400 });
  }

  try {
    const order = await getOrder(ref);
    if (!order) {
      return NextResponse.json({ error: "Commande introuvable." }, { status: 404 });
    }
    const current = await reconcileOrder(order);
    return NextResponse.json(
      { status: current.status },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    console.error("[orders/status]", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Service indisponible." }, { status: 503 });
  }
}
