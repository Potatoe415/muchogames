// Match state (plain JSON, saved as is) and its transitions. Phases:
// roll → move → ask (question shown) → reveal (answer shown) → roll…,
// choose (pick a category on the hub), over.
import { CATS, HUB, catOf, kindOf, reachable } from "./board.js";

export const MAX_PLAYERS = 6;

export function newMatch(names) {
  return {
    v: 1,
    players: names.map((name) => ({
      name,
      pos: HUB,
      wedges: Array(CATS).fill(false),
      asked: 0,
      right: 0
    })),
    cur: 0,
    phase: "roll",
    die: 0,
    q: null,
    choose: null,
    winner: -1,
    turns: 1
  };
}

export const current = (s) => s.players[s.cur];
export const hasAll = (p) => p.wedges.every(Boolean);

export function targets(s) {
  return s.phase === "move" ? reachable(current(s).pos, s.die) : new Map();
}

export function roll(s, value) {
  s.die = value;
  s.phase = "move";
}

// Landing decides what comes next; the caller draws the question.
export function land(s, node) {
  const player = current(s);
  player.pos = node;
  const kind = kindOf(node);
  if (kind === "roll") {
    s.phase = "roll";
    return "again";
  }
  if (kind === "hub") {
    s.phase = "choose";
    s.choose = hasAll(player) ? "final" : "free";
    return s.choose;
  }
  return "question";
}

export function ask(s, cat, index, final = false) {
  const node = current(s).pos;
  s.q = {
    cat,
    i: index,
    final,
    hq: kindOf(node) === "hq" && catOf(node) === cat
  };
  s.choose = null;
  s.phase = "ask";
}

export function reveal(s) {
  s.phase = "reveal";
}

function nextPlayer(s) {
  s.cur = (s.cur + 1) % s.players.length;
  s.turns += 1;
}

// Returns "won", "wedge", "right" or "wrong".
export function answer(s, correct) {
  const player = current(s);
  const q = s.q;
  player.asked += 1;
  s.q = null;
  s.phase = "roll";
  if (!correct) {
    nextPlayer(s);
    return "wrong";
  }
  player.right += 1;
  if (q.final) {
    s.phase = "over";
    s.winner = s.cur;
    return "won";
  }
  if (q.hq && !player.wedges[q.cat]) {
    player.wedges[q.cat] = true;
    return "wedge";
  }
  return "right";
}
