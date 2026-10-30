import Link from "next/link";
import { buttonStyles } from "@/components/ui/button";
import { Container } from "@/components/ui/section";
import { Ornament } from "@/components/ui/ornament";

export default function NotFound() {
  return (
    <Container className="flex min-h-[60dvh] flex-col items-center justify-center py-24 text-center">
      <p className="font-display text-8xl font-bold text-gold-gradient">404</p>
      <Ornament className="mt-6" />
      <h1 className="mt-6 font-display text-3xl text-ivory-50">Page introuvable</h1>
      <p className="mt-3 max-w-md text-ivory-300">
        Cette page n&apos;existe pas ou la commande demandée est introuvable.
      </p>
      <Link href="/" className={buttonStyles({ className: "mt-10" })}>
        Retour à l&apos;accueil
      </Link>
    </Container>
  );
}
