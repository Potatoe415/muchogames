// The three courses below the start (Slalom left, Freestyle middle, Tree
// Slalom right), their fixed scenery and the timed run. A run starts when
// the skier crosses a lane's start line and ends at its finish line; skiing
// outside the lanes is free skiing.
import { COURSES, GATE_PENALTY, START_Y } from "./config.js";
import { SPRITE } from "./sprites.js";

const SIGN_Y = START_Y - 260;
const LANE_MARGIN = 40;
const GATE_REACH = 60;

function buildGates(mode) {
  const lane = COURSES[mode];
  const gates = [];
  for (
    let y = START_Y + lane.step, i = 0;
    y < lane.endY - 120;
    y += lane.step
  ) {
    const red = i % 2 === 0;
    const sprite = red ? SPRITE.flagRed : SPRITE.flagBlue;
    gates.push({ y, x: red ? lane.red : lane.blue, red, sprite, state: null });
    i += 1;
  }
  return gates;
}

const decor = (sprite, x, y) => ({ kind: "decor", sprite, x, y });

function laneBanners(lane) {
  return [
    decor(SPRITE.startLeft, lane.minX, START_Y),
    decor(SPRITE.startRight, lane.maxX, START_Y),
    decor(SPRITE.finishLeft, lane.minX, lane.endY),
    decor(SPRITE.finishRight, lane.maxX, lane.endY)
  ];
}

function buildItems(gates) {
  return [
    decor(SPRITE.title, -120, -24),
    decor(SPRITE.helpPad, 130, -64),
    decor(SPRITE.helpKeys, 130, -26),
    decor(SPRITE.signSlalom, -70, SIGN_Y),
    decor(SPRITE.signFree, 0, SIGN_Y),
    decor(SPRITE.signTree, 70, SIGN_Y),
    ...Object.values(COURSES).flatMap(laneBanners),
    ...[...gates.slalom, ...gates.tree].map((gate) => ({
      kind: "gate",
      gate,
      x: gate.x,
      y: gate.y
    }))
  ];
}

export function createCourse() {
  const gates = { slalom: buildGates("slalom"), tree: buildGates("tree") };
  return { gates, items: buildItems(gates), run: null };
}

export function fixedItemsIn(course, x0, y0, x1, y1) {
  return course.items
    .filter((it) => it.x >= x0 && it.x < x1 && it.y >= y0 && it.y < y1)
    .map((it) => ({ ...it }));
}

export function laneAt(x, y) {
  return Object.keys(COURSES).find((mode) => {
    const lane = COURSES[mode];
    return x >= lane.minX && x <= lane.maxX && y >= START_Y && y <= lane.endY;
  });
}

export function nearGate(mode, y, margin) {
  const lane = COURSES[mode];
  if (!lane.step || y < START_Y) return false;
  const offset = (y - START_Y) % lane.step;
  return offset < margin || lane.step - offset < margin;
}

function startRun(game) {
  const mode = laneAt(game.skier.x, START_Y);
  if (!mode) return;
  (game.course.gates[mode] || []).forEach((gate) => {
    gate.state = null;
    gate.sprite = gate.red ? SPRITE.flagRed : SPRITE.flagBlue;
  });
  game.course.run = { mode, time: 0, missed: 0, style: game.skier.style };
  game.audio.play("start");
}

function judgeGate(game, run, gate) {
  const { x } = game.skier;
  const passed = gate.red
    ? x < gate.x && x > gate.x - GATE_REACH * 2
    : x > gate.x && x < gate.x + GATE_REACH * 2;
  gate.state = passed ? "ok" : "miss";
  gate.sprite = passed ? SPRITE.gateOk : SPRITE.gateMiss;
  if (!passed) run.missed += 1;
  game.audio.play(passed ? "gate" : "gateMiss");
}

function finishRun(game, run) {
  const lane = COURSES[run.mode];
  const { x, style } = game.skier;
  game.course.run = null;
  if (x < lane.minX - LANE_MARGIN || x > lane.maxX + LANE_MARGIN) {
    game.onCourse({ mode: run.mode, cancelled: true });
    return;
  }
  game.audio.play("finish");
  if (run.mode === "freestyle") {
    game.onCourse({ mode: run.mode, points: style - run.style });
    return;
  }
  const time = run.time + run.missed * GATE_PENALTY;
  game.onCourse({ mode: run.mode, time, missed: run.missed });
}

export function updateCourse(game, prevY, dt) {
  const { course, skier } = game;
  const crossed = (lineY) => prevY < lineY && skier.y >= lineY;
  const run = course.run;
  if (skier.mode === "eaten") return;
  if (!run) {
    if (crossed(START_Y)) startRun(game);
    return;
  }
  run.time += dt;
  if (skier.y < START_Y - LANE_MARGIN) {
    course.run = null;
    game.onCourse({ mode: run.mode, cancelled: true });
    return;
  }
  (course.gates[run.mode] || [])
    .filter((gate) => !gate.state && crossed(gate.y))
    .forEach((gate) => judgeGate(game, run, gate));
  if (crossed(COURSES[run.mode].endY)) finishRun(game, run);
}

export const runTime = (run) => run.time + run.missed * GATE_PENALTY;
