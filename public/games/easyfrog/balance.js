// Normal difficulty: every tunable value of the game. The match reads the
// active one (Normal or Easy) from game.balance.
import { croco, diving, safe } from "./lanes.js";

const DIVE = { surfaceTime: 2200, diveTime: 1800, warningTime: 800 };

// Levels 4 to 7 share the same river; only the speed multiplier grows.
const LATE_RIVER = [
  safe("nenuphar", 4, 120, 0),
  safe("nenuphar", 4, -120, 400),
  diving(3, -90, 200, DIVE),
  diving(3, -90, 600, DIVE),
  safe("log", 2, 200, 100),
  safe("log", 2, 200, 600),
  croco(1, -165, 300)
];

const late = (level, speedMultiplier, timeLimit) => ({
  level,
  requiredWins: 4,
  speedMultiplier,
  timeLimit,
  river: LATE_RIVER
});

export const BALANCE = {
  startingLives: 3,
  maxLives: 5,
  respawnCooldownMs: 1000, // inputs are blocked this long after a death

  winScore: 200, // points per filled slot
  flyScore: 500, // points for catching the fly
  deathPenalty: 10000, // points deducted on death (never below 0)
  timeBonus: 5, // seconds added when reaching a slot

  anticipateDuration: 0.02, // crouch before the jump, seconds
  jumpDuration: 0.12, // jump arc, seconds

  flySpawnChance: null, // unused: Normal spawns on a cooldown
  flySpawnCooldown: 8, // seconds between a fly leaving and the next one
  flyActiveDuration: 6, // seconds a fly stays catchable
  flyMinLevel: 3,
  chaosflyMinLevel: 4, // the screen-flipping fly appears from this level

  roadLaneSpeeds: { 9: 150, 8: -120, 7: 200, 6: -90 },
  roadCarGap: 320, // px between the two cars of a lane (level 2+)
  minCarGapFactor: 1.5, // min free space between cars, in cells
  trainSpeed: 200, // px/s; direction is random per level
  trainStartX: 720,

  levels: [
    {
      level: 1,
      requiredWins: 1,
      speedMultiplier: 1.0,
      timeLimit: 15,
      river: [
        safe("log", 4, 100, 0),
        safe("log", 4, 100, 400),
        safe("log", 3, -80, 200),
        safe("log", 3, -80, 600),
        safe("log", 2, 180, 100),
        safe("log", 2, 180, 600),
        croco(1, -165, 300)
      ]
    },
    {
      level: 2,
      requiredWins: 2,
      speedMultiplier: 1.2,
      timeLimit: 25,
      river: [
        safe("nenuphar", 4, 100, 0),
        safe("nenuphar", 4, 100, 400),
        safe("turtle", 3, -80, 200),
        safe("turtle", 3, -80, 600),
        safe("log", 2, 180, 100),
        safe("log", 2, 180, 600),
        croco(1, -165, 300)
      ]
    },
    {
      level: 3,
      requiredWins: 3,
      speedMultiplier: 1.5,
      timeLimit: 30,
      river: [
        safe("nenuphar", 4, 100, 0),
        safe("nenuphar", 4, -100, 400),
        safe("turtle", 3, -80, 200),
        diving(3, -80, 600, {
          surfaceTime: 2500,
          diveTime: 1500,
          warningTime: 700
        }),
        safe("log", 2, 180, 100),
        safe("log", 2, 180, 600),
        croco(1, -165, 300)
      ]
    },
    late(4, 1.5, 35),
    late(5, 1.9, 50),
    late(6, 2.1, 55),
    late(7, 2.3, 60)
  ]
};
