"use client";

import { useRouter } from "next/navigation";
import { HomeTopBar } from "@/components/HomeTopBar";
import { useI18n } from "@/lib/client/i18n";
import { withHubName } from "@/lib/client/hubName";

/** Same layout/mode picker as the home screen, but every button reuses the existing
 *  /local, /online, /adhoc routes with `?game=bataillecorse` instead of a duplicated tree. */
export default function BataillecorsePage() {
  const router = useRouter();
  const { t } = useI18n();

  return (
    <main
      className="relative mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-between overflow-hidden"
      data-id="bataillecorse-home-screen"
      style={{
        backgroundImage: "url('/bataillecorse-full.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center top",
      }}
    >
      <HomeTopBar game="bataillecorse" />

      <div className="relative z-10 flex w-full flex-col items-center gap-3 px-6 pt-[25vh]" data-id="bataillecorse-splash-actions">
        <button
          data-id="bataillecorse-play-face-to-face-button"
          onClick={() => router.push("/local?game=bataillecorse&mode=duel")}
          className="w-full rounded-2xl bg-[var(--accent-orange)] px-4 py-5 text-lg font-black text-[var(--surface)] shadow-lg"
        >
          {t("bataillecorseFaceToFaceButton")}
          <span className="mt-0.5 block text-xs font-medium text-[var(--surface)]/80">{t("bataillecorseFaceToFaceNote")}</span>
        </button>

        <button
          data-id="bataillecorse-play-local-button"
          onClick={() => router.push("/local?game=bataillecorse")}
          className="w-full rounded-2xl bg-[var(--accent-yellow)] px-4 py-5 text-lg font-black text-[var(--surface)] shadow-lg"
        >
          {t("playLocal")}
          <span className="mt-0.5 block text-xs font-medium text-[var(--surface)]/80">{t("bataillecorseLocalOfflineNote")}</span>
        </button>

        <button
          data-id="bataillecorse-play-online-button"
          onClick={() => router.push(withHubName("/online?game=bataillecorse"))}
          className="w-full rounded-2xl bg-[var(--accent-cyan)] px-4 py-5 text-lg font-black text-[var(--surface)] shadow-lg"
        >
          {t("playOnline")}
        </button>

        <button
          data-id="bataillecorse-play-adhoc-button"
          onClick={() => router.push(withHubName("/adhoc?game=bataillecorse"))}
          className="w-full rounded-2xl bg-[var(--accent-green)] px-4 py-5 text-lg font-black text-[var(--surface)] shadow-lg"
        >
          {t("playAdhoc")}
          <span className="mt-0.5 block text-xs font-medium text-[var(--surface)]/80">{t("adhocOfflineNote")}</span>
        </button>
      </div>
    </main>
  );
}
