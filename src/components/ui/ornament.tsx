import { cn } from "@/lib/utils";

/** Filet doré orné d'un fleuron — rappel de l'affiche. */
export function Ornament({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-4 text-gold-400",
        className,
      )}
      aria-hidden
    >
      <span className="h-px w-16 bg-linear-to-r from-transparent to-gold-400/80 sm:w-28" />
      <svg
        width="64"
        height="22"
        viewBox="0 0 64 22"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      >
        <path d="M32 3.5 36.5 11 32 18.5 27.5 11Z" fill="currentColor" />
        <path d="M26 11C21 11 19 6 14 6 10 6 8 9 10 11.5 11.7 13.5 15 12.6 14.6 10.4" />
        <path d="M38 11C43 11 45 6 50 6 54 6 56 9 54 11.5 52.3 13.5 49 12.6 49.4 10.4" />
        <path d="M26 11C21 11 19 16 14 16 10 16 8 13 10 10.5" opacity="0.55" />
        <path d="M38 11C43 11 45 16 50 16 54 16 56 13 54 10.5" opacity="0.55" />
      </svg>
      <span className="h-px w-16 bg-linear-to-l from-transparent to-gold-400/80 sm:w-28" />
    </div>
  );
}
