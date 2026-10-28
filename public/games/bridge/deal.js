// One deal: { dealer, vul: [ns, ew], hands, calls, plays, claim }. Everything
// else (phase, tricks, whose turn) is derived by replaying calls and plays.
import { finalContract, readAuction, seatOfCall } from "./auction.js";
import { NT, partnerOf, rankOf, sideOf, SOUTH, suitOf } from "./cards.js";

// True when `card` beats `best`, the card winning the trick so far.
export function beats(card, best, trump) {
  const suit = suitOf(card);
  if (suit === suitOf(best)) return rankOf(card) > rankOf(best);
  return suit === trump;
}

export function winningPlay(plays, trump) {
  return plays.reduce((best, play) =>
    beats(play.card, best.card, trump) ? play : best
  );
}

export const trickWinner = (plays, trump) => winningPlay(plays, trump).seat;

export function legalPlays(hand, trick) {
  if (!trick.length) return [...hand];
  const led = suitOf(trick[0].card);
  const follow = hand.filter((card) => suitOf(card) === led);
  return follow.length ? follow : [...hand];
}

function replayPlays(deal, contract) {
  const trump = contract.strain === NT ? -1 : contract.strain;
  const remaining = deal.hands.map((hand) => [...hand]);
  const tricks = [];
  const won = [0, 0];
  let current = { leader: (contract.declarer + 1) % 4, plays: [] };
  deal.plays.forEach((card) => {
    const seat = (current.leader + current.plays.length) % 4;
    remaining[seat] = remaining[seat].filter((held) => held !== card);
    current.plays.push({ seat, card });
    if (current.plays.length < 4) return;
    const winner = trickWinner(current.plays, trump);
    tricks.push({ ...current, winner });
    won[sideOf(winner)] += 1;
    current = { leader: winner, plays: [] };
  });
  return { trump, remaining, tricks, won, current };
}

export function dealState(deal) {
  const auction = readAuction(deal.dealer, deal.calls);
  if (!auction.over) return { phase: "auction", toAct: auction.toAct, auction };
  if (auction.passedOut) return { phase: "passed", auction };
  const contract = finalContract(deal.dealer, deal.calls);
  const play = replayPlays(deal, contract);
  const declarerSide = sideOf(contract.declarer);
  if (deal.claim) play.won[declarerSide] += deal.claim;
  const done = play.tricks.length === 13 || Boolean(deal.claim);
  return {
    phase: done ? "done" : "play",
    auction,
    contract,
    dummy: partnerOf(contract.declarer),
    dummyVisible: deal.plays.length > 0,
    toAct: (play.current.leader + play.current.plays.length) % 4,
    declarerTricks: play.won[declarerSide],
    ...play
  };
}

// The human plays South in the auction, and both North-South hands when
// North-South declare.
export function humanControls(state, seat) {
  if (state.phase === "auction") return seat === SOUTH;
  if (sideOf(state.contract.declarer) === sideOf(SOUTH)) {
    return sideOf(seat) === sideOf(SOUTH);
  }
  return seat === SOUTH;
}

// Takes back the human's last decision and everything after it.
export function undoDeal(deal) {
  const state = dealState(deal);
  if (state.phase === "play" && deal.plays.length) {
    const seats = playSeats(deal, state.contract);
    for (let i = deal.plays.length - 1; i >= 0; i -= 1) {
      if (humanControls(state, seats[i])) {
        return { ...deal, plays: deal.plays.slice(0, i) };
      }
    }
  }
  for (let i = deal.calls.length - 1; i >= 0; i -= 1) {
    if (seatOfCall(deal.dealer, i) === SOUTH) {
      return { ...deal, calls: deal.calls.slice(0, i), plays: [] };
    }
  }
  return null;
}

function playSeats(deal, contract) {
  const trump = contract.strain === NT ? -1 : contract.strain;
  const seats = [];
  let leader = (contract.declarer + 1) % 4;
  let trick = [];
  deal.plays.forEach((card) => {
    const seat = (leader + trick.length) % 4;
    seats.push(seat);
    trick.push({ seat, card });
    if (trick.length === 4) {
      leader = trickWinner(trick, trump);
      trick = [];
    }
  });
  return seats;
}
