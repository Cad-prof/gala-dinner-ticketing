import Link from "next/link";
import { Menu } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { buttonStyles } from "@/components/ui/button";

const links = [
  { href: "/#evenement", label: "L'événement" },
  { href: "/#billets", label: "Billets" },
  { href: "/#deroulement", label: "Réservation" },
  { href: "/#infos", label: "Infos pratiques" },
];

export function Navbar() {
  return (
    <header className="no-print sticky top-0 z-50 border-b border-gold-500/15 bg-ink-950/75 backdrop-blur-xl">
      <div className="mx-auto flex h-18 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link href="/" aria-label="Mboro Horizons — accueil">
          <Logo compact />
        </Link>

        <nav className="hidden items-center gap-9 md:flex" aria-label="Principal">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-[12px] uppercase tracking-[0.24em] text-ivory-300 transition-colors hover:text-gold-200"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/billetterie"
            className={buttonStyles({ size: "sm", className: "hidden sm:inline-flex" })}
          >
            Réserver
          </Link>

          {/* Menu mobile sans JavaScript */}
          <details className="group relative md:hidden">
            <summary
              className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-full border border-gold-500/30 text-gold-200 [&::-webkit-details-marker]:hidden"
              aria-label="Ouvrir le menu"
            >
              <Menu size={18} />
            </summary>
            <div className="absolute right-0 top-13 w-64 rounded-2xl border border-gold-500/25 bg-ink-900/95 p-3 shadow-card backdrop-blur-xl">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="block rounded-xl px-4 py-3 text-[13px] uppercase tracking-[0.2em] text-ivory-200 hover:bg-gold-500/10 hover:text-gold-100"
                >
                  {l.label}
                </Link>
              ))}
              <Link
                href="/billetterie"
                className={buttonStyles({ size: "md", className: "mt-2 w-full" })}
              >
                Réserver ma place
              </Link>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
