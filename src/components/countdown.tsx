"use client";

import { useEffect, useState } from "react";

function diff(target: number) {
  const ms = Math.max(0, target - Date.now());
  return {
    days: Math.floor(ms / 86_400_000),
    hours: Math.floor((ms / 3_600_000) % 24),
    minutes: Math.floor((ms / 60_000) % 60),
    seconds: Math.floor((ms / 1000) % 60),
    done: ms === 0,
  };
}

export function Countdown({ targetISO }: { targetISO: string }) {
  const target = new Date(targetISO).getTime();
  // Premier rendu neutre pour éviter tout décalage d'hydratation.
  const [t, setT] = useState<ReturnType<typeof diff> | null>(null);

  useEffect(() => {
    const tick = () => setT(diff(target));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  const cells = [
    { label: "Jours", value: t?.days },
    { label: "Heures", value: t?.hours },
    { label: "Minutes", value: t?.minutes },
    { label: "Secondes", value: t?.seconds },
  ];

  return (
    <div
      className="flex items-stretch justify-center gap-3 sm:gap-5"
      role="timer"
      aria-label="Compte à rebours avant le Dîner de Gala"
    >
      {cells.map((c, i) => (
        <div key={c.label} className="flex items-center gap-3 sm:gap-5">
          <div className="min-w-16 text-center sm:min-w-20">
            <div className="font-display text-4xl font-semibold tabular-nums text-gold-gradient sm:text-5xl">
              {c.value === undefined ? "--" : String(c.value).padStart(2, "0")}
            </div>
            <div className="mt-1 text-[10px] uppercase tracking-[0.3em] text-ivory-400">
              {c.label}
            </div>
          </div>
          {i < cells.length - 1 ? (
            <span className="-mt-5 font-display text-2xl text-gold-600/70">·</span>
          ) : null}
        </div>
      ))}
    </div>
  );
}
