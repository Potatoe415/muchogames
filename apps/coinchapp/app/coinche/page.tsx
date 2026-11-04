"use client";

import { useRouter } from "next/navigation";
import { CardBackPicker } from "@/components/CardBackPicker";
import { HomeTopBar } from "@/components/HomeTopBar";
import { useI18n } from "@/lib/client/i18n";
import { withHubName } from "@/lib/client/hubName";

/** Same layout/mode picker as the Bouilla/Président splashes, but every button
 *  reuses the existing /local, /online, /adhoc routes with no `?game=` param
 *  (Coinche is the default game type at every one of those routes). */
export default function CoinchePage() {
  const router = useRouter();
  const { t } = useI18n();

  return (
    <main
      className="relative mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-between overflow-hidden"
      data-id="coinche-home-screen"
      style={{
        backgroundImage: "url('/splashscreen.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center top",
      }}
    >
      <HomeTopBar game="coinche" />

      <div className="relative z-10 flex w-full flex-col items-center gap-3 px-6 pt-[25dvh]" data-id="coinche-splash-actions">
        <button
          data-id="coinche-play-local-button"
          onClick={() => router.push("/local")}
          className="w-full rounded-2xl bg-[var(--accent-yellow)] px-4 py-5 text-lg font-black text-[var(--surface)] shadow-lg"
        >
          {t("playLocal")}
          <span className="mt-0.5 block text-xs font-medium text-[var(--surface)]/80">{t("localOfflineNote")}</span>
        </button>

        <button
          data-id="coinche-play-online-button"
          onClick={() => router.push(withHubName("/online?target=1000"))}
          className="w-full rounded-2xl bg-[var(--accent-cyan)] px-4 py-5 text-lg font-black text-[var(--surface)] shadow-lg"
        >
          {t("playOnline")}
        </button>

        <button
          data-id="coinche-play-adhoc-button"
          onClick={() => router.push(withHubName("/adhoc"))}
          className="w-full rounded-2xl bg-[var(--accent-green)] px-4 py-5 text-lg font-black text-[var(--surface)] shadow-lg"
        >
          {t("playAdhoc")}
          <span className="mt-0.5 block text-xs font-medium text-[var(--surface)]/80">{t("adhocOfflineNote")}</span>
        </button>

        <CardBackPicker game="coinche" />
      </div>
    </main>
  );
}
