# 0005 — Game table UI component split

Date: 2026-06-09
Status: Accepted
Decision: Split the game table presentation into `GameHud`, `GameTableScene`, and small table helpers while keeping `GameTable` as the state/action orchestrator.
Context: Matching the provided mobile game screenshot required a richer HUD, table scene, player positions, and card styling.
Rationale: Separate presentational components keep each file focused and avoid turning the interactive table into a monolith.
Consequences: Future visual adjustments for the top HUD and table scene should happen in their dedicated components; gameplay logic remains unchanged.
Alternatives_Rejected: Keep all layout in `GameTable` (too broad); change game state shape for visual-only data (unnecessary).
