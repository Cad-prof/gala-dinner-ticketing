# Dîner de Gala — Mboro Horizons · Billetterie

Site de billetterie pour le **Dîner de Gala du 30 décembre 2026** (Foyer des jeunes, Mboro).
Next.js 16 (App Router) · Tailwind CSS v4 · **Supabase** (commandes, billets, journal des paiements) · **Bictorys** (paiement Wave / Orange Money / Free Money / carte).

## Fonctionnement

1. `/billetterie` — le client choisit Prévente (7 000 FCFA) et/ou VIP (10 000 FCFA), saisit ses coordonnées.
2. `POST /api/checkout` — valide, **recalcule le prix côté serveur** (`src/lib/event.ts`), enregistre la commande `pending` dans Supabase, crée le paiement Bictorys et renvoie l'URL du checkout hébergé.
3. Le client paie sur la page sécurisée Bictorys puis revient sur `/confirmation?ref=MH-…`.
4. `POST /api/webhooks/bictorys` — **seule source de vérité** : signature vérifiée (HMAC / `X-Secret-Key`), montant + devise comparés à la commande, traitement idempotent. À succès : statut `succeeded` et émission d'un billet (code + QR) par place.
5. La page de confirmation se met à jour toute seule (polling) et sert de filet de sécurité (vérification serveur→serveur via la clé privée si le webhook tarde).
6. `/admin` — espace organisateur protégé par mot de passe : statistiques, commandes, **contrôle d'entrée** (le QR d'un billet ouvre `/admin?code=…` → bouton « Valider l'entrée », usage unique).

## Mise en service

1. **Supabase** : créez un projet, exécutez `supabase/migrations/0001_init.sql` dans *SQL Editor*.
2. **Bictorys** : récupérez clé publique, clé privée et secret webhook (dashboard → Développeurs). Déclarez le webhook :
   `https://VOTRE-DOMAINE/api/webhooks/bictorys`
3. Renseignez les variables (voir `.env.example`) :

| Variable | Rôle |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase |
| `SUPABASE_SECRET_KEY` | Clé secrète Supabase (serveur uniquement) |
| `BICTORYS_API_KEY` | Clé publique Bictorys (création du paiement) |
| `BICTORYS_PRIVATE_KEY` | Clé privée Bictorys (vérification de transaction) |
| `BICTORYS_WEBHOOK_SECRET` | Secret de signature des webhooks |
| `BICTORYS_API_BASE_URL` | *(optionnel)* `https://api.test.bictorys.com` pour le sandbox |
| `NEXT_PUBLIC_BASE_URL` | URL publique **HTTPS** du site (sans slash final) |
| `ADMIN_PASSWORD` | Mot de passe de `/admin` |

> Bictorys refuse les URLs de redirection non-HTTPS hors `localhost` : en local, utilisez un tunnel HTTPS (ngrok…).

## Développement local

Prérequis : Node.js 20.9 ou supérieur et npm.

1. Installez les dépendances : `npm ci`.
2. Créez votre fichier de configuration local : `cp .env.example .env.local` (PowerShell : `Copy-Item .env.example .env.local`).
3. Dans `.env.local`, renseignez `NEXT_PUBLIC_SUPABASE_URL` et `SUPABASE_SECRET_KEY` avec les identifiants de votre projet Supabase. Exécutez `supabase/migrations/0001_init.sql` dans son *SQL Editor* si ce n'est pas déjà fait.
4. Réglez `NEXT_PUBLIC_BASE_URL` sur `http://localhost:3000`. Ajoutez les clés Bictorys pour tester le paiement ; utilisez des clés sandbox et configurez un tunnel HTTPS pour recevoir les webhooks en local.
5. Lancez le serveur : `npm run dev`, puis ouvrez [http://localhost:3000](http://localhost:3000). La billetterie est sur `/billetterie` et l'espace organisateur sur `/admin`.

Les variables Bictorys sont nécessaires au checkout, et `ADMIN_PASSWORD` à l'accès à `/admin`. Gardez `.env.local` privé et ne commitez jamais vos clés.

## Personnaliser

- Date, lieu, contact, tarifs et avantages : `src/lib/event.ts`.
- Design system (tokens, polices, utilitaires) : `src/app/globals.css` — guide visuel sur `/design-system`.
- Composants UI : `src/components/ui/*`.

## Sécurité

- Tables Supabase en RLS **sans policy** : seul le serveur (clé secrète) y accède.
- Aucun montant n'est lu depuis le navigateur ; la redirection de retour ne valide jamais un paiement.
- Références de commande à 60 bits d'entropie (le lien de confirmation est privé).
