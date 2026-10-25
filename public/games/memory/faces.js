// Placeholder faces. `image` stays null until real recto URLs exist.
// One shared back: `CARD_BACK.image`.
export const CARD_BACK = { image: null };

export const FACES = [
  { id: "f01", color: "#e11d48", glyph: "🍋", image: null },
  { id: "f02", color: "#7c3aed", glyph: "🍇", image: null },
  { id: "f03", color: "#dc2626", glyph: "🍒", image: null },
  { id: "f04", color: "#be185d", glyph: "🍓", image: null },
  { id: "f05", color: "#65a30d", glyph: "🥝", image: null },
  { id: "f06", color: "#ea580c", glyph: "🍑", image: null },
  { id: "f07", color: "#ca8a04", glyph: "🍍", image: null },
  { id: "f08", color: "#0f766e", glyph: "🥥", image: null },
  { id: "f09", color: "#16a34a", glyph: "🍉", image: null },
  { id: "f0a", color: "#b91c1c", glyph: "🍎", image: null },
  { id: "f0b", color: "#facc15", glyph: "🍌", image: null },
  { id: "f0c", color: "#f97316", glyph: "🍊", image: null },
  { id: "f0d", color: "#2563eb", glyph: "🫐", image: null },
  { id: "f0e", color: "#4d7c0f", glyph: "🍈", image: null },
  { id: "f0f", color: "#d97706", glyph: "🥭", image: null },
  { id: "f10", color: "#84cc16", glyph: "🍐", image: null },
  { id: "f11", color: "#9f1239", glyph: "🌶️", image: null },
  { id: "f12", color: "#ea580c", glyph: "🥕", image: null }
];

export const FACE_BY_ID = Object.fromEntries(
  FACES.map((face) => [face.id, face])
);
