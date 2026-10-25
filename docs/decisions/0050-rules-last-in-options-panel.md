# 0050 — Rules are the last section of every options panel

Date: 2026-10-25
Status: Accepted
Decision: Every game's options panel reads Language, then game-specific
options, then Rules. "Report a problem" stays below Rules, appended by
`initOptionsPanel`.
Context: The owner asked for the rules to always sit at the end of the
options panel. Decision 0047's order put Rules second, before the game's
own options (sound, swipe, reverse dice…).
Rationale: Rules are long text; options above them stay reachable without
scrolling. Applied to every in-repo game and the wordpack shell in one pass:
Chip's Challenge, JezzBall, Pipe Dream, SkiFree, Space Cadet, Yatzy (splash
and in-game panels). The others already had Rules last.
Consequences: Supersedes the order line of decision 0047 in
`docs/PLATFORM_RULES.md`. `npm run check` still checks presence only, not
order. Colocated apps (`apps/coinchapp`, `apps/tranquil`) follow their own
`AGENTS.md` and were not touched.
Alternatives_Rejected: Move "Report a problem" above Rules (owner chose to
keep it at the very bottom).
