import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "mb-2 block text-[11px] font-medium uppercase tracking-[0.22em] text-gold-300/90",
        className,
      )}
      {...props}
    />
  );
}

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-13 w-full rounded-xl border border-gold-500/20 bg-ink-900/80 px-4 text-[15px] text-ivory-50 placeholder:text-ivory-500 transition-colors",
        "hover:border-gold-500/40 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-400/20",
        className,
      )}
      {...props}
    />
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? (
        <p className="mt-2 text-[13px] text-danger" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-2 text-[13px] text-ivory-400">{hint}</p>
      ) : null}
    </div>
  );
}
