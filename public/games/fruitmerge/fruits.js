// The 11 fruits, smallest first. `r` is the radius as a fraction of the box
// width; colours and decorations feed fruit-art.js.
export const FRUITS = [
  {
    id: "blueberry",
    r: 0.042,
    body: "#5b8def",
    dark: "#2f5cc0",
    light: "#a9c6ff",
    top: "crown"
  },
  {
    id: "strawberry",
    r: 0.054,
    body: "#ff4b5c",
    dark: "#c62837",
    light: "#ff9ba5",
    top: "leaves",
    pattern: "seeds"
  },
  {
    id: "raspberry",
    r: 0.068,
    body: "#e8396f",
    dark: "#a91d4a",
    light: "#ff8fb2",
    top: "leaves",
    pattern: "bumps"
  },
  {
    id: "peach",
    r: 0.081,
    body: "#ffb39a",
    dark: "#ee8063",
    light: "#ffe2d4",
    top: "leaf"
  },
  {
    id: "lemon",
    r: 0.095,
    body: "#ffe04a",
    dark: "#e2b000",
    light: "#fff4a8",
    top: "leaf",
    pattern: "dots"
  },
  {
    id: "plum",
    r: 0.111,
    body: "#9a4cba",
    dark: "#652785",
    light: "#d39ce9",
    top: "stem",
    wink: true
  },
  {
    id: "orange",
    r: 0.129,
    body: "#ff981f",
    dark: "#dc6a00",
    light: "#ffcb7d",
    top: "leaf",
    pattern: "dots"
  },
  {
    id: "apple",
    r: 0.149,
    body: "#f2403f",
    dark: "#b51d24",
    light: "#ff9286",
    top: "stemLeaf"
  },
  {
    id: "pineapple",
    r: 0.171,
    body: "#ffd23a",
    dark: "#dea000",
    light: "#fff1a2",
    top: "crownLeaves",
    pattern: "grid"
  },
  {
    id: "melon",
    r: 0.197,
    body: "#b8df6a",
    dark: "#82b03a",
    light: "#e4f8b6",
    top: "stem",
    pattern: "net"
  },
  {
    id: "watermelon",
    r: 0.232,
    body: "#3fae4b",
    dark: "#1d742a",
    light: "#86de8c",
    pattern: "stripes"
  }
];

export const LAST = FRUITS.length - 1;

// Only the five smallest fruits fall from the top, small ones more often.
export const DROP_WEIGHTS = [30, 25, 20, 15, 10];
export const MAX_DROP_LEVEL = DROP_WEIGHTS.length - 1;

// Points for making a fruit of this level; two watermelons that vanish give
// PAIR_POINTS.
export const pointsFor = (level) => (level * (level + 1)) / 2;
export const PAIR_POINTS = 100;

export function randomDropLevel(random = Math.random) {
  const total = DROP_WEIGHTS.reduce((sum, w) => sum + w, 0);
  let roll = random() * total;
  for (let level = 0; level < DROP_WEIGHTS.length; level++) {
    roll -= DROP_WEIGHTS[level];
    if (roll < 0) return level;
  }
  return 0;
}
