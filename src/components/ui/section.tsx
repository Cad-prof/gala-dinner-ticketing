import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Ornament } from "@/components/ui/ornament";

export function Container({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("mx-auto w-full max-w-6xl px-5 sm:px-8", className)}
      {...props}
    />
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="text-[11px] font-medium uppercase tracking-[0.42em] text-gold-400">
      {children}
    </p>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  align?: "center" | "left";
  className?: string;
}) {
  return (
    <div
      className={cn(
        align === "center" ? "mx-auto text-center" : "text-left",
        "max-w-2xl",
        className,
      )}
    >
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <h2 className="mt-4 font-display text-4xl leading-[1.05] text-ivory-50 sm:text-5xl">
        {title}
      </h2>
      {align === "center" ? <Ornament className="mt-6" /> : null}
      {subtitle ? (
        <p className="mt-5 text-[17px] leading-relaxed text-ivory-300">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
