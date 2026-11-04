# 0060 — Full-height layouts use dvh, not vh

Date: 2026-11-03
Status: Accepted
Decision: Full-height layouts use `dvh` (`100dvh`, `h-dvh`, `min-h-dvh`, `max-h-dvh`). A stylesheet does not keep a `vh` fallback. `npm run check` rejects a bare `vh` in a game's HTML or CSS. Tightens the system-bar rule in decision 0053.
Context: `100vh` is the height with the mobile toolbar hidden, so the bottom of a page sits under the toolbar when it is showing. Several games already had a `vh` line followed by `dvh`. Coinchapp, Tranquil, the hub, and the older games still had bare `vh` or `min-h-screen`.
Rationale: One unit. Browsers that support this site support `dvh`. A second `vh` line does not fix the toolbar jump; it only brings the bug back where `dvh` is ignored.
Consequences: `docs/PLATFORM_RULES.md` section 6 no longer asks for a `100vh` line before `100dvh`. Fixed bars inside `TableShell` keep the shell's safe-area spacer and do not add a second `env(safe-area-inset-bottom)`.
Alternatives_Rejected: Keep `vh` then `dvh` as a fallback (the old 0053 wording). That leaves a broken unit in every sheet and the toolbar bug in any browser that skips the second line.
