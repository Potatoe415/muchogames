import type { PlayerView } from "./redact";

/** The bot always flips the instant it's able to - the top card is random and
 *  hidden, so there is no strategic choice to make, only pacing (see
 *  GameSettings.botThinkMs, applied by the caller as a delay before this). */
export function shouldBotFlip(view: PlayerView, botSeat: 0 | 1): boolean {
  return view.phase === "playing" && view.slapWindow === null && view.turn === botSeat;
}

/** Matches `BOT_REFLEX_LEVELS` in `GameSettingsPanel.tsx` (slow / normal). */
const SLOW_BOT_THINK_MS = 3200;
const NORMAL_BOT_THINK_MS = 2400;
/** Slow never beats 1s; normal never beats 0.5s; fast / very-fast keep 150ms. */
const SLOW_REACTION_FLOOR_MS = 1000;
const NORMAL_REACTION_FLOOR_MS = 500;
const FAST_REACTION_FLOOR_MS = 150;

function reactionFloorMs(botThinkMs: number): number {
  if (botThinkMs >= SLOW_BOT_THINK_MS) return SLOW_REACTION_FLOOR_MS;
  if (botThinkMs >= NORMAL_BOT_THINK_MS) return NORMAL_REACTION_FLOOR_MS;
  return FAST_REACTION_FLOOR_MS;
}

/** Simulated local reaction time for a bot's slap attempt, in ms. Scales with
 *  `botThinkMs` (GameSettings, shared with every other game's bot pacing) so
 *  the same slider also tunes reflex difficulty: a higher `botThinkMs` makes
 *  the bot a slower (easier) opponent to out-slap. Normal's floor is 0.5s
 *  and slow's is 1s, so those two levels cannot win a slap race with a
 *  sub-threshold tap. */
export function simulateBotReactionMs(botThinkMs: number): number {
  const max = Math.max(250, Math.min(botThinkMs, 2500));
  const min = Math.min(reactionFloorMs(botThinkMs), max);
  return min + Math.random() * Math.max(0, max - min);
}
