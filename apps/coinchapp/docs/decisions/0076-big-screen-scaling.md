# 0076 — Card games scale up on big screens; Solitaire columns tighten to fit

Date: 2026-11-01
Status: Accepted
Decision: The root font size is `clamp(16px, 100svmin / 56, 48px)`, so every rem-based size (card caps, HUD, buttons, text) grows with the screen; Solitaire sizes its cards for a 4-card-width fan and tightens long columns (face-down cards first) to the height left.
Context: On a 4K TV browser the tables stayed phone-sized in the middle of the screen: cards were capped at 7rem (Solitaire 6.5rem), and Solitaire sized itself for its worst-case column, so height capped it at ~92 px on 16:9.
Rationale: One CSS rule covers all six games with no per-game code. Phones and tablets (smaller side < ~900 px) keep exactly 16px. Tightening the fan only when needed is what desktop Solitaire does and lets cards use the real space.
Consequences: Desktop 1080p screens also get ~1.2x larger UI. Any new fixed size must be in rem to follow. Solitaire measures its scene (`useSolitaireFanRoom`) with a ResizeObserver.
Alternatives_Rejected: A TV-only mode (`?tv=1` like Millionaire): the owner chose always-on scaling. Remote-control navigation: deferred (`docs/BACKLOG.md`).
