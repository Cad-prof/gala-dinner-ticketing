-- Wave payment audit idempotency and shared checkout abuse throttling.
-- Existing Bictorys orders/events remain unchanged.

alter table payment_events
  add column if not exists provider_event_id text;

alter table payment_events
  alter column provider set default 'wave';

alter table orders
  add column if not exists provider_checked_at timestamptz;

comment on column orders.provider is
  'Payment provider used for the order (for example: wave).';
comment on column payment_events.provider_event_id is
  'Provider event ID used to deduplicate webhook audit records.';

create unique index if not exists payment_events_provider_event_id_uidx
  on payment_events (provider, provider_event_id);

create table if not exists checkout_rate_limits (
  fingerprint text primary key check (fingerprint ~ '^[0-9a-f]{64}$'),
  window_started_at timestamptz not null,
  attempts integer not null check (attempts > 0)
);

alter table checkout_rate_limits enable row level security;

revoke all on table checkout_rate_limits from public, anon, authenticated;
grant all on table checkout_rate_limits to service_role;

create or replace function public.consume_checkout_attempt(
  p_fingerprints text[],
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_fingerprint text;
  v_attempts integer;
  v_now timestamptz := clock_timestamp();
  v_allowed boolean := true;
begin
  if p_limit < 1 or p_window_seconds < 1 or cardinality(p_fingerprints) < 1 then
    raise exception 'Invalid checkout rate limit arguments';
  end if;

  for v_fingerprint in
    select distinct fingerprint
    from unnest(p_fingerprints) as fingerprints(fingerprint)
    order by fingerprint
  loop
    if v_fingerprint !~ '^[0-9a-f]{64}$' then
      raise exception 'Invalid checkout rate limit fingerprint';
    end if;

    insert into public.checkout_rate_limits (fingerprint, window_started_at, attempts)
    values (v_fingerprint, v_now, 1)
    on conflict (fingerprint) do update
    set window_started_at = case
          when public.checkout_rate_limits.window_started_at <=
            v_now - make_interval(secs => p_window_seconds)
          then v_now
          else public.checkout_rate_limits.window_started_at
        end,
        attempts = case
          when public.checkout_rate_limits.window_started_at <=
            v_now - make_interval(secs => p_window_seconds)
          then 1
          else least(public.checkout_rate_limits.attempts + 1, p_limit + 1)
        end;

    select attempts into v_attempts
    from public.checkout_rate_limits
    where fingerprint = v_fingerprint;
    if v_attempts > p_limit then
      v_allowed := false;
    end if;
  end loop;

  return v_allowed;
end;
$$;

revoke all on function public.consume_checkout_attempt(text[], integer, integer)
  from public, anon, authenticated;
grant execute on function public.consume_checkout_attempt(text[], integer, integer)
  to service_role;
