// Player-count badge and duration tag on hub tiles. Both read optional
// `players: [min, max]` and `duration` (minutes) fields of
// public/hub-config.json; a game without them shows nothing.
const MINUTES = "min";

function readPlayers(game) {
  const players = game.players;
  if (!Array.isArray(players) || players.length !== 2) return null;
  const [min, max] = players.map(Number);
  return Number.isInteger(min) && Number.isInteger(max) && min <= max
    ? { min, max }
    : null;
}

/** Bottom-right corner badge of a tile, or null when the count is unknown. */
export function createPlayersBadge(game) {
  const players = readPlayers(game);
  if (!players) return null;
  const badge = document.createElement("span");
  badge.className = "game-tile__players";
  badge.dataset.id = `hub-tile-players-${game.id}`;
  badge.textContent = `👥 ${
    players.min === players.max ? players.min : `${players.min}–${players.max}`
  }`;
  return badge;
}

/** Duration chip shown under the tile title, or null when unknown. */
export function createTileTags(game) {
  const duration = Number(game.duration);
  if (!Number.isInteger(duration) || duration <= 0) return null;

  const wrap = document.createElement("div");
  wrap.className = "game-tile__tags";
  const chip = document.createElement("span");
  chip.className = "game-tile__tag";
  chip.textContent = `⏱ ${duration} ${MINUTES}`;
  wrap.appendChild(chip);
  return wrap;
}
