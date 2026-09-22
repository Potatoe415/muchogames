# 0022 — Pre-fill the profile "Nom" from the Google display name

Date: 2026-09-05
Status: Accepted
Decision: `auth.js` now also reads the `name` claim out of the same Google JWT it already decodes for the email, and writes it to `bergamots-player-name` (the same `localStorage` key `profile.js` uses) — but only the first time, i.e. only while that key is still empty. It never overwrites a name the player already typed on `/profile`.
Context: User asked whether the Google account's name could be used automatically instead of always requiring manual entry on `/profile`.
Rationale: The JWT already carries `name` alongside `email`; reusing it removes a manual step for anyone signing in with Google, with no new data source, no new storage key, and no backend involved. "Fill only if empty" preserves the existing "editable and saved" behavior from the prior decision — sign-in never silently clobbers a manual edit.
Consequences: A player who signs in with Google before ever visiting `/profile` gets their name pre-filled for free. A player who typed a custom name first keeps it forever unless they clear it themselves (clearing it would let a subsequent sign-in refill it from Google again).
Alternatives_Rejected: Always overwriting the name from Google on every sign-in — rejected, would silently discard a manual edit. Storing the Google name under a separate key from the manual one — rejected, unnecessary complexity for two names that mean the same thing to the player.
