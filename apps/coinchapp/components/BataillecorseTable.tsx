"use client";

import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { otherSeat, SLAP_GRACE_MS, type PlayerView } from "@/lib/bataillecorse";
import { useBataillecorseDebugMode } from "@/lib/client/bataillecorseDebugMode";
import { HUB_URL } from "@/lib/client/hubUrl";
import { formatText, useI18n } from "@/lib/client/i18n";
import { useRecordMatchResult } from "@/lib/client/matchResultStats";
import type { ReactionPick, TableReaction } from "@/lib/client/reactions";
import type { GameView } from "@/lib/server/view";
import { CssVarProbe, useCssVarPx } from "@/lib/client/useCssVarPx";
import { useOptimisticFlip } from "@/lib/client/useOptimisticFlip";
import { BataillecorseDebugOverlay, type BataillecorseDebugMode } from "./BataillecorseDebugOverlay";
import { CardBack, PlayingCard } from "./PlayingCard";
import { EmojiButton } from "./EmojiButton";
import { ReactionBubble } from "./ReactionBubble";
import { GameInfoButton, HostRow, type HostControls } from "./GameHud";
import { playedCardEnterStyle, type EnterDirection } from "./TrickStage";
import { playerName } from "./gameTableHelpers";
import { TableShell } from "./TableShell";

/** This table only ever renders a la Bataille Corse game: narrow the shared,
 *  multi-game `GameView` down to its own view/botViews shape. */
export type BataillecorseGameView = Omit<GameView, "view" | "botViews"> & {
  view: PlayerView | null;
  botViews?: Record<number, PlayerView>;
};

export interface BataillecorseActions {
  onFlip: () => Promise<void> | void;
  /** `reactionMs` is measured entirely client-side (see docs/DECISIONS.md);
   *  `observedWindowId` is whichever slap window this client last saw open. */
  onSlap: (reactionMs: number, observedWindowId: number | null) => Promise<void> | void;
  onBecomeHost?: () => Promise<void> | void;
  onForceSync?: () => void;
  onReset?: () => void;
  onSendReaction?: (pick: ReactionPick) => void;
  onRematch?: () => Promise<void> | void;
}

/** How long a "pile won"/"false slap" banner stays visible, diffed by event
 *  id so it flashes exactly once per occurrence (same pattern as Président's
 *  `lastBurn`/`lastSkip`, see docs/DECISIONS.md). */
const FLASH_MS = 1800;

/** How long the "your reaction time" readout stays on screen after a slap
 *  attempt - both players' own readout, each under their own deck. */
const REACTION_READOUT_MS = 5000;

/** How long the winner's deck glows like it just caught fire from grabbing
 *  the pile - see `.bataillecorse-deck-fire` (`app/globals.css`). */
const FIRE_MS = 2600;

/** How long a slap-bounce class stays on the pile cards. Must cover
 *  `.bataillecorse-pile-card-hit` (480ms), `-slam` (520ms) and
 *  `.bataillecorse-pile-slap-shock` (560ms) in `app/globals.css`. Leaving
 *  the class on after that (the old `tapHitKey > 0` forever) made every
 *  later flip remount with the bounce animation, which on mobile Safari
 *  swallows the child's `.bataillecorse-card-enter` slide. */
const PILE_HIT_MS = 560;

/** `tapHitKey` itself is a monotonically increasing counter so a second slap
 *  can restart the bounce; this returns it only while the bounce should
 *  actually play, then 0 so later flips get a clean slide-in. */
function useLiveTapHitKey(tapHitKey: number): number {
  const [track, setTrack] = useState({ key: 0, live: 0 });
  if (tapHitKey !== track.key) {
    setTrack({ key: tapHitKey, live: tapHitKey });
  }
  useEffect(() => {
    if (tapHitKey === 0) return;
    const timer = setTimeout(() => {
      setTrack((s) => (s.key === tapHitKey ? { key: s.key, live: 0 } : s));
    }, PILE_HIT_MS);
    return () => clearTimeout(timer);
  }, [tapHitKey]);
  return tapHitKey !== track.key ? tapHitKey : track.live;
}

export function useFlash(eventId: number | undefined): boolean {
  const [visible, setVisible] = useState(false);
  const seenRef = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (eventId === undefined || eventId === seenRef.current) return;
    seenRef.current = eventId;
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), FLASH_MS);
    return () => clearTimeout(timer);
  }, [eventId]);
  return visible;
}

/** Which seat's deck should glow like it's on fire right now, for `FIRE_MS`
 *  after that seat wins a pile - diffed by event id, same one-shot-per-
 *  occurrence pattern as `useFlash`, just returning the seat instead of a
 *  plain boolean since either deck can be the one lighting up. */
export function useWinnerFireSeat(lastPileWin: PlayerView["lastPileWin"]): PlayerView["mySeat"] | null {
  const [seat, setSeat] = useState<PlayerView["mySeat"] | null>(null);
  const seenRef = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (!lastPileWin || lastPileWin.id === seenRef.current) return;
    seenRef.current = lastPileWin.id;
    setSeat(lastPileWin.seat);
    const timer = setTimeout(() => setSeat(null), FIRE_MS);
    return () => clearTimeout(timer);
  }, [lastPileWin]);
  return seat;
}

