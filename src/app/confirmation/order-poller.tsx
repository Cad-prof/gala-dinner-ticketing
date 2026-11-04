"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

/**
 * Tant que la commande est `pending`, interroge l'API toutes les 4 s (le
 * webhook Wave peut mettre quelques secondes à arriver) puis rafraîchit
 * la page dès que le statut change. S'arrête après 3 minutes.
 */
export function OrderPoller({ orderRef }: { orderRef: string }) {
  const router = useRouter();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    let stopped = false;
    const startedAt = Date.now();

    async function check() {
      try {
        const res = await fetch(`/api/orders/${orderRef}`, { cache: "no-store" });
        if (res.ok) {
          const data = (await res.json()) as { status?: string };
          if (data.status && data.status !== "pending") {
            stopped = true;
            router.refresh();
            return;
          }
        }
      } catch {
        /* réseau instable : on réessaie au prochain tour */
      }
      if (!stopped && Date.now() - startedAt > 180_000) {
        stopped = true;
        setTimedOut(true);
      }
    }

    const id = setInterval(() => {
      if (!stopped) void check();
      else clearInterval(id);
    }, 4000);
    void check();

    return () => {
      stopped = true;
      clearInterval(id);
    };
  }, [orderRef, router]);

  if (timedOut) {
    return (
      <p className="text-sm leading-relaxed text-ivory-300">
        Votre paiement n&apos;est pas encore confirmé. Actualisez cette page dans
        quelques minutes. Si vous avez été débité, contactez-nous en indiquant
        votre référence.
      </p>
    );
  }

  return (
    <p className="flex items-center justify-center gap-3 text-sm text-ivory-300">
      <Loader2 size={16} className="animate-spin text-gold-400" />
      Confirmation du paiement en cours…
    </p>
  );
}
