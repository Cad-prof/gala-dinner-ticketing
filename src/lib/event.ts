/**
 * Source de vérité de l'événement et des tarifs.
 * Les prix sont TOUJOURS recalculés côté serveur à partir de ce fichier :
 * on ne fait jamais confiance au montant envoyé par le navigateur.
 */

export const EVENT = {
  organizer: "Mboro Horizons",
  title: "Dîner de Gala",
  theme:
    "Honorer ceux qui ont marqué Mboro, inspirer ceux qui construiront son avenir",
  /** Début de la journée de l'événement (UTC = heure de Dakar). */
  dateISO: "2026-12-30T00:00:00Z",
  day: "30",
  month: "Décembre",
  year: "2026",
  dateLabel: "30 Décembre 2026",
  venue: "Foyer des jeunes",
  city: "Mboro",
  phoneDisplay: "+221 78 015 58 36",
  phoneTel: "+221780155836",
  whatsapp: "https://wa.me/221780155836",
} as const;

export type TicketTypeId = "prevente" | "vip";

export interface TicketType {
  id: TicketTypeId;
  name: string;
  tagline: string;
  /** Prix unitaire en FCFA (XOF, entier). */
  price: number;
  perks: string[];
  highlight?: boolean;
}

export const TICKET_TYPES: readonly TicketType[] = [
  {
    id: "prevente",
    name: "Prévente",
    tagline: "Le tarif privilégié pour réserver votre place dès maintenant.",
    price: 7000,
    perks: [
      "Entrée au Dîner de Gala",
      "Tarif de prévente préférentiel",
      "Billet numérique avec QR code",
    ],
  },
  {
    id: "vip",
    name: "VIP",
    tagline: "L'expérience complète, au plus près de la soirée.",
    price: 10000,
    perks: [
      "Entrée au Dîner de Gala",
      "Accueil et placement VIP",
      "Billet numérique avec QR code",
    ],
    highlight: true,
  },
] as const;

export const MAX_PER_TYPE = 10;
export const MAX_TICKETS_PER_ORDER = 20;

export function getTicketType(id: string): TicketType | undefined {
  return TICKET_TYPES.find((t) => t.id === id);
}
