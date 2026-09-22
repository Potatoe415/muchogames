# 0007 — Bots run client-side in the host browser

Date: 2026-06-10
Status: Accepted
Decision: Bots now run entirely client-side. For online games one client (the "host", initially the creator, stored in `games.host_user_id`) drives every bot seat: it decides from the bot seat's redacted view (`chooseClientAction`) and submits via the new host-only `submitBotMove` Server Action. The server no longer auto-plays bots (`advanceBots` removed from `commit`/`startGame`) but still validates every submitted move. Any seated human can take over with `becomeHost` from an in-game parameters panel.
Context: User wants bots to always run on a player's phone (the one that created the online game) and a way to hand off control if that player leaves. Supersedes the 2026-06-09 note that TECH still said "bots run server-side".
Rationale: Keeps heavy bot CPU off Vercel functions and gives a simple, explicit handoff via a button instead of presence/heartbeat infra (none exists yet).
Consequences: Trusted-runner model - the host's `getView` payload now includes `botViews` (bot seats' hands), so a malicious host could see opponent-bot cards in mixed human+bot games (accepted risk). New column `games.host_user_id` (folded into `0001_init.sql`; DB is still in dev/reset mode). `lib/coinche/bot.ts advanceBots` is now used only by the offline `useLocalGame`.
Alternatives_Rejected: Automatic presence-based election (needs heartbeat/presence tracking that does not exist); keeping server-side bots (heavy serverless CPU, contradicts the product directive); withholding bot hands from the host (the browser bot brain needs the seat's hand to play).
