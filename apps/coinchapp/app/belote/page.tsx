"use client";

import { useRouter } from "next/navigation";
import { CardBackPicker } from "@/components/CardBackPicker";
import { HomeTopBar } from "@/components/HomeTopBar";
import { useI18n } from "@/lib/client/i18n";
import { withHubName } from "@/lib/client/hubName";

/** Same layout/mode picker as the Coinche splash, with `?game=belote` on the shared
 *  /local, /online, /adhoc routes. The painted title lives in the splash art. */
export default function BelotePage() {
  const router = useRouter();
  const { t } = useI18n();

  return (
    <main
      className="relative mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-between overflow-hidden"
      data-id="belote-home-screen"
      style={{
        backgroundImage: "url('/belote-full.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center top",
      }}
    >
      <HomeTopBar game="belote" />

      <div className="relative z-10 flex w-full flex-col items-center gap-3 px-6 pt-[25dvh]" data-id="belote-splash-actions">
        <button
          data-id="belote-play-local-button"
          onClick={() => router.push("/local?game=belote")}
          className="w-full rounded-2xl bg-[var(--accent-yellow)] px-4 py-5 text-lg font-black text-[var(--surface)] shadow-lg"
        >
          {t("playLocal")}
          <span className="mt-0.5 block text-xs font-medium text-[var(--surface)]/80">{t("localOfflineNote")}</span>
        </button>

        <button
          data-id="belote-play-online-button"
          onClick={() => router.push(withHubName("/online?game=belote"))}
          className="w-full rounded-2xl bg-[var(--accent-cyan)] px-4 py-5 text-lg font-black text-[var(--surface)] shadow-lg"
        >
          {t("playOnline")}
        </button>

        <button
          data-id="belote-play-adhoc-button"
          onClick={() => router.push(withHubName("/adhoc?game=belote"))}
          className="w-full rounded-2xl bg-[var(--accent-green)] px-4 py-5 text-lg font-black text-[var(--surface)] shadow-lg"
        >
          {t("playAdhoc")}
          <span className="mt-0.5 block text-xs font-medium text-[var(--surface)]/80">{t("adhocOfflineNote")}</span>
        </button>

        <CardBackPicker game="belote" />
      </div>
    </main>
  );
}
