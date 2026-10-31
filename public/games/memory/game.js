import { pickFirst, pickSecond, rollSmart } from "./bot.js";
import { BOT_FIRST_MS, BOT_SECOND_MS, MISMATCH_MS } from "./config.js";
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

function echo(before, after) {
  const found = count(after, "MATCHED") > count(before, "MATCHED");
  if (found || count(after, "FLIPPED") > count(before, "FLIPPED")) playFlip();
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

export function createMatch({ config, cards, saved, onUpdate, online }) {
  const state = saved ?? createState(config, cards);
  const base = state.elapsedMs ?? 0;
  const box = {
    alive: true,
    closing: false,
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
      const seat = box.online?.seat;
      commit(box, { type: "FLIP", instanceId, bot: false, seat });
    },
    apply(next) {
      if (!box.alive || sameBoard(box.state, next)) return;
      const before = box.state;
      box.state = next;
      box.onUpdate(box.state);
      echo(before, next);
      closeLater(box);
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
