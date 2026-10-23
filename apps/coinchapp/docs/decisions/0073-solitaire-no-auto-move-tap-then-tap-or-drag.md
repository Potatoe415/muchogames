# 0073 — Solitaire: no auto-move; tap then tap, or drag and drop

Date: 2026-10-23
Status: Accepted (supersedes the tap rule of 0072)
Decision: A tapped card never moves on its own, even with a single legal destination. The first tap picks it up (only when it can go somewhere) and lights its destinations; a tap on one moves it there. Drag and drop works alongside: a press that moves more than 8 px drags the pressed card or run, which follows the pointer and lands on the `data-drop` zone it is released over (illegal drop: it snaps back). The click a browser fires right after a drag is ignored for 400 ms.
Context: Owner feedback (2026-10-23): "quand je clique sur une carte et qu'elle peut aller quelque part, elle y va automatiquement. J'aime pas ça" — wants either drag and drop, or tap the card then tap where it goes.
Rationale: `resolveTap` keeps one pure rule for both cases. Drag lives in `components/useSolitaireDrag.ts` with `window` pointer listeners (no pointer capture, so a plain tap still clicks the button underneath) and `document.elementsFromPoint` hit testing that skips the dragged pile itself. Dragged cards are moved with a CSS transform in place, no floating copy.
Consequences: Every move now takes two taps or one drag. Pressable cards carry `touch-action: none`.
Alternatives_Rejected: HTML5 drag and drop (`draggable`), which does not fire on touch screens.
