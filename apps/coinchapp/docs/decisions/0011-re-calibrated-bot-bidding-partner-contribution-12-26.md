# 0011 — Re-calibrated bot bidding (PARTNER_CONTRIBUTION 12 -> 26)

Date: 2026-06-10
Status: Accepted
Decision: Raised `PARTNER_CONTRIBUTION` in `lib/coinche/bot.ts` from 12 to 26. Supersedes the earlier "12" calibration.
Context: Bots almost never opened in real play (user saw ~1 in 5 deals) and bid low when they did. A 4000-deal simulation (manual auction + weak play-out) confirmed 12 only reaches a contract 60.5% of the time, avg value 84.6.
Rationale: Sweep results - 12: 60.5%/84.6/94.2% make; 20: 90.8%/88.1/90.2%; 26: 99.1%/92.5/86.0%; 32: 100%/98.2/81.6%; 40: 100%/106.3/72.4% (contractRate/avgValue/makeRate). 26 is the knee of the curve: a contract on ~99% of deals and a higher average (92.5) while keeping an ~86% make rate under weak play - and the real game now plays attack with the stronger ISMCTS, so true make rate is higher.
Consequences: Bots open on nearly every deal and bid more meaningfully. Slightly more failed contracts than at 12, accepted as the explicit product direction ("bid more, higher"). The make-rate figure is a conservative proxy (both teams played the weak cheapest-winner bot in the sim).
Alternatives_Rejected: 20 (still ~9% redeals, barely higher bids); 32+ (over-bids, make rate drops below ~82% even before accounting for human defenders).