/** Which side the pile's newest card should slide in from: whichever seat's
 *  stock count just went down played it. Adjusted during render (React's
 *  documented "reset state on prop change" pattern, same as Président's
 *  `usePileDisplay`) so it is always correct by the time the new card's key
 *  first mounts.
 *
 *  An immediate tribute failure (see `resolveTributeEffect`/`justEnteredCardKey`
 *  in `useDisplayPile`) plays and sweeps the losing card away inside the very
 *  same server update: `view.pile.length` never observably *increases* for
 *  it (it goes straight from the pre-sweep length to 0), so the stock-count
 *  comparison below never runs and `dir` would otherwise keep whatever
 *  direction the *previous* flip left it at - wrongly crediting that card to
 *  the wrong seat. That losing card always belongs to the tribute *payer*,
 *  i.e. whichever seat is not `lastPileWin.seat` (the payer is always who
 *  loses a `"tribute"`-reason pile), so this is checked first. */
export function usePileEnterDirection(view: PlayerView, mySeat: number): EnterDirection {
  const [dir, setDir] = useState<EnterDirection>("bottom");
  const [track, setTrack] = useState({
    pileLength: view.pile.length,
    myStockCount: view.myStockCount,
    lastPileWinId: view.lastPileWin?.id ?? null,
  });
  const lastPileWinId = view.lastPileWin?.id ?? null;
  if (lastPileWinId !== track.lastPileWinId && view.lastPileWin?.reason === "tribute") {
    const payer = otherSeat(view.lastPileWin.seat);
    setDir(payer === mySeat ? "bottom" : "top");
    setTrack({ pileLength: view.pile.length, myStockCount: view.myStockCount, lastPileWinId });
  } else if (view.pile.length !== track.pileLength) {
    if (view.pile.length > track.pileLength) {
      setDir(view.myStockCount < track.myStockCount ? "bottom" : "top");
    }
    setTrack({ pileLength: view.pile.length, myStockCount: view.myStockCount, lastPileWinId });
  } else if (lastPileWinId !== track.lastPileWinId) {
    setTrack({ pileLength: view.pile.length, myStockCount: view.myStockCount, lastPileWinId });
  }
  return dir;
}

/** How long the pile stays visible after a "double"/"sandwich" win before
 *  it's actually cleared: the server clears `pile` in the very same update
 *  that reports the win (see `awardPile` in `engine.ts`), so without this the
 *  cards that formed the pattern never get seen at all - they'd vanish on
 *  the same frame the win banner appears. Must cover the full
 *  `.bataillecorse-pile-fly` animation (3400ms, `app/globals.css`) so the
 *  sweep never gets cut off mid-flight by the real pile snapping to empty. */
const HOLD_PILE_MS = 3600;

/** Freezes the pile at whatever it looked like the instant before a pile-win
 *  clears it, for `HOLD_PILE_MS`, then releases it back to the real (now
 *  empty, or freshly-refilled) `view.pile`. Freezes on `lastPileWin.cards`
 *  (the full swept pile the server captured at award time), never on a
 *  client's own previously-seen `pile` prop: the server clears `pile` in the
 *  very same update that reports the win (see `awardPile` in `engine.ts`),
 *  so whichever card was just flipped to trigger the win (e.g. a failed
 *  tribute answer) never existed as a separate observable `pile` state for
 *  either seat to have tracked - only the win event itself carries it.
 *  Adjusted during render (React's documented "reset state on prop change"
 *  pattern, same as `usePileEnterDirection` above) so the frozen cards are
 *  already there on the very first frame the server reports an empty pile -
 *  no separate effect-driven extra frame where the pile flashes empty first.
 *  `flying` is true for that whole hold: drives the "cards fly into the
 *  winner's stock" sweep in `PileStack` (`.bataillecorse-pile-fly`, see
 *  `app/globals.css`) instead of the pile just vanishing.
 *
 *  `justEnteredCardKey`: identifies the top card of `lastPileWin.cards` when
 *  it is genuinely new - i.e. it was never the live pile's top card before
 *  this same update (a failed tribute answer: the card that lost the pile
 *  was flipped and swept away in one atomic server transition, so it never
 *  had its own non-flying frame to slide in during). `PileStack` uses this
 *  to still animate that one card's entrance even while `flying` is true,
 *  without replaying the slide-in on a slap/false-slap win - those sweep the
 *  pile exactly as it already was, so their top card always matches the
 *  live pile's previous top card and `justEnteredCardKey` stays `null`. */
export function useDisplayPile(
  pile: PlayerView["pile"],
  lastPileWin: PlayerView["lastPileWin"],
): { pile: PlayerView["pile"]; flying: boolean; justEnteredCardKey: string | null } {
  const winEventId = lastPileWin?.id;
  const [track, setTrack] = useState({
    winEventId,
    livePile: pile,
    frozen: null as PlayerView["pile"] | null,
    justEnteredCardKey: null as string | null,
  });
  if (winEventId !== track.winEventId) {
    const cards = winEventId !== undefined ? lastPileWin!.cards : null;
    const priorTop = track.livePile[track.livePile.length - 1];
    const newTop = cards?.[cards.length - 1];
    const isNew = Boolean(newTop) && (!priorTop || cardKey(newTop!) !== cardKey(priorTop));
    setTrack({ winEventId, livePile: pile, frozen: cards, justEnteredCardKey: isNew ? cardKey(newTop!) : null });
  } else if (pile !== track.livePile && track.frozen === null) {
    setTrack((t) => ({ ...t, livePile: pile }));
  }
  useEffect(() => {
    if (track.frozen === null) return;
    const timer = setTimeout(() => setTrack((t) => ({ ...t, frozen: null, justEnteredCardKey: null })), HOLD_PILE_MS);
    return () => clearTimeout(timer);
  }, [track.frozen]);
  return { pile: track.frozen ?? pile, flying: track.frozen !== null, justEnteredCardKey: track.justEnteredCardKey };
}

