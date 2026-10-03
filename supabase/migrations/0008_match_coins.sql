-- Coins are spent per match, not per hub launch (docs/PLATFORM_RULES.md).
-- start_muchogames_match is called when a match starts, by api/profile for
-- in-repo games and by the coinchapp/Tranquil servers. In one call it spends
-- the player's coin and counts the match:
--   - signed-in players by profile id (muchogames_coins, 0007),
--   - anonymous players by a random device id the hub creates and forwards
--     to the other apps (muchogames_device_coins, below).
-- Requires 0005_game_stats.sql and 0007_coins.sql.

create table if not exists public.muchogames_device_coins (
  device_id uuid primary key,
  day date not null,
  spent integer not null default 0 check (spent >= 0),
  updated_at timestamptz not null default now()
);

create index if not exists muchogames_device_coins_day_idx
  on public.muchogames_device_coins (day);

alter table public.muchogames_device_coins enable row level security;
-- No policies: service-role only, same as every other muchogames_* table.

alter table public.muchogames_game_stats
  add column if not exists started integer not null default 0
  check (started >= 0);

-- Returns the coins left today after this match, or null when the daily
-- allowance is already used up (the match must not start). Admins pass
-- p_unlimited: nothing is spent, the match is still counted. The Paris day
-- is decided here, never by the caller.
create or replace function public.start_muchogames_match(
  p_game_id text,
  p_daily integer,
  p_profile_id uuid default null,
  p_device_id uuid default null,
  p_unlimited boolean default false
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  today date := (now() at time zone 'Europe/Paris')::date;
  spent_today integer;
begin
  if p_game_id is null or char_length(p_game_id) not between 1 and 64 then
    raise exception 'invalid game id';
  end if;

  if p_unlimited then
    spent_today := 0;
  elsif p_profile_id is not null then
    spent_today := public.spend_muchogames_coin(p_profile_id, p_daily);
  elsif p_device_id is not null then
    insert into public.muchogames_device_coins as coins
      (device_id, day, spent, updated_at)
    values (p_device_id, today, 1, now())
    on conflict (device_id) do update
    set spent = case when coins.day = today then coins.spent + 1 else 1 end,
        day = today,
        updated_at = now()
    where coins.day <> today or coins.spent < p_daily
    returning spent into spent_today;
  else
    raise exception 'profile or device id required';
  end if;

  if spent_today is null then
    return null;
  end if;

  insert into public.muchogames_events (type, game_id)
  values ('match_start', p_game_id);

  if p_profile_id is not null then
    insert into public.muchogames_game_stats as stats
      (profile_id, game_id, started, last_played_at)
    select p_profile_id, p_game_id, 1, now()
    where exists (
      select 1 from public.muchogames_profiles where id = p_profile_id
    )
    on conflict (profile_id, game_id) do update
    set started = stats.started + 1,
        last_played_at = now();
  end if;

  -- Device rows only matter for today; keep the table small.
  delete from public.muchogames_device_coins where day < today - 7;

  return greatest(p_daily - spent_today, 0);
end;
$$;

revoke all on function public.start_muchogames_match(text, integer, uuid, uuid, boolean)
  from public, anon, authenticated;
grant execute on function public.start_muchogames_match(text, integer, uuid, uuid, boolean)
  to service_role;

-- Coins left today for an anonymous device (read-only, for the hub badge).
create or replace function public.muchogames_device_coins_left(
  p_device_id uuid,
  p_daily integer
)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select greatest(
    p_daily - coalesce((
      select spent from public.muchogames_device_coins
      where device_id = p_device_id
        and day = (now() at time zone 'Europe/Paris')::date
    ), 0),
    0
  );
$$;

revoke all on function public.muchogames_device_coins_left(uuid, integer)
  from public, anon, authenticated;
grant execute on function public.muchogames_device_coins_left(uuid, integer)
  to service_role;
