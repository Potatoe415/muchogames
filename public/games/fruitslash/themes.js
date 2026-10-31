// Slashable item sets. `e` is the emoji drawn, `c` its juice colour (glow,
// splash, floating points). Only emoji from Unicode 12 or older, so every
// phone draws them.
const SETS = {
  fruits: [
    { e: "🍉", c: "#ff4d6d" },
    { e: "🍎", c: "#ff3b3b" },
    { e: "🍊", c: "#ff9f1c" },
    { e: "🍌", c: "#ffe14d" },
    { e: "🍓", c: "#ff2e63" },
    { e: "🍇", c: "#b15cff" },
    { e: "🍍", c: "#ffd23f" },
    { e: "🥝", c: "#8ac926" },
    { e: "🍑", c: "#ffa07a" },
    { e: "🍒", c: "#ff1f4b" },
    { e: "🥭", c: "#ffb703" },
    { e: "🍋", c: "#fff275" }
  ],
  veggies: [
    { e: "🥕", c: "#ff8c1a" },
    { e: "🥦", c: "#4cd964" },
    { e: "🍅", c: "#ff4136" },
    { e: "🌽", c: "#ffd60a" },
    { e: "🍆", c: "#b15cff" },
    { e: "🥒", c: "#52d68a" },
    { e: "🥔", c: "#e0b872" },
    { e: "🍄", c: "#ff5e5e" },
    { e: "🥑", c: "#9be564" }
  ],
  sweets: [
    { e: "🍭", c: "#ff70a6" },
    { e: "🍬", c: "#70d6ff" },
    { e: "🍩", c: "#ff9ebb" },
    { e: "🧁", c: "#ffafcc" },
    { e: "🍪", c: "#e0a96d" },
    { e: "🍫", c: "#c47a45" },
    { e: "🍦", c: "#fff1e6" },
    { e: "🎂", c: "#ffc8dd" },
    { e: "🍡", c: "#ff99c8" }
  ],
  toys: [
    { e: "🎈", c: "#ff595e" },
    { e: "⚽", c: "#f1f5ff" },
    { e: "🏀", c: "#ff8c42" },
    { e: "🎁", c: "#8ac926" },
    { e: "🧸", c: "#d99a6c" },
    { e: "🎾", c: "#d9ed92" },
    { e: "🥁", c: "#ff595e" },
    { e: "🎨", c: "#ffca3a" },
    { e: "🧩", c: "#4ea8ff" }
  ],
  space: [
    { e: "🪐", c: "#ffb86b" },
    { e: "🌙", c: "#ffe66d" },
    { e: "☄️", c: "#ff9f1c" },
    { e: "💎", c: "#4cc9f0" },
    { e: "🛸", c: "#80ffdb" },
    { e: "🚀", c: "#f72585" },
    { e: "🌍", c: "#4895ef" },
    { e: "🔮", c: "#d264ff" },
    { e: "⚡", c: "#ffd60a" }
  ]
};

export const THEME_ICONS = {
  fruits: "🍓",
  veggies: "🥕",
  sweets: "🍭",
  toys: "🧸",
  space: "🚀",
  mix: "🌈"
};
export const THEME_IDS = Object.keys(THEME_ICONS);

export const BOMB = { e: "💣", c: "#ff3d3d" };
export const BONUS = { e: "🌟", c: "#ffd23f" };

const ALL = Object.values(SETS).flat();
const BY_EMOJI = new Map([...ALL, BOMB, BONUS].map((item) => [item.e, item]));

export const itemsOf = (theme) => SETS[theme] || ALL;

// The juice colour of a saved emoji, or null when it is not a known item.
export const lookup = (emoji) => BY_EMOJI.get(emoji) || null;

export const isThemeItem = (theme, emoji) =>
  itemsOf(theme).some((item) => item.e === emoji);
