// Tuning. One world unit = one original SkiFree pixel; times in seconds.
// 10 px per metre: a straight run at full speed reaches 2000 m in ~75 s.
export const PX_PER_M = 10;
export const MAX_SPEED = 280;
export const TURBO_FACTOR = 1.4;
// Share of the top speed kept per ski angle step |dir| (0°, 30°, 60°, 90°).
export const SPEED_SHARE = [1, 0.78, 0.42, 0];
export const ACCEL = 260;
export const BRAKE = 420;
export const CRASH_BRAKE = 600;
export const GRAVITY = 950;
export const HOP_SPEED = 190;
export const RAMP_SPEED = 230;
export const RAMP_SPEED_GAIN = 0.45;
export const STOPPED = 12;
export const STEP_PX = 6;
export const STEP_TIME = 0.14;
export const TURN_GAP = 0.09;
export const CRASH_SLIDE = 0.55;
export const CRASH_SIT = 0.75;
export const CRASH_GRACE = 0.8;
export const CAMERA_TOP = 0.3;

// The yeti outruns the normal top speed (280) but not the turbo one (392).
export const YETI_SPEED = MAX_SPEED * 1.3;
export const YETI_FIRST_M = 2000;
export const YETI_AGAIN_M = 500;
export const YETI_UPHILL_M = -125;

export const START_Y = 600;
export const GATE_PENALTY = 5;
// Red flags (arrow ←) are passed on their left, blue flags (→) on their right.
export const COURSES = {
  slalom: {
    minX: -680,
    maxX: -420,
    endY: START_Y + 5000,
    step: 320,
    red: -600,
    blue: -500
  },
  freestyle: { minX: -220, maxX: 220, endY: START_Y + 9000 },
  tree: {
    minX: 420,
    maxX: 720,
    endY: START_Y + 9000,
    step: 400,
    red: 530,
    blue: 610
  }
};
export const LIFT = {
  x: -320,
  top: -1600,
  towerStep: 1600,
  chairStep: 200,
  speed: 50,
  hang: 26
};
export const CELL = 256;