/** The instant (`performance.now()`) *this client* first saw the currently
 *  open slap window, for measuring a genuine local reaction time - read only
 *  from the `tapSlap` event handler, never during render (`.current` is a
 *  ref, not state, and mutated inside an effect, not the render body).
 *  Uses `useLayoutEffect` (not `useEffect`): a plain effect only runs after
 *  the browser has already painted the new frame, which is late enough that
 *  a fast human reacting to the very frame that opened the window could tap
 *  before it fires, wrongly reading back as "no window seen yet" (reaction
 *  measured as 0). A layout effect runs before paint, so by the time the
 *  player can actually see the window, this ref is already set. */
export function useWindowSeenAtRef(slapWindow: PlayerView["slapWindow"]): RefObject<{ id: number; perfMs: number } | null> {
  const ref = useRef<{ id: number; perfMs: number } | null>(null);
  useLayoutEffect(() => {
    if (!slapWindow || ref.current?.id === slapWindow.id) return;
    ref.current = { id: slapWindow.id, perfMs: performance.now() };
  }, [slapWindow]);
  return ref;
}

/** Seconds, 2 decimals (e.g. "0,54" / "0.54") - `performance.now()` has
 *  sub-millisecond precision, but the readout is shown in seconds. */
function formatReactionSeconds(ms: number, locale: "fr" | "en"): string {
  const value = (ms / 1000).toFixed(2);
  return locale === "fr" ? value.replace(".", ",") : value;
}

/** A seat's own locally-measured reaction time for the slap that just
 *  resolved (see `PileWinEvent.reactionMsBySeat`) - `null` once nobody has
 *  won a slap yet, or that seat never claimed (won uncontested via
 *  `resolveStaleSlapWindow`). Diffed by event id so it only (re)appears once
 *  per resolution, auto-hiding after `REACTION_READOUT_MS`. Shown as the
 *  combined `{mine}s | {opponent}s` readout above the phone-holder's deck. */
export function useSeatReactionMs(lastPileWin: PlayerView["lastPileWin"], seat: 0 | 1): number | null {
  const [value, setValue] = useState<number | null>(null);
  const seenIdRef = useRef<number | undefined>(undefined);
  useEffect(() => {
    const id = lastPileWin?.id;
    const ms = lastPileWin?.reason === "slap" ? lastPileWin.reactionMsBySeat?.[seat] : undefined;
    if (id === undefined || id === seenIdRef.current || ms === undefined) return;
    seenIdRef.current = id;
    setValue(ms);
    const timer = setTimeout(() => setValue(null), REACTION_READOUT_MS);
    return () => clearTimeout(timer);
  }, [lastPileWin, seat]);
  return value;
}

/** Whether the currently open slap window should visually stand out (red
 *  pulse) yet. Deliberately delayed by `SLAP_GRACE_MS` (the same window a
 *  claim has to land in) instead of firing the instant the pattern appears:
 *  revealing it immediately would hand away the "spot it yourself" reflex
 *  test this game is actually about - the highlight only kicks in as a
 *  last-moment nudge, right as the window is about to auto-resolve. */
export function useSlapWindowUrgent(slapWindow: PlayerView["slapWindow"]): boolean {
  const [urgentWindowId, setUrgentWindowId] = useState<number | null>(null);
  useEffect(() => {
    if (!slapWindow) return;
    const remaining = slapWindow.openedAtMs + SLAP_GRACE_MS - Date.now();
    const timer = setTimeout(() => setUrgentWindowId(slapWindow.id), Math.max(0, remaining));
    return () => clearTimeout(timer);
  }, [slapWindow]);
  return slapWindow !== null && slapWindow.id === urgentWindowId;
}

/** `{mine}s | {opponent}s` above player 1's yellow turn-circle. The shorter
 *  time glows yellow; a missing claim (uncontested slap) shows an en-dash. */
export function ReactionTimesReadout({
  mineMs,
  opponentMs,
  locale,
}: {
  mineMs: number | null;
  opponentMs: number | null;
  locale: "fr" | "en";
}) {
  if (mineMs === null && opponentMs === null) return null;
  const mineFast = mineMs !== null && (opponentMs === null || mineMs <= opponentMs);
  const oppFast = opponentMs !== null && (mineMs === null || opponentMs <= mineMs);
  const chip = (ms: number | null) => (ms === null ? "–" : `${formatReactionSeconds(ms, locale)}s`);
  return (
    <p
      className="pointer-events-none z-10 rounded-full bg-black/55 px-8 py-3 text-2xl font-bold text-white shadow-lg"
      data-id="bataillecorse-reaction-times"
    >
      <span className={mineFast ? "bataillecorse-reaction-fast" : undefined} data-id="bataillecorse-reaction-time-mine">
        {chip(mineMs)}
      </span>
      <span className="px-2 text-white/45">|</span>
      <span className={oppFast ? "bataillecorse-reaction-fast" : undefined} data-id="bataillecorse-reaction-time-opponent">
        {chip(opponentMs)}
      </span>
    </p>
  );
}

