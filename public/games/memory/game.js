import { pickFirst, pickSecond, rollSmart } from "./bot.js";
import {
  BOT_FIRST_MS,
  BOT_SECOND_MS,
  MISMATCH_MS,
  REVEAL_MS
} from "./config.js";
import { clearSave, writeSave } from "./persist.js";
import { createState, reduce } from "./reducer.js";
import { playFlip, playMatch, playMismatch, playWin, stop } from "./sound.js";
import { sameBoard } from "./wire.js";

function arm(box, ms, fn) {
  const id = setTimeout(() => {
    box.timers.delete(id);
    if (box.alive) fn();
  }, ms);
  box.timers.add(id);
}

// Solo clock: starts on the first flip, pauses while the page is hidden,
// stops at game over.
function elapsedMs({ clock }) {
  const running = clock.since === null ? 0 : performance.now() - clock.since;
  return Math.round(clock.base + running);
}

function runClock(box) {
  const { clock } = box;
  if (!box.timed || !clock.started || clock.since !== null) return;
  if (box.state.phase === "GAME_OVER") return;
  clock.since = performance.now();
}

function pauseClock({ clock }) {
  if (clock.since === null) return;
  clock.base += performance.now() - clock.since;
  clock.since = null;
}

function stamp(box) {
  if (box.timed) box.state = { ...box.state, elapsedMs: elapsedMs(box) };
}

function checkpoint(box) {
  if (box.online) return;
  if (box.state.phase === "GAME_OVER") clearSave();
  else writeSave(box.state);
}

function botFirst(box) {
  if (box.state.phase !== "BOT") return;
  box.plan = pickFirst(box.state, rollSmart(box.state.config.difficulty));
  if (!box.plan) return;
  commit(box, { type: "FLIP", instanceId: box.plan.first, bot: true });
}

function botSecond(box) {
  if (box.state.phase !== "BOT" || !box.plan) return;
  const instanceId = pickSecond(box.state, box.plan.first, box.plan);
  commit(box, { type: "FLIP", instanceId, bot: true });
}

// Online, only the player whose miss it is closes the cards, so the two
// devices never both write the same CLOSE.
function closeLater(box) {
  if (box.state.phase !== "EVALUATING" || box.closing) return;
  if (box.online && box.state.active !== box.online.seat) return;
  box.closing = true;
  arm(box, MISMATCH_MS, () => {
    box.closing = false;
    commit(box, { type: "CLOSE" });
  });
}

function afterClose(box) {
  if (box.state.phase === "BOT") arm(box, BOT_FIRST_MS, () => botFirst(box));
}

function oneOpen(box, action) {
  if (action.bot) arm(box, BOT_SECOND_MS, () => botSecond(box));
}

function matched(box) {
  playMatch();
  if (box.state.phase === "GAME_OVER") {
    playWin();
    return;
  }
  if (box.state.phase === "BOT") arm(box, BOT_FIRST_MS, () => botFirst(box));
}

function follow(box, action) {
  if (action.type === "CLOSE") return afterClose(box);
  if (action.type !== "FLIP") return;
  playFlip();
  if (box.state.phase === "EVALUATING") {
    playMismatch();
    closeLater(box);
    return;
  }
  if (box.state.openIds.length === 1) return oneOpen(box, action);
  return matched(box);
}

function commit(box, action) {
  const next = reduce(box.state, action);
  if (next === box.state) return;
  if (action.type === "FLIP") {
    box.clock.started = true;
    runClock(box);
  }
  if (next.phase === "GAME_OVER") pauseClock(box);
  box.state = next;
  stamp(box);
  // Published before onUpdate: a final move must be queued before the end of
  // the match leaves the room.
  box.online?.publish(next);
  checkpoint(box);
  box.onUpdate(box.state);
  follow(box, action);
}

function count(state, status) {
  return state.cards.filter((card) => card.status === status).length;
}

const upCount = (state) => count(state, "FLIPPED") + count(state, "MATCHED");

