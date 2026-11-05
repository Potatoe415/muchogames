# 0062 — Hub Home opens on "Most played"; `cartes` is card games only

Date: 2026-11-05
Status: Accepted
Decision: The first Home row is "Les plus joués" — the 12 games with the most launched matches (site-wide `/api/popular`, else this browser's `muchogames-match-counts`), ties broken by `added` date. When no count exists at all, the same row shows the 12 newest games as "Nouveautés". The `cartes` type is relabelled "Jeux de cartes" / "Card games" / "Juegos de cartas" and holds card games only; Yams (the only dice game) moves to `reflexion`.
Context: Owner request: the first games a visitor sees should be the most launched, else the newest; Yams out of the cards row and into Réflexion; no more dice in the cards category.
Rationale: Reuses the existing popular ranking (0052) and sort helpers; the row re-renders once the site-wide ranking arrives. Amends the Home row order of 0058 (Recent, Favorites, Featured now come after it).
Consequences: In `npm run dev` there is no `/api/popular`, so the row reflects only the local browser's counts. A future dice game needs a type of its own (product decision) or `reflexion`.
Alternatives_Rejected: Showing all games in the row (too long on a phone); a separate "Dés" type for a single game.
