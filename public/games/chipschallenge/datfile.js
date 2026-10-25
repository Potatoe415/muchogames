// Reader for the original Microsoft level file (assets/CHIPS.DAT, 149
// levels). Little-endian: magic, level count, then per level its number,
// time limit, chips required, the top and bottom 32x32 layers (run-length
// coded: 0xFF count tile) and optional fields (title, trap and clone machine
// wiring, password XOR 0x99, hint, monster list).
const MAGICS = [0x0002aaac, 0x0102aaac];
const CELLS = 32 * 32;
const RUN = 0xff;
const PASSWORD_KEY = 0x99;
const FIELD = {
  title: 3,
  traps: 4,
  clones: 5,
  password: 6,
  hint: 7,
  plainPassword: 8,
  monsters: 10
};

function unpack(bytes, start, size) {
  const out = new Uint8Array(CELLS);
  let o = 0;
  let p = start;
  while (p < start + size && o < CELLS) {
    if (bytes[p] === RUN) {
      out.fill(bytes[p + 2], o, Math.min(CELLS, o + bytes[p + 1]));
      o += bytes[p + 1];
      p += 3;
    } else {
      out[o++] = bytes[p++];
    }
  }
  return out;
}

function text(bytes, start, end, key = 0) {
  let s = "";
  for (let i = start; i < end && bytes[i] !== 0; i++) {
    s += String.fromCharCode(bytes[i] ^ key);
  }
  return s;
}

// [x1, y1, x2, y2] records of `stride` bytes (16-bit coordinates).
function links(view, start, end, stride) {
  const out = [];
  for (let k = start; k + stride <= end; k += stride) {
    out.push([0, 2, 4, 6].map((d) => view.getUint16(k + d, true)));
  }
  return out;
}

function readField(level, type, bytes, view, d, end) {
  if (type === FIELD.title) level.title = text(bytes, d, end);
  else if (type === FIELD.traps) level.traps = links(view, d, end, 10);
  else if (type === FIELD.clones) level.clones = links(view, d, end, 8);
  else if (type === FIELD.password) {
    level.password = text(bytes, d, end, PASSWORD_KEY);
  } else if (type === FIELD.plainPassword && !level.password) {
    level.password = text(bytes, d, end);
  } else if (type === FIELD.hint) level.hint = text(bytes, d, end);
  else if (type === FIELD.monsters) {
    for (let k = d; k + 2 <= end; k += 2) {
      level.monsters.push([bytes[k], bytes[k + 1]]);
    }
  }
}

function readLevel(bytes, view, start) {
  let p = start;
  const word = () => {
    p += 2;
    return view.getUint16(p - 2, true);
  };
  const level = { number: word(), time: word(), chips: word() };
  word();
  const topSize = word();
  level.top = unpack(bytes, p, topSize);
  p += topSize;
  const bottomSize = word();
  level.bottom = unpack(bytes, p, bottomSize);
  p += bottomSize;
  Object.assign(level, { title: "", password: "", hint: "" });
  Object.assign(level, { traps: [], clones: [], monsters: [] });
  const end = p + 2 + word();
  while (p + 2 <= end) {
    const len = bytes[p + 1];
    readField(level, bytes[p], bytes, view, p + 2, p + 2 + len);
    p += 2 + len;
  }
  return level;
}

export function parseDat(buffer) {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (!MAGICS.includes(view.getUint32(0, true))) {
    throw new Error("Not a Chip's Challenge level file");
  }
  const count = view.getUint16(4, true);
  const levels = [];
  let pos = 6;
  for (let i = 0; i < count; i++) {
    const size = view.getUint16(pos, true);
    levels.push(readLevel(bytes, view, pos + 2));
    pos += 2 + size;
  }
  return levels;
}
