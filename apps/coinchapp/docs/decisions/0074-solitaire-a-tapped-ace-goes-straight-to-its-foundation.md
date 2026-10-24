# 0074 — Solitaire: a tapped Ace goes straight to its foundation

Date: 2026-10-24
Status: Accepted (narrows 0073)
Decision: Tapping an Ace moves it straight onto its own foundation, with no second tap. Every other card still needs a destination tap or a drag (0073).
Context: Owner request (2026-10-24): "quand on clique sur une carte As, elle aille directement à sa place dans l'emplacement des As, sans avoir à cliquer une deuxième fois."
Rationale: An Ace can also sit on a 2, but the owner wants the tap to prefer the foundation every time. `resolveTap` moves a tapped Ace (waste or column) onto its own foundation; `applyMove` rejects it when that foundation already holds it, and an Ace already on its foundation is left for the normal tap.
Consequences: A 2 (or anything else) with a single destination still waits for the second tap. Dragging an Ace is unchanged.
Alternatives_Rejected: Auto-move every card that has a single destination — the owner rejected that the day before (0073).
