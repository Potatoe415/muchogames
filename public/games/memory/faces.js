import { BACKS, THEMES } from "./decks.js";

export { BACKS };
export const THEME_IDS = THEMES.map((theme) => theme.id);

const pad = (n) => String(n).padStart(2, "0");
const asset = (path) => new URL(path, import.meta.url).href;

export function faceIds(themeId) {
  const theme = THEMES.find((item) => item.id === themeId);
  if (!theme) return [];
  return Array.from({ length: theme.count }, (_, index) => pad(index + 1));
}

export const faceUrl = (themeId, faceId) =>
  asset(`cards/${themeId}/card_${faceId}.webp`);

export const backUrl = (backId) => asset(`backs/back_${backId}.webp`);

export function deckUrls(config, cards) {
  const faces = new Set(cards.map((card) => card.faceId));
  return [
    backUrl(config.back),
    ...[...faces].map((faceId) => faceUrl(config.theme, faceId))
  ];
}
