"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LearnTour } from "@/components/learn/LearnTour";
import { useI18n } from "@/lib/client/i18n";

/** "Apprendre à jouer": a 5-10 minute beginner tour of Coinche (rules, quizzes,
 *  scripted tricks and three guided deals), fully offline and never a match. */
export default function CoincheLearnPage() {
  const router = useRouter();
  const { t } = useI18n();
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-5 pb-8 pt-6" data-id="coinche-learn-screen">
      <Link
        href="/coinche"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--foreground)]/10 text-[var(--foreground)]/70 transition-colors hover:bg-[var(--foreground)]/20"
        data-id="learn-back-home"
        aria-label={t("learnBack")}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
      </Link>
      <h1 className="text-3xl font-black tracking-tight text-[var(--surface)]" data-id="learn-title">
        {t("learnToPlay")}
      </h1>
      <LearnTour onPlay={() => router.push("/local")} />
    </main>
  );
}
