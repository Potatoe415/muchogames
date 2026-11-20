"use client";

import { useState } from "react";
import { useI18n } from "@/lib/client/i18n";
import { parseCards } from "@/lib/learn/engine";
import { SEAT_LABEL } from "@/lib/learn/coach";
import { tr, type Step } from "@/lib/learn/types";
import { PlayingCard } from "../PlayingCard";
import { CardRow, CoachBubble } from "./LearnCards";

type Info = Extract<Step, { kind: "info" }>;
type Quiz = Extract<Step, { kind: "quiz" }>;

/** Explanation screen: text, optional dealt-in cards with tooltips, optional picture. */
export function InfoStep({ step, onDone }: { step: Info; onDone: () => void }) {
  const { locale } = useI18n();
  return (
    <div className="flex flex-col gap-4" data-id={`learn-step-${step.id}`}>
      <p className="whitespace-pre-line text-base text-[var(--foreground)]">{tr(step.body, locale)}</p>
      {step.illustration === "table" && <SeatsPicture />}
      {step.cards && <CardRow cards={parseCards(step.cards)} trump={step.trump} dataId="learn-info-cards" />}
      {step.illustration === "belote" && (
        <p className="belote-flash self-center rounded-full bg-black/50 px-6 py-2 text-2xl font-extrabold tracking-widest text-[var(--accent-yellow)]">
          BELOTE !
        </p>
      )}
      {step.tip && <CoachBubble dataId="learn-info-tip">{tr(step.tip, locale)}</CoachBubble>}
      <NextButton onClick={onDone} />
    </div>
  );
}

/** 4 seats around a felt: you and your partner in yellow, the opponents in cyan. */
function SeatsPicture() {
  const { locale } = useI18n();
  const seat = (i: number, className: string) => (
    <span
      className={`learn-deal-in absolute rounded-full px-3 py-1 text-xs font-black text-[var(--surface)] ${i % 2 === 0 ? "bg-[var(--team-a)]" : "bg-[var(--team-b)]"} ${className}`}
      style={{ animationDelay: `${i * 150}ms` }}
    >
      {tr(SEAT_LABEL[i], locale)}
    </span>
  );
  return (
    <div className="relative mx-auto h-44 w-full max-w-xs rounded-[2rem] bg-felt shadow-inner" data-id="learn-seats-picture">
      {seat(0, "bottom-2 left-1/2 -translate-x-1/2")}
      {seat(1, "right-2 top-1/2 -translate-y-1/2")}
      {seat(2, "left-1/2 top-2 -translate-x-1/2")}
      {seat(3, "left-2 top-1/2 -translate-y-1/2")}
    </div>
  );
}

/** Multiple choice; a wrong pick shakes and explains, the right one unlocks "Next". */
export function QuizStep({ step, onDone }: { step: Quiz; onDone: () => void }) {
  const { locale } = useI18n();
  const [picked, setPicked] = useState<number | null>(null);
  const solved = picked === step.answer;
  return (
    <div className="flex flex-col gap-4" data-id={`learn-step-${step.id}`}>
      <p className="text-base font-bold text-[var(--foreground)]">{tr(step.question, locale)}</p>
      {step.hand && <CardRow cards={parseCards(step.hand)} dataId="learn-quiz-hand" />}
      {step.auction && (
        <ul className="rounded-xl bg-black/10 p-2 text-sm text-[var(--foreground)]" data-id="learn-quiz-auction">
          {step.auction.map((line) => (
            <li key={line.fr}>{tr(line, locale)}</li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap justify-center gap-2" data-id="learn-quiz-options">
        {step.options.map((option, i) => (
          <QuizOption key={i} index={i} option={option} picked={picked} answer={step.answer} disabled={solved} onPick={setPicked} />
        ))}
      </div>
      {picked !== null && (
        <CoachBubble tone={solved ? "good" : "bad"} dataId="learn-quiz-feedback">
          {solved ? tr(step.explain, locale) : locale === "fr" ? "Pas tout à fait… essayez encore !" : "Not quite… try again!"}
        </CoachBubble>
      )}
      {solved && <NextButton onClick={onDone} />}
    </div>
  );
}

function QuizOption({
  index,
  option,
  picked,
  answer,
  disabled,
  onPick,
}: {
  index: number;
  option: Quiz["options"][number];
  picked: number | null;
  answer: number;
  disabled: boolean;
  onPick: (i: number) => void;
}) {
  const { locale } = useI18n();
  const state = picked !== index ? "" : index === answer ? "ring-4 ring-[var(--accent-green)]" : "learn-shake ring-4 ring-[var(--accent-red)]";
  return (
    <button
      key={picked === index ? "picked" : "idle"}
      type="button"
      disabled={disabled}
      onClick={() => onPick(index)}
      data-id={`learn-quiz-option-${index}`}
      className={`rounded-2xl ${option.card ? "p-1" : "min-w-[5.5rem] bg-[var(--surface)] px-4 py-3 font-black text-[var(--card-face)] shadow"} ${state}`}
    >
      {option.card ? <PlayingCard card={parseCards(option.card)[0]} size="lg" /> : tr(option.text!, locale)}
    </button>
  );
}

export function NextButton({ onClick, label }: { onClick: () => void; label?: string }) {
  const { locale } = useI18n();
  return (
    <button
      type="button"
      onClick={onClick}
      data-id="learn-next-button"
      className="learn-pop mt-2 w-full rounded-2xl bg-[var(--accent-yellow)] px-4 py-4 text-lg font-black text-[var(--surface)] shadow-lg"
    >
      {label ?? (locale === "fr" ? "Continuer →" : "Continue →")}
    </button>
  );
}
