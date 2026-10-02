-- Daily play coins for signed-in players: 10 per day, one spent per game
-- launched from the hub, back to 10 at midnight Europe/Paris. One row per
-- player holding the day it counts for, so no purge job is needed.
-- Anonymous players keep their counter in the browser (hub-coins.js); admins
-- are unlimited and never reach this table (api/profile/_coins.js).

create table if not exists public.muchogames_coins (
  profile_id uuid primary key references auth.users (id) on delete cascade,
  day date not null,
  spent integer not null default 0 check (spent >= 0),
  updated_at timestamptz not null default now()
);

alter table public.muchogames_coins enable row level security;
-- No policies: service-role only, same as every other muchogames_* table.

-- Spends one coin for today (Paris time, decided here, never by the caller).
-- Returns the number spent today after this call, or null when the daily
-- allowance is already used up. One statement, so two tabs launching at the
-- same moment cannot both get the last coin.
create or replace function public.spend_muchogames_coin(
  p_id uuid,
  p_daily integer
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  today date := (now() at time zone 'Europe/Paris')::date;
  result integer;
begin
  insert into public.muchogames_coins as coins (profile_id, day, spent, updated_at)
  values (p_id, today, 1, now())
  on conflict (profile_id) do update
  set spent = case when coins.day = today then coins.spent + 1 else 1 end,
      day = today,
      updated_at = now()
  where coins.day <> today or coins.spent < p_daily
  returning spent into result;

  return result;
end;
$$;

revoke all on function public.spend_muchogames_coin(uuid, integer)
  from public, anon, authenticated;
grant execute on function public.spend_muchogames_coin(uuid, integer)
  to service_role;
