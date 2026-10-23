"use client";

import { useRouter } from "next/navigation";
import { HomeTopBar } from "@/components/HomeTopBar";
import { SOLITAIRE_LABELS } from "@/components/solitaireLabels";
import { useI18n } from "@/lib/client/i18n";

/** Solitaire is solo and offline only: the splash offers the two draw modes
 *  and goes straight to the shared `/local/play` route. */
export default function SolitairePage() {
  const router = useRouter();
  const { locale } = useI18n();
  const labels = SOLITAIRE_LABELS[locale];

  return (
    <main
      className="relative mx-auto flex w-full max-w-md flex-1 flex-col items-center overflow-hidden"
      data-id="solitaire-home-screen"
      style={{
        backgroundImage: "url('/solitaire-full.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center top",
      }}
    >
      <HomeTopBar game="solitaire" />

      <div className="relative z-10 flex w-full flex-col items-center gap-3 px-6 pt-[32vh]" data-id="solitaire-splash-actions">
        <button
          data-id="solitaire-play-draw1-button"
          onClick={() => router.push("/local/play?game=solitaire&draw=1")}
          className="w-full rounded-2xl bg-[var(--accent-yellow)] px-4 py-5 text-lg font-black text-[var(--surface)] shadow-lg"
        >
          {labels.draw1}
          <span className="mt-0.5 block text-xs font-medium text-[var(--surface)]/80">{labels.draw1Note}</span>
        </button>

        <button
          data-id="solitaire-play-draw3-button"
          onClick={() => router.push("/local/play?game=solitaire&draw=3")}
          className="w-full rounded-2xl bg-[var(--accent-orange)] px-4 py-5 text-lg font-black text-[var(--surface)] shadow-lg"
        >
          {labels.draw3}
          <span className="mt-0.5 block text-xs font-medium text-[var(--surface)]/80">{labels.draw3Note}</span>
        </button>
      </div>
    </main>
  );
}
