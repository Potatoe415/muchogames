// Directions, pipe pieces and the FIFO queue of upcoming pieces.
export const N = 0;
export const E = 1;
export const S = 2;
export const W = 3;
export const DX = [0, 1, 0, -1];
export const DY = [-1, 0, 1, 0];

export const opposite = (dir) => (dir + 2) % 4;

// `links` are the channels of a piece: pairs of edges the flooz can join.
// The cross holds two independent channels (horizontal, then vertical).
export const PIECES = {
  h: { links: [[E, W]], weight: 2 },
  v: { links: [[N, S]], weight: 2 },
  ne: { links: [[N, E]], weight: 2 },
  nw: { links: [[N, W]], weight: 2 },
  se: { links: [[S, E]], weight: 2 },
  sw: { links: [[S, W]], weight: 2 },
  x: {
    links: [
      [E, W],
      [N, S]
    ],
    weight: 1
  }
};

const TYPES = Object.keys(PIECES);
const TOTAL_WEIGHT = TYPES.reduce((sum, type) => sum + PIECES[type].weight, 0);

export function channelFor(type, entry) {
  return PIECES[type].links.findIndex((link) => link.includes(entry));
}

export function exitFor(type, channel, entry) {
  const [a, b] = PIECES[type].links[channel];
  return a === entry ? b : a;
}

function weightedType(random) {
  let roll = random() * TOTAL_WEIGHT;
  for (const type of TYPES) {
    roll -= PIECES[type].weight;
    if (roll < 0) return type;
  }
  return TYPES[TYPES.length - 1];
}

// items[0] is the active piece. A draw that would make three identical
// pieces in a row is rerolled once, which keeps the mix balanced.
export function createQueue(size, random = Math.random) {
  const items = [];
  const draw = () => {
    const type = weightedType(random);
    const [a, b] = items.slice(-2);
    return a === type && b === type ? weightedType(random) : type;
  };
  while (items.length < size) items.push(draw());
  return {
    list: () => items.slice(),
    take() {
      const type = items.shift();
      items.push(draw());
      return type;
    }
  };
}
