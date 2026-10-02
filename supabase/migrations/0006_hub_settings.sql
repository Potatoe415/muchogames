-- Owner-editable hub settings (single row): hidden / pinned / "new" games
-- and an announcement banner, overlaid on public/hub-config.json by the hub.
-- Read publicly through api/hub-settings.js, written through api/admin
-- (`hub-settings-update`). See docs/tasks/platform-admin-profile-roadmap.md
-- (phase 5). The shape of `settings` is validated in api/_lib/hubSettings.js.

create table if not exists public.muchogames_hub_settings (
  id smallint primary key default 1 check (id = 1),
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Seeded with the pinned order hub.js used to hard-code, so the hub looks
-- the same the moment it starts reading this row.
insert into public.muchogames_hub_settings (id, settings)
values (
  1,
  '{"hidden": [], "pinned": ["coinche", "bouilla", "president", "bataillecorse"], "new": [], "announcement": {"active": false, "fr": "", "en": "", "es": ""}}'::jsonb
)
on conflict (id) do nothing;

alter table public.muchogames_hub_settings enable row level security;
-- No policies: service-role only, same as every other muchogames_* table.
