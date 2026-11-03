"use client";

import "./globals.css";
import { buttonStyles } from "@/components/ui/button";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fr">
      <body className="min-h-dvh bg-ink-950 text-ivory-100">
        <main className="flex min-h-dvh flex-col items-center justify-center px-6 py-24 text-center">
          <p className="font-display text-7xl font-bold text-gold-gradient">Oups</p>
          <h1 className="mt-6 font-display text-3xl text-ivory-50">
            Le site rencontre un problème
          </h1>
          <p className="mt-3 max-w-md text-ivory-300">
            Une erreur inattendue empêche l&apos;affichage. Réessayez dans un instant.
          </p>
          <button
            type="button"
            className={buttonStyles({ className: "mt-10" })}
            onClick={reset}
          >
            Réessayer
          </button>
        </main>
      </body>
    </html>
  );
}