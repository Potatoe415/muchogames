/** The card-back picture each game remembers on this device, chosen on its
 *  home screen. Cosmetic only: never sent to the server or to other players. */
export const CARD_BACKS = ["classic", "hogwarts", "casino", "stars", "garden"] as const;
export type CardBackId = (typeof CARD_BACKS)[number];

export const DEFAULT_CARD_BACK: CardBackId = "classic";

const KEY_PREFIX = "coinchapp-card-back:";

export function parseCardBack(value: unknown): CardBackId {
  return CARD_BACKS.includes(value as CardBackId) ? (value as CardBackId) : DEFAULT_CARD_BACK;
}

/** `null` for the classic back, which is drawn in CSS. */
export function cardBackSrc(back: CardBackId): string | null {
  return back === "classic" ? null : `/card-backs/${back}.webp`;
}

export function readCardBack(game: string | undefined): CardBackId {
  if (!game) return DEFAULT_CARD_BACK;
  try {
    return parseCardBack(localStorage.getItem(KEY_PREFIX + game));
  } catch {
    return DEFAULT_CARD_BACK;
  }
}

export function writeCardBack(game: string, back: CardBackId): void {
  try {
    localStorage.setItem(KEY_PREFIX + game, back);
  } catch {
    // Storage unavailable: the choice only lasts for this visit.
  }
}