function echo(before, after) {
  const found = count(after, "MATCHED") > count(before, "MATCHED");
  if (upCount(after) > upCount(before)) playFlip();
  if (found) playMatch();
  if (after.phase === "EVALUATING" && before.phase !== "EVALUATING") {
    playMismatch();
  }
  if (after.phase === "GAME_OVER" && before.phase !== "GAME_OVER") playWin();
}

// A save taken between the robot's two flips resumes on its second flip.
function laterBot(box) {
  if (box.state.phase !== "BOT") return;
  const [first] = box.state.openIds;
  if (!first) return arm(box, BOT_FIRST_MS, () => botFirst(box));
  const smart = rollSmart(box.state.config.difficulty);
  box.plan = { first, second: null, smart };
  arm(box, BOT_SECOND_MS, () => botSecond(box));
}

function statuses(state) {
  return new Map(state.cards.map((card) => [card.instanceId, card.status]));
}

function show(box, next) {
  const before = box.state;
  const was = statuses(before);
  const now = performance.now();
  next.cards.forEach(({ instanceId, status }) => {
    if (status !== "FLIPPED") box.upSince.delete(instanceId);
    else if (was.get(instanceId) !== "FLIPPED")
      box.upSince.set(instanceId, now);
  });
  box.state = next;
  box.onUpdate(next);
  echo(before, next);
}

// Online, the opponent's cards stay face up at least REVEAL_MS here, even when
// the board that closes them arrives right after the one that opened them. A
// pair that arrives already matched is first shown open.
function holdFor(box, next) {
  const now = performance.now();
  const was = statuses(box.state);
  const unseen = [];
  let wait = 0;
  next.cards.forEach(({ instanceId, status }) => {
    const before = was.get(instanceId);
    if (before === "IDLE" && status === "MATCHED") unseen.push(instanceId);
    if (before !== "FLIPPED" || status === "FLIPPED") return;
    const since = box.upSince.get(instanceId);
    if (since !== undefined) wait = Math.max(wait, since + REVEAL_MS - now);
  });
  return { wait: unseen.length ? REVEAL_MS : wait, unseen };
}

function opened(state, ids) {
  const cards = state.cards.map((card) =>
    ids.includes(card.instanceId) ? { ...card, status: "FLIPPED" } : card
  );
  return { ...state, cards };
}

function drain(box) {
  const next = box.pending;
  if (!box.alive || box.holding || !next) return;
  box.pending = null;
  if (sameBoard(box.state, next)) return;
  const { wait, unseen } = holdFor(box, next);
  if (wait > 0) {
    if (unseen.length) show(box, opened(box.state, unseen));
    box.pending = next;
    box.holding = true;
    arm(box, wait, () => {
      box.holding = false;
      drain(box);
    });
    return;
  }
  show(box, next);
  closeLater(box);
}

export function createMatch({ config, cards, saved, onUpdate, online }) {
  const state = saved ?? createState(config, cards);
  const base = state.elapsedMs ?? 0;
  const box = {
    alive: true,
    closing: false,
    holding: false,
    pending: null,
    upSince: new Map(),
    plan: null,
    state,
    timers: new Set(),
    onUpdate,
    online: online ?? null,
    timed: !online && state.config.mode === "solo",
    clock: { started: base > 0, base, since: null }
  };
  runClock(box);
  checkpoint(box);
  onUpdate(box.state);
  laterBot(box);
  closeLater(box);
  return {
    save() {
      if (!box.alive) return;
      stamp(box);
      checkpoint(box);
    },
    elapsed: () => elapsedMs(box),
    setVisible(visible) {
      if (visible) runClock(box);
      else pauseClock(box);
    },
    flip(instanceId) {
      if (box.holding) return;
      const seat = box.online?.seat;
      commit(box, { type: "FLIP", instanceId, bot: false, seat });
    },
    apply(next) {
      box.pending = next;
      drain(box);
    },
    destroy() {
      if (!box.alive) return;
      pauseClock(box);
      stamp(box);
      checkpoint(box);
      box.alive = false;
      box.timers.forEach((id) => clearTimeout(id));
      box.timers.clear();
      stop();
    }
  };
}
