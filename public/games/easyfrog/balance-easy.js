// Easy difficulty: slower lanes, no timer, smaller death penalty, five
// levels without diving turtles. Same fields as balance.js.
import { croco, safe } from "./lanes.js";

// Levels 2 to 5: lily pads, turtles, logs and a crocodile, faster each time.
function river(pad, turtle, log, croc, padsOpposite) {
  return [
    safe("nenuphar", 4, pad, 0),
    safe("nenuphar", 4, padsOpposite ? -pad : pad, 400),
    safe("turtle", 3, turtle, 200),
    safe("turtle", 3, turtle, 600),
    safe("log", 2, log, 100),
    safe("log", 2, log, 600),
    croco(1, croc, 300)
  ];
}

const level = (n, requiredWins, speedMultiplier, lanes) => ({
  level: n,
  requiredWins,
  speedMultiplier,
  timeLimit: null,
  river: lanes
});

export const EASY_BALANCE = {
  startingLives: 3,
  maxLives: 5,
  respawnCooldownMs: 800,

  winScore: 200,
  flyScore: 500,
  deathPenalty: 5000,
  timeBonus: null, // no timer in Easy
  deathTimeBonus: null,

  anticipateDuration: 0.02,
  jumpDuration: 0.12,

  flySpawnChance: 0.005, // chance per frame (no cooldown in Easy)
  flySpawnCooldown: null,
  flyActiveDuration: 9,
  flyMinLevel: 2,
  chaosflyMinLevel: 5,

  roadLaneSpeeds: { 9: 100, 8: -80, 7: 140, 6: -60 },
  roadCarGap: 400,
  minCarGapFactor: 1.5,
  trainSpeed: -150,
  trainStartX: 720,

  levels: [
    level(1, 1, 0.8, [
      safe("log", 4, 80, 0),
      safe("log", 4, 80, 400),
      safe("log", 3, -60, 200),
      safe("log", 3, -60, 600),
      safe("log", 2, 120, 100),
      safe("log", 2, 120, 600),
      croco(1, -100, 300)
    ]),
    level(2, 2, 1.0, river(80, -60, 120, -100, false)),
    level(3, 3, 1.1, river(90, -70, 140, -120, true)),
    level(4, 4, 1.3, river(100, -80, 160, -130, true)),
    level(5, 4, 1.5, river(110, -85, 170, -140, true))
  ]
};