export function BataillecorseTable({
  gv,
  actions,
  reactions,
  selfAvatar,
  debugMode = "online",
}: {
  gv: BataillecorseGameView;
  actions: BataillecorseActions;
  reactions?: Map<number, TableReaction>;
  selfAvatar?: string;
  /** Which of this table's 3 possible callers rendered it (solo vs bot,
   *  online, or ad-hoc/P2P - never "duel", that's `BataillecorseDuelTable`'s
   *  own table) - shown in the debug overlay when debug mode is on (see
   *  `BataillecorseDebugOverlay.tsx`). */
  debugMode?: BataillecorseDebugMode;
}) {
  const { locale, t } = useI18n();
  const view = gv.view!;
  const mySeat = gv.mySeat!;
  const debugOn = useBataillecorseDebugMode();
  const opponentSeat = mySeat === 0 ? 1 : 0;
  const [panelOpen, setPanelOpen] = useState(false);
  const windowSeenAtRef = useWindowSeenAtRef(view.slapWindow);

  const pileWinFlash = useFlash(view.lastPileWin?.id);
  const falseSlapFlash = useFlash(view.lastFalseSlap?.id);
  const pileEnterDirection = usePileEnterDirection(view, mySeat);
  const { pile: displayPile, flying: pileFlying, justEnteredCardKey } = useDisplayPile(view.pile, view.lastPileWin);
  const { myTurnToFlip, pendingFlip, pendingFaceDown, optimisticStockCount, optimisticPile, flip: tapFlip } =
    useOptimisticFlip(view, mySeat, actions.onFlip, pileFlying);
  const shownPile = pileFlying ? displayPile : optimisticPile;
  const pileFlyTarget: "up" | "down" | null =
    pileFlying && view.lastPileWin ? (view.lastPileWin.seat === mySeat ? "down" : "up") : null;
  const slapWindowUrgent = useSlapWindowUrgent(view.slapWindow);
  const opponentReactionMs = useSeatReactionMs(view.lastPileWin, opponentSeat as 0 | 1);
  const eventReactionMsMine = useSeatReactionMs(view.lastPileWin, mySeat as 0 | 1);
  const winnerFireSeat = useWinnerFireSeat(view.lastPileWin);
  const owesTribute = view.tribute?.seat === mySeat;
  const [slapTapKey, setSlapTapKey] = useState(0);
  const slapImpact =
    pileFlyTarget !== null && (view.lastPileWin?.reason === "slap" || view.lastPileWin?.reason === "falseSlap");

  async function tapSlap() {
    if (view.phase !== "playing" || pileFlying) return;
    setSlapTapKey((n) => n + 1);
    const seen = view.slapWindow && windowSeenAtRef.current?.id === view.slapWindow.id ? windowSeenAtRef.current : null;
    const reactionMs = seen ? performance.now() - seen.perfMs : 0;
    // Only the window THIS client currently sees open counts as "observed" -
    // never fall back to `lastClosedSlapWindowId`: once any window has ever
    // closed in the match, that id stays fixed until the next one closes, so
    // falling back to it would make every later bogus tap (nothing open at
    // all) always match it and silently skip the false-slap penalty (see
    // `attemptSlap` in `engine.ts`). `null` here correctly means "I tapped
    // with nothing open" - always a foul.
    const observedWindowId = view.slapWindow?.id ?? null;
    await actions.onSlap(reactionMs, observedWindowId);
  }

  return (
    <TableShell dataId="bataillecorse-table">
      {debugOn && <BataillecorseDebugOverlay mode={debugMode} view={view} />}
      <header className="absolute inset-x-0 top-[var(--table-hud-top)] z-30 flex items-center justify-between px-3">
        <a
          href={HUB_URL}
          aria-label={t("backToHub")}
          data-id="bataillecorse-back"
          className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--card-face)] text-5xl font-black leading-none text-[var(--surface)] shadow-lg"
        >
          ‹
        </a>
        <p className="rounded-full bg-[var(--surface-overlay)]/70 px-3 py-1 text-xs font-medium text-[var(--card-face)]/70" data-id="bataillecorse-stock-tally">
          {optimisticStockCount} — {view.opponentStockCount}
        </p>
        <GameInfoButton label={t("gameInfo")} onClick={() => setPanelOpen(true)} />
      </header>

      {panelOpen && (
        <InfoPanel
          host={
            actions.onBecomeHost && actions.onForceSync
              ? { isHost: gv.isHost, hostName: gv.hostSeat !== null ? playerName(gv, gv.hostSeat, locale) : null, onBecomeHost: actions.onBecomeHost, onForceSync: actions.onForceSync }
              : undefined
          }
          onReset={actions.onReset}
          onClose={() => setPanelOpen(false)}
        />
      )}

      <div className="relative h-0 min-h-0 flex-1" data-id="bataillecorse-scene">
        {/* The winner's whole half of the screen glows like it just caught
            fire, on top of the matching deck glow (`StockPile`'s `fire`
            prop) - same `winnerFireSeat`/`FIRE_MS` window, so both clear the
            instant the other does. First child with no explicit z-index and
            `pointer-events-none`: every other element in this scene paints
            over it in DOM order, so it never sits on top of a card or blocks
            a tap. */}
        {winnerFireSeat !== null && (
          <div
            className={[
              "bataillecorse-half-fire pointer-events-none absolute inset-x-0 h-1/2",
              winnerFireSeat === opponentSeat ? "top-0 bataillecorse-half-fire-top" : "bottom-0 bataillecorse-half-fire-bottom",
            ].join(" ")}
            data-id="bataillecorse-half-fire"
            aria-hidden="true"
          />
        )}

        <SeatRow
          label={playerName(gv, opponentSeat, locale)}
          stockCount={view.opponentStockCount}
          isTurn={view.turn === opponentSeat && !pileFlying}
          reaction={reactions?.get(opponentSeat)}
          fire={winnerFireSeat === opponentSeat}
          tributeAttempts={!owesTribute ? view.tribute?.attemptsLeft : undefined}
          pileWinLabel={
            pileWinFlash && view.lastPileWin && view.lastPileWin.reason !== "falseSlap" && view.lastPileWin.seat === opponentSeat
              ? formatText(t("pileWonBanner"), { player: playerName(gv, opponentSeat, locale) })
              : undefined
          }
          dataId="bataillecorse-opponent-seat"
          className="absolute inset-x-0 top-[calc(var(--table-hud-top)+3.5rem)]"
        />

        <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 flex-col items-center gap-3" data-id="bataillecorse-center-block">
          <div className="flex min-h-[1.75rem] flex-col items-center gap-1.5" />

          {/* Tapping the pile itself is the slap gesture: a very light circle
              around the cards is the whole hit target, not a separate button. */}
          <button
            type="button"
            data-id="bataillecorse-slap-button"
            onClick={tapSlap}
            disabled={view.phase !== "playing" || pileFlying}
            aria-label={t("slapPileButton")}
            className={[
              "relative flex h-[var(--slap-circle-size)] w-[var(--slap-circle-size)] items-center justify-center rounded-full transition-all active:scale-95",
              slapWindowUrgent
                ? "animate-pulse bg-[var(--accent-red)]/15 ring-4 ring-[var(--accent-red)]"
                : "bg-white/5 ring-1 ring-white/20",
            ].join(" ")}
          >
            <PileStack
              cards={shownPile}
              enterFrom={pendingFlip ? "bottom" : pileEnterDirection}
              pendingFaceDown={pendingFaceDown}
              fly={pileFlyTarget ? { key: view.lastPileWin!.id, toward: pileFlyTarget } : undefined}
              slapImpact={slapImpact}
              tapHitKey={slapTapKey}
              justEnteredCardKey={justEnteredCardKey}
            />
            {falseSlapFlash && view.lastFalseSlap && <FalseSlapMark label={t("falseSlapStamp")} />}
          </button>

          <div className="flex min-h-[1.75rem] flex-col items-center gap-1.5">
            {owesTribute && view.tribute && (
              <TributePlayHint attempts={view.tribute.attemptsLeft} dataId="bataillecorse-tribute-banner" />
            )}
            {falseSlapFlash && view.lastFalseSlap && (
              <p className="sr-only" data-id="bataillecorse-false-slap-flash">
                {formatText(t("falseSlapBanner"), {
                  player: view.lastFalseSlap.seat === mySeat ? t("you") : playerName(gv, opponentSeat, locale),
                })}
              </p>
            )}
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-10 flex flex-col items-center gap-3" data-id="bataillecorse-self-seat">
          {/* `selfAvatar` is only passed by `GameRoom` (online). */}
          {selfAvatar !== undefined && (
            <p className="text-xs font-bold uppercase text-[var(--card-face)]/80" data-id="bataillecorse-self-name">
              {playerName(gv, mySeat, locale)}
            </p>
          )}
          {/* Both seats' times, always above player 1's yellow turn-circle
              (`0.75s | 0.52s`, opponent on the right). Twice the previous
              size so they stay readable on a phone. The shorter one glows
              yellow (see docs/DECISIONS.md). */}
          <ReactionTimesReadout mineMs={eventReactionMsMine} opponentMs={opponentReactionMs} locale={locale} />
          <StockPile
            count={optimisticStockCount}
            dataId="bataillecorse-my-stock"
            scale={1.5}
            onClick={tapFlip}
            disabled={!myTurnToFlip || pendingFlip}
            fire={winnerFireSeat === mySeat}
            fireGreen
            isTurn={view.turn === mySeat && !pileFlying}
            overlayLabel={
              pileWinFlash && view.lastPileWin && view.lastPileWin.reason !== "falseSlap" && view.lastPileWin.seat === mySeat
                ? t("pileWonYou")
                : undefined
            }
          />
        </div>

        {actions.onSendReaction && <EmojiButton myReaction={reactions?.get(mySeat)} onSelect={actions.onSendReaction} />}
      </div>

      {view.phase === "finished" && (
        <FinishedOverlay gv={gv} view={view} onRematch={actions.onRematch} onReset={actions.onReset} />
      )}
    </TableShell>
  );
}

