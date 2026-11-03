"use client";

import { useEffect } from "react";
import Link from "next/link";
import { buttonStyles } from "@/components/ui/button";
import { Container } from "@/components/ui/section";
import { Ornament } from "@/components/ui/ornament";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app/error]", error.digest ?? "Unhandled route error");
  }, [error]);

  return (
    <Container className="flex min-h-[60dvh] flex-col items-center justify-center py-24 text-center">
      <p className="font-display text-7xl font-bold text-gold-gradient">Oups</p>
      <Ornament className="mt-6" />
      <h1 className="mt-6 font-display text-3xl text-ivory-50">
        Une erreur est survenue
      </h1>
      <p className="mt-3 max-w-md text-ivory-300">
        Cette page n&apos;a pas pu s&apos;afficher. Réessayez dans un instant.
      </p>
      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <button type="button" className={buttonStyles()} onClick={reset}>
          Réessayer
        </button>
        <Link href="/" className={buttonStyles({ variant: "outline" })}>
          Retour à l&apos;accueil
        </Link>
      </div>
    </Container>
  );
}