import { cn } from "@/lib/utils";

/** Soleil levant sur l'horizon — marque Mboro Horizons. */
export function LogoMark({ className }: { className?: string }) {
  const cx = 100;
  const cy = 52;
  const r = 20;
  const count = 15;
  const pt = (ang: number, rad: number) =>
    `${(cx + rad * Math.cos(ang)).toFixed(2)},${(cy + rad * Math.sin(ang)).toFixed(2)}`;

  const rays = Array.from({ length: count }, (_, i) => {
    const t = i / (count - 1);
    const a = Math.PI + 0.1 + t * (Math.PI - 0.2);
    const long = i % 2 === 0;
    const falloff = 1 - Math.abs(t - 0.5) * 0.4;
    const len = (long ? 44 : 28) * falloff;
    const d = 0.07;
    return `${pt(a - d, r)} ${pt(a, r + len)} ${pt(a + d, r)}`;
  });

  return (
    <svg
      viewBox="0 0 200 76"
      className={cn("text-ivory-50", className)}
      fill="currentColor"
      aria-hidden
    >
      {rays.map((points, i) => (
        <polygon key={i} points={points} />
      ))}
      <path d="M82 52a18 18 0 0 1 36 0Z" />
      <path d="M14 61C52 49 80 60 100 57s56-9 86 4c-34 3-60 1-86 4S50 68 14 61Z" />
    </svg>
  );
}

export function Logo({
  className,
  markClassName,
  compact = false,
}: {
  className?: string;
  markClassName?: string;
  compact?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <LogoMark className={cn(compact ? "h-7" : "h-10", markClassName)} />
      <span
        className={cn(
          "font-display font-bold uppercase leading-none tracking-[0.14em] text-ivory-50",
          compact ? "text-[15px]" : "text-xl",
        )}
      >
        Mboro Horizons
      </span>
    </span>
  );
}
