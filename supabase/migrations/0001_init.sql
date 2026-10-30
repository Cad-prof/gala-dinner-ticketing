-- Mboro Horizons — Dîner de Gala : billetterie
-- À exécuter UNE FOIS dans Supabase → SQL Editor (ou via `supabase db push`).
--
-- Sécurité : RLS activé sur toutes les tables, SANS aucune policy.
-- Seule la clé secrète (service_role / sb_secret_…), utilisée côté serveur
-- uniquement, peut lire ou écrire. Le navigateur n'a aucun accès direct.

create extension if not exists pgcrypto;

-- ─── orders : commandes + suivi du paiement ─────────────────────────────
create table if not exists orders (
  id                       uuid primary key default gen_random_uuid(),
  order_reference          text not null unique,
  status                   text not null default 'pending'
                             check (status in ('pending', 'succeeded', 'failed', 'cancelled', 'refunded')),
  currency                 text not null default 'XOF',
  amount_total             integer not null check (amount_total > 0),
  ticket_count             integer not null check (ticket_count > 0),
  items                    jsonb not null,  -- [{ type, name, unitPrice, quantity }]
  customer_name            text not null,
  customer_email           text not null,
  customer_phone           text not null,
  provider                 text,            -- 'bictorys'
  provider_charge_id       text,            -- chargeId renvoyé à la création du paiement
  provider_transaction_id  text,            -- id de transaction reçu via webhook
  paid_at                  timestamptz,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create index if not exists orders_status_idx on orders (status);
create index if not exists orders_created_at_idx on orders (created_at desc);
create index if not exists orders_email_idx on orders (customer_email);

-- ─── tickets : un billet (QR) par place, émis après paiement confirmé ────
create table if not exists tickets (
  id               uuid primary key default gen_random_uuid(),
  code             text not null unique,
  order_reference  text not null references orders (order_reference) on delete cascade,
  seq              integer not null,
  ticket_type      text not null check (ticket_type in ('prevente', 'vip')),
  checked_in_at    timestamptz,
  created_at       timestamptz not null default now(),
  unique (order_reference, seq)
);

create index if not exists tickets_order_idx on tickets (order_reference);

-- ─── payment_events : journal brut des webhooks (audit / litiges) ───────
create table if not exists payment_events (
  id               uuid primary key default gen_random_uuid(),
  order_reference  text,
  provider         text not null default 'bictorys',
  event_status     text,
  payload          jsonb not null,
  created_at       timestamptz not null default now()
);

create index if not exists payment_events_ref_idx on payment_events (order_reference);

-- ─── RLS : aucun accès anon / authenticated ─────────────────────────────
alter table orders enable row level security;
alter table tickets enable row level security;
alter table payment_events enable row level security;

-- ─── updated_at automatique ─────────────────────────────────────────────
create or replace function set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists orders_set_updated_at on orders;
create trigger orders_set_updated_at
  before update on orders
  for each row
  execute function set_updated_at();
