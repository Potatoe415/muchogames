-- Player bug reports and ideas, sent from the hub, /profile, and the in-repo
-- games' options panel (api/feedback.js), read and triaged on /admin
-- (api/admin/_feedback.js). See docs/tasks/platform-admin-profile-roadmap.md.
--
-- Anonymous on purpose: no profile id, IP, user agent, or contact field. A
-- player who wants an answer can write their contact in the message itself.
-- Same `muchogames_` prefix rule as muchogames_events (shared multigames-db).

create table if not exists public.muchogames_feedback (
  id bigint generated always as identity primary key,
  kind text not null default 'bug' check (kind in ('bug', 'idea')),
  message text not null check (char_length(message) between 1 and 2000),
  game_id text check (game_id is null or char_length(game_id) <= 64),
  page text check (page is null or char_length(page) <= 200),
  status text not null default 'new'
    check (status in ('new', 'in_progress', 'resolved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists muchogames_feedback_status_created_at_idx
  on public.muchogames_feedback (status, created_at desc);

create or replace function public.set_muchogames_feedback_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql set search_path = public;

drop trigger if exists muchogames_feedback_set_updated_at
  on public.muchogames_feedback;

create trigger muchogames_feedback_set_updated_at
  before update on public.muchogames_feedback
  for each row
  execute function public.set_muchogames_feedback_updated_at();

alter table public.muchogames_feedback enable row level security;
-- No policies: service-role only, same as muchogames_events. The browser
-- writes through api/feedback.js and reads nothing.
