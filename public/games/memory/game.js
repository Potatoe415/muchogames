import { pickFirst, pickSecond, rollSmart } from "./bot.js";
import { BOT_FIRST_MS, BOT_SECOND_MS, MISMATCH_MS } from "./config.js";
import { buildDeck } from "./deck.js";
import { clearSave, writeSave } from "./persist.js";
import { createState, reduce } from "./reducer.js";
import { playFlip, playMatch, playMismatch, playWin, stop } from "./sound.js";

function arm(box, ms, fn) {
  const id = setTimeout(() => {
    box.timers.delete(id);
    if (box.alive) fn();
  }, ms);
  box.timers.add(id);
}

function checkpoint(box) {
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

function afterClose(box) {
  checkpoint(box);
  if (box.state.phase === "BOT") arm(box, BOT_FIRST_MS, () => botFirst(box));
}

function oneOpen(box, action) {
  if (action.bot) arm(box, BOT_SECOND_MS, () => botSecond(box));
}

function matched(box) {
  playMatch();
  checkpoint(box);
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
    arm(box, MISMATCH_MS, () => commit(box, { type: "CLOSE" }));
    return;
  }
  if (box.state.openIds.length === 1) return oneOpen(box, action);
  return matched(box);
}

function commit(box, action) {
  const next = reduce(box.state, action);
  if (next === box.state) return;
  box.state = next;
  box.onUpdate(box.state);
  follow(box, action);
}

function laterBot(box) {
  if (box.state.phase === "BOT") arm(box, BOT_FIRST_MS, () => botFirst(box));
}

export function createMatch({ config, saved, onUpdate }) {
  const box = {
    alive: true,
    plan: null,
    state: saved ?? createState(config, buildDeck(config.grid)),
    timers: new Set(),
    onUpdate
  };
  onUpdate(box.state);
  laterBot(box);
  return {
    flip(instanceId) {
      commit(box, { type: "FLIP", instanceId, bot: false });
    },
    destroy() {
      box.alive = false;
      box.timers.forEach((id) => clearTimeout(id));
      box.timers.clear();
      stop();
    }
  };
}
