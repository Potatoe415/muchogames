# 0061 — La Bataille Corse: face-to-face gets its own home-screen button after all

Date: 2026-09-21
Status: Accepted
Decision: Reversed the "toggle inside `/local`, no new home button" choice from earlier the same day. La Bataille Corse's home splash now has a 4th button, "Jouer face à face" (`--accent-orange`), placed **first** (above "Jouer en local"). It routes to `/local?game=bataillecorse&mode=duel` - the same setup screen as before, with the existing bot/duel toggle now defaulting to "duel" (still switchable) instead of always defaulting to "bot".
Context: User explicitly changed their mind right after the previous decision was shipped and asked for an extra button, first, "Jouer face à face".
Rationale: Reused the existing `/local` setup screen and duel-mode toggle unchanged (only added a `?mode=duel` read to preset the toggle's initial state) rather than building a second setup flow - the toggle from the earlier decision is still useful for a player who lands there via the plain "Jouer en local" button and changes their mind the other way.
Consequences: `app/bataillecorse/page.tsx` gained a 4th button (new `bataillecorseFaceToFaceButton`/`bataillecorseFaceToFaceNote` i18n keys). `app/local/page.tsx`'s `bataillecorseMode` initial state now reads `searchParams.get("mode")` instead of a hardcoded `"bot"`. No changes to the duel engine/table/hooks from the previous decision.
Alternatives_Rejected: Removing the now-partly-redundant toggle from `/local` since the home screen decides the mode up front - rejected, it stays useful for the "Jouer en local" entry point and removing it wasn't requested.
