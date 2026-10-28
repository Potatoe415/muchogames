// A robot's card. Rules of thumb for most of the deal; at the harder levels
// the last tricks are searched double dummy over sampled layouts of the
// hidden hands (Monte Carlo), keeping the card that most often reaches the
// side's target.
import { analyzeAuction } from "./bid-system.js";
import { rankOf, sideOf } from "./cards.js";
import { createSolver } from "./dds.js";
import { legalPlays } from "./deal.js";
import { declarerLead } from "./play-declarer.js";
import { followCard } from "./play-follow.js";
import { defenderLead, openingLead } from "./play-lead.js";
import { isDeclarerSide, prepareView, tricksNeeded } from "./play-util.js";
import { sampleLayout } from "./sampler.js";

export const LEVEL_IDS = ["easy", "medium", "hard", "expert"];

const SEARCH = {
  hard: { tricks: 5, samples: 12, ms: 400 },
  expert: { tricks: 7, samples: 20, ms: 900 },
  hint: { tricks: 7, samples: 20, ms: 900 }
};

function ruleCard(v, legal) {
  if (v.trick.length) return followCard(v, legal);
  if (isDeclarerSide(v)) return declarerLead(v);
  return v.tricks.length ? defenderLead(v) : openingLead(v);
}

// The lowest card of the run of touching cards `card` belongs to.
function runBottom(legal, card) {
  let bottom = card;
  while (rankOf(bottom) > 0 && legal.includes(bottom - 1)) bottom -= 1;
  return bottom;
}

const distinctCards = (legal) =>
  legal.filter((card) => runBottom(legal, card) === card);

function sampleScores(v, candidates, plan, know) {
  const scores = new Map(candidates.map((c) => [c, 0]));
  const need = tricksNeeded(v);
  const leader = v.trick.length ? v.trick[0].seat : v.seat;
  const started = Date.now();
  let samples = 0;
  while (
    samples < plan.samples &&
    (samples < 4 || Date.now() - started < plan.ms)
  ) {
    const hands = sampleLayout(v, know);
    if (!hands) break;
    const solver = createSolver({
      hands,
      trick: v.trick,
      leader,
      trump: v.trump,
      maxSide: sideOf(v.seat),
      limit: 400000
    });
    const values = candidates.map((c) => solver.valueOf(v.seat, c));
    if (values.includes(null)) break;
    values.forEach((t, i) => {
      scores.set(
        candidates[i],
        scores.get(candidates[i]) + (t >= need ? 100 : 0) + t
      );
    });
    samples += 1;
  }
  return samples ? scores : null;
}

// Ties keep the rule-of-thumb card, so the search only overrides it when a
// different card does better.
function searchCard(v, legal, plan, fallback) {
  const candidates = distinctCards(legal);
  if (candidates.length === 1) return fallback;
  const know = analyzeAuction(v.dealer, v.vul, v.calls).know;
  const scores = sampleScores(v, candidates, plan, know);
  if (!scores) return fallback;
  let best = runBottom(legal, fallback);
  let bestScore = scores.get(best);
  scores.forEach((score, card) => {
    if (score > bestScore) {
      best = card;
      bestScore = score;
    }
  });
  return best === runBottom(legal, fallback) ? fallback : best;
}

export function chooseCard(view) {
  const v = prepareView(view);
  const legal = legalPlays(v.hands[v.seat], v.trick);
  if (legal.length === 1) return legal[0];
  const rule = ruleCard(v, legal);
  const plan = SEARCH[v.level];
  if (plan && v.hands[v.seat].length <= plan.tricks) {
    return searchCard(v, legal, plan, rule);
  }
  if (v.level === "easy" && Math.random() < 0.2) {
    return legal[Math.floor(Math.random() * legal.length)];
  }
  return rule;
}
