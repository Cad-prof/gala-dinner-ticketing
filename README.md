# Dîner de Gala — Mboro Horizons · Billetterie

Site de billetterie pour le **Dîner de Gala du 30 décembre 2026** (Foyer des jeunes, Mboro).
Next.js 16 (App Router) · Tailwind CSS v4 · **Supabase** (commandes, billets, journal des paiements) · **Wave Business Checkout API**.

## Fonctionnement

1. `/billetterie` — le client choisit Prévente (7 000 FCFA) et/ou VIP (10 000 FCFA), puis saisit ses coordonnées.
2. `POST /api/checkout` — valide le panier, **recalcule le prix côté serveur** (`src/lib/event.ts`), applique une limite de tentatives, enregistre la commande `pending` et crée une session Wave Checkout avec la référence privée comme `client_reference`.
3. Le client est redirigé vers `wave_launch_url`, puis revient sur `/confirmation?ref=MH-…`. Les URL de retour ne prouvent jamais un paiement.
4. `POST /api/webhooks/wave` — vérifie la signature HMAC Wave sur le corps brut, contrôle l'horodatage, l'identifiant de commande, la session, le montant et la devise. Seul un événement `checkout.session.completed` avec `checkout_status=complete` et `payment_status=succeeded` peut valider une commande et émettre les billets.
5. Si le webhook tarde, la confirmation interroge Wave côté serveur. Si la création du checkout a expiré sans réponse claire, le serveur recherche la session par `client_reference` au lieu de répéter le POST et de créer une autre session.
6. `/admin` — espace organisateur protégé par mot de passe : statistiques, commandes, **contrôle d'entrée** (le QR d'un billet ouvre `/admin?code=…` → bouton « Valider l'entrée », usage unique).

## Mise en service

1. **Supabase** : créez un projet et exécutez `supabase/migrations/0001_init.sql`, puis `supabase/migrations/0002_wave_payment_events.sql` dans *SQL Editor*. La seconde migration ajoute la déduplication des événements Wave et le limiteur partagé de tentatives.
2. **Wave Business** : créez une clé API avec l'accès Checkout et activez la signature des requêtes. Enregistrez un webhook HTTPS sur `https://VOTRE-DOMAINE/api/webhooks/wave`, choisissez une stratégie de signature (secret HMAC), puis abonnez-le aux événements `checkout.session.completed` et `checkout.session.payment_failed`. Conservez séparément le secret API-signing et le secret webhook.
3. Configurez les variables serveur (voir [`.env.example`](.env.example)) :

| Variable | Rôle |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase |
| `SUPABASE_SECRET_KEY` | Clé secrète Supabase, uniquement côté serveur |
| `WAVE_API_KEY` | Clé Wave Business API |
| `WAVE_API_SIGNING_SECRET` | Secret de signature des requêtes Wave |
| `WAVE_WEBHOOK_SECRET` | Secret HMAC distinct du webhook Wave |
| `WAVE_API_BASE_URL` | *(optionnel)* URL d'API fournie par Wave ; par défaut `https://api.wave.com` |
| `NEXT_PUBLIC_BASE_URL` | URL publique **HTTPS** du site, sans slash final |
| `ADMIN_PASSWORD` | Mot de passe de `/admin` |

Wave exige des URL HTTPS pour `success_url` et `error_url`. Pour le développement local, exposez l'application via un tunnel HTTPS et utilisez son URL comme `NEXT_PUBLIC_BASE_URL`. La documentation Wave consultée ne définit pas d'URL sandbox : demandez à Wave un accès de test au lieu d'inventer une base URL.

### Migration depuis Bictorys

Les nouveaux checkouts utilisent Wave uniquement. L'ancien endpoint `/api/webhooks/bictorys` et la réconciliation serveur restent temporairement actifs pour solder les checkouts Bictorys déjà créés. Gardez `BICTORYS_PRIVATE_KEY` et `BICTORYS_WEBHOOK_SECRET` dans l'environnement de déploiement jusqu'à leur succès ou leur expiration, puis supprimez l'ancien webhook du portail et retirez ces secrets. Les anciennes commandes et entrées d'audit restent conservées dans Supabase.

## Développement local

Prérequis : Node.js 20.9 ou supérieur et npm.

1. Installez les dépendances : `npm ci`.
2. Créez le fichier local : `cp .env.example .env.local` (PowerShell : `Copy-Item .env.example .env.local`).
3. Renseignez `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `WAVE_API_KEY`, `WAVE_API_SIGNING_SECRET`, `WAVE_WEBHOOK_SECRET` et `ADMIN_PASSWORD`. Exécutez les deux migrations Supabase si elles ne sont pas déjà appliquées.
4. Configurez un tunnel HTTPS et réglez `NEXT_PUBLIC_BASE_URL` sur son URL. Déclarez aussi l'URL de webhook du tunnel dans le portail Wave pour recevoir les événements.
5. Lancez `npm run dev`, puis ouvrez [l'application locale](http://localhost:3000). La billetterie est sur `/billetterie` et l'espace organisateur sur `/admin`.

Gardez `.env.local` privé et ne commitez jamais les clés. Si une clé API ou un secret est exposé, révoquez-le dans le portail Wave et remplacez-le immédiatement.

## Sécurité et erreurs de paiement

- Les montants sont recalculés côté serveur et comparés à la session Wave en XOF avant toute validation.
- Les appels API et webhooks sont signés. La vérification webhook utilise le corps HTTP brut, compare les signatures à temps constant et rejette les horodatages expirés ou trop futurs.
- Les événements sont dédupliqués par fournisseur et identifiant d'événement. Les transitions d'état et l'émission des billets restent idempotentes.
- Le polling de confirmation est plafonné à une vérification serveur→serveur toutes les 10 secondes par commande, même si le navigateur interroge le statut plus souvent.
- Les tentatives Checkout sont limitées à **5 par e-mail ou téléphone normalisé sur 15 minutes**. Seules des empreintes HMAC des coordonnées sont stockées pour cette limite. Si Supabase ou le limiteur est indisponible, le checkout échoue de façon fermée.
- `checkout.session.payment_failed` est conservé dans le journal mais ne clôt pas la commande : Wave peut envoyer plusieurs échecs avant un paiement réussi. Une session expirée devient annulée. Seule la session Wave vérifiée peut déclencher l'émission des billets.
- Ne répétez pas automatiquement la création d'une session après un timeout : le résultat peut être ambigu. La recherche par `client_reference` évite de créer une seconde session payante.
- Les tables métier sont en RLS **sans policy** ; seul le serveur avec la clé Supabase secrète y accède. Les IP de webhook peuvent aussi être filtrées dans l'infrastructure selon la liste officielle Wave maintenue dans sa documentation.
- Les références de commande ont 60 bits d'entropie ; le lien de confirmation est privé.

## Personnaliser

- Date, lieu, contact, tarifs et avantages : `src/lib/event.ts`.
- Design system (tokens, polices, utilitaires) : `src/app/globals.css` — guide visuel sur `/design-system`.
- Composants UI : `src/components/ui/*`.
