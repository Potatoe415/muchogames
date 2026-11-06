# 0063 — TTMC renamed "Tu te crois fort ?" (TTCF)

Date: 2026-11-06
Status: Accepted
Decision: The game "Tu te mets combien ?" (`ttmc`) is now "Tu te crois fort ?" with game id `ttcf`; no player-facing or repo reference to TTMC is left.
Context: Owner request ("je ne veux plus voir de référence à TTMC").
Rationale: The id appears in URLs, `data-id`s, storage keys and the hub catalog, so renaming only the title would leave the old name visible (address bar, shared links). The game was added on 2026-11-02, so few saves and stats exist under the old id.
Consequences: Folders `public/games/ttcf/` and `public/data/ttcf/`, files `ttcf.js` / `ttcf.css` / `ttcf_data.json`, `scripts/ttcf_slice.py`, storage `muchogames_ttcf_save` and `muchogames_ttcf_mode`, hub id `ttcf`. A match saved under `muchogames_ttmc_save` is not carried over; site-wide play counts and coin/match rows recorded as `ttmc` stay under that id (no migration); old `/games/ttmc/` links now 404. The 356 card subjects "Tu te mets combien en …" read "Tu te crois fort en …"; the 3 cards that named "TTMC" in their text name "TTCF". EN / ES titles follow the new name ("Think you're so smart?", "¿Te crees muy listo?").
Alternatives_Rejected: Keep `ttmc` as the id and change only the title (the old name would still show in URLs and code); a redirect from `/games/ttmc/` (keeps the old name in `vercel.json`).
