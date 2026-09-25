# STATE

Replace on every update. Max 40 lines. History lives in git and `docs/decisions/`.

Status: Every back/options button hub-wide now matches Coinchapp's `HomeTopBar.tsx` exactly (36px circle, black/45 background, white SVG icon, shadow-md, blur). Games with a deliberate own skin (cafards, blackstories, pyramide) keep their palette, just the shared icon shape.
Focus: None — task complete, `npm run check` (root) and Tranquil's `npm run build -w client` both pass.
Level: L2

Context:
- Working_On: `public/shared/css/game-header.css` (shared base rule), plus per-game icon markup and `apps/tranquil/client/src/index.css`.
- Relevant_Files: `public/games/{cafards,blackstories,olemains,pyramide}/index.html`, `wordplayer.html`, `public/profile/index.html`, `apps/tranquil/client/src/index.css`.
- Do_Not_Touch: Millionaire's own glass `.icon-button` skin, and every game's persistent in-game header row (Yatzy `.game-settings-button`, Tranquil `GameBoard.tsx` header) — scoped out per user answer.
- Relevant_Decisions: `docs/decisions/0038-match-coinchapps-floating-back-settings-button-style-hub-wid.md` (supersedes/extends 0007's positioning-only rule with an exact visual spec).

Next:
- None queued for this task.

Open_Questions:
- None new.

Blockers:
- None.

Recent_Changes:
- 2026-09-25 Back/options buttons hub-wide (all vanilla-JS games + profile + Tranquil) now visually match Coinchapp's floating button exactly; per-game color skins (cafards/blackstories/pyramide) preserved, icon shape unified everywhere.
- 2026-09-25 Sign-out removes the local avatar (and its thumb). The account photo comes back from the server on the next sign-in.
