// Pure 9×9 helpers shared by the generator and the model. Cells are indexed
// 0..80 row by row; a digit mask uses bits 1..9.
export const SIZE = 81;
export const ALL = 0x3fe;

export const rowOf = (i) => (i / 9) | 0;
export const colOf = (i) => i % 9;
export const boxOf = (i) => ((i / 27) | 0) * 3 + (((i % 9) / 3) | 0);

const range = (n) => Array.from({ length: n }, (_, i) => i);

export const UNITS = [
  ...range(9).map((r) => range(9).map((c) => r * 9 + c)),
  ...range(9).map((c) => range(9).map((r) => r * 9 + c)),
  ...range(9).map((b) => range(SIZE).filter((i) => boxOf(i) === b))
];

export const PEERS = range(SIZE).map((i) =>
  range(SIZE).filter(
    (j) =>
      j !== i &&
      (rowOf(j) === rowOf(i) || colOf(j) === colOf(i) || boxOf(j) === boxOf(i))
  )
);

export function bitCount(mask) {
  let n = 0;
  for (let m = mask; m; m &= m - 1) n++;
  return n;
}

export function digitsOf(mask) {
  return range(10).filter((v) => v > 0 && mask & (1 << v));
}

// Digits no peer of `i` holds yet.
export function freeMask(values, i) {
  let used = 0;
  for (const p of PEERS[i]) used |= 1 << values[p];
  return ALL & ~used;
}

export function shuffle(list, rng) {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export const indexes = () => range(SIZE);
