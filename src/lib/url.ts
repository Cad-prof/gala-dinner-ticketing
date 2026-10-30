/**
 * URL publique du site. Priorité : variable d'environnement explicite,
 * puis en-têtes du proxy (x-forwarded-*), puis l'hôte de la requête.
 */
export function resolveBaseUrl(
  headers: { get(name: string): string | null },
  fallbackOrigin?: string,
): string {
  const fromEnv = process.env.SITE_URL ?? process.env.NEXT_PUBLIC_BASE_URL;
  if (fromEnv) return fromEnv.replace(/\/+$/, "");

  const host = headers.get("x-forwarded-host") ?? headers.get("host");
  if (host) {
    const proto =
      headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ??
      (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
    return `${proto}://${host}`;
  }
  return (fallbackOrigin ?? "http://localhost:3000").replace(/\/+$/, "");
}
