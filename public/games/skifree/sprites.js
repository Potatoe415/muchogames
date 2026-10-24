// Original SkiFree bitmaps (Chris Pirih, 1991), keyed by their SKI.EXE
// resource id and packed into assets/sprites.png (white = transparent).
// Rect: [sx, sy, width, height]. Sprites are drawn anchored bottom-center.
const RECTS = {
  1: [0, 232, 16, 32],
  2: [17, 232, 16, 32],
  3: [153, 296, 24, 28],
  4: [178, 296, 24, 28],
  5: [34, 232, 16, 32],
  6: [203, 296, 24, 28],
  7: [228, 296, 24, 28],
  8: [0, 326, 24, 28],
  9: [25, 326, 24, 28],
  10: [50, 326, 24, 28],
  11: [75, 326, 24, 28],
  12: [199, 163, 32, 32],
  13: [86, 355, 32, 24],
  14: [0, 199, 32, 32],
  15: [51, 232, 28, 31],
  16: [80, 232, 28, 31],
  17: [41, 163, 28, 34],
  18: [23, 355, 32, 26],
  19: [33, 199, 32, 32],
  20: [119, 355, 31, 24],
  21: [109, 232, 25, 31],
  22: [135, 232, 25, 31],
  23: [201, 355, 12, 24],
  24: [214, 355, 12, 24],
  25: [227, 355, 12, 24],
  26: [240, 355, 12, 24],
  27: [70, 163, 64, 32],
  28: [120, 265, 24, 30],
  29: [108, 296, 22, 29],
  30: [131, 296, 21, 29],
  31: [151, 355, 24, 24],
  32: [176, 355, 24, 24],
  33: [40, 383, 21, 15],
  34: [62, 383, 21, 15],
  35: [0, 383, 19, 19],
  36: [20, 383, 19, 19],
  37: [93, 265, 26, 30],
  38: [145, 265, 20, 30],
  39: [161, 232, 25, 31],
  40: [51, 296, 30, 29],
  41: [66, 199, 32, 32],
  42: [99, 199, 32, 32],
  43: [82, 296, 25, 29],
  44: [56, 355, 29, 25],
  45: [84, 383, 23, 11],
  46: [108, 383, 16, 11],
  47: [17, 403, 16, 4],
  48: [221, 383, 24, 8],
  49: [132, 199, 28, 32],
  50: [186, 326, 22, 27],
  51: [0, 0, 32, 64],
  52: [188, 383, 32, 8],
  53: [58, 0, 107, 55],
  54: [134, 383, 53, 9],
  55: [0, 265, 92, 30],
  56: [135, 163, 63, 32],
  57: [100, 326, 42, 27],
  58: [143, 326, 42, 27],
  59: [166, 265, 50, 29],
  60: [0, 296, 50, 29],
  61: [210, 114, 40, 36],
  62: [165, 114, 44, 36],
  63: [0, 163, 40, 35],
  64: [33, 0, 24, 64],
  65: [161, 199, 26, 32],
  66: [188, 199, 26, 32],
  67: [215, 199, 26, 32],
  68: [166, 0, 32, 48],
  69: [199, 0, 32, 48],
  70: [0, 65, 32, 48],
  71: [33, 65, 32, 48],
  72: [66, 65, 32, 48],
  73: [99, 65, 32, 48],
  74: [132, 65, 32, 48],
  75: [165, 65, 32, 48],
  76: [198, 65, 32, 48],
  77: [0, 114, 32, 48],
  78: [33, 114, 32, 48],
  79: [66, 114, 32, 48],
  80: [99, 114, 32, 48],
  81: [132, 114, 32, 48],
  82: [0, 403, 16, 8],
  83: [209, 326, 22, 27],
  84: [232, 326, 22, 27],
  85: [0, 355, 22, 27],
  86: [125, 383, 8, 11]
};

export const SKIER = {
  // Ski angle dir -3..3 (−90° … +90°, 0 = straight down the slope).
  dir: [4, 3, 2, 1, 5, 6, 7],
  stepLeft: [8, 10],
  stepRight: [9, 11],
  ouch: 12,
  sit: 13,
  headFirst: 18,
  spin: [14, 15, 17, 16],
  flipLeft: [21, 19, 20],
  flipRight: [22, 19, 20]
};

export const SPRITE = {
  flagRed: 23,
  flagBlue: 24,
  gateOk: 25,
  gateMiss: 26,
  moguls: 27,
  npcDown: 28,
  npcLeft: 29,
  npcRight: 30,
  npcDizzy: 31,
  npcFallen: 32,
  dogWalk: [33, 34],
  dogWoof: [35, 36],
  boarderRide: [37, 38],
  boarderFlip: [39, 40, 41, 42, 43, 44],
  rock: 45,
  stump: 46,
  bumpSmall: 47,
  bumpLarge: 48,
  treeSmall: 49,
  treeDead: 50,
  treeLarge: 51,
  ramp: 52,
  title: 53,
  helpPad: 55,
  helpKeys: 56,
  startLeft: 57,
  startRight: 58,
  finishLeft: 59,
  finishRight: 60,
  signSlalom: 61,
  signTree: 62,
  signFree: 63,
  tower: 64,
  chairFull: 65,
  chairOne: 66,
  chairEmpty: 67,
  yetiDown: [68, 69],
  yetiRight: [70, 71],
  yetiLeft: [72, 73],
  yetiUp: [74, 75],
  yetiEat: [76, 77, 76, 77, 78, 79, 78, 79, 80, 81, 80, 81, 80, 81],
  yellow: 82,
  fire: [83, 84, 85],
  ash: 86
};

let sheetPromise = null;

export function loadSheet() {
  sheetPromise ??= new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => {
      sheetPromise = null;
      reject(new Error("SkiFree sprite sheet failed to load"));
    };
    image.src = "assets/sprites.png";
  });
  return sheetPromise;
}

export const spriteHeight = (id) => RECTS[id][3];

export function drawSprite(ctx, sheet, id, x, y) {
  const [sx, sy, w, h] = RECTS[id];
  const dx = Math.round(x - w / 2);
  const dy = Math.round(y - h);
  ctx.drawImage(sheet, sx, sy, w, h, dx, dy, w, h);
}
