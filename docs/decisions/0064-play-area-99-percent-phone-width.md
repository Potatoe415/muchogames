# 0064 — Play area 99% of the phone's width in portrait

Date: 2026-11-06
Status: Accepted
Decision: In portrait, a game's play area (canvas or board) is 99% of the screen's width; it leaves the 24px side strips of decision 0061, everything else keeps them (`docs/PLATFORM_RULES.md` section 6.3).
Context: Owner request: on a phone, JezzBall's field was ~87% of the width and Chip's Challenge's ~70-80% (24px side padding, plus integer zoom for Chip's).
Rationale: The board is what the player looks at; 24px on each side is 13% of a 360px phone. Only the board leaves the strips: buttons, HUD and cards stay clear of the system back gesture. Owner choices (2026-11-06): board only (not the whole page), applied now to JezzBall and Chip's Challenge, and Chip's pixel art scales freely (an original pixel spans 3 or 4 device pixels) rather than keep integer zoom, which on most phones (1080 / 1440 device px) leaves it at ~80%.
Consequences: Binds new games; existing games are brought to it one by one (`docs/BACKLOG.md`). A swipe that starts in the outer 24px of the board can trigger the system back gesture (the match is saved, section 5). Boards are drawn with fractional cell sizes, cell edges rounded to device pixels. Landscape, desktop and TV are unchanged.
Alternatives_Rejected: The whole page at 99% (puts buttons under the system gestures); board at 99% with swipes ignored near the edges (owner chose the simpler rule); integer zoom for Chip's Challenge (no gain on most phones).
