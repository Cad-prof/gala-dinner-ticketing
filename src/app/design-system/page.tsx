import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Button, buttonStyles } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { Logo } from "@/components/ui/logo";
import { Ornament } from "@/components/ui/ornament";
import { Container, Eyebrow, SectionHeading } from "@/components/ui/section";

export const metadata: Metadata = {
  title: "Design system",
  robots: { index: false, follow: false },
};

const palettes: Array<{ name: string; shades: Array<[string, string]> }> = [
  {
    name: "Encre",
    shades: [
      ["ink-950", "bg-ink-950"],
      ["ink-900", "bg-ink-900"],
      ["ink-800", "bg-ink-800"],
      ["ink-700", "bg-ink-700"],
      ["ink-600", "bg-ink-600"],
      ["ink-500", "bg-ink-500"],
    ],
  },
  {
    name: "Or",
    shades: [
      ["gold-100", "bg-gold-100"],
      ["gold-200", "bg-gold-200"],
      ["gold-300", "bg-gold-300"],
      ["gold-400", "bg-gold-400"],
      ["gold-500", "bg-gold-500"],
      ["gold-600", "bg-gold-600"],
      ["gold-700", "bg-gold-700"],
    ],
  },
  {
    name: "Ivoire",
    shades: [
      ["ivory-50", "bg-ivory-50"],
      ["ivory-100", "bg-ivory-100"],
      ["ivory-200", "bg-ivory-200"],
      ["ivory-300", "bg-ivory-300"],
      ["ivory-400", "bg-ivory-400"],
      ["ivory-500", "bg-ivory-500"],
    ],
  },
  {
    name: "Bordeaux",
    shades: [
      ["bordeaux-300", "bg-bordeaux-300"],
      ["bordeaux-500", "bg-bordeaux-500"],
      ["bordeaux-700", "bg-bordeaux-700"],
      ["bordeaux-900", "bg-bordeaux-900"],
    ],
  },
  {
    name: "États",
    shades: [
      ["success", "bg-success"],
      ["warning", "bg-warning"],
      ["danger", "bg-danger"],
    ],
  },
];

export default function DesignSystemPage() {
  return (
    <Container className="space-y-20 py-16 sm:py-24">
      <header>
        <Eyebrow>Design system</Eyebrow>
        <h1 className="mt-4 font-display text-6xl text-ivory-50">
          Nuit d&apos;<span className="italic text-gold-gradient">Or</span>
        </h1>
        <p className="mt-5 max-w-2xl text-[17px] leading-relaxed text-ivory-300">
          Noir encre, or champagne et ivoire, avec une touche de bordeaux héritée de
          l&apos;affiche. Titres en Cormorant Garamond, texte en Jost.
        </p>
      </header>

      <section>
        <h2 className="font-display text-3xl text-ivory-50">Couleurs</h2>
        <div className="mt-8 space-y-6">
          {palettes.map((p) => (
            <div key={p.name}>
              <p className="mb-3 text-[11px] uppercase tracking-[0.3em] text-gold-400">{p.name}</p>
              <div className="flex flex-wrap gap-3">
                {p.shades.map(([label, cls]) => (
                  <div key={label} className="w-24">
                    <div className={`h-16 rounded-xl border border-gold-500/20 ${cls}`} />
                    <p className="mt-2 text-xs text-ivory-400">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div>
            <p className="mb-3 text-[11px] uppercase tracking-[0.3em] text-gold-400">Dégradés</p>
            <div className="flex flex-wrap gap-3">
              <div className="h-16 w-48 rounded-xl bg-gold-gradient" />
              <div className="flex h-16 w-48 items-center justify-center rounded-xl bg-ink-800 font-display text-3xl font-bold text-gold-gradient">
                Gold text
              </div>
              <div className="flex h-16 w-48 items-center justify-center rounded-xl bg-ink-800 font-display text-3xl font-bold text-gold-shimmer">
                Shimmer
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="font-display text-3xl text-ivory-50">Typographie</h2>
        <div className="mt-8 space-y-6">
          <p className="font-display text-7xl font-bold text-gold-gradient">GALA</p>
          <p className="font-display text-5xl text-ivory-50">Titre de section</p>
          <p className="font-display text-3xl italic text-ivory-200">
            « Honorer ceux qui ont marqué Mboro »
          </p>
          <p className="max-w-xl text-[17px] leading-relaxed text-ivory-300">
            Texte courant en Jost, lisible et aéré, pour les descriptions et informations pratiques.
          </p>
          <Eyebrow>Surtitre en capitales espacées</Eyebrow>
        </div>
      </section>

      <section>
        <h2 className="font-display text-3xl text-ivory-50">Boutons & badges</h2>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Button size="lg">Primaire</Button>
          <Button variant="outline" size="lg">
            Contour
          </Button>
          <Button variant="dark" size="lg">
            Sombre
          </Button>
          <Button variant="ghost" size="lg">
            Discret
          </Button>
          <Button disabled>Désactivé</Button>
          <a href="#" className={buttonStyles({ size: "sm" })}>
            Lien stylé
          </a>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Badge>Or</Badge>
          <Badge tone="bordeaux">Bordeaux</Badge>
          <Badge tone="success">Payée</Badge>
          <Badge tone="warning">En attente</Badge>
          <Badge tone="danger">Échec</Badge>
          <Badge tone="neutral">Neutre</Badge>
        </div>
      </section>

      <section>
        <h2 className="font-display text-3xl text-ivory-50">Formulaires & cartes</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <Card>
            <CardBody className="space-y-6">
              <Field label="Nom complet" htmlFor="ds-name">
                <Input id="ds-name" placeholder="Prénom et nom" />
              </Field>
              <Field label="E-mail" htmlFor="ds-mail" error="Adresse e-mail invalide.">
                <Input id="ds-mail" defaultValue="vous@exemple" />
              </Field>
              <Field label="Téléphone" htmlFor="ds-phone" hint="Numéro joignable, ex. 78 015 58 36">
                <Input id="ds-phone" placeholder="+221 78 015 58 36" />
              </Field>
            </CardBody>
          </Card>
          <Card className="border-gold-400/50 shadow-gold">
            <CardBody>
              <SectionHeading
                align="left"
                eyebrow="Carte en relief"
                title="Surface dorée"
                subtitle="Surfaces sombres, filets or à 20 % d'opacité, ombre profonde."
              />
              <Ornament className="mt-8 justify-start" />
            </CardBody>
          </Card>
        </div>
      </section>

      <section>
        <h2 className="font-display text-3xl text-ivory-50">Logo</h2>
        <div className="mt-8 flex flex-wrap items-center gap-12 rounded-3xl border border-gold-500/20 bg-ink-900 p-10">
          <Logo />
          <Logo compact />
        </div>
      </section>
    </Container>
  );
}
