// One match on screen: model + board view (or the wheel in wheel mode) +
// question card + die. Saves after every step. main.js owns the page shell
// and the match lifecycle.
import { PAWN_COLORS, createBoardView, pawnSvg } from "./board-view.js";
import { catOf } from "./board.js";
import * as model from "./model.js";
import { createQuestionView } from "./question-view.js";
import { createWheelView } from "./wheel-view.js";

const ROLL_FRAMES = 6;
const FRAME_MS = 70;
const LANDED_MS = 450;
const PIPS = {
  1: [5],
  2: [1, 9],
  3: [1, 5, 9],
  4: [1, 3, 7, 9],
  5: [1, 3, 5, 7, 9],
  6: [1, 3, 4, 6, 7, 9]
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const randomDie = () => 1 + Math.floor(Math.random() * 6);

function paintDie(el, value, t) {
  el.innerHTML = (PIPS[value] || [])
    .map((p) => `<span class="tp-pip tp-pip-${p}"></span>`)
    .join("");
  el.setAttribute("aria-label", value ? t("die", { n: value }) : "");
}

function renderPlayers(ctx) {
  const { els, state, t } = ctx;
  els.players.replaceChildren(
    ...state.players.map((p, i) => {
      const item = document.createElement("li");
      item.className = "tp-player";
      item.dataset.id = `trivialpursuit-player-${i + 1}`;
      item.classList.toggle("is-current", i === state.cur);
      const name = document.createElement("span");
      name.className = "tp-player-name";
      name.textContent = p.name;
      const count = document.createElement("span");
      count.className = "tp-player-count";
      count.textContent = t("wedgesOf", { n: p.wedges.filter(Boolean).length });
      item.innerHTML = `<span class="tp-player-pawn">${pawnSvg(p.wedges, PAWN_COLORS[i])}</span>`;
      item.append(name, count);
      return item;
    })
  );
}

function statusText(ctx) {
  const { state, t } = ctx;
  if (state.phase === "move") return t("moveHint", { n: state.die });
  return ctx.status || t("turnOf", { name: model.current(state).name });
}

function showQuestion(ctx) {
  const { state, deck } = ctx;
  let item = deck.get(state.q.cat, state.q.i);
  if (!item) {
    state.q.i = deck.draw(state.q.cat);
    item = deck.get(state.q.cat, state.q.i);
  }
  ctx.questions.showQuestion(item, state.q, state.phase === "reveal");
}

function chooseTitle(ctx) {
  const { state, t } = ctx;
  if (state.choose === "free") return t("chooseFree");
  return t(state.players.length > 1 ? "chooseFinal" : "chooseFinalSolo");
}

function refresh(ctx) {
  const { els, state, board, wheel, t } = ctx;
  renderPlayers(ctx);
  els.status.textContent = statusText(ctx);
  els.turn.textContent = model.current(state).name;
  els.roll.disabled = state.phase !== "roll" || ctx.busy;
  els.roll.textContent = t(wheel ? "spinWheel" : "rollDie");
  els.die.hidden = Boolean(wheel);
  if (wheel) wheel.setLabel(t("wheelAria"));
  else {
    board.render(state);
    if (state.phase === "move") {
      board.showTargets(model.targets(state), (id) => pick(ctx, id));
    } else board.clearTargets();
  }
  if (state.phase === "ask" || state.phase === "reveal") showQuestion(ctx);
  else if (state.phase === "choose") ctx.questions.showChoose(chooseTitle(ctx));
  else ctx.questions.hide();
  paintDie(els.die, state.die, ctx.t);
}

function commit(ctx, status = "") {
  ctx.status = status;
  ctx.save(ctx.state);
  refresh(ctx);
}

async function rollDie(ctx) {
  if (ctx.busy || ctx.state.phase !== "roll") return;
  ctx.busy = true;
  ctx.els.roll.disabled = true;
  ctx.els.die.classList.add("is-rolling");
  for (let i = 0; i < ROLL_FRAMES; i += 1) {
    paintDie(ctx.els.die, randomDie(), ctx.t);
    await wait(FRAME_MS);
  }
  ctx.els.die.classList.remove("is-rolling");
  ctx.busy = false;
  model.roll(ctx.state, randomDie());
  commit(ctx);
  ctx.board.focusTarget();
}

// `speed` comes from a swipe on the wheel; the button spins at random speed.
async function spinWheel(ctx, speed) {
  const { state, deck } = ctx;
  if (ctx.busy || state.phase !== "roll") return;
  ctx.busy = true;
  ctx.els.roll.disabled = true;
  const cat = await ctx.wheel.spin(speed);
  await wait(LANDED_MS);
  ctx.busy = false;
  if (ctx.destroyed) return;
  model.spin(state, cat, deck.draw(cat));
  commit(ctx);
}

async function pick(ctx, node) {
  const { state, deck } = ctx;
  const path = model.targets(state).get(node);
  if (ctx.busy || !path) return;
  ctx.busy = true;
  ctx.board.clearTargets();
  const mover = state.cur;
  const result = model.land(state, node);
  if (result === "question")
    model.ask(state, catOf(node), deck.draw(catOf(node)));
  ctx.save(state);
  await ctx.board.animate(mover, path);
  ctx.busy = false;
  if (ctx.destroyed) return;
  commit(ctx, result === "again" ? ctx.t("again") : "");
  if (state.phase === "roll") ctx.els.roll.focus({ preventScroll: true });
}

function answerStatus(ctx, result, cat) {
  const { state, t } = ctx;
  const name = model.current(state).name;
  if (result === "wrong") return t("wrong", { name });
  if (result === "right") return t("right", { name });
  const won = t("wedge", { cat: t(`cat${cat}`), name });
  if (!model.hasAll(model.current(state))) return won;
  return `${won} ${t(ctx.wheel ? "goWheel" : "goHub")}`;
}

function answer(ctx, correct) {
  const { state } = ctx;
  if (ctx.busy || state.phase !== "reveal") return;
  const cat = state.q.cat;
  const result = model.answer(state, correct);
  if (result === "won") {
    ctx.questions.hide();
    ctx.onWin(state);
    return;
  }
  commit(ctx, answerStatus(ctx, result, cat));
  ctx.els.roll.focus({ preventScroll: true });
}

function bindPlay(ctx, signal) {
  const { els, state } = ctx;
  els.roll.addEventListener(
    "click",
    () => (ctx.wheel ? spinWheel(ctx) : rollDie(ctx)),
    { signal }
  );
  return createQuestionView(els.q, ctx.t, signal, {
    reveal: () => {
      if (state.phase !== "ask") return;
      model.reveal(state);
      commit(ctx, ctx.status);
    },
    answer: (correct) => answer(ctx, correct),
    other: () => {
      if (state.phase !== "ask") return;
      state.q.i = ctx.deck.draw(state.q.cat, state.q.i);
      commit(ctx, ctx.status);
    },
    choose: (cat) => {
      if (state.phase !== "choose") return;
      model.ask(state, cat, ctx.deck.draw(cat), state.choose === "final");
      commit(ctx);
    }
  });
}

export function createPlay({ els, state, deck, t, save, onWin }) {
  const abort = new AbortController();
  const ctx = { els, state, deck, t, save, onWin, busy: false, status: "" };
  if (state.mode === "wheel") {
    ctx.wheel = createWheelView(
      els.board,
      {
        canSpin: () => !ctx.busy && state.phase === "roll",
        onFling: (speed) => spinWheel(ctx, speed)
      },
      abort.signal
    );
  } else ctx.board = createBoardView(els.board, t);
  ctx.questions = bindPlay(ctx, abort.signal);
  refresh(ctx);
  if (state.phase === "roll") els.roll.focus({ preventScroll: true });
  return {
    relabel: () => refresh(ctx),
    save: () => save(state),
    destroy: () => {
      ctx.destroyed = true;
      abort.abort();
      ctx.questions.hide();
    }
  };
}
