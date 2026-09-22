"use client";

import { useI18n } from "@/lib/client/i18n";
import { BOT_PUNCH_LEVELS, type BotPunch } from "@/lib/coinche";
import {
  BATAILLECORSE_DECK_SIZE_OPTIONS,
  BOT_THINK_MS_STEP,
  DEFAULT_BATAILLECORSE_BOT_THINK_MS,
  DEFAULT_BATAILLECORSE_DECK_SIZE,
  DEFAULT_BOT_THINK_MS,
  DEFAULT_PRESIDENT_ROUNDS_TO_PLAY,
  MAX_BOT_THINK_MS,
  MIN_BOT_THINK_MS,
  PRESIDENT_ROUNDS_OPTIONS,
  STILL_THERE_TIMEOUT_OPTIONS,
} from "@/lib/supabase/types";
import { ParamPresetPicker } from "./ParamPresetPicker";
import type { ParamPreset } from "@/lib/client/useParamPresets";

export interface GameSetupValues {
  target: number;
  countContractOnlyIfMade: boolean;
  failedContractDefensePoints: string;
  zeroPointsForNonContractingTeamWhenContractMade: boolean;
  capotMadePoints: string;
  capotFailedDefensePoints: string;
  allowToutAtoutSansAtout: boolean;
  requireMorePointsToWin: boolean;
  botPunch: BotPunch;
  /** Seconds of silence on a human's turn before the "are you still there?"
   *  idle timer kicks in. Shared by both games (see docs/DATA_MODEL.md). One of
   *  `STILL_THERE_TIMEOUT_OPTIONS`, chosen via a discrete slider. */
  stillThereTimeoutSec: number;
  /** How long a bot "thinks" before playing, in ms. Shared by both games and
   *  every mode (see `GameSettings.botThinkMs`). */
  botThinkMs: number;
  /** Président-only: number of rounds in the match (see `GameSettings.presidentRoundsToPlay`). */
  roundsToPlay: number;
  /** La Bataille Corse-only: 32 or 52 cards (see `GameSettings.bataillecorseDeckSize`). */
  bataillecorseDeckSize: 32 | 52;
}

export const DEFAULT_GAME_SETUP: GameSetupValues = {
  target: 1000,
  countContractOnlyIfMade: true,
  failedContractDefensePoints: "160",
  zeroPointsForNonContractingTeamWhenContractMade: true,
  capotMadePoints: "250",
  capotFailedDefensePoints: "250",
  allowToutAtoutSansAtout: false,
  requireMorePointsToWin: true,
  botPunch: "med",
  stillThereTimeoutSec: 15,
  botThinkMs: DEFAULT_BOT_THINK_MS,
  roundsToPlay: DEFAULT_PRESIDENT_ROUNDS_TO_PLAY,
  bataillecorseDeckSize: DEFAULT_BATAILLECORSE_DECK_SIZE,
};

/** La Bataille Corse's own defaults, applied by every setup screen
 *  (local/online/ad-hoc) instead of `DEFAULT_GAME_SETUP.botThinkMs` - see
 *  `DEFAULT_BATAILLECORSE_BOT_THINK_MS`'s doc comment for why the shared
 *  default doesn't fit this game's reflex slider. `bataillecorseDeckSize`
 *  already matches `DEFAULT_GAME_SETUP`, kept here only for a single
 *  call site per setup screen. */
export const DEFAULT_BATAILLECORSE_GAME_SETUP: GameSetupValues = {
  ...DEFAULT_GAME_SETUP,
  botThinkMs: DEFAULT_BATAILLECORSE_BOT_THINK_MS,
};

const TARGETS = [500, 1000, 1500, 2000];
const PUNCH_LABEL_KEY = { low: "punchLow", med: "punchMed", high: "punchHigh" } as const;

/** La Bataille Corse only: `botThinkMs` reframed as 4 discrete "reflex
 *  quality" levels (slow..very fast) instead of the other games' continuous
 *  thinking-time slider - it directly drives `simulateBotReactionMs`'s upper
 *  bound, so a "faster" bot is a harder opponent to out-slap. */
const BOT_REFLEX_LEVELS = [3200, DEFAULT_BATAILLECORSE_BOT_THINK_MS, 1600, 800] as const;
const BOT_REFLEX_LABEL_KEYS = ["botReflexSlow", "botReflexNormal", "botReflexFast", "botReflexVeryFast"] as const;

/** Nearest reflex level for a `botThinkMs` value that didn't come from this
 *  slider (e.g. the shared `DEFAULT_BOT_THINK_MS`). */
function closestBotReflexIndex(botThinkMs: number): number {
  let closest = 0;
  for (let i = 1; i < BOT_REFLEX_LEVELS.length; i++) {
    if (Math.abs(BOT_REFLEX_LEVELS[i] - botThinkMs) < Math.abs(BOT_REFLEX_LEVELS[closest] - botThinkMs)) closest = i;
  }
  return closest;
}