/** White, no pill, painted under the winner's ring without taking layout
 *  space (`StockPile`'s `overlayLabel`) so the seat does not jump. Same
 *  `data-id` at either seat: only one of the two can ever be visible. */
export function PileWinBanner({ label }: { label: string }) {
  return (
    <p className="whitespace-nowrap text-center text-sm font-bold leading-none text-white" data-id="bataillecorse-pile-win-flash">
      {label}
    </p>
  );
}

function SeatRow({
  label,
  stockCount,
  isTurn,
  reaction,
  fire,
  tributeAttempts,
  pileWinLabel,
  dataId,
  className,
}: {
  label: string;
  stockCount: number;
  isTurn: boolean;
  reaction?: TableReaction;
  fire?: boolean;
  tributeAttempts?: number;
  pileWinLabel?: string;
  dataId: string;
  className: string;
}) {
  return (
    <div className={`flex flex-col items-center gap-1.5 ${className}`} data-id={dataId}>
      <p className={`text-xs font-bold uppercase ${isTurn ? "underline decoration-2" : ""}`}>{label}</p>
      <StockPile count={stockCount} fire={fire} isTurn={isTurn} overlayLabel={pileWinLabel} />
      {tributeAttempts !== undefined && (
        <TributePlayHint attempts={tributeAttempts} dataId={`${dataId}-tribute`} />
      )}
      {reaction && <ReactionBubble reaction={reaction} size="md" dataId="bataillecorse-opponent-reaction" />}
    </div>
  );
}

/** White, no pill: how many cards the current tribute-payer still has to flip. */
export function TributePlayHint({ attempts, dataId }: { attempts: number; dataId: string }) {
  const { t } = useI18n();
  return (
    <p className="whitespace-nowrap text-center text-sm font-bold text-white" data-id={dataId}>
      {formatText(t(attempts === 1 ? "tributePlay" : "tributePlayPlural"), { attempts })}
    </p>
  );
}

/** Layer step as a fraction of `--card-sm-w` (2px when that width was 40px). */
const STOCK_LAYER_STEP_RATIO = 2 / 40;

