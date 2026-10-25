// Original CHIPS.EXE tile codes (code = column * 16 + row in
// assets/tiles.png) and how the rules engine's tile names map onto them.
import { DIRECTIONS } from "./vendor/lexy/js/defs.js";

export const TILE = 32;

export const T = Object.freeze({
  FLOOR: 0x00,
  BLOCK: 0x0a,
  CLONE_BLOCK: 0x0e,
  EXIT: 0x15,
  CLONER: 0x31,
  DROWNED: 0x33,
  BURNED: 0x34,
  BOMBED: 0x35,
  CHIP_EXIT: 0x39,
  EXIT_2: 0x3a,
  EXIT_3: 0x3b,
  SWIM: 0x3c,
  KEY_BLUE: 0x64,
  KEY_RED: 0x65,
  KEY_GREEN: 0x66,
  KEY_YELLOW: 0x67,
  FLIPPERS: 0x68,
  FIRE_BOOTS: 0x69,
  SKATES: 0x6a,
  SUCTION: 0x6b
});

// First sprite of each creature; add the direction (N, W, S, E).
export const SPRITE = Object.freeze({
  bug: 0x40,
  fireball: 0x44,
  ball: 0x48,
  tank_blue: 0x4c,
  glider: 0x50,
  teeth: 0x54,
  walker: 0x58,
  blob: 0x5c,
  paramecium: 0x60,
  player: 0x6c
});

// Terrain and item tiles by engine name.
export const CODES = Object.freeze({
  floor: 0x00,
  wall: 0x01,
  chip: 0x02,
  water: 0x03,
  fire: 0x04,
  wall_invisible: 0x05,
  dirt: 0x0b,
  ice: 0x0c,
  force_floor_s: 0x0d,
  force_floor_n: 0x12,
  force_floor_e: 0x13,
  force_floor_w: 0x14,
  exit: 0x15,
  door_blue: 0x16,
  door_red: 0x17,
  door_green: 0x18,
  door_yellow: 0x19,
  ice_nw: 0x1a,
  ice_ne: 0x1b,
  ice_se: 0x1c,
  ice_sw: 0x1d,
  fake_floor: 0x1e,
  fake_wall: 0x1f,
  thief_tools: 0x21,
  socket: 0x22,
  button_green: 0x23,
  button_red: 0x24,
  green_wall: 0x25,
  green_floor: 0x26,
  button_brown: 0x27,
  button_blue: 0x28,
  teleport_blue: 0x29,
  bomb: 0x2a,
  trap: 0x2b,
  wall_appearing: 0x2c,
  gravel: 0x2d,
  popwall: 0x2e,
  hint: 0x2f,
  cloner: 0x31,
  force_floor_all: 0x32,
  bogus_player_drowned: 0x33,
  bogus_player_burned_fire: 0x34,
  bogus_player_burned: 0x35,
  bogus_player_win: 0x39,
  key_blue: 0x64,
  key_red: 0x65,
  key_green: 0x66,
  key_yellow: 0x67,
  flippers: 0x68,
  fire_boots: 0x69,
  cleats: 0x6a,
  suction_boots: 0x6b
});

// Thin wall tiles by edge bit mask.
export const THIN_WALLS = Object.freeze({
  [DIRECTIONS.north.bit]: 0x06,
  [DIRECTIONS.west.bit]: 0x07,
  [DIRECTIONS.south.bit]: 0x08,
  [DIRECTIONS.east.bit]: 0x09,
  [DIRECTIONS.south.bit | DIRECTIONS.east.bit]: 0x30
});
