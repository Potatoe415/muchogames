# BACKLOG

Current work only. Completed work lives in git history and `docs/decisions/`.
`Done` section dropped and `Later` merged into `Next` on 2026-09-22 (bootstrap v10.1 upgrade — see `docs/decisions/INDEX.md`).

## Now
- [ ] **Security**: rotate the Vercel token that was pasted in chat earlier, once `tranquil`'s Vercel repoint (below) is also done.
- [ ] **User**: delete the `Potatoe415/coinchapp` GitHub repo (Settings → Danger Zone → Delete). `Potatoe415/tranquil` stays untouched until its own repoint (below) is done.
- [ ] **User, optional**: `delete from public.games where room_code = 'JQW';` in Supabase, or let the 48h TTL cron handle it.
- [ ] Do the same Vercel repoint for `tranquil` (`prj_FnorlK5RzjApMxvvVAXIhEvlxBdF`) — not started yet. Same approach as `coinchapp` (see `docs/decisions/INDEX.md` 2026-09-17): new project linked to `Potatoe415/muchogames`, Root Directory `apps/tranquil`, copy non-sensitive env vars, ask the user to re-enter sensitive ones, redeploy, verify live, then move `tranquil-woad.vercel.app` over.
- [ ] Fix `apps/coinchapp/lib/client/useMatchStats.ts:220` — `react-hooks/set-state-in-effect` lint error, surfaced by `npm run lint:all`. Pre-existing in `coinchapp`'s own code, flag only.
- [ ] Decide whether/how to bring `apps/tranquil` into the Turborepo/workspace graph (blocked by its own nested npm workspaces).
- [ ] Confirm `/admin` renders and logs in from a real browser (only verified at HTTP level so far).
- [ ] Delete the verification row: `delete from public.muchogames_events where game_id = '__verification__';`.
- [ ] Rotate `ADMIN_PASSWORD` (current value is a demo password) — `vercel env add ADMIN_PASSWORD production --sensitive --force`, then redeploy.
- [ ] Copy `SUPABASE_URL` to the Preview environment (currently Production-only).
- [ ] Verify Yatzy online play with two real devices (create, join, leave, resume, reclaim a seat by code).
- [ ] Decide on the GitHub branch-protection rule on `main` (currently bypassed on every push): adopt PRs or remove the rule.
- [ ] Make `api/admin/login.js`'s "admin not configured" case diagnosable without leaking info (currently redacted as a generic 5xx).
- [ ] Confirm `muchogames.win` still shows "Valid Configuration" in Vercel; add `muchogames.vercel.app` to Google Cloud Console's Authorized JavaScript origins.
- [ ] Sanity-check the wins/losses counters live: Yatzy (vs robot + online), all 4 `coinchapp` games (`HomeTopBar`'s settings panel), Tranquil (`SettingsPanel`).
- [ ] Confirm today's Yatzy fixes (overlap, square cells, dice-icon sizing, header/settings panel) on a real device once deployed (hard-refresh/reopen so `yatzy-offline-v39` takes over).
- [ ] Verify Yatzy "Mode defaite" end-to-end with two real Supabase-backed online clients (only forced-local-state verified so far).
- [ ] Confirm Yatzy Play Online: small avatar beside the name field and beside the local name on the score chip; solo/robot have neither.
- [ ] Confirm Coinche/Bouilla online `GameRoom` chip (not local/ad-hoc) after those apps are deployed.
- [ ] Confirm Tranquil online `GameBoard` (not local/bot) after that app is deployed.
- [ ] Confirm `/profile` crop then saved file stays under 50 KB.
- [ ] Commit and push the "La Bataille Corse" Hub tile once confirmed visually (tile art, position next to Président, launch works with name/avatar params).
- [ ] Commit and push the GIF picker squash fix and the Président tile + coinche launch-URL fix, once both confirmed on real devices.

## Next
- [ ] Ship a genuinely lighter mobile banner — `public/assets/banner-games-hub-mobile.jpg` is byte-identical to the desktop banner; needs a real resized asset (would add an image dependency such as `sharp` — user's call).
- [ ] Clear the 13 remaining lint warnings, then add `--max-warnings 0`. Mostly dead code (`detectInitialLocale`, `calculateMinMaxDelta`, `handleLanguageSelection`, `isStraight`, `vegLabel`) and one `catch (error)` that should be `catch {}`.
- [ ] Decide whether to add automated tests for `scoring.js` (Yatzy) and `shared/js/engine.js` — no automated tests exist in this repo today.
- [ ] Decide whether to formalize a shared error-handling/logging convention (stable `E_<SCOPE>_<NNN>` codes, `trace_id`, shared logger) — see `docs/DEBUGGING.md` gaps.
- [ ] No secret-scanning tool or dependency-audit step configured in `check` — see `docs/SECURITY.md`.
- [ ] Reduce `docs/DATA_MODEL.md` to the v10.1 entity-index format once/if per-module `DATA.md` files exist for the hub's own data — not needed while the repo stays hub-spoke (no `src/modules/`).
- [ ] Decide: keep `data-id` attributes or migrate to `data-testid` (bootstrap v10.1 default) — most existing games predate `data-id` entirely; a repo-wide rename is a separate, larger decision.
- [ ] Continue splitting `public/games/yatsy/app.js` (1187 lines against the 300-line limit; `storage.js`/`render.js`/`session.js` already extracted). `public/games/millionaire/app.js` (1069), `public/games/pyramide/app.js` (847), `wordplayer.js` (700) are also over limit.
- [ ] Serve `@supabase/supabase-js` from the npm dependency instead of the unpinned runtime CDN import in `public/games/yatsy/matchmaking.js`.
- [ ] Accessibility pass on the hub: `role="tablist"`/`aria-selected` on category tabs, keyboard support + `aria-expanded` on the language switcher, `:focus-visible`, `prefers-reduced-motion`, update `<html lang>`.
- [ ] Deduplicate the rules-modal loading logic repeated across several games.
- [ ] Author a `NOTES.md` (per `docs/GAMES_MAP.md`'s convention) for `millionaire`, `pyramide`, `yatsy`.
- [ ] Fix `public/games/pictionary/index.html` + `main.js`: orphaned, not referenced by `hub-config.json` (pre-existing dead code, left untouched per `AGENTS.md`).
- [ ] Extend the admin page further if wanted (hub visits, per-language split, live event feed) — declined once already (2026-08-30), needs new columns + a deliberate personal-data decision.
- [ ] Split `public/admin/admin.css` when it next grows (271/300 lines).
- [ ] Finish the "bergamots" → "muchogames" rename: `localStorage` keys (`bergamots-lang`, `bergamots-player-name`, `bergamots-player-avatar*`, `bergamots-auth`, `bergamots-launch-counts`) and the `yatzy_*` Supabase tables are still unrenamed (deliberate — renaming either resets/migrates real user data).
- [ ] Add visual tags (player count, duration, type) to Hub game tiles.
- [ ] Whether to raise `printWidth` from 80 to 100.
- [ ] Whether PRODUCT should stay "max 3 rolls" given the online joke extra roll.
- [ ] Whether PRODUCT/TECH should drop "avatar is Bergamots-only".
- [ ] Ask the user to confirm the `docs/PRODUCT.md` Out_Of_Scope wording edit (see `STATE.md` Focus) before touching either `docs/PRODUCT.md` or `apps/coinchapp/docs/PRODUCT.md`.

## Blocked
- None.
