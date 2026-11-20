"use client";

import { useMemo, useState } from "react";
import { useI18n } from "@/lib/client/i18n";
import { applyPlay, cardId, computeDealResult, legalCards, sameCard, type Card } from "@/lib/coinche";
import { cardName, RULE_TEXT } from "@/lib/learn/coach";
import { dealStepState, explainTurn, parseCards, trickStepState } from "@/lib/learn/engine";
import { tr, type Step } from "@/lib/learn/types";
import { useTutorialDeal } from "@/lib/learn/useTutorialDeal";
import { CoachBubble } from "./LearnCards";
import { NextButton } from "./StepViews";
import { TutorialTable } from "./TutorialTable";

type TrickStep = Extract<Step, { kind: "trick" }>;
type DealStep = Extract<Step, { kind: "deal" }>;

/** One scripted trick: the 3 others already played, you pick the right card. */
export function TrickPlayStep({ step, onDone }: { step: TrickStep; onDone: () => void }) {
  const { locale } = useI18n();
  const start = useMemo(() => trickStepState(step), [step]);
  const legal = useMemo(() => new Set(legalCards(start, 0).map(cardId)), [start]);
  const best = useMemo(() => new Set(parseCards(step.best).map(cardId)), [step]);
  const [played, setPlayed] = useState<Card | null>(null);
  const [feedback, setFeedback] = useState<{ tone: "hint" | "bad"; text: string } | null>(null);
  const [shake, setShake] = useState<string | null>(null);

  const done = played && best.has(cardId(played));
  const after = done ? applyPlay(start, 0, played) : null;

  const tap = (card: Card) => {
    if (done) return;
    const id = cardId(card);
    if (!legal.has(id)) {
      setShake(id);
      setFeedback({ tone: "bad", text: `${locale === "fr" ? "Interdit !" : "Not allowed!"} ${tr(RULE_TEXT[explainTurn(start, 0)], locale)}` });
      return;
    }
    if (!best.has(id)) {
      setShake(id);
      setFeedback({ tone: "hint", text: locale === "fr" ? `Autorisé, mais il y a mieux que ${cardName(card, locale)}. Réessayez !` : `Allowed, but there is better than ${cardName(card, locale)}. Try again!` });
      return;
    }
    setPlayed(card);
  };

  return (
    <div className="flex flex-col gap-3" data-id={`learn-step-${step.id}`}>
      <p className="text-base font-bold text-[var(--foreground)]">{tr(step.prompt, locale)}</p>
      <TutorialTable
        trump={step.trump}
        current={after ? [] : [...start.currentTrick.cards, ...(played ? [{ seat: 0 as const, card: played }] : [])]}
        held={after ? after.tricks[0] : null}
        turn={done ? null : 0}
        hand={start.hands[0].filter((c) => !played || !sameCard(c, played))}
        legal={done ? new Set() : legal}
        shakeId={shake}
        onTap={tap}
      />
      {done ? (
        <>
          <CoachBubble tone="good" dataId="learn-trick-feedback">{tr(step.explain, locale)}</CoachBubble>
          <NextButton onClick={onDone} />
        </>
      ) : (
        <CoachBubble tone={feedback?.tone ?? "hint"} dataId="learn-trick-feedback">
          {feedback?.text ?? tr(RULE_TEXT[explainTurn(start, 0)], locale)}
        </CoachBubble>
      )}
    </div>
  );
}

/** A full scripted deal against the bots, with the coach explaining each turn. */
export function DealPlayStep({ step, onDone }: { step: DealStep; onDone: () => void }) {
  const { locale } = useI18n();
  const initial = useMemo(() => dealStepState(step), [step]);
  const { state, held, myTurn, play } = useTutorialDeal(initial);
  const legal = useMemo(() => new Set(myTurn ? legalCards(state, 0).map(cardId) : []), [state, myTurn]);
  const [shake, setShake] = useState<string | null>(null);

  const tap = (card: Card) => {
    if (!myTurn) return;
    if (!legal.has(cardId(card))) return setShake(cardId(card));
    setShake(null);
    play(card);
  };

  const finished = state.phase !== "playing" && !held;
  return (
    <div className="flex flex-col gap-3" data-id={`learn-step-${step.id}`}>
      {state.tricks.length === 0 && state.currentTrick.cards.length === 0 && (
        <CoachBubble dataId="learn-deal-intro">{tr(step.intro, locale)}</CoachBubble>
      )}
      <p className="text-center text-xs font-bold text-[var(--foreground)]/70" data-id="learn-deal-progress">
        {locale === "fr" ? "Pli" : "Trick"} {Math.min(state.tricks.length + 1, 8)} / 8
      </p>
      <TutorialTable
        trump={step.trump}
        current={held ? [] : state.currentTrick.cards}
        held={held}
        turn={state.phase === "playing" && !held ? state.turn : null}
        hand={state.hands[0]}
        legal={legal}
        shakeId={shake}
        onTap={tap}
      />
      {finished ? <DealSummary step={step} result={computeDealResult(state)} onDone={onDone} /> : (
        <CoachBubble tone={shake ? "bad" : "hint"} dataId="learn-deal-coach">
          {myTurn
            ? `${shake ? (locale === "fr" ? "Interdit ! " : "Not allowed! ") : ""}${tr(RULE_TEXT[explainTurn(state, 0)], locale)}`
            : locale === "fr" ? "Les autres jouent…" : "The others are playing…"}
        </CoachBubble>
      )}
    </div>
  );
}

function DealSummary({ step, result, onDone }: { step: DealStep; result: ReturnType<typeof computeDealResult>; onDone: () => void }) {
  const { locale } = useI18n();
  const att = result.contract.team;
  const youAttack = att === "A";
  const won = youAttack === result.contractMade;
  const belote = result.belote === att ? 20 : 0;
  const fr = `Votre équipe : ${result.cardPoints.A} points de plis, l'adversaire : ${result.cardPoints.B}.\n` +
    `Contrat ${step.value}${belote ? ` (+20 de Belote)` : ""} ${result.contractMade ? "réussi" : "chuté"}.\n` +
    `Score : vous ${result.gained.A}, eux ${result.gained.B}.`;
  const en = `Your team: ${result.cardPoints.A} trick points, opponents: ${result.cardPoints.B}.\n` +
    `Contract ${step.value}${belote ? " (+20 Belote)" : ""} ${result.contractMade ? "made" : "failed"}.\n` +
    `Score: you ${result.gained.A}, them ${result.gained.B}.`;
  return (
    <div className="flex flex-col gap-2" data-id="learn-deal-summary">
      <CoachBubble tone={won ? "good" : "bad"} dataId="learn-deal-result">
        {`${won ? (locale === "fr" ? "Bravo ! " : "Well done! ") : (locale === "fr" ? "Raté, ce n'est pas grave ! " : "Missed, no worries! ")}${locale === "fr" ? fr : en}`}
      </CoachBubble>
      <NextButton onClick={onDone} />
    </div>
  );
}
