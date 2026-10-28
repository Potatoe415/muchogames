// Playing to a trick already led: second hand low, third hand high (or a
// finesse for declarer), fourth hand wins as cheaply as it can; ruff or
// discard the least useful card when void.
import { rankOf, suitOf } from "./cards.js";
import { beats } from "./deal.js";
import {
  cheapestBeating,
  currentWinner,
  equalBelow,
  higherOutside,
  highest,
  isDeclarerSide,
  isMaster,
  lowest,
  suitCards,
  tricksNeeded
} from "./play-util.js";

const sameSide = (a, b) => a % 2 === b % 2;

function bestIn(hand, suit) {
  const cards = suitCards(hand || [], suit);
  return cards.length ? cards[0] : null;
}

// Can the visible hand playing after us beat `best`?
function nextCanBeat(v, next, best, led) {
  const hand = v.hands[next];
  if (!hand) return null;
  const follow = hand.filter((c) => suitOf(c) === led);
  const pool = follow.length ? follow : hand;
  return pool.some((c) => beats(c, best, v.trump));
}

function fourthHand(v, legal, win) {
  if (sameSide(win.seat, v.seat)) return lowest(legal);
  return cheapestBeating(legal, win.card, v.trump) ?? lowest(legal);
}

function thirdHand(v, legal, win, led) {
  const next = (v.seat + 1) % 4;
  const partnerWins = sameSide(win.seat, v.seat);
  const nextBeats = nextCanBeat(v, next, win.card, led);
  if (partnerWins && (nextBeats === false || isMaster(v, win.card)))
    return lowest(legal);
  if (v.hands[next]) {
    const theirs = bestIn(v.hands[next], led);
    const target =
      theirs !== null && beats(theirs, win.card, v.trump) ? theirs : win.card;
    return cheapestBeating(legal, target, v.trump) ?? lowest(legal);
  }
  if (partnerWins && rankOf(win.card) >= 9) return lowest(legal);
  const top = highest(legal);
  if (!beats(top, win.card, v.trump)) return lowest(legal);
  if (!isDeclarerSide(v)) return equalBelow(v, legal, top);
  const cheap = cheapestBeating(legal, win.card, v.trump);
  return higherOutside(v, cheap) <= 1 ? cheap : lowest(legal);
}

function secondHand(v, legal, win, led) {
  const after = (v.seat + 2) % 4;
  const cheap = cheapestBeating(legal, win.card, v.trump);
  if (isDeclarerSide(v)) {
    const partnerTop = bestIn(v.hands[after], led);
    if (partnerTop !== null && isMaster(v, partnerTop)) return lowest(legal);
    return cheap !== null && isMaster(v, cheap) ? cheap : lowest(legal);
  }
  if (cheap !== null && isMaster(v, cheap) && tricksNeeded(v) === 1)
    return cheap;
  const ledCard = v.trick[0].card;
  if (rankOf(ledCard) >= 9 && cheap !== null && shouldCover(v, ledCard))
    return cheap;
  return lowest(legal);
}

// Cover an honour unless dummy led it from a sequence.
function shouldCover(v, ledCard) {
  const leader = v.trick[0].seat;
  const hand = v.hands[leader];
  if (!hand) return true;
  return !hand.some(
    (c) => suitOf(c) === suitOf(ledCard) && rankOf(c) === rankOf(ledCard) - 1
  );
}

function keepValue(v, hand, suit) {
  const cards = suitCards(hand, suit);
  const masters = cards.filter((c) => isMaster(v, c)).length;
  const honours = cards.filter((c) => rankOf(c) >= 9).length;
  const guard =
    cards.length >= 2 && rankOf(cards[0]) >= 10 && rankOf(cards[0]) < 12
      ? 3
      : 0;
  const length = v.trump < 0 && cards.length >= 4 ? cards.length : 0;
  return masters * 6 + honours * 2 + guard + length - cards.length * 0.5;
}

export function discard(v, legal) {
  const suits = [0, 1, 2, 3].filter(
    (s) => s !== v.trump && legal.some((c) => suitOf(c) === s)
  );
  if (!suits.length) return lowest(legal);
  const suit = suits.sort(
    (a, b) => keepValue(v, legal, a) - keepValue(v, legal, b)
  )[0];
  return lowest(suitCards(legal, suit));
}

function voidPlay(v, legal, win, position) {
  const partnerWins = sameSide(win.seat, v.seat);
  const safe = partnerWins && (position === 3 || isMaster(v, win.card));
  if (v.trump >= 0 && !safe) {
    const trumps = legal.filter((c) => suitOf(c) === v.trump);
    const ruff = cheapestBeating(trumps, win.card, v.trump);
    if (ruff !== null) return ruff;
  }
  return discard(v, legal);
}

export function followCard(v, legal) {
  const led = suitOf(v.trick[0].card);
  const win = currentWinner(v);
  const position = v.trick.length;
  if (suitOf(legal[0]) !== led) return voidPlay(v, legal, win, position);
  if (position === 3) return fourthHand(v, legal, win);
  if (position === 2) return thirdHand(v, legal, win, led);
  return secondHand(v, legal, win, led);
}
