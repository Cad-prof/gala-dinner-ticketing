import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return Response.json({ ok: false }, { status: 503 });
  }

  try {
    const { error } = await getSupabaseAdmin()
      .from("orders")
      .select("id", { head: true })
      .limit(1);

    if (error) {
      return Response.json({ ok: false }, { status: 503 });
    }

    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false }, { status: 503 });
  }
}
