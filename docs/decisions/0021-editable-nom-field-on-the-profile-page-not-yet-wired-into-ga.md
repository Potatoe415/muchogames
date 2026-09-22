# 0021 — Editable "Nom" field on the profile page, not yet wired into games

Date: 2026-09-05
Status: Accepted
Decision: `public/profile/` gained a text input ("Nom") + "Enregistrer" button (`profile.js`), saved to `localStorage` (`bergamots-player-name`) on submit. No game reads this value yet.
Context: User asked for a name field on the profile page that will later pre-fill the name field in games. Explicitly deferred the game-side wiring to a future task.
Rationale: Same minimal, client-only pattern as the signed-in email (no backend, no account). Saving now, before any game consumes it, lets the field exist and be testable independently of the (larger, multi-file) follow-up work of threading it into every game's own name input.
Consequences: `bergamots-player-name` is a new client-side key with no reader yet — inert until a follow-up task wires it into games' name inputs. `docs/PRODUCT.md`/`docs/TECH.md` note this explicitly so it is not mistaken for a finished feature.
Alternatives_Rejected: Waiting to add the field until the game-side wiring is also done — rejected per explicit user instruction to do this step now and the wiring later.
