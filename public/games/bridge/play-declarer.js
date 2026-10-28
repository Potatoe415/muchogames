// Declarer's leads, seeing both hands: ruff losers in the short trump hand,
// draw trumps, cash winners from the short side, lead toward tenaces, then
// set up the longest suit.
import { partnerOf, rankOf, suitOf } from "./cards.js";
import {
  higherOutside,
  isMaster,
  lowest,
  opponentTrumps,
  suitCards
} from "./play-util.js";

const count = (cards, suit) => cards.filter((c) => suitOf(c) === suit).length;

function ruffInShortHand(v, mine, other) {
  if (v.trump < 0 || !opponentTrumps(v)) return null;
  const otherTrumps = count(other, v.trump);
  if (!otherTrumps || otherTrumps > count(mine, v.trump)) return null;
  for (const suit of [0, 1, 2, 3]) {
    if (suit === v.trump || count(other, suit)) continue;
    const losers = suitCards(mine, suit).filter((c) => !isMaster(v, c));
    if (losers.length) return lowest(losers);
  }
  return null;
}

function drawTrumps(v, mine, other) {
  if (v.trump < 0) return null;
  const theirs = opponentTrumps(v);
  const ours = suitCards(mine, v.trump);
  const partners = suitCards(other, v.trump);
  if (!theirs || !ours.length || ours.length + partners.length <= theirs)
    return null;
  const master = ours.find((c) => isMaster(v, c));
  if (master !== undefined) return master;
  if (partners.some((c) => isMaster(v, c))) return ours[ours.length - 1];
  return ours[0];
}

// A winner from the hand that is shorter in the suit (unblocking), or a low
// card toward partner's winner.
function cashWinner(v, mine, other) {
  if (v.trump >= 0 && opponentTrumps(v)) return null;
  for (const suit of [3, 2, 1, 0]) {
    const a = suitCards(mine, suit);
    const b = suitCards(other, suit);
    const aTop = a.length && isMaster(v, a[0]);
    const bTop = b.length && isMaster(v, b[0]);
    if (aTop && (a.length <= b.length || !bTop)) return a[0];
    if (bTop && a.length && !aTop) return a[a.length - 1];
  }
  return null;
}

// Partner holds a tenace (A-Q with the king out): lead low toward it.
function towardTenace(v, mine, other) {
  for (const suit of [3, 2, 1, 0]) {
    if (suit === v.trump) continue;
    const a = suitCards(mine, suit);
    const b = suitCards(other, suit);
    if (!a.length || b.length < 2) continue;
    const tenace =
      b.some((c) => higherOutside(v, c) === 1) && isMaster(v, b[0]);
    if (tenace && rankOf(a[0]) < rankOf(b[1])) return a[a.length - 1];
  }
  return null;
}

function establish(v, mine, other) {
  const suits = [0, 1, 2, 3].filter((s) => s !== v.trump && count(mine, s));
  if (!suits.length) return lowest(mine);
  const longest = suits.sort(
    (x, y) =>
      count(mine, y) + count(other, y) - (count(mine, x) + count(other, x))
  )[0];
  const cards = suitCards(mine, longest);
  const honourTop =
    cards.length >= 2 &&
    rankOf(cards[0]) - rankOf(cards[1]) === 1 &&
    rankOf(cards[0]) >= 9;
  return honourTop ? cards[0] : cards[cards.length - 1];
}

export function declarerLead(v) {
  const mine = v.hands[v.seat];
  const other = v.hands[partnerOf(v.seat)] || [];
  return (
    ruffInShortHand(v, mine, other) ??
    drawTrumps(v, mine, other) ??
    cashWinner(v, mine, other) ??
    towardTenace(v, mine, other) ??
    establish(v, mine, other)
  );
}