/** A face-down draw pile: layered card-backs (not just one) so it reads as an
 *  actual stack rather than a single flat card, collapsing to a single card
 *  once only one is left. The remaining count is written directly on the
 *  front card's back (just the number, no unit) instead of a separate label.
 *  `scale` grows the whole stack from its bottom-left anchor without
 *  disturbing layout around it (the reserved box grows to match). When
 *  `onClick` is given (own stock only - see `tapFlip`), tapping the pile
 *  itself is how you play: there is no separate "Jouer" button. `fire`
 *  makes the whole stack glow like it just caught fire (see `FIRE_MS`/
 *  `useWinnerFireSeat`, `.bataillecorse-deck-fire` in `app/globals.css`) -
 *  the deck that just won the pile. */
export function StockPile({
  count,
  dataId,
  scale = 1,
  onClick,
  disabled,
  fire,
  isTurn,
  overlayLabel,
  fireGreen,
}: {
  count: number;
  dataId?: string;
  scale?: number;
  onClick?: () => void;
  disabled?: boolean;
  fire?: boolean;
  /** Whose turn it currently is to flip - draws a yellow ring around the
   *  whole stack so it doubles as the "current player" indicator (same
   *  accent color as every other turn/selection highlight, e.g.
   *  `PlayerBadge`'s underline elsewhere, `ring-[var(--accent-yellow)]` on
   *  selected cards). */
  isTurn?: boolean;
  /** Painted under the ring, out of flow - a pile-win caption must not
   *  grow this box or the seat jumps. */
  overlayLabel?: string;
  /** Player 1's pile-win glow is green; the opponent's stays yellow. */
  fireGreen?: boolean;
}) {
  const { probeRef, px: cardW, probeStyle } = useCssVarPx("--card-sm-w", 40);
  const layers = count === 0 ? 0 : count === 1 ? 1 : 3;
  const cardH = cardW * 1.5;
  const step = cardW * STOCK_LAYER_STEP_RATIO * scale;
  const width = cardW * scale + step * Math.max(0, layers - 1);
  const height = cardH * scale + step * Math.max(0, layers - 1);
  const Tag = onClick ? "button" : "div";
  const ringDiameter = Math.max(width, height) * 1.25;
  /** `ring-4` is a box-shadow, so the yellow circle paints outside
   *  `ringDiameter`. Always reserve that space (even when `isTurn` is
   *  false) so a readout sitting above this pile is above the circle, not
   *  overlapping it, and the seat does not jump when the ring appears. */
  const RING_PX = 4;
  const padX = Math.max(0, (ringDiameter - width) / 2) + RING_PX;
  const padY = Math.max(0, (ringDiameter - height) / 2) + RING_PX;
  return (
    <div className="relative" style={{ width: width + padX * 2, height: height + padY * 2 }}>
      {isTurn && (
        <span
          className="pointer-events-none absolute rounded-full ring-4 ring-[var(--accent-yellow)]"
          style={{
            width: ringDiameter,
            height: ringDiameter,
            left: RING_PX,
            top: RING_PX,
          }}
          data-id={dataId ? `${dataId}-turn-ring` : "bataillecorse-turn-ring"}
          aria-hidden="true"
        />
      )}
      {overlayLabel && (
        <div
          className="pointer-events-none absolute left-1/2 z-10 -translate-x-1/2"
          style={{ top: padY + height }}
        >
          <PileWinBanner label={overlayLabel} />
        </div>
      )}
      <Tag
        type={onClick ? "button" : undefined}
        onClick={onClick}
        disabled={onClick ? disabled : undefined}
        className={[onClick ? "absolute transition-transform active:scale-95 disabled:pointer-events-none disabled:opacity-50" : "absolute", fire ? (fireGreen ? "bataillecorse-deck-fire-green" : "bataillecorse-deck-fire") : ""].join(" ")}
        style={{ width, height, left: padX, top: padY }}
        data-id={dataId}
      >
        <CssVarProbe probeRef={probeRef} probeStyle={probeStyle} />
      {Array.from({ length: layers }, (_, i) => {
        const isFront = i === layers - 1;
        return (
          <div key={i} className="absolute origin-bottom-left" style={{ left: i * step, bottom: i * step, transform: `scale(${scale})` }}>
            <CardBack size="sm" />
            {isFront && (
              <span
                className="absolute inset-0 flex items-center justify-center text-lg font-black text-white/60 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]"
                data-id={dataId ? `${dataId}-count` : undefined}
              >
                {count}
              </span>
            )}
          </div>
        );
      })}
      </Tag>
    </div>
  );
}

/** Fixed left/right/tilt offsets for the 2 cards sitting behind the current
 *  top card, so the pile reads as a scattered discard heap rather than a
 *  neat stack - same idea as Président's `HISTORY_OFFSETS` (`PresidentTable.tsx`). */
const HISTORY_OFFSETS = [
  { x: 16, y: 8, rot: 9 },
  { x: -15, y: 14, rot: -8 },
];

function cardKey(card: PlayerView["pile"][number]): string {
  return `${card.rank}${card.suit}`;
}

/** How far the pile sweeps toward the winner's stock before shrinking away -
 *  see `.bataillecorse-pile-fly` (`app/globals.css`). In `svh` (viewport
 *  height), not a fixed px value: `TableShell` is full-viewport and the
 *  opponent's stock (near the top) and the player's own (near the bottom)
 *  both sit roughly this far from the center pile regardless of device
 *  height. Deliberately generous (nearly half the screen) so the sweep
 *  actually lands on the deck instead of stopping short partway there -
 *  overshooting slightly is fine since the stack has already faded out
 *  (`opacity: 0`) by the time it gets there. */
const PILE_FLY_DISTANCE_SVH = 46;

