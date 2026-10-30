import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** Erreur de configuration (variables d'environnement manquantes). */
export class ConfigError extends Error {}

function readConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  return { url, key };
}

export function isSupabaseConfigured(): boolean {
  const { url, key } = readConfig();
  return Boolean(url && key);
}

let client: SupabaseClient | null = null;

/**
 * Client Supabase côté serveur (clé secrète → contourne la RLS).
 * `import "server-only"` fait échouer le build si ce module est importé
 * depuis un composant client : la clé ne peut pas fuiter vers le navigateur.
 * Instancié paresseusement pour que le build ne dépende pas des secrets.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (client) return client;
  const { url, key } = readConfig();
  if (!url || !key) {
    throw new ConfigError(
      "Supabase n'est pas configuré (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SECRET_KEY).",
    );
  }
  client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}
