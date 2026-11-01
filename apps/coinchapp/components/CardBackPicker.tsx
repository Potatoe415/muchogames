"use client";

import { CARD_BACKS, type CardBackId } from "@/lib/client/cardBack";
import { useI18n, type TranslationKey } from "@/lib/client/i18n";
import type { CoinchappGame } from "@/lib/profileGames";
import { useCardBackChoice } from "./CardBackContext";
import { CardBackArt } from "./PlayingCard";

const BACK_LABEL: Record<CardBackId, TranslationKey> = {
  classic: "cardBackClassic",
  hogwarts: "cardBackHogwarts",
  casino: "cardBackCasino",
  stars: "cardBackStars",
  garden: "cardBackGarden",
};

const THUMB = { width: "2.75rem", height: "4.125rem" };

/** Home-screen row of thumbnails: the back this game draws face-down cards with. */
export function CardBackPicker({ game }: { game: CoinchappGame }) {
  const { t } = useI18n();
  const [back, choose] = useCardBackChoice(game);

  return (
    <section
      className="flex w-full flex-col items-center gap-2 rounded-2xl bg-black/35 px-3 py-2 backdrop-blur-sm"
      data-id={`${game}-card-back-picker`}
    >
      <p className="text-xs font-bold uppercase tracking-wide text-white/85">{t("cardBackLabel")}</p>
      <div className="flex gap-2" role="radiogroup" aria-label={t("cardBackLabel")}>
        {CARD_BACKS.map((id) => (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={back === id}
            aria-label={t(BACK_LABEL[id])}
            data-id={`${game}-card-back-${id}`}
            onClick={() => choose(id)}
            className={`rounded-lg transition active:scale-95 ${
              back === id ? "ring-4 ring-[var(--accent-yellow)]" : "opacity-75 hover:opacity-100"
            }`}
          >
            <CardBackArt back={id} style={THUMB} />
          </button>
        ))}
      </div>
    </section>
  );
}
