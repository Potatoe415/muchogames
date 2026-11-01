# 0079 — Card back chosen on each game's home screen

Date: 2026-11-01
Status: Accepted
Decision: `components/CardBackPicker.tsx` sits under the mode buttons on the six home screens. The choice is stored per game in `localStorage` (`coinchapp-card-back:<game>`, values in `lib/client/cardBack.ts`). `TableShell` provides the back stored for `match.game` (`CardBackContext.tsx`), and `CardBack` draws it, so every face-down card in every table follows with no per-table code. Pictures: `public/card-backs/*.webp`, stretched to the 2:3 box so their frame stays whole. `classic` is the former CSS back and the default.
Context: Owner request (2026-11-01), across the hub's card games (root decision 0056).
Rationale: All face-down cards already go through `CardBack`, and every table goes through `TableShell` with the game id, so one context covers the six games. Cosmetic and local: nothing is sent to the server or the other players.
Consequences: Belote and Coinche keep separate choices (`match.game` is `belote` or `coinche`). The first client render shows the classic back for a moment until `localStorage` is read (same as the other post-hydration settings).
Alternatives_Rejected: One choice for the six games (owner chose per game). Passing the back as a prop through every table (many call sites for one cosmetic value).
