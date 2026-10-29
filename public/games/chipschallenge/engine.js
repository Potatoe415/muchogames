// Bridge to the vendored rules engine (Lexy's Labyrinth, MIT, see
// vendor/lexy/SOURCE.md). It reads CHIPS.DAT and simulates the levels tic by
// tic (20/s) with the Lynx ruleset: in Node it wins 147 of the 149 levels
// with the public Tile World solutions. Everything game-specific outside this
// file only sees the plain values returned here.
import { compat_flags_for_ruleset, INPUT_BITS } from "./vendor/lexy/js/defs.js";
import { parse_game } from "./vendor/lexy/js/format-dat.js";
import { Level } from "./vendor/lexy/js/game.js";

export const RULESET = "lynx";
export const TICS_PER_SECOND = 20;
const COMPAT = compat_flags_for_ruleset(RULESET);

// Input bit per direction N, W, S, E.
export const DIR_BITS = [
  INPUT_BITS.up,
  INPUT_BITS.left,
  INPUT_BITS.down,
  INPUT_BITS.right
];
export const DIR_INDEX = { north: 0, west: 1, south: 2, east: 3 };

const KEYS = {
  blue: "key_blue",
  red: "key_red",
  yellow: "key_yellow",
  green: "key_green"
};
const BOOTS = {
  flippers: "flippers",
  fire: "fire_boots",
  skates: "cleats",
  suction: "suction_boots"
};
const DEATHS = {
  drowned: "water",
  burned: "fire",
  exploded: "bomb",
  squished: "block",
  time: "time"
};
const SOUNDS = {
  "get-chip": "chip",
  "get-chip-last": "chip",
  "get-chip-extra": "chip",
  "get-key": "item",
  "get-tool": "item",
  door: "door",
  socket: "socket",
  push: "push",
  "slide-ice": "ice",
  "slide-force": "force",
  splash: "splash",
  "step-fire": "fire",
  bomb: "bomb",
  thief: "thief",
  teleport: "teleport",
  "button-press": "click",
  popwall: "click",
  "fake-floor": "click",
  tick: "tick"
};

export function parsePack(buffer) {
  const pack = parse_game(buffer);
  const levels = pack.level_metadata.map((meta, i) => ({
    number: i + 1,
    title: meta.title || `LEVEL ${i + 1}`,
    password: (meta.password || "").toUpperCase()
  }));
  return { pack, levels };
}

export function setSound(level, onSound) {
  const play = (name) => SOUNDS[name] && onSound(SOUNDS[name]);
  level.sfx = { play, play_once: play };
}

// The engine is deterministic apart from these two seeds, drawn with
// Math.random() when a level is created (the Lynx PRNG always starts at 0).
export const levelSeeds = (level) => ({
  tw: level._tw_rng,
  blob: level._blob_modifier
});

export function createLevel(pack, index, onSound, seeds = null) {
  const level = new Level(pack.load_level(index), COMPAT);
  if (seeds) {
    level._tw_rng = seeds.tw;
    level._blob_modifier = seeds.blob;
  }
  setSound(level, onSound);
  level.undo_enabled = false;
  return level;
}

// Plain summary of the board, compared after a replay: tic, Chip, chips
// left, time and a hash of every actor (type, cell, direction).
export function fingerprint(level) {
  let hash = 0;
  level.actors.forEach((actor) => {
    if (!actor.cell) return;
    const key = `${actor.type.name}@${actor.cell.x},${actor.cell.y}${actor.direction}`;
    for (let i = 0; i < key.length; i += 1) {
      hash = (Math.imul(hash, 31) + key.charCodeAt(i)) >>> 0;
    }
  });
  const cell = level.player?.cell;
  return {
    tic: level.tic_counter,
    x: cell?.x ?? -1,
    y: cell?.y ?? -1,
    chips: level.chips_remaining,
    time: level.time_remaining ?? -1,
    actors: hash
  };
}

function hintAt(player) {
  const terrain = player?.cell?.get_terrain();
  return terrain?.type.is_hint ? terrain.hint_text || "" : null;
}

function inventory(player) {
  const keys = {};
  const boots = {};
  Object.entries(KEYS).forEach(([k, name]) => {
    keys[k] = (player?.keyring?.[name] ?? 0) > 0;
  });
  Object.entries(BOOTS).forEach(([k, name]) => {
    boots[k] = Boolean(player?.toolbelt?.includes(name));
  });
  return { keys, boots };
}

export function deathReason(level) {
  if (level.state !== "failure") return null;
  return DEATHS[level.fail_reason] ?? "monster";
}

// Plain snapshot for the status panel and the dialogs.
export function status(level, number) {
  const time = level.time_remaining;
  return {
    number,
    chipsLeft: level.chips_remaining,
    limited: time !== null,
    timeLeft: time === null ? 0 : Math.ceil(time / TICS_PER_SECOND),
    hint: hintAt(level.player),
    dead: deathReason(level),
    won: level.state === "success",
    ...inventory(level.player)
  };
}
