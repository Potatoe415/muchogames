-- Online rooms shared by several games (Yatzy, Memory).
-- The tables keep their yatzy_ names; game_id says which game owns a room,
-- so a code created in one game cannot be joined or read from another.
-- The allowed ids live in api/_lib/rooms.js.

alter table public.yatzy_games
  add column if not exists game_id text not null default 'yatsy'
  check (char_length(game_id) between 1 and 32);
