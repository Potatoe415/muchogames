"use client";

import { useRouter } from "next/navigation";
import { HomeTopBar } from "@/components/HomeTopBar";
import { forceUpdate } from "@/lib/client/forceUpdate";
import { useI18n } from "@/lib/client/i18n";
import { withHubName } from "@/lib/client/hubName";

/** Président's own build/iteration counter, shown next to the mode buttons
 *  on this splash only - unrelated to the whole app's `NEXT_PUBLIC_APP_VERSION`
 *  (see `app/page.tsx`). Same pattern as la Bataille Corse. Bump by hand as
 *  this game changes. */
const PRESIDENT_VERSION = "0.3";

/** Same layout/mode picker as the home screen, but every button reuses the existing
 *  /local, /online, /adhoc routes with `?game=president` instead of a duplicated tree. */
export default function PresidentPage() {
  const router = useRouter();
  const { t } = useI18n();

  return (
    <main
      className="relative mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-between overflow-hidden"
      data-id="president-home-screen"
      style={{
        backgroundImage: "url('/president-full.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center top",
      }}
    >
      <HomeTopBar game="president" />

      <div className="relative z-10 flex w-full flex-col items-center gap-3 px-6 pt-[25vh]" data-id="president-splash-actions">
        <button
          data-id="president-play-local-button"
          onClick={() => router.push("/local?game=president")}
          className="w-full rounded-2xl bg-[var(--accent-yellow)] px-4 py-5 text-lg font-black text-[var(--surface)] shadow-lg"
        >
          {t("playLocal")}
          <span className="mt-0.5 block text-xs font-medium text-[var(--surface)]/80">{t("localOfflineNote")}</span>
        </button>

        <button
          data-id="president-play-online-button"
          onClick={() => router.push(withHubName("/online?game=president"))}
          className="w-full rounded-2xl bg-[var(--accent-cyan)] px-4 py-5 text-lg font-black text-[var(--surface)] shadow-lg"
        >
          {t("playOnline")}
        </button>

        <button
          data-id="president-play-adhoc-button"
          onClick={() => router.push(withHubName("/adhoc?game=president"))}
          className="w-full rounded-2xl bg-[var(--accent-green)] px-4 py-5 text-lg font-black text-[var(--surface)] shadow-lg"
        >
          {t("playAdhoc")}
          <span className="mt-0.5 block text-xs font-medium text-[var(--surface)]/80">{t("adhocOfflineNote")}</span>
        </button>
      </div>

      <div
        className="relative z-10 mb-4 flex w-full items-center justify-between gap-3 px-6"
        data-id="president-splash-version-row"
      >
        <span className="text-sm font-bold text-white/90" data-id="president-version-label">
          v{PRESIDENT_VERSION}
        </span>
        <button
          type="button"
          data-id="president-force-refresh-button"
          onClick={forceUpdate}
          className="rounded-lg border border-white/50 bg-black/30 px-4 py-2 text-sm font-medium text-white/90 transition hover:border-white/80 hover:text-white active:scale-95"
        >
          {t("forceRefreshButton")}
        </button>
      </div>
    </main>
  );
}
