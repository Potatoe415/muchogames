// Standard algebraic notation (e4, Nxf3+, O-O, e8=Q#) with the piece letters
// of the player's language ("CFTDR" in French: knight, bishop, rook, queen,
// king).
import {
  applyMove,
  colOf,
  inCheck,
  KNIGHT,
  legalMoves,
  PAWN,
  rowOf,
  squareName,
  typeOf
} from "./rules.js";

const letter = (letters, type) => letters[type - KNIGHT] || "";

function disambiguation(pos, m, legal) {
  const piece = pos.board[m.from];
  const rivals = legal.filter(
    (other) =>
      other.from !== m.from &&
      other.to === m.to &&
      pos.board[other.from] === piece
  );
  if (!rivals.length) return "";
  const name = squareName(m.from);
  if (!rivals.some((other) => colOf(other.from) === colOf(m.from)))
    return name[0];
  if (!rivals.some((other) => rowOf(other.from) === rowOf(m.from)))
    return name[1];
  return name;
}

function suffix(pos, m) {
  const next = applyMove(pos, m);
  if (!inCheck(next)) return "";
  return legalMoves(next).length ? "+" : "#";
}

export function san(pos, m, letters) {
  if (m.rook) return (colOf(m.to) === 6 ? "O-O" : "O-O-O") + suffix(pos, m);
  const type = typeOf(pos.board[m.from]);
  const target = squareName(m.to);
  const takes = m.taken >= 0 ? "×" : "";
  let text;
  if (type === PAWN) {
    const file = takes ? squareName(m.from)[0] : "";
    text = `${file}${takes}${target}`;
    if (m.promo) text += `=${letter(letters, m.promo)}`;
  } else {
    const which = disambiguation(pos, m, legalMoves(pos));
    text = `${letter(letters, type)}${which}${takes}${target}`;
  }
  return text + suffix(pos, m);
}
