import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Tone = "gold" | "bordeaux" | "success" | "danger" | "neutral" | "warning";

const tones: Record<Tone, string> = {
  gold: "border-gold-400/50 bg-gold-500/10 text-gold-200",
  bordeaux: "border-bordeaux-300/40 bg-bordeaux-500/20 text-[#f1b8c0]",
  success: "border-success/40 bg-success/10 text-success",
  danger: "border-danger/40 bg-danger/10 text-danger",
  warning: "border-warning/40 bg-warning/10 text-warning",
  neutral: "border-ivory-500/40 bg-ink-600/60 text-ivory-300",
};

export function Badge({
  tone = "gold",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-medium uppercase tracking-[0.22em]",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
