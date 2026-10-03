/** Public games hub. Back controls leave this app for this URL. */
export const HUB_URL = "https://www.muchogames.win/";

/** Opens the hub's "Report a problem" dialog, pre-filled with `game` (a hub
 *  game id) when given. Reports land in the hub's admin inbox. */
export function hubFeedbackUrl(game?: string): string {
  return `${HUB_URL}?feedback=${encodeURIComponent(game ?? "")}`;
}
