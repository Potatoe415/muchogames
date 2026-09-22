# 0018 — Yatzy GIF reactions via Giphy, same pattern as Coinchapp

Date: 2026-09-04
Status: Accepted
Decision: Yatzy's reaction picker gained a GIF tab that searches Giphy (trending when the query is empty). GIFs are ephemeral like emojis: a Giphy CDN URL is broadcast on the existing `emoji` realtime event and shown for 5s. Search runs server-side (`api/yatsy/gifs.js`, plus a Vite dev middleware so `npm run dev` works) so `GIPHY_API_KEY` stays server-only. Receivers only render `https` URLs on `media*.giphy.com` / `i.giphy.com`. Rating is `pg-13`.
Context: User asked to apply the Coinchapp GIF feature to Yatzy in bergamots.
Rationale: Reusing the existing reaction broadcast avoids chat/persistence. A server proxy avoids exposing the key. Vite does not run `api/`, so the same `runGifSearch` helper is also mounted as `/api/yatsy/gifs` in `vite.config.js` for local solo play. Official "Powered by GIPHY" attribution sits in the picker as required by Giphy's terms.
Consequences: New env var `GIPHY_API_KEY` (local `.env` / `.env.local` + Vercel Production and Preview). Service worker bumped to `yatzy-offline-v19` so clients pick up `gif-picker.js`.
Alternatives_Rejected: Client-side Giphy calls with a public key (would leak the key); requiring `vercel dev` for local GIF search (solo play would look broken under the usual `npm run dev`); persisting GIFs in `yatzy_games.game_state` (unnecessary for a 5s overlay).