/** The center pile: the current top card slides in from whichever seat just
 *  played it (`.bataillecorse-card-enter`, `app/globals.css` - same slide-in
 *  as every other game's `played-card-enter`, `TrickStage.tsx`, minus the
 *  landing bounce: a plain flip that neither opens/answers a tribute nor
 *  wins the pile is just "the card is now on the table"), while the 1-2
 *  cards behind it sit scattered and dimmed.
 *  A local flip paints the owner's `myTopCard` on top immediately (same frame
 *  as the tap); that card's identity is the React key, so the slide-in does
 *  not replay when the server echoes it. `useDisplayPile` also lingers the pile face-up
 *  for a moment after a win instead of vanishing instantly.
 *
 *  `fly`: set for that same lingering window when the win is the *current*
 *  one being shown - animates the whole gathered stack sweeping toward
 *  whichever seat just won it (up = opponent's stock, down = the player's
 *  own) and shrinking away, instead of just vanishing. A slap (or false
 *  slap) uses `.bataillecorse-pile-fly-slap` instead: the hold is a hit on
 *  the cards, then the same sweep. Keyed by the win event's id so a second,
 *  later win restarts the sweep rather than being a no-op remount. That
 *  remount must NOT replay `.bataillecorse-card-enter` on the
 *  top card, or the last flip looks like it is played a second time the
 *  instant someone slaps (see `PileCurrentCard`). */
function pileCardHitClass(tapHitKey: number, slapImpact: boolean, flying: boolean): string | undefined {
  if (flying && slapImpact) return "bataillecorse-pile-card-slam";
  if (flying || tapHitKey === 0) return undefined;
  return tapHitKey % 2 === 1 ? "bataillecorse-pile-card-hit" : "bataillecorse-pile-card-hit-alt";
}

export function PileStack({
  cards,
  enterFrom,
  fly,
  slapImpact,
  tapHitKey,
  pendingFaceDown,
  justEnteredCardKey,
}: {
  cards: PlayerView["pile"];
  enterFrom: EnterDirection;
  fly?: { key: number; toward: "up" | "down" };
  slapImpact?: boolean;
  tapHitKey?: number;
  pendingFaceDown?: boolean;
  /** Top card's key when it never got a non-flying frame to slide in during
   *  (see `useDisplayPile`) - still animates its entrance even though `fly`
   *  is set, instead of just popping in already mid-sweep. */
  justEnteredCardKey?: string | null;
}) {
  const { probeRef, px: cardW, probeStyle } = useCssVarPx("--card-md-w", 56);
  const liveTapHitKey = useLiveTapHitKey(tapHitKey ?? 0);
  const behind = pendingFaceDown ? cards.slice(-2) : cards.slice(-3, -1);
  const topCard = pendingFaceDown ? undefined : cards[cards.length - 1];
  if (!pendingFaceDown && !topCard) {
    return <p className="text-sm italic text-[var(--card-face)]/70">{"—"}</p>;
  }
  const hitClass = pileCardHitClass(liveTapHitKey, Boolean(slapImpact), Boolean(fly));
  const showShock = Boolean((fly && slapImpact) || (!fly && liveTapHitKey > 0));
  return (
    <div
      key={fly ? `fly-${fly.key}` : "pile"}
      className={`relative aspect-[2/3] w-[var(--card-md-w)] ${fly ? (slapImpact ? "bataillecorse-pile-fly-slap" : "bataillecorse-pile-fly") : ""}`}
      data-id="bataillecorse-pile"
      style={
        {
          transform: "scale(1.5)",
          ...(fly ? { "--pile-fly-y": `${fly.toward === "down" ? PILE_FLY_DISTANCE_SVH : -PILE_FLY_DISTANCE_SVH}svh` } : {}),
        } as React.CSSProperties
      }
    >
      <CssVarProbe probeRef={probeRef} probeStyle={probeStyle} />
      {showShock && (
        <>
          <span
            key={fly ? `flash-fly-${fly.key}` : `flash-tap-${liveTapHitKey}`}
            className="bataillecorse-pile-slap-flash"
            data-id="bataillecorse-pile-slap-flash"
            aria-hidden="true"
          />
          <span
            key={fly ? `shock-fly-${fly.key}` : `shock-tap-${liveTapHitKey}`}
            className="bataillecorse-pile-slap-shock"
            data-id="bataillecorse-pile-slap-shock"
            aria-hidden="true"
          />
        </>
      )}
      {behind.map((card, i) => {
        const depthFromTop = behind.length - i;
        const base = HISTORY_OFFSETS[(depthFromTop - 1 + HISTORY_OFFSETS.length) % HISTORY_OFFSETS.length];
        const offset = { x: (base.x / 56) * cardW, y: (base.y / 56) * cardW, rot: base.rot };
        return (
          <div
            key={cardKey(card)}
            className="absolute left-0 top-0"
            style={{ transform: `translate(${offset.x}px, ${offset.y}px) rotate(${offset.rot}deg)`, zIndex: i }}
            data-id={`bataillecorse-pile-history-${depthFromTop}`}
          >
            <div className={hitClass}>
              <PlayingCard
                card={card}
                size="md"
                dimmed
                showRightIndex
                dataId={`bataillecorse-pile-history-card-${depthFromTop}`}
              />
            </div>
          </div>
        );
      })}
      <div
        key={topCard ? cardKey(topCard) : "pending"}
        className="absolute left-0 top-0"
        style={{ zIndex: behind.length }}
        data-id="bataillecorse-pile-current"
      >
        <div className={hitClass}>
          <PileCurrentCard
            card={topCard}
            enterFrom={enterFrom}
            animateEnter={!fly || (Boolean(topCard) && cardKey(topCard!) === justEnteredCardKey)}
            faceDown={pendingFaceDown}
          />
        </div>
      </div>
    </div>
  );
}

