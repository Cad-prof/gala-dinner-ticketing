import type { Metadata } from "next";
import { Container, Eyebrow } from "@/components/ui/section";
import { isWaveConfigured } from "@/lib/wave";
import { isSupabaseConfigured } from "@/lib/supabase";
import { getTicketType, type TicketTypeId } from "@/lib/event";
import { CheckoutForm } from "./checkout-form";

export const metadata: Metadata = {
  title: "Billetterie",
  description:
    "Réservez vos billets pour le Dîner de Gala de Mboro Horizons — Prévente 7 000 FCFA, VIP 10 000 FCFA.",
};

export const dynamic = "force-dynamic";

export default async function BilletteriePage({
  searchParams,
}: {
  searchParams: Promise<{ offre?: string }>;
}) {
  const { offre } = await searchParams;
  const initial: TicketTypeId = offre && getTicketType(offre) ? (offre as TicketTypeId) : "prevente";
  const paymentsReady = isSupabaseConfigured() && isWaveConfigured();

  return (
    <div className="bg-spotlight relative">
      <Container className="py-14 sm:py-20">
        <div className="mb-12 max-w-2xl">
          <Eyebrow>Billetterie officielle</Eyebrow>
          <h1 className="mt-4 font-display text-5xl leading-none text-ivory-50 sm:text-6xl">
            Réservez votre <span className="italic text-gold-gradient">soirée</span>
          </h1>
          <p className="mt-5 text-[17px] leading-relaxed text-ivory-300">
            Sélectionnez vos billets, renseignez vos coordonnées, puis réglez en
            toute sécurité. Vos billets s&apos;affichent dès la confirmation du
            paiement.
          </p>
        </div>

        <CheckoutForm initialType={initial} paymentsReady={paymentsReady} />
      </Container>
    </div>
  );
}
