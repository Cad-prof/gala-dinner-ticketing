import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "gold" | "outline" | "ghost" | "dark";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2.5 rounded-full font-medium uppercase tracking-[0.16em] whitespace-nowrap transition-all duration-300 disabled:pointer-events-none disabled:opacity-50 select-none";

const variants: Record<ButtonVariant, string> = {
  gold: "bg-gold-gradient text-ink-950 shadow-gold hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0",
  outline:
    "border border-gold-500/50 text-gold-200 hover:border-gold-300 hover:bg-gold-500/10 hover:text-gold-100",
  ghost: "text-ivory-200 hover:text-gold-200",
  dark: "bg-ink-700 text-ivory-100 border border-gold-500/20 hover:border-gold-500/50",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-10 px-5 text-[11px]",
  md: "h-12 px-7 text-xs",
  lg: "h-14 px-10 text-[13px]",
};

/** Classes de bouton réutilisables sur un <Link> ou <a>. */
export function buttonStyles({
  variant = "gold",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}): string {
  return cn(base, variants[variant], sizes[size], className);
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({
  variant,
  size,
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonStyles({ variant, size, className })}
      {...props}
    />
  );
}
