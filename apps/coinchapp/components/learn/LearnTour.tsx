"use client";

import { useState } from "react";
import { useI18n } from "@/lib/client/i18n";
import { CHAPTERS } from "@/lib/learn/chapters-practice";
import { tr, type Chapter, type Step } from "@/lib/learn/types";
import { DealPlayStep, TrickPlayStep } from "./PlaySteps";
import { InfoStep, QuizStep } from "./StepViews";

/** Chapter list, then one step at a time with a progress bar. */
export function LearnTour({ onPlay }: { onPlay: () => void }) {
  const { locale } = useI18n();
  const [chapterIndex, setChapterIndex] = useState<number | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [done, setDone] = useState<Set<string>>(new Set());

  if (chapterIndex === null) {
    return <ChapterList done={done} onOpen={(i) => (setChapterIndex(i), setStepIndex(0))} onPlay={onPlay} />;
  }
  const chapter = CHAPTERS[chapterIndex];
  const next = () => {
    if (stepIndex + 1 < chapter.steps.length) return setStepIndex(stepIndex + 1);
    setDone(new Set(done).add(chapter.id));
    if (chapterIndex + 1 < CHAPTERS.length) return (setChapterIndex(chapterIndex + 1), setStepIndex(0));
    setChapterIndex(null);
  };
  const step = chapter.steps[stepIndex];
  return (
    <section className="flex flex-col gap-3" data-id="learn-chapter">
      <button type="button" onClick={() => setChapterIndex(null)} data-id="learn-chapters-button" className="self-start text-sm font-bold text-[var(--surface)]">
        ← {locale === "fr" ? "Sommaire" : "Contents"}
      </button>
      <div className="h-2 overflow-hidden rounded-full bg-black/10" data-id="learn-progress">
        <div className="h-full rounded-full bg-[var(--accent-green)] transition-all duration-500" style={{ width: `${((stepIndex + 1) / chapter.steps.length) * 100}%` }} />
      </div>
      <p className="text-xs font-bold uppercase tracking-wide text-[var(--foreground)]/60">
        {tr(chapter.title, locale)} · {stepIndex + 1}/{chapter.steps.length}
      </p>
      <h2 className="text-2xl font-black text-[var(--surface)]" data-id="learn-step-title">{tr(step.title, locale)}</h2>
      <StepView key={step.id} step={step} onDone={next} />
    </section>
  );
}

function StepView({ step, onDone }: { step: Step; onDone: () => void }) {
  if (step.kind === "info") return <InfoStep step={step} onDone={onDone} />;
  if (step.kind === "quiz") return <QuizStep step={step} onDone={onDone} />;
  if (step.kind === "trick") return <TrickPlayStep step={step} onDone={onDone} />;
  return <DealPlayStep step={step} onDone={onDone} />;
}

function ChapterList({ done, onOpen, onPlay }: { done: Set<string>; onOpen: (i: number) => void; onPlay: () => void }) {
  const { locale } = useI18n();
  const total = CHAPTERS.reduce((sum, c) => sum + c.minutes, 0);
  const allDone = done.size === CHAPTERS.length;
  return (
    <section className="flex flex-col gap-3" data-id="learn-chapter-list">
      <p className="text-sm text-[var(--foreground)]/75">
        {locale === "fr" ? `6 étapes, environ ${total} minutes. Commencez par la première !` : `6 parts, about ${total} minutes. Start with the first one!`}
      </p>
      {CHAPTERS.map((chapter, i) => (
        <ChapterCard key={chapter.id} chapter={chapter} index={i} done={done.has(chapter.id)} onOpen={() => onOpen(i)} />
      ))}
      {allDone && (
        <button type="button" onClick={onPlay} data-id="learn-play-now-button" className="learn-pop mt-2 w-full rounded-2xl bg-[var(--accent-yellow)] px-4 py-5 text-lg font-black text-[var(--surface)] shadow-lg">
          {locale === "fr" ? "🎉 Prêt ! Jouer une vraie partie" : "🎉 Ready! Play a real match"}
        </button>
      )}
    </section>
  );
}

function ChapterCard({ chapter, index, done, onOpen }: { chapter: Chapter; index: number; done: boolean; onOpen: () => void }) {
  const { locale } = useI18n();
  return (
    <button
      type="button"
      onClick={onOpen}
      data-id={`learn-chapter-${chapter.id}`}
      className="learn-deal-in flex items-center gap-3 rounded-2xl bg-[var(--surface)] p-4 text-left text-[var(--card-face)] shadow-lg"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg font-black ${done ? "bg-[var(--accent-green)]" : "bg-[var(--accent-yellow)]"} text-[var(--surface)]`}>
        {done ? "✓" : index + 1}
      </span>
      <span className="flex-1">
        <span className="block font-black">{tr(chapter.title, locale)}</span>
        <span className="block text-xs text-[var(--card-face)]/75">{tr(chapter.summary, locale)}</span>
      </span>
      <span className="text-xs text-[var(--card-face)]/60">{chapter.minutes} min</span>
    </button>
  );
}
