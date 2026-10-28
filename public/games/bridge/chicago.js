// A match is a Chicago: four deals, dealer North, East, South then West;
// nobody vulnerable, then the dealer's side, the dealer's side, everybody.
import { validCalls } from "./auction.js";
import { dealHands, sideOf } from "./cards.js";
import { dealState, legalPlays } from "./deal.js";
import { contractScore } from "./scoring.js";

export const DEALS_PER_MATCH = 4;
const VULNERABILITY = [
  [false, false],
  [false, true],
  [true, false],
  [true, true]
];

export function newDeal(index, random) {
  return {
    dealer: index % 4,
    vul: [...VULNERABILITY[index]],
    hands: dealHands(random),
    calls: [],
    plays: [],
    claim: 0
  };
}

export function createMatch(level, random) {
  return { level, deals: [newDeal(0, random)], results: [] };
}

export const currentDeal = (match) => match.deals[match.deals.length - 1];

// { contract, declarer tricks, ns, ew } of a finished deal.
export function dealResult(deal) {
  const state = dealState(deal);
  const { contract } = state;
  const side = sideOf(contract.declarer);
  const score = contractScore(contract, state.declarerTricks, deal.vul[side]);
  const forNs = side === 0 ? score : -score;
  return {
    contract,
    tricks: state.declarerTricks,
    ns: Math.max(0, forNs),
    ew: Math.max(0, -forNs)
  };
}

export function totals(match) {
  return match.results.reduce(
    (sum, result) => ({ ns: sum.ns + result.ns, ew: sum.ew + result.ew }),
    { ns: 0, ew: 0 }
  );
}

export const matchOver = (match) => match.results.length >= DEALS_PER_MATCH;

// Records the finished deal and deals the next one unless the match is over.
export function closeDeal(match, random) {
  const results = [...match.results, dealResult(currentDeal(match))];
  const next = { ...match, results };
  if (results.length < DEALS_PER_MATCH) {
    next.deals = [...match.deals, newDeal(results.length, random)];
  }
  return next;
}

// A passed-out deal is dealt again by the same dealer.
export function redeal(match, random) {
  const deals = [...match.deals];
  deals[deals.length - 1] = newDeal(match.results.length, random);
  return { ...match, deals };
}

export const replaceDeal = (match, deal) => ({
  ...match,
  deals: [...match.deals.slice(0, -1), deal]
});

function validHands(hands) {
  if (!Array.isArray(hands) || hands.length !== 4) return false;
  const seen = new Set(hands.flat());
  return (
    seen.size === 52 &&
    hands.every((hand) => Array.isArray(hand) && hand.length === 13) &&
    [...seen].every((card) => Number.isInteger(card) && card >= 0 && card < 52)
  );
}

function validPlays(deal) {
  if (!Array.isArray(deal.plays)) return false;
  for (let i = 0; i < deal.plays.length; i += 1) {
    const state = dealState({ ...deal, plays: deal.plays.slice(0, i) });
    if (state.phase !== "play") return false;
    const hand = state.remaining[state.toAct];
    const trick = state.current.plays;
    if (!legalPlays(hand, trick).includes(deal.plays[i])) return false;
  }
  return true;
}

function validDeal(deal, index) {
  return (
    deal &&
    deal.dealer === index % 4 &&
    validHands(deal.hands) &&
    Array.isArray(deal.calls) &&
    validCalls(deal.dealer, deal.calls) &&
    validPlays({ ...deal, claim: 0 }) &&
    Number.isInteger(deal.claim) &&
    deal.claim >= 0 &&
    deal.claim <= 13
  );
}

// Rebuilds a saved match, replaying every deal against the rules.
export function restoreMatch(saved) {
  if (!saved || !Array.isArray(saved.deals) || !saved.deals.length) return null;
  if (saved.deals.length > DEALS_PER_MATCH) return null;
  const deals = saved.deals.map((deal, index) => ({
    dealer: deal?.dealer,
    vul: [...VULNERABILITY[index]],
    hands: deal?.hands,
    calls: deal?.calls,
    plays: deal?.plays,
    claim: deal?.claim ?? 0
  }));
  if (!deals.every(validDeal)) return null;
  const match = { level: saved.level, deals, results: [] };
  for (let i = 0; i < deals.length - 1; i += 1) {
    if (dealState(deals[i]).phase !== "done") return null;
    match.results.push(dealResult(deals[i]));
  }
  return match;
}
