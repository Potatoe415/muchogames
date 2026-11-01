# 0078 — Arrow keys and TV remote drive every screen through one global focus mover

Date: 2026-11-01
Status: Accepted
Decision: `components/RemoteNav.tsx`, mounted once in `app/layout.tsx`, moves the focus to the nearest reachable control in the arrow's direction, presses the focused button on Enter/OK (once, held keys do not repeat), and closes the open panel on Escape or the webOS/Tizen Back key.
Context: Owner wants the card games playable on the 4K TV browser with the remote and with the arrow keys (after decision 0076 made them fill the screen).
Rationale: Every action in the six games is already a `<button>`/`<a>` (cards, piles, bids, slap, flip), so one spatial focus mover covers them all with no per-game code. "Reachable" is a hit test at a card's visible strip (centre, top-left, left edge), which skips anything an open panel covers and keeps the focus inside it. Enter is handled by hand because TV browsers do not all activate buttons the same way. The pink focus ring shows from the first arrow press until the next touch or click (`html[data-remote-nav]`), not only on the browser's `:focus-visible` guess. A focused card is raised over the cards fanned on it.
Consequences: New controls must stay real buttons/links to be reachable. A panel closes with Escape only through a `data-id` ending in `close-button` or a fixed `-overlay` backdrop. Android TV browsers may still turn Back into history back (leaves to the hub; the match stays saved).
Alternatives_Rejected: Per-game key maps (six copies of the same thing). Native `:focus-visible` only (not reliable on TV browsers). A Bataille Corse direct slap key: owner deferred it (`docs/BACKLOG.md`).
