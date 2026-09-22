import { LocalGame } from "@/components/LocalGame";
import { BouillaLocalGame } from "@/components/BouillaLocalGame";
import { PresidentLocalGame } from "@/components/PresidentLocalGame";
import { BataillecorseLocalGame } from "@/components/BataillecorseLocalGame";
import { BataillecorseDuelGame } from "@/components/BataillecorseDuelGame";
import { BOT_PUNCH_LEVELS, type BotPunch, type ScoringRules } from "@/lib/coinche";
import {
  BATAILLECORSE_DECK_SIZE_OPTIONS,
  DEFAULT_BATAILLECORSE_DECK_SIZE,
  DEFAULT_BOT_THINK_MS,
  DEFAULT_PRESIDENT_ROUNDS_TO_PLAY,
  MAX_BOT_THINK_MS,
  MIN_BATAILLECORSE_BOT_THINK_MS,
  MIN_BOT_THINK_MS,
  PRESIDENT_ROUNDS_OPTIONS,
} from "@/lib/supabase/types";

const TARGETS = [500, 1000, 1500, 2000];

function parsePunch(raw: string | undefined): BotPunch {
  return BOT_PUNCH_LEVELS.includes(raw as BotPunch) ? (raw as BotPunch) : "med";
}

/** `min` defaults to `MIN_BOT_THINK_MS`; callers for la Bataille Corse pass
 *  `MIN_BATAILLECORSE_BOT_THINK_MS` instead (see `sanitizeBotThinkMs` in
 *  `lib/server/actions-lobby.ts` for why this game's floor is lower). */
function parseBotThinkMs(raw: string | undefined, min: number = MIN_BOT_THINK_MS): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return DEFAULT_BOT_THINK_MS;
  return Math.min(MAX_BOT_THINK_MS, Math.max(min, n));
}

function seedFromParams(seedParam?: string): number {
  const explicit = Number(seedParam);
  if (Number.isInteger(explicit) && explicit > 0) return explicit >>> 0;
  return (Math.random() * 0x100000000) >>> 0;
}

function parsePoints(raw: string | undefined, fallback: number): number {
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : fallback;
}

function parseRoundsToPlay(raw: string | undefined): number {
  const n = Number(raw);
  return (PRESIDENT_ROUNDS_OPTIONS as readonly number[]).includes(n) ? n : DEFAULT_PRESIDENT_ROUNDS_TO_PLAY;
}

function parseDeckSize(raw: string | undefined): 32 | 52 {
  const n = Number(raw);
  return (BATAILLECORSE_DECK_SIZE_OPTIONS as readonly number[]).includes(n) ? (n as 32 | 52) : DEFAULT_BATAILLECORSE_DECK_SIZE;
}

export default async function LocalPlayPage({
  searchParams,
}: {
  searchParams: Promise<{
    game?: string;
    target?: string;
    seed?: string;
    countContractOnlyIfMade?: string;
    failedContractDefensePoints?: string;
    zeroPointsForNonContractingTeamWhenContractMade?: string;
    capotMadePoints?: string;
    capotFailedDefensePoints?: string;
    allowSpecialBids?: string;
    requireMorePointsToWin?: string;
    botPunch?: string;
    botThinkMs?: string;
    roundsToPlay?: string;
    deckSize?: string;
    mode?: string;
  }>;
}) {
  const sp = await searchParams;
  const seed = seedFromParams(sp.seed);
  const botThinkMs = parseBotThinkMs(sp.botThinkMs);
  if (sp.game === "bouilla") {
    return <BouillaLocalGame seed={seed} botThinkMs={botThinkMs} />;
  }
  if (sp.game === "president") {
    return <PresidentLocalGame seed={seed} botThinkMs={botThinkMs} roundsToPlay={parseRoundsToPlay(sp.roundsToPlay)} />;
  }
  if (sp.game === "bataillecorse" && sp.mode === "duel") {
    return <BataillecorseDuelGame seed={seed} deckSize={parseDeckSize(sp.deckSize)} />;
  }
  if (sp.game === "bataillecorse") {
    const bataillecorseBotThinkMs = parseBotThinkMs(sp.botThinkMs, MIN_BATAILLECORSE_BOT_THINK_MS);
    return <BataillecorseLocalGame seed={seed} botThinkMs={bataillecorseBotThinkMs} deckSize={parseDeckSize(sp.deckSize)} />;
  }
  const target = Number(sp.target);
  const targetPoints = TARGETS.includes(target) ? target : 1000;
  const scoringRules: ScoringRules = {
    countContractOnlyIfMade: sp.countContractOnlyIfMade === "true",
    failedContractDefensePoints: parsePoints(sp.failedContractDefensePoints, 160),
    zeroPointsForNonContractingTeamWhenContractMade: sp.zeroPointsForNonContractingTeamWhenContractMade === "true",
    capotMadePoints: parsePoints(sp.capotMadePoints, 250),
    capotFailedDefensePoints: parsePoints(sp.capotFailedDefensePoints, 250),
    allowToutAtoutSansAtout: sp.allowSpecialBids === "true",
    requireMorePointsToWin: sp.requireMorePointsToWin !== "false",
  };
  const botPunch = parsePunch(sp.botPunch);
  return (
    <LocalGame
      targetPoints={targetPoints}
      seed={seed}
      scoringRules={scoringRules}
      botPunch={botPunch}
      botThinkMs={botThinkMs}
    />
  );
}