/** Top-of-pile card. The slide-in from the flipping seat plays for a genuine
 *  new flip, or for the one card a tribute failure both plays and sweeps
 *  away in the same update (`justEnteredCardKey` in `PileStack`) - never for
 *  a slap/false-slap win remounting `PileStack` to restart the fly-away on a
 *  card that was already sitting there, or replaying the enter animation
 *  would make the last flip look like it was played twice. */
function PileCurrentCard({
  card,
  enterFrom,
  animateEnter,
  faceDown,
}: {
  card?: PlayerView["pile"][number];
  enterFrom: EnterDirection;
  animateEnter: boolean;
  faceDown?: boolean;
}) {
  const inner =
    faceDown || !card ? (
      <CardBack size="md" dataId="bataillecorse-pile-pending-back" />
    ) : (
      <PlayingCard card={card} size="md" dataId="bataillecorse-pile-current-card" />
    );
  if (!animateEnter) return inner;
  return (
    <div className="bataillecorse-card-enter will-change-transform" style={playedCardEnterStyle(enterFrom)}>
      {inner}
    </div>
  );
}

/** Full-size stamp over the slap circle: a stylized red cross plus WRONG,
 *  shown for `FLASH_MS` after a false slap. Pointer-events none so it never
 *  eats the next tap. */
export function FalseSlapMark({ label }: { label: string }) {
  return (
    <div
      className="bataillecorse-false-slap-mark pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
      data-id="bataillecorse-false-slap-mark"
      aria-hidden="true"
    >
      <svg viewBox="0 0 100 100" className="h-full w-full text-[var(--accent-red)] drop-shadow-[0_3px_0_rgba(0,0,0,0.65)]" aria-hidden="true">
        <line x1="18" y1="18" x2="82" y2="82" stroke="currentColor" strokeWidth="12" strokeLinecap="round" />
        <line x1="82" y1="18" x2="18" y2="82" stroke="currentColor" strokeWidth="12" strokeLinecap="round" />
      </svg>
      <span className="absolute text-[clamp(1.25rem,5svmin,2rem)] font-black tracking-[0.2em] text-[var(--accent-red)] drop-shadow-[0_2px_0_rgba(0,0,0,0.55)]">
        {label}
      </span>
    </div>
  );
}

export function InfoPanel({ host, onReset, onClose }: { host?: HostControls; onReset?: () => void; onClose: () => void }) {
  const { t, locale, setLocale } = useI18n();
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 px-6" data-id="bataillecorse-info-overlay" onClick={onClose}>
      <div className="w-full max-w-xs rounded-2xl bg-[var(--surface)] p-5 shadow-2xl" data-id="bataillecorse-info-panel" onClick={(e) => e.stopPropagation()}>
        <p className="mb-4 text-center text-lg font-black text-[var(--card-face)]">{t("gameInfo")}</p>
        {host && <HostRow host={host} onClose={onClose} />}
        {onReset && (
          <button
            data-id="bataillecorse-reset-button"
            onClick={() => { onReset(); onClose(); }}
            className="mt-2 w-full rounded-lg bg-[var(--accent-red)]/80 py-2 font-bold text-[var(--card-face)]"
          >
            {t("restartGame")}
          </button>
        )}
        <div className="mb-3 mt-3 flex items-center justify-between" data-id="bataillecorse-language-row">
          <span className="text-sm text-[var(--card-face)]/80">{t("language")}</span>
          <div className="flex gap-1">
            {(["fr", "en"] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setLocale(lang)}
                className={`rounded px-2 py-1 text-xs font-bold ${locale === lang ? "bg-[var(--accent-cyan)] text-[var(--surface)]" : "bg-[var(--card-face)]/10 text-[var(--card-face)]/70"}`}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <button onClick={onClose} className="mt-4 w-full rounded-lg bg-[var(--card-face)]/14 py-2 font-bold text-[var(--card-face)]" data-id="bataillecorse-info-close-button">
          {t("close")}
        </button>
      </div>
    </div>
  );
}

function FinishedOverlay({
  gv,
  view,
  onRematch,
  onReset,
}: {
  gv: BataillecorseGameView;
  view: PlayerView;
  onRematch?: () => Promise<void> | void;
  onReset?: () => void;
}) {
  const { t, locale } = useI18n();
  const iWon = view.winner === gv.mySeat;
  useRecordMatchResult(gv.gameId, true, iWon);
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 px-6" data-id="bataillecorse-finished-overlay">
      <div className="w-full max-w-xs rounded-2xl bg-[var(--surface)] p-6 text-center shadow-2xl">
        <p className="mb-1 text-sm font-bold uppercase text-[var(--card-face)]/60">{t("gameFinished")}</p>
        <p className="mb-4 text-2xl font-black text-[var(--card-face)]" data-id="bataillecorse-winner-name">
          {iWon ? t("youWin") : formatText(t("bataillecorseWinnerBanner"), { player: playerName(gv, view.winner ?? 0, locale) })}
        </p>
        {onRematch && (
          <button
            data-id="bataillecorse-rematch-button"
            onClick={() => void onRematch()}
            className="mb-2 w-full rounded-lg bg-[var(--accent-cyan)] py-2 font-bold text-[var(--surface)]"
          >
            {t("newGame")}
          </button>
        )}
        {onReset && (
          <button
            data-id="bataillecorse-play-again-button"
            onClick={onReset}
            className="w-full rounded-lg bg-[var(--accent-yellow)] py-2 font-bold text-[var(--surface)]"
          >
            {t("newGame")}
          </button>
        )}
      </div>
    </div>
  );
}
