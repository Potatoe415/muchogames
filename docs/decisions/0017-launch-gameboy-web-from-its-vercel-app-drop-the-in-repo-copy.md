# 0017 — Launch GameBoy Web from its Vercel app, drop the in-repo copy

Date: 2026-09-01
Status: Accepted
Decision: The hub tile is `kind: external` to `https://gameboy-web.vercel.app/binjgb/docs/simple.html`. Deleted the vendored player, `index.html`, and `porklike.gb` from bergamots. Thumbnail stays.
Context: The user created a Vercel project at `gameboy-web.vercel.app` and asked to push that launch URL and remove the duplicates.
Rationale: One player, one host. Bergamots is the hub; gameboy-web is the app. Root `https://gameboy-web.vercel.app/` 404s today, so the tile uses the working `simple.html` path.
Consequences: Bergamots no longer ships an emulator or ROM. Changes to the player happen in the gameboy-web repo. The leftover thumbnail folder `public/games/gameboy-web/assets/` remains for the hub tile.
Alternatives_Rejected: Keep both copies - the user asked to drop the duplicates. Point at the bare vercel.app URL - that path 404s.
