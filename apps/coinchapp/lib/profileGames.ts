// Game ids as the hub knows them (`public/hub-config.json` in the root repo),
// used to attribute results on the shared hub profile. Shared by client and
// server code, so it carries no "use client" / "use server" directive.
// A superset of `GameType`: solitaire is local-only and never reaches the DB.
export const COINCHAPP_GAMES = ["coinche", "bouilla", "president", "bataillecorse", "solitaire"] as const;
export type CoinchappGame = (typeof COINCHAPP_GAMES)[number];

export function toCoinchappGame(value: unknown): CoinchappGame | null {
  return COINCHAPP_GAMES.includes(value as CoinchappGame) ? (value as CoinchappGame) : null;
}
