// Defenders' leads: the opening lead (partner's suit, sequences, fourth
// best, short suits against a trump contract) and later leads (cash what
// sets the contract, return partner's suit, cut dummy's ruffs).
import { ACE, KING, partnerOf, QUEEN, rankOf, suitOf } from "./cards.js";
import {
  highest,
  isMaster,
  lowest,
  suitCards,
  suitsBid,
  tricksNeeded
} from "./play-util.js";

const touching = (ranks) =>
  ranks.length >= 2 && ranks[0] - ranks[1] === 1 && ranks[0] >= 8;

function suitContractScore(ranks, len, isTrump, trumpCount) {
  let score = 0;
  if (ranks[0] === ACE && ranks[1] === KING) score += 22;
  else if (touching(ranks) && ranks[0] >= 9) score += 18;
  if (isTrump) score -= len === 1 ? 40 : ranks[0] >= QUEEN ? 25 : 12;
  else if (len === 1 && trumpCount >= 1 && ranks[0] < QUEEN) score += 18;
  else if (len === 2 && ranks[0] < QUEEN) score += 4;
  if (ranks[0] === ACE && ranks[1] !== KING) score -= 8;
  if (ranks.includes(KING) && !ranks.includes(ACE) && !ranks.includes(QUEEN))
    score -= 10;
  if (ranks[0] === QUEEN && !touching(ranks)) score -= 4;
  return score;
}

function ntScore(ranks, len) {
  const honours = ranks.filter((r) => r >= 9).length;
  let score = len * 6 + honours * 2;
  if (touching(ranks) && ranks[1] - ranks[2] === 1) score += 15;
  if (len <= 2 && ranks[0] >= QUEEN) score -= 10;
  return score;
}

function leadScore(v, suit, cards, bids) {
  const ranks = cards.map(rankOf);
  const partner = partnerOf(v.seat);
  let score = bids[partner].has(suit) ? 40 : 0;
  if (bids[v.declarer].has(suit) || bids[v.dummy].has(suit)) score -= 25;
  if (v.trump < 0) return score + ntScore(ranks, cards.length);
  const trumps = v.hands[v.seat].filter((c) => suitOf(c) === v.trump).length;
  return (
    score + suitContractScore(ranks, cards.length, suit === v.trump, trumps)
  );
}

// Top of a sequence, the ace against a trump contract, top of a doubleton,
// fourth best from an honour, low from three to an honour, else top.
function cardFromSuit(cards, trump, partnerSuit) {
  const ranks = cards.map(rankOf);
  const len = cards.length;
  if (len <= 2 || touching(ranks)) return cards[0];
  if (ranks[0] === ACE && trump >= 0) return cards[0];
  if (partnerSuit) return ranks[0] >= 9 ? cards[len - 1] : cards[0];
  if (len >= 4 && ranks[0] >= 9) return cards[3];
  if (len >= 4) return cards[1];
  return ranks[0] >= 9 ? cards[len - 1] : cards[0];
}

export function openingLead(v) {
  const hand = v.hands[v.seat];
  const bids = suitsBid(v);
  let best = null;
  [3, 2, 1, 0].forEach((suit) => {
    const cards = suitCards(hand, suit);
    if (!cards.length) return;
    const score = leadScore(v, suit, cards, bids);
    if (!best || score > best.score) best = { suit, score, cards };
  });
  const partnerSuit = bids[partnerOf(v.seat)].has(best.suit);
  return cardFromSuit(best.cards, v.trump, partnerSuit);
}

const ruffable = (v, suit) => {
  if (v.trump < 0 || suit === v.trump) return false;
  const dummy = v.hands[v.dummy];
  const dummyRuffs =
    dummy &&
    !dummy.some((c) => suitOf(c) === suit) &&
    dummy.some((c) => suitOf(c) === v.trump);
  return dummyRuffs || v.voids[v.declarer][suit];
};

function partnerLedSuit(v) {
  const partner = partnerOf(v.seat);
  const trick = v.tricks.find((t) => t.leader === partner);
  return trick ? suitOf(trick.plays[0].card) : null;
}

function returnCard(cards, v) {
  const master = cards.find((c) => isMaster(v, c));
  if (master) return master;
  return cards.length === 2 ? cards[0] : cards[cards.length - 1];
}

function cashMasters(v, hand) {
  const masters = hand.filter(
    (c) => isMaster(v, c) && !ruffable(v, suitOf(c)) && suitOf(c) !== v.trump
  );
  if (!masters.length) return null;
  if (v.trump >= 0 || masters.length >= tricksNeeded(v))
    return highest(masters);
  return null;
}

function cutRuffs(v, hand) {
  const dummy = v.hands[v.dummy];
  if (v.trump < 0 || !dummy) return null;
  const trumps = suitCards(hand, v.trump);
  const dummyTrumps = dummy.filter((c) => suitOf(c) === v.trump).length;
  const shortSide = [0, 1, 2, 3].some(
    (s) => s !== v.trump && dummy.filter((c) => suitOf(c) === s).length <= 1
  );
  if (!trumps.length || !dummyTrumps || !shortSide) return null;
  if (trumps.length === 1 && rankOf(trumps[0]) >= QUEEN) return null;
  return trumps[trumps.length - 1];
}

// Lead the suit where dummy is weakest: top of touching honours, else low.
function quietLead(v, hand) {
  const dummy = v.hands[v.dummy] || [];
  const options = [0, 1, 2, 3].filter(
    (s) => s !== v.trump && hand.some((c) => suitOf(c) === s)
  );
  if (!options.length) return lowest(hand);
  const weakness = (s) =>
    dummy.filter((c) => suitOf(c) === s && rankOf(c) >= 9).length * 3 -
    suitCards(hand, s).length;
  const suit = options.sort((a, b) => weakness(a) - weakness(b))[0];
  const cards = suitCards(hand, suit);
  const ranks = cards.map(rankOf);
  return touching(ranks) || cards.length <= 2
    ? cards[0]
    : cards[cards.length - 1];
}

export function defenderLead(v) {
  const hand = v.hands[v.seat];
  const cash = cashMasters(v, hand);
  if (cash !== null) return cash;
  const back = partnerLedSuit(v);
  const backCards = back === null ? [] : suitCards(hand, back);
  if (backCards.length && !ruffable(v, back)) return returnCard(backCards, v);
  return cutRuffs(v, hand) ?? quietLead(v, hand);
}
