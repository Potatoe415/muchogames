import type { Seat } from "./types";

/**
 * Bot personalities. Every behaviour difference comes from these numbers: the
 * decision code never branches on the profile name. `normal` is the calibrated
 * baseline (decisions 0009/0011); profile effects are measured as the gap to
 * `normal`, so `normal` bids and plays as before (plus coinche/surcoinche).
 *
 * Tuned by simulation (3000 deals, team of the profile vs team of `normal`):
 * takes / makes / coinches won / net points per deal vs normal:
 *   aggressive   81% / 57% / -   / +11.6
 *   conservative 27% / 93% / -   / -49   (passes quickly: the opponents take)
 *   defensive    38% / 87% / 71% / -22   (51 coinches)
 *   normal       50% / 83% / 100% / ~0   (8 coinches)
 */
export type BotProfile = "normal" | "aggressive" | "conservative" | "defensive";
export const BOT_PROFILES: BotProfile[] = ["normal", "aggressive", "conservative", "defensive"];
export const DEFAULT_BOT_PROFILE: BotProfile = "normal";

/** Profile per seat; a missing seat plays `normal`. JSON-safe (stored in `GameSettings`). */
export type BotProfiles = Partial<Record<Seat, BotProfile>>;

export interface BotProfileConfig {
  /** Points taken off the hand estimate before bidding (negative = bids higher). */
  bidSafetyMargin: number;
  /** Weight of trump length and short suits (voids/singletons) in the estimate. */
  distributionMultiplier: number;
  /** Strength of the raise on a partner's bid (normal 15 = the calibrated raise). */
  partnerTrustBonus: number;
  /** Estimated opponent fail probability needed to coinche. */
  coincheThreshold: number;
  /** Estimated own success probability needed to surcoinche. */
  surcoincheThreshold: number;
  /** 0..1: passes a borderline ambiguous hand (strong in defence) to coinche later. */
  trapPassTendency: number;
  /** 0..1: in attack, appetite for leading trumps while opponents still hold some. */
  trumpHuntPriority: number;
  /** 0..1: in defence, appetite for leading a long outside suit to shorten the taker. */
  shorteningDefensePriority: number;
  /** 0..1: willingness to bank on unguarded tens and uncertain tricks. */
  riskTolerance: number;
  /** Belote variant: minimum take score (no coinche there). */
  beloteTakeThreshold: number;
}

export const BOT_PROFILE_CONFIG: Record<BotProfile, BotProfileConfig> = {
  normal: {
    bidSafetyMargin: 0,
    distributionMultiplier: 1.0,
    partnerTrustBonus: 15,
    coincheThreshold: 0.6,
    surcoincheThreshold: 0.6,
    trapPassTendency: 0.0,
    trumpHuntPriority: 0.5,
    shorteningDefensePriority: 0.5,
    riskTolerance: 0.5,
    beloteTakeThreshold: 45,
  },
  aggressive: {
    bidSafetyMargin: -10,
    distributionMultiplier: 1.3,
    partnerTrustBonus: 20,
    coincheThreshold: 0.55,
    surcoincheThreshold: 0.55,
    trapPassTendency: 0.0,
    trumpHuntPriority: 0.9,
    shorteningDefensePriority: 0.4,
    riskTolerance: 0.85,
    beloteTakeThreshold: 40,
  },
  conservative: {
    bidSafetyMargin: 5,
    distributionMultiplier: 0.85,
    partnerTrustBonus: 10,
    coincheThreshold: 0.75,
    surcoincheThreshold: 0.75,
    trapPassTendency: 0.2,
    trumpHuntPriority: 0.4,
    shorteningDefensePriority: 0.3,
    riskTolerance: 0.15,
    beloteTakeThreshold: 50,
  },
  defensive: {
    bidSafetyMargin: 0,
    distributionMultiplier: 1.0,
    partnerTrustBonus: 15,
    coincheThreshold: 0.5,
    surcoincheThreshold: 0.5,
    trapPassTendency: 0.8,
    trumpHuntPriority: 0.3,
    shorteningDefensePriority: 0.9,
    riskTolerance: 0.45,
    beloteTakeThreshold: 48,
  },
};

export const NORMAL_CONFIG = BOT_PROFILE_CONFIG.normal;

export function isBotProfile(value: unknown): value is BotProfile {
  return BOT_PROFILES.includes(value as BotProfile);
}

/** Config for `seat`, `normal` when the seat has no (valid) profile. */
export function configForSeat(profiles: BotProfiles | undefined, seat: Seat): BotProfileConfig {
  const profile = profiles?.[seat];
  return BOT_PROFILE_CONFIG[isBotProfile(profile) ? profile : DEFAULT_BOT_PROFILE];
}

/** Keep only seats 0..3 mapped to known profiles (untrusted input: settings, URL). */
export function sanitizeBotProfiles(raw: unknown): BotProfiles {
  const out: BotProfiles = {};
  if (!raw || typeof raw !== "object") return out;
  for (const seat of [0, 1, 2, 3] as Seat[]) {
    const value = (raw as Record<string, unknown>)[seat];
    if (isBotProfile(value)) out[seat] = value;
  }
  return out;
}

/** Local game URL form: comma list for seats 1..3 ("aggressive,normal,defensive"). */
export function encodeLocalBotProfiles(profiles: BotProfiles): string {
  return ([1, 2, 3] as Seat[]).map((seat) => profiles[seat] ?? DEFAULT_BOT_PROFILE).join(",");
}

export function decodeLocalBotProfiles(raw: string | undefined): BotProfiles {
  const parts = (raw ?? "").split(",");
  return sanitizeBotProfiles({ 1: parts[0], 2: parts[1], 3: parts[2] });
}
