"use client";

import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/client/i18n";

export function LanguageSwitcher() {
  const pathname = usePathname();
  const { locale, setLocale } = useI18n();
  const isInStartedGame = pathname === "/local/play" || pathname.startsWith("/game/");
  // Home splash screens have their own settings panel (`HomeTopBar`) with an
  // equivalent language switch, so this global one would sit on top of the
  // paramètres button (previously missing `/bataillecorse`, then `/solitaire`).
  const hasOwnLanguageSwitch =
    pathname === "/" ||
    pathname === "/bouilla" ||
    pathname === "/president" ||
    pathname === "/coinche" ||
    pathname === "/belote" ||
    pathname === "/bataillecorse" ||
    pathname === "/solitaire";

  if (isInStartedGame || hasOwnLanguageSwitch) return null;

  return (
    <label
      className="fixed right-3 top-3 z-[60] flex items-center gap-2 rounded-full bg-[var(--surface-overlay)] px-3 py-1 text-xs font-bold text-[var(--card-face)] ring-1 ring-[var(--accent-cyan)]/30"
      data-id="language-switcher"
    >
      <select
        data-id="language-select"
        value={locale}
        onChange={(e) => setLocale(e.target.value === "en" ? "en" : "fr")}
        aria-label="Language"
        className="rounded bg-transparent text-[var(--card-face)] outline-none"
      >
        <option value="fr">FR</option>
        <option value="en">EN</option>
      </select>
    </label>
  );
}