interface ToggleProps {
  checked: boolean;
  onToggle: () => void;
  dataId: string;
}

function ToggleSwitch({ checked, onToggle, dataId }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      data-id={dataId}
      onClick={onToggle}
      className={[
        "relative h-6 w-11 flex-shrink-0 rounded-full transition-colors",
        checked ? "bg-[var(--accent-yellow)]" : "bg-[var(--card-face)]/20",
      ].join(" ")}
    >
      <span
        className={[
          "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-[22px]" : "translate-x-0",
        ].join(" ")}
      />
    </button>
  );
}

interface Props {
  values: GameSetupValues;
  onChange: (next: GameSetupValues) => void;
  /** Prefix for data-id attributes, e.g. "local" or "online". */
  idPrefix: string;
  title: string;
  /** Whether to show the Coinche-only fields (points/capot/preset picker/etc.).
   *  Defaults to true. */
  coincheFields?: boolean;
  /** Whether to show the Président-only field (rounds-to-play slider).
   *  Defaults to false. */
  presidentFields?: boolean;
  /** Whether to show the la Bataille Corse-only field (32/52 card deck size).
   *  Defaults to false. */
  bataillecorseFields?: boolean;
  /** Whether to show the shared idle-turn timer field. Online-only: local and
   *  ad-hoc games never run the server-side idle timer, so it would be dead UI
   *  there. Defaults to false. */
  showStillThereTimeout?: boolean;
  /** Hides the bot-only field (reflex slider / think-time slider): there is
   *  no bot to tune in la Bataille Corse's face-to-face duel mode (see
   *  `LocalSetupPageInner`). Defaults to false. */
  hideBotFields?: boolean;
}

