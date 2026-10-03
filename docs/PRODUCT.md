# PRODUCT

Status: Living document. Never edit autonomously — confirm with user first.

---

Project_Name: Muchogames
Objective: Provide a single hub to browse and launch a curated collection of party/group games from one page, with zero setup per game (no accounts, no install).
Problem: Party/group games are scattered across apps and links; Muchogames centralizes them behind one dashboard with a consistent look and multilingual support.

Target_Users:
- Groups of friends/family playing together in person (word-guessing games, riddles, dice games, quizzes).
- Remote pairs/groups playing Yatzy online together via a shared room code.

Core_Features:
- Hub/dashboard (`index.html` + `hub.js`) rendering game tiles from `public/hub-config.json`. Three launch kinds: `wordpack` (shared engine), `custom` (standalone app), `external` (external link).
- Wordplayer engine (`wordplayer.html` + `wordplayer.js` + `shared/js/engine.js`): shared word-guessing game shell used by Pictionary, Taboo, Esquisse, Pigeon Pigeon. Config: timer choice → play (show/hide word, validate/pass) → end stats.
- Olé Mains: word-guessing game with deck selection, countdown, successive word reveal, final scoring (1 point validated / 0 passed).
- Black Stories: dark riddles. Read title/short riddle → think → reveal full solution. History navigation (previous/random next), multilingual, per-story illustrations.
- Yatzy (`public/games/yatsy/`): dice poker. Roll (max 3) → keep dice → pick a scoring category. Automatic scoring (Full, Square, Straights), +35 upper-section bonus above 63, Yatzy handling (5 identical dice). Online multiplayer via 3-letter room codes backed by Supabase Postgres (via `api/yatsy/games/*` Vercel serverless functions).
- Other custom games with their own data/rules: Millionaire (quiz), Salade de Cafards, Pyramide, and others under `public/games/`.
- Multilingual support (FR/EN/ES) for rules and word/question content, driven by JSON fields rather than code.
- Admin back-office (`public/admin/`, reachable at `/admin`), for the owner only (Google sign-in, allowlisted account): matches-started stats over 7 days / 30 days / 6 months (total, daily trend, ranking by game), signed-in player and recorded-result counts; a feedback inbox (new / in progress / resolved); a hub catalog editor (hide, pin, mark "new" any game) and a FR/EN/ES announcement banner; a players list (clear a name or avatar, delete a non-admin account).
- Daily play coins: each match started costs one coin out of 10 per day (reset at midnight, Paris time), in every game — including "play again" and online rematches; opening a game is free. Shown as a "🪙 n/10" badge on the hub. Out of coins, the match does not start and the game says "Vous n'avez plus de pièces pour aujourd'hui. Revenez demain !". One server-side counter per player across every game (Google profile when signed in, else an anonymous browser id); the admin is unlimited. Exception: Easy Frog and GameBoy Web (code outside this repo) cost one coin when opened from the hub.
- Common base for every game, current and future (`docs/PLATFORM_RULES.md`, enforced by `npm run check`): back button top-left (asks "Quitter la partie ?" during a match), options gear top-right with language, rules and "Report a problem", one coin per match, matches started / won / lost.
- Hub conveniences: a "My games" tab, first of the category tabs and open by default when it has games (favorites starred on tiles + recently launched, per browser), an optional player-count badge (bottom-right) and duration tag on tiles, and the owner's announcement banner and "new" badges.
- "Report a problem": a bug/idea dialog reachable from the hub, `/profile`, every in-repo game's options panel, and coinchapp/Tranquil settings (which open the hub's dialog). Anonymous; reports land in the admin inbox.
- Google login status on the hub (`auth.js`): a top-right icon lets a visitor sign in with a Google/Gmail account or sign out. When signed in, the popover shows the signed-in email, a "Profil" link to a profile page (`/profile`), and an "Admin" link for the owner.
- Profile page (`/profile`, `public/profile/`): an editable "Nom" text field and an Avatar (upload, saved client-side, and to the shared profile when signed in). Every player sees how many matches they started in this browser and their most played games. Signed-in players also see matches started / wins / losses per game (wins/losses only where there is one unambiguous local player: Yatzy vs robot or online, Millionaire, the four coinchapp games, Tranquil; Yatzy best score) and can export all their hub data as JSON or delete their account. Nom is auto-filled once from the Google account's display name on first sign-in (never overwrites a name the player already set themselves). The name pre-fills Yatzy's own name field (same origin) and, as a `?name=` link parameter, the pseudo field already present in Coinche, Bouilla and Tranquil (separate apps on other domains) — always a soft pre-fill, never required, never overwriting what a player types in that game. The Avatar is Muchogames-only and does not travel to other games. See `docs/TECH.md` "Player identity contract" for the mechanism any future game should follow.

Out_Of_Scope:
- Mandatory accounts. Players stay anonymous by default and every game works signed out. Signing in with Google is optional: it creates a shared profile (display name, avatar, wins/losses totals and per game) in Supabase, verified server-side; the email is not copied into hub tables. The player can export or delete it from `/profile`. Admin access is the owner's Google account, allowlisted by user id (`ADMIN_USER_IDS`).
- Persistent scores/progress beyond wins/losses. Round/hand scores stay per game session; Yatzy game state persists only for the lifetime of a room, up to 48h TTL for purge. Anonymous players keep their wins/losses in the local browser only.
- Leaderboards, friends, and match-by-match history (per-game aggregates only, see `docs/decisions/0042`).
- Visitor-level analytics: match counts are aggregate only, with no IP, user agent, device, country, or session identifier stored (the anonymous coin counter's random browser id is never joined to these events). Reaffirmed on 2026-08-30, when unique visitors, live presence, devices and countries were considered for the stats page and deliberately declined rather than overlooked.

User_Roles:
- Player: no distinct roles or permissions; anonymous by default, optionally signed in with Google (own profile only).
- Admin: a Google account whose Supabase user id is listed in `ADMIN_USER_IDS` (the owner). Grants the back-office described in Core_Features; cannot edit game content (`hub-config.json`, word packs) or delete another admin.
- Yatzy room creator/joiner: implicit roles (`creator` / `joiner`) tied to a room code and a resume token, not to an account.

Success_Criteria:
- All games load and are playable via `npm run dev` and `npm run build`.
- Adding a new wordpack game requires zero code changes: a data JSON under `public/data/<id>/` plus one entry in `public/hub-config.json`.

Constraints:
- Vanilla HTML/CSS/JavaScript only; no heavy UI framework (see `docs/TECH.md`).
- Supabase (via Vercel serverless functions only) holds Yatzy multiplayer state, matches-started events, daily coin counters, signed-in profiles and per-game stats, feedback reports, and the hub settings overlay. Game content stays in static JSON.
- Everything must stay on free tiers (Vercel Hobby, Supabase free). No paid feature may be introduced without explicit approval.

Open_Questions:
- None currently tracked. Add here before making product-scope decisions autonomously.
