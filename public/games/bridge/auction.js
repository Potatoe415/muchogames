// Calls are strings: "P" pass, "X" double, "XX" redouble, or a bid made of a
// level 1–7 and a strain C D H S N ("1H", "3N").
import { sideOf } from "./cards.js";

export const STRAIN_CODES = "CDHSN";
export const PASS = "P";
export const DOUBLE = "X";
export const REDOUBLE = "XX";

const BID_PATTERN = /^[1-7][CDHSN]$/;

export function parseBid(call) {
  if (typeof call !== "string" || !BID_PATTERN.test(call)) return null;
  return { level: Number(call[0]), strain: STRAIN_CODES.indexOf(call[1]) };
}

export const isBid = (call) => parseBid(call) !== null;
export const bidCall = (level, strain) => `${level}${STRAIN_CODES[strain]}`;

export function bidRank(call) {
  const bid = parseBid(call);
  return bid ? (bid.level - 1) * 5 + bid.strain : -1;
}

export const ALL_BIDS = Array.from({ length: 35 }, (_, i) =>
  bidCall(Math.floor(i / 5) + 1, i % 5)
);

export const seatOfCall = (dealer, index) => (dealer + index) % 4;

// Where the auction stands: last bid, double state, who calls next, over?
export function readAuction(dealer, calls) {
  let last = null;
  let doubled = 0;
  calls.forEach((call, index) => {
    const bid = parseBid(call);
    if (bid) {
      last = { call, ...bid, seat: seatOfCall(dealer, index), index };
      doubled = 0;
    } else if (call === DOUBLE) doubled = 1;
    else if (call === REDOUBLE) doubled = 2;
  });
  let passes = 0;
  for (let i = calls.length - 1; i >= 0 && calls[i] === PASS; i -= 1) {
    passes += 1;
  }
  const over = last ? passes >= 3 : calls.length >= 4;
  return {
    last,
    doubled,
    toAct: seatOfCall(dealer, calls.length),
    over,
    passedOut: over && !last
  };
}

export function legalCalls(dealer, calls) {
  const state = readAuction(dealer, calls);
  if (state.over) return [];
  const legal = [PASS];
  const from = state.last ? bidRank(state.last.call) + 1 : 0;
  legal.push(...ALL_BIDS.slice(from));
  const theirs = state.last && sideOf(state.last.seat) !== sideOf(state.toAct);
  if (state.last && theirs && state.doubled === 0) legal.push(DOUBLE);
  if (state.last && !theirs && state.doubled === 1) legal.push(REDOUBLE);
  return legal;
}

// { level, strain, declarer, doubled } once the auction is over, else null.
export function finalContract(dealer, calls) {
  const state = readAuction(dealer, calls);
  if (!state.over || !state.last) return null;
  const { level, strain, seat } = state.last;
  const declarerIndex = calls.findIndex((call, index) => {
    const bid = parseBid(call);
    const caller = seatOfCall(dealer, index);
    return bid?.strain === strain && sideOf(caller) === sideOf(seat);
  });
  return {
    level,
    strain,
    declarer: seatOfCall(dealer, declarerIndex),
    doubled: state.doubled
  };
}

// True when every call is legal in turn.
export function validCalls(dealer, calls) {
  return calls.every((call, index) =>
    legalCalls(dealer, calls.slice(0, index)).includes(call)
  );
}
