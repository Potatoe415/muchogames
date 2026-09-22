# 0018 — Rule 4b (don't overtake partner) generalised to any partner + secure-win guard

Date: 2026-06-16
Status: Accepted
Decision: `dontOvertakePartner` no longer requires the partner to be the declarer. It now applies whenever the partner is the **certain** winner of the trick — either I am the last to play, or no card still unseen by me can beat the partner's winning card (`partnerWinSecure`). When the partner is only the provisional winner (e.g. led a weak card with opponents still to play), the filter does nothing and the ISMCTS search decides.
Context: Reviewing the just-added rule 4b, the declarer-only scope was both too narrow ("don't overtake your partner" is universal in coinche) and unsafe (ducking when the partner merely leads a weak card can hand the trick to opponents who play after me). User picked the "any partner + secure-win" option.
Rationale: Not overtaking a partner who already holds the trick for sure never loses a trick and saves a high card; gating on certainty avoids the weak-lead trap. Reuses public info only (my hand + played cards) via a full-deck scan for unbeatable-card detection; still a hard filter with safe fallback, ISMCTS untouched.
Consequences: Supersedes the rule 4b scope noted in the previous entry (declarer-only). `dontOvertakePartner` signature changed to take `hand` + `played` instead of `contract`. tsc clean, 47/47 tests pass.
Alternatives_Rejected: Declarer-only scope (too narrow, keeps the weak-lead risk); duck whenever partner is provisional winner (the weak-lead trap); last-to-play-only guard (simpler but misses correct 2nd/3rd-seat ducks when the partner is already master).
