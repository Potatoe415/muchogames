// Flat hub taxonomy: three independent axes read from public/hub-config.json.
// `type` from `tags`, `time` from `duration` (minutes), `players` from
// `players: [min, max]`. No DOM here: scripts/check-games.mjs imports it too.
export const TYPES = [
  "cartes",
  "soiree",
  "mots",
  "reflexion",
  "arcade",
  "quiz"
];
export const TIMES = ["rapide", "moyen", "long"];
export const PLAYERS = ["solo", "duo", "groupe"];
export const AXES = { type: TYPES, time: TIMES, players: PLAYERS };

const QUICK_MAX_MINUTES = 5;
const MEDIUM_MAX_MINUTES = 20;

const LABELS = {
  fr: {
    cartes: "Cartes & dés",
    soiree: "Soirée",
    mots: "Mots",
    reflexion: "Réflexion",
    arcade: "Arcade",
    quiz: "Quiz",
    rapide: "⚡ Rapide",
    moyen: "≤ 20 min",
    long: "Long",
    solo: "Solo",
    duo: "2 joueurs",
    groupe: "Groupe (3+)"
  },
  en: {
    cartes: "Cards & dice",
    soiree: "Party",
    mots: "Words",
    reflexion: "Brain",
    arcade: "Arcade",
    quiz: "Quiz",
    rapide: "⚡ Quick",
    moyen: "≤ 20 min",
    long: "Long",
    solo: "Solo",
    duo: "2 players",
    groupe: "Group (3+)"
  },
  es: {
    cartes: "Cartas y dados",
    soiree: "Fiesta",
    mots: "Palabras",
    reflexion: "Ingenio",
    arcade: "Arcade",
    quiz: "Preguntas",
    rapide: "⚡ Rápido",
    moyen: "≤ 20 min",
    long: "Largo",
    solo: "Solo",
    duo: "2 jugadores",
    groupe: "Grupo (3+)"
  }
};

export const EMPTY_FILTERS = Object.freeze({
  type: "",
  time: "",
  players: "",
  fav: false
});

export function tagLabel(value, lang) {
  return (LABELS[lang] || LABELS.fr)[value] || value;
}

export function readPlayers(game) {
  const players = game.players;
  if (!Array.isArray(players) || players.length !== 2) return null;
  const [min, max] = players.map(Number);
  return Number.isInteger(min) &&
    Number.isInteger(max) &&
    min >= 1 &&
    min <= max
    ? { min, max }
    : null;
}

export function readDuration(game) {
  const duration = Number(game.duration);
  return Number.isInteger(duration) && duration > 0 ? duration : null;
}

export function typesOf(game) {
  return Array.isArray(game.tags)
    ? game.tags.filter((tag) => TYPES.includes(tag))
    : [];
}

export function timeOf(game) {
  const duration = readDuration(game);
  if (!duration) return "";
  if (duration <= QUICK_MAX_MINUTES) return "rapide";
  return duration <= MEDIUM_MAX_MINUTES ? "moyen" : "long";
}

function fitsPlayers(game, bucket) {
  const players = readPlayers(game);
  if (!players) return false;
  if (bucket === "solo") return players.min === 1;
  if (bucket === "duo") return players.min <= 2 && players.max >= 2;
  return players.max >= 3;
}

/** One value per axis; axes combine (AND). `isFavorite` is (id) => bool. */
export function matchesFilters(game, filters, isFavorite) {
  if (filters.type && !typesOf(game).includes(filters.type)) return false;
  if (filters.time && timeOf(game) !== filters.time) return false;
  if (filters.players && !fitsPlayers(game, filters.players)) return false;
  return !filters.fav || isFavorite(game.id);
}

export function activeFilterCount(filters) {
  return ["type", "time", "players", "fav"].filter((axis) => filters[axis])
    .length;
}

function normalize(text) {
  return String(text)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

// Title, id and the game's tag labels in every language, so "chess",
// "echecs" or "cards" all find something whatever the hub language.
function searchText(game) {
  const tags = [...typesOf(game), timeOf(game)].filter(Boolean);
  const labels = tags.flatMap((tag) =>
    Object.keys(LABELS).map((lang) => tagLabel(tag, lang))
  );
  return normalize([game.title, game.id, ...labels].join(" "));
}

/** Every word of the query must appear somewhere (accent-insensitive). */
export function matchesQuery(game, query) {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const text = searchText(game);
  return words.every((word) => text.includes(word));
}

/** Catalog problems of one hub-config entry, for scripts/check-games.mjs. */
export function catalogProblems(game) {
  const tags = Array.isArray(game.tags) ? game.tags : [];
  return [
    ...(tags.length > 0 && tags.every((tag) => TYPES.includes(tag))
      ? []
      : ["catalog-tags"]),
    ...(readDuration(game) ? [] : ["catalog-duration"]),
    ...(readPlayers(game) ? [] : ["catalog-players"])
  ];
}
