# 0055 — Daily play allowance is 20 coins

Date: 2026-10-31
Status: Accepted (supersedes the "10 per day" allowance in 0046; 0047's one coin per match stays)
Decision: Each player gets 20 coins per Paris day, still one coin per match started. The number lives in `DAILY_COINS` (`api/profile/_coins.js`, `hub-coins.js`, `apps/coinchapp/lib/server/actions-match.ts`) and is passed as `p_daily`; no SQL change.
Context: Owner request (2026-10-31): the default number of pieces to play with should be 20.
Rationale: The cap is a parameter, not a stored schema. Raising it gives players who already spent some of today's 10 the extra coins immediately (`remaining = 20 - spent`).
Consequences: Hub badge shows `n/20`. Midnight reset still returns the counter to 20. Admins stay unlimited. Tranquil does not spend coins until its server is wired; when it is, it must pass the same 20.
Alternatives_Rejected: A new migration that hardcodes 20 in SQL (the functions already take `p_daily`). Leaving coinchapp at 10 (same player would hit a lower cap there).