export function GameSettingsPanel({
  values,
  onChange,
  idPrefix,
  title,
  coincheFields = true,
  presidentFields = false,
  bataillecorseFields = false,
  showStillThereTimeout = false,
  hideBotFields = false,
}: Props) {
  const { t } = useI18n();

  function set<K extends keyof GameSetupValues>(key: K, val: GameSetupValues[K]) {
    onChange({ ...values, [key]: val });
  }

  function applyPreset(preset: ParamPreset) {
    onChange({
      ...values,
      capotMadePoints: String(preset.capotMadePoints),
      capotFailedDefensePoints: String(preset.capotFailedDefensePoints),
      countContractOnlyIfMade: preset.countContractOnlyIfMade,
      failedContractDefensePoints: String(preset.failedContractDefensePoints),
      zeroPointsForNonContractingTeamWhenContractMade: preset.zeroPointsForNonContractingTeamWhenContractMade,
    });
  }

  return (
    <section
      className="rounded-2xl bg-[var(--surface)] p-5 text-[var(--card-face)] shadow-lg ring-1 ring-[var(--accent-cyan)]/25"
      data-id={`${idPrefix}-settings-card`}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <h2 className="text-lg font-bold">{title}</h2>
        {coincheFields && (
          <ParamPresetPicker
            currentValues={{
              capotMadePoints: Number(values.capotMadePoints) || 250,
              capotFailedDefensePoints: Number(values.capotFailedDefensePoints) || 250,
              countContractOnlyIfMade: values.countContractOnlyIfMade,
              failedContractDefensePoints: Number(values.failedContractDefensePoints) || 160,
              zeroPointsForNonContractingTeamWhenContractMade: values.zeroPointsForNonContractingTeamWhenContractMade,
            }}
            onSelect={applyPreset}
          />
        )}
      </div>
      <div className="grid grid-cols-1 gap-3">
        {!hideBotFields && (bataillecorseFields ? (
          <div className="flex flex-col gap-1.5 text-sm" data-id={`${idPrefix}-bot-reflex-row`}>
            <div className="flex items-center justify-between">
              <span className="text-[var(--card-face)]/75">{t("botReflexQualityLabel")}</span>
              <span className="font-bold text-[var(--accent-yellow)]" data-id={`${idPrefix}-bot-reflex-value`}>
                {t(BOT_REFLEX_LABEL_KEYS[closestBotReflexIndex(values.botThinkMs)])}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={BOT_REFLEX_LEVELS.length - 1}
              step={1}
              value={closestBotReflexIndex(values.botThinkMs)}
              onChange={(e) => set("botThinkMs", BOT_REFLEX_LEVELS[Number(e.target.value)])}
              data-id={`${idPrefix}-bot-reflex-slider`}
              className="w-full accent-[var(--accent-yellow)]"
            />
            <div className="flex justify-between text-xs text-[var(--card-face)]/50">
              {BOT_REFLEX_LABEL_KEYS.map((key) => (
                <span key={key}>{t(key)}</span>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5 text-sm" data-id={`${idPrefix}-bot-think-ms-row`}>
            <div className="flex items-center justify-between">
              <span className="text-[var(--card-face)]/75">{t("botThinkTime")}</span>
              <span className="font-bold text-[var(--accent-yellow)]" data-id={`${idPrefix}-bot-think-ms-value`}>
                {(values.botThinkMs / 1000).toFixed(1)}s
              </span>
            </div>
            <input
              type="range"
              min={MIN_BOT_THINK_MS}
              max={MAX_BOT_THINK_MS}
              step={BOT_THINK_MS_STEP}
              value={values.botThinkMs}
              onChange={(e) => set("botThinkMs", Number(e.target.value))}
              data-id={`${idPrefix}-bot-think-ms-slider`}
              className="w-full accent-[var(--accent-yellow)]"
            />
            <div className="flex justify-between text-xs text-[var(--card-face)]/50">
              <span>{t("botThinkFast")}</span>
              <span>{t("botThinkSlow")}</span>
            </div>
          </div>
        ))}
        {bataillecorseFields && (
          <div className="flex flex-col gap-1.5 text-sm" data-id={`${idPrefix}-deck-size-row`}>
            <span className="text-[var(--card-face)]/75">{t("deckSizeLabel")}</span>
            <div className="flex gap-2">
              {BATAILLECORSE_DECK_SIZE_OPTIONS.map((size) => (
                <button
                  key={size}
                  type="button"
                  data-id={`${idPrefix}-deck-size-${size}`}
                  onClick={() => set("bataillecorseDeckSize", size)}
                  className={[
                    "flex-1 rounded-lg px-3 py-2 font-bold",
                    values.bataillecorseDeckSize === size
                      ? "bg-[var(--accent-yellow)] text-[var(--surface)]"
                      : "bg-[rgba(255,250,242,0.12)] text-[var(--card-face)]/70",
                  ].join(" ")}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}
        {showStillThereTimeout && (
          <div className="flex flex-col gap-1.5 text-sm" data-id={`${idPrefix}-still-there-timeout-row`}>
            <div className="flex items-center justify-between">
              <span className="text-[var(--card-face)]/75">{t("stillThereTimeout")}</span>
              <span
                className="font-bold text-[var(--accent-yellow)]"
                data-id={`${idPrefix}-still-there-timeout-value`}
              >
                {values.stillThereTimeoutSec}s
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={STILL_THERE_TIMEOUT_OPTIONS.length - 1}
              step={1}
              value={(STILL_THERE_TIMEOUT_OPTIONS as readonly number[]).indexOf(values.stillThereTimeoutSec)}
              onChange={(e) => set("stillThereTimeoutSec", STILL_THERE_TIMEOUT_OPTIONS[Number(e.target.value)])}
              data-id={`${idPrefix}-still-there-timeout-slider`}
              className="w-full accent-[var(--accent-yellow)]"
            />
            <div className="flex justify-between text-xs text-[var(--card-face)]/50">
              {STILL_THERE_TIMEOUT_OPTIONS.map((sec) => (
                <span key={sec}>{sec}</span>
              ))}
            </div>
          </div>
        )}
        {presidentFields && (
          <div className="flex flex-col gap-1.5 text-sm" data-id={`${idPrefix}-rounds-to-play-row`}>
            <div className="flex items-center justify-between">
              <span className="text-[var(--card-face)]/75">{t("roundsToPlayLabel")}</span>
              <span className="font-bold text-[var(--accent-yellow)]" data-id={`${idPrefix}-rounds-to-play-value`}>
                {values.roundsToPlay}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={PRESIDENT_ROUNDS_OPTIONS.length - 1}
              step={1}
              value={(PRESIDENT_ROUNDS_OPTIONS as readonly number[]).indexOf(values.roundsToPlay)}
              onChange={(e) => set("roundsToPlay", PRESIDENT_ROUNDS_OPTIONS[Number(e.target.value)])}
              data-id={`${idPrefix}-rounds-to-play-slider`}
              className="w-full accent-[var(--accent-yellow)]"
            />
            <div className="flex justify-between text-xs text-[var(--card-face)]/50">
              {PRESIDENT_ROUNDS_OPTIONS.map((n) => (
                <span key={n}>{n}</span>
              ))}
            </div>
          </div>
        )}
        {coincheFields && (
          <>
            <label className="flex items-center justify-between gap-3 text-sm">
              <span className="text-[var(--card-face)]/75">{t("pointsCount")}</span>
              <select
                data-id={`${idPrefix}-target-select`}
                value={values.target}
                onChange={(e) => set("target", Number(e.target.value))}
                className="w-40 rounded-lg bg-[rgba(255,250,242,0.12)] px-3 py-2 ring-1 ring-[var(--accent-cyan)]/25"
              >
                {TARGETS.map((p) => (
                  <option key={p} value={p}>{p} points</option>
                ))}
              </select>
            </label>
            <label
              className="flex items-center justify-between gap-3 text-sm"
              data-id={`${idPrefix}-count-contract-only-checkbox-row`}
            >
              <span className="text-[var(--card-face)]/75">{t("localOnlyContractPoints")}</span>
              <ToggleSwitch
                checked={values.countContractOnlyIfMade}
                onToggle={() => set("countContractOnlyIfMade", !values.countContractOnlyIfMade)}
                dataId={`${idPrefix}-count-contract-only-checkbox`}
              />
            </label>
            <label className="flex items-center justify-between gap-3 text-sm">
              <span className="text-[var(--card-face)]/75">{t("failedContract")}</span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                data-id={`${idPrefix}-failed-contract-points-input`}
                value={values.failedContractDefensePoints}
                onChange={(e) => set("failedContractDefensePoints", e.target.value)}
                placeholder="160"
                className="w-40 rounded-lg bg-[rgba(255,250,242,0.12)] px-3 py-2 ring-1 ring-[var(--accent-cyan)]/25"
              />
            </label>
            <label className="flex items-center justify-between gap-3 text-sm">
              <span className="text-[var(--card-face)]/75">{t("opponentPoints")}</span>
              <ToggleSwitch
                checked={!values.zeroPointsForNonContractingTeamWhenContractMade}
                onToggle={() =>
                  set(
                    "zeroPointsForNonContractingTeamWhenContractMade",
                    !values.zeroPointsForNonContractingTeamWhenContractMade,
                  )
                }
                dataId={`${idPrefix}-opponent-points-switch`}
              />
            </label>
            <label className="flex items-center justify-between gap-3 text-sm">
              <span className="text-[var(--card-face)]/75">{t("capot")}</span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                data-id={`${idPrefix}-capot-made-points-input`}
                value={values.capotMadePoints}
                onChange={(e) => set("capotMadePoints", e.target.value)}
                placeholder="250"
                className="w-40 rounded-lg bg-[rgba(255,250,242,0.12)] px-3 py-2 ring-1 ring-[var(--accent-cyan)]/25"
              />
            </label>
            <label className="flex items-center justify-between gap-3 text-sm">
              <span className="text-[var(--card-face)]/75">{t("failedCapot")}</span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                data-id={`${idPrefix}-capot-failed-defense-points-input`}
                value={values.capotFailedDefensePoints}
                onChange={(e) => set("capotFailedDefensePoints", e.target.value)}
                placeholder="250"
                className="w-40 rounded-lg bg-[rgba(255,250,242,0.12)] px-3 py-2 ring-1 ring-[var(--accent-cyan)]/25"
              />
            </label>
            <label
              className="flex items-center justify-between gap-3 text-sm"
              data-id={`${idPrefix}-allow-special-bids-row`}
            >
              <span className="text-[var(--card-face)]/75">{t("allowSpecialBids")}</span>
              <ToggleSwitch
                checked={values.allowToutAtoutSansAtout}
                onToggle={() => set("allowToutAtoutSansAtout", !values.allowToutAtoutSansAtout)}
                dataId={`${idPrefix}-allow-special-bids-switch`}
              />
            </label>
            <label
              className="flex items-center justify-between gap-3 text-sm"
              data-id={`${idPrefix}-require-more-points-row`}
            >
              <span className="text-[var(--card-face)]/75">{t("requireMorePointsToWin")}</span>
              <ToggleSwitch
                checked={values.requireMorePointsToWin}
                onToggle={() => set("requireMorePointsToWin", !values.requireMorePointsToWin)}
                dataId={`${idPrefix}-require-more-points-switch`}
              />
            </label>
            <div className="flex flex-col gap-1.5 text-sm" data-id={`${idPrefix}-bot-punch-row`}>
              <div className="flex items-center justify-between">
                <span className="text-[var(--card-face)]/75">{t("botLevel")}</span>
                <span
                  className="font-bold text-[var(--accent-yellow)]"
                  data-id={`${idPrefix}-bot-punch-value`}
                >
                  {t(PUNCH_LABEL_KEY[values.botPunch])}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={BOT_PUNCH_LEVELS.length - 1}
                step={1}
                value={BOT_PUNCH_LEVELS.indexOf(values.botPunch)}
                onChange={(e) => set("botPunch", BOT_PUNCH_LEVELS[Number(e.target.value)])}
                data-id={`${idPrefix}-bot-punch-slider`}
                className="w-full accent-[var(--accent-yellow)]"
              />
              <div className="flex justify-between text-xs text-[var(--card-face)]/50">
                <span>{t("punchLow")}</span>
                <span>{t("punchMed")}</span>
                <span>{t("punchHigh")}</span>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
