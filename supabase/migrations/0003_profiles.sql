-- Shared player profile, keyed by a real (non-anonymous) Supabase Auth user
-- created via Google Sign-In (see docs/tasks/unified-profile-accounts.md).
-- Lives in the same `multigames-db` project as yatzy_*/muchogames_* (hub)
-- and games/game_players/game_events (coinchapp, reused by tranquil) — the
-- `muchogames_` prefix follows the same collision-avoidance rule as
-- muchogames_events (docs/DECISIONS.md 2026-08-16).
--
-- Same access pattern as yatzy_games/muchogames_events: RLS enabled, zero
-- client policies. The browser never reads/writes these tables directly —
-- only a service-role key does, from `api/profile/*` (hub) or from
-- coinchapp/tranquil's own serverless functions, which share this same
-- Supabase project and therefore hold an equally-privileged service-role
-- key of their own.

create table if not exists public.muchogames_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text,
  avatar_url text,
  wins integer not null default 0,
  losses integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.muchogames_profiles enable row level security;
-- No policies: service-role only, same as yatzy_games/muchogames_events.

create or replace function public.set_muchogames_profiles_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists muchogames_profiles_set_updated_at
  on public.muchogames_profiles;

create trigger muchogames_profiles_set_updated_at
  before update on public.muchogames_profiles
  for each row
  execute function public.set_muchogames_profiles_updated_at();

-- Atomic wins/losses increment (avoids a read-then-write race between two
-- servers — e.g. hub Yatzy and coinchapp — recording a result for the same
-- profile at nearly the same time). Callers pass 0 for the counter they are
-- not incrementing. security definer + a fixed search_path so it can run
-- under the service-role call from any app's serverless function.
create or replace function public.increment_muchogames_profile_stats(
  p_id uuid,
  p_wins integer,
  p_losses integer
)
returns public.muchogames_profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.muchogames_profiles;
begin
  update public.muchogames_profiles
  set wins = wins + greatest(p_wins, 0),
      losses = losses + greatest(p_losses, 0)
  where id = p_id
  returning * into result;

  return result;
end;
$$;

-- Short-lived, single-use hand-off from the hub to coinchapp/tranquil at
-- launch time, so those apps can adopt the same profile without ever
-- receiving a raw Supabase or Google token in a URL. The hub writes a row
-- when appending `?profileCode=` to a launch link; the receiving app reads
-- and marks it used via its own service-role client (same project).
create table if not exists public.muchogames_launch_codes (
  code text primary key,
  profile_id uuid not null references public.muchogames_profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at timestamptz
);

create index if not exists muchogames_launch_codes_expires_at_idx
  on public.muchogames_launch_codes (expires_at);

alter table public.muchogames_launch_codes enable row level security;
-- No policies: service-role only.
