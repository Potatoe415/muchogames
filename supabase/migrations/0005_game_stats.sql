-- Per-game wins/losses for a signed-in profile, so /profile can show a
-- breakdown instead of one combined total. One row per (profile, game), not
-- one per match: coinchapp and Tranquil sync batched deltas, and a bounded
-- row count keeps the shared multigames-db small.
-- See docs/tasks/platform-admin-profile-roadmap.md (phase 3).
--
-- Callers fall back to increment_muchogames_profile_stats (0003) while this
-- function does not exist yet, so the order of deploy vs. migration is free.

create table if not exists public.muchogames_game_stats (
  profile_id uuid not null
    references public.muchogames_profiles (id) on delete cascade,
  game_id text not null check (char_length(game_id) between 1 and 64),
  wins integer not null default 0 check (wins >= 0),
  losses integer not null default 0 check (losses >= 0),
  best_score integer,
  last_played_at timestamptz not null default now(),
  primary key (profile_id, game_id)
);

alter table public.muchogames_game_stats enable row level security;
-- No policies: service-role only, same as muchogames_profiles.

-- Increments the profile totals and, when p_game_id is given, that game's
-- row, in one transaction. Returns the updated profile, or null when the
-- profile does not exist (callers treat that as "not linked").
create or replace function public.record_muchogames_game_result(
  p_id uuid,
  p_game_id text,
  p_wins integer,
  p_losses integer,
  p_score integer default null
)
returns public.muchogames_profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.muchogames_profiles;
  safe_wins integer := greatest(coalesce(p_wins, 0), 0);
  safe_losses integer := greatest(coalesce(p_losses, 0), 0);
begin
  update public.muchogames_profiles
  set wins = wins + safe_wins,
      losses = losses + safe_losses
  where id = p_id
  returning * into result;

  if result.id is null or p_game_id is null or p_game_id = '' then
    return result;
  end if;

  insert into public.muchogames_game_stats as stats
    (profile_id, game_id, wins, losses, best_score, last_played_at)
  values (p_id, p_game_id, safe_wins, safe_losses, p_score, now())
  on conflict (profile_id, game_id) do update
  set wins = stats.wins + excluded.wins,
      losses = stats.losses + excluded.losses,
      best_score = greatest(stats.best_score, excluded.best_score),
      last_played_at = now();

  return result;
end;
$$;

revoke all on function public.record_muchogames_game_result(uuid, text, integer, integer, integer)
  from public, anon, authenticated;
grant execute on function public.record_muchogames_game_result(uuid, text, integer, integer, integer)
  to service_role;
