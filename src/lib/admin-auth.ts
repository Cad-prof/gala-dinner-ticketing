import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { cookies, headers } from "next/headers";

const COOKIE = "mh_admin";
const MAX_AGE = 60 * 60 * 12; // 12 h

function digest(key: string, data: string): Buffer {
  return createHmac("sha256", key).update(data).digest();
}

export function isAdminConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD);
}

/** Jeton de session dérivé du mot de passe (aucune donnée en base). */
function sessionToken(): string | null {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return null;
  return digest(password, "mboro-horizons:admin-session:v1").toString("hex");
}

/** Comparaison à temps constant (hachage préalable → longueurs égales). */
export function passwordMatches(input: string): boolean {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return false;
  return timingSafeEqual(digest("cmp", input), digest("cmp", password));
}

export async function isAdmin(): Promise<boolean> {
  const expected = sessionToken();
  if (!expected) return false;
  const value = (await cookies()).get(COOKIE)?.value;
  if (!value) return false;
  const a = Buffer.from(value);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function createAdminSession(): Promise<void> {
  const token = sessionToken();
  if (!token) return;
  const proto = (await headers()).get("x-forwarded-proto");
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: proto === "https",
    path: "/admin",
    maxAge: MAX_AGE,
  });
}

export async function destroyAdminSession(): Promise<void> {
  (await cookies()).delete({ name: COOKIE, path: "/admin" });
}
