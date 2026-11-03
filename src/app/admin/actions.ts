"use server";

import { redirect } from "next/navigation";
import {
  createAdminSession,
  destroyAdminSession,
  isAdmin,
  isAdminConfigured,
  passwordMatches,
} from "@/lib/admin-auth";
import { getOrder } from "@/lib/orders";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { TicketRow } from "@/lib/types";

function cleanCode(value: FormDataEntryValue | null): string {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .slice(0, 32);
}

function withCode(path: string, code: string, extra = ""): string {
  const params = new URLSearchParams();
  if (code) params.set("code", code);
  const base = params.toString();
  const query = [base, extra].filter(Boolean).join("&");
  return query ? `${path}?${query}` : path;
}

export async function loginAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const code = cleanCode(formData.get("code"));

  if (!isAdminConfigured() || !passwordMatches(password)) {
    // Ralentit les tentatives par force brute.
    await new Promise((resolve) => setTimeout(resolve, 800));
    redirect(withCode("/admin", code, "error=credentials"));
  }

  try {
    await createAdminSession();
  } catch (err) {
    console.error(
      "[admin/login] session:",
      err instanceof Error ? err.message : "Unknown session error",
    );
    redirect(withCode("/admin", code, "error=session"));
  }
  redirect(withCode("/admin", code));
}

export async function logoutAction() {
  await destroyAdminSession();
  redirect("/admin");
}

/** Valide l'entrée d'un billet (une seule fois, uniquement si la commande est payée). */
export async function checkInAction(formData: FormData) {
  if (!(await isAdmin())) redirect("/admin");

  const code = cleanCode(formData.get("code"));
  if (!code) redirect("/admin");

  let result: "ok" | "already" | "error" | "notFound" | "invalid" | null = null;

  try {
    const db = getSupabaseAdmin();
    const { data: ticket, error: ticketError } = await db
      .from("tickets")
      .select("*")
      .eq("code", code)
      .maybeSingle<TicketRow>();
    if (ticketError) throw ticketError;
    if (!ticket) {
      result = "notFound";
    } else {
      const order = await getOrder(ticket.order_reference);
      if (!order || order.status !== "succeeded") {
        result = "invalid";
      } else {
        // Mise à jour conditionnelle : deux scans simultanés ne valident qu'une fois.
        const { data: updated, error } = await db
          .from("tickets")
          .update({ checked_in_at: new Date().toISOString() })
          .eq("id", ticket.id)
          .is("checked_in_at", null)
          .select("id");

        if (error) throw error;
        result = updated && updated.length > 0 ? "ok" : "already";
      }
    }
  } catch (err) {
    console.error(
      "[admin/check-in]",
      err instanceof Error ? err.message : "Unknown check-in error",
    );
    result = "error";
  }

  if (result === "notFound" || result === "invalid") {
    redirect(withCode("/admin", code));
  }
  redirect(withCode("/admin", code, `result=${result ?? "error"}`));
}
