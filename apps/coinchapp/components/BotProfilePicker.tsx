"use client";

import { useEffect, useRef, useState } from "react";
import { BOT_PROFILE_CONFIG, BOT_PROFILES, DEFAULT_BOT_PROFILE, type BotProfile } from "@/lib/coinche";
import { useI18n, type TranslationKey } from "@/lib/client/i18n";
import { botAvatarSrc } from "./gameTableHelpers";


const NAME_KEY: Record<BotProfile, TranslationKey> = {
  normal: "botProfileNormal",
  aggressive: "botProfileAggressive",
  conservative: "botProfileConservative",
  defensive: "botProfileDefensive",
};
const BLURB_KEY: Record<BotProfile, TranslationKey> = {
  normal: "botProfileNormalBlurb",
  aggressive: "botProfileAggressiveBlurb",
  conservative: "botProfileConservativeBlurb",
  defensive: "botProfileDefensiveBlurb",
};

/** Display traits, each a 0..1 bar derived from the profile config (no per-profile code). */
const TRAITS: { key: TranslationKey; value: (p: BotProfile) => number }[] = [
  { key: "botTraitBidding", value: (p) => clamp01((15 - BOT_PROFILE_CONFIG[p].bidSafetyMargin) / 25) },
  { key: "botTraitCoinche", value: (p) => clamp01((0.95 - BOT_PROFILE_CONFIG[p].coincheThreshold) / 0.45) },
  { key: "botTraitTrumpHunt", value: (p) => BOT_PROFILE_CONFIG[p].trumpHuntPriority },
  { key: "botTraitDefence", value: (p) => BOT_PROFILE_CONFIG[p].shorteningDefensePriority },
  { key: "botTraitRisk", value: (p) => BOT_PROFILE_CONFIG[p].riskTolerance },
];

/** Gap kept between the menu and the viewport edge; below this room the menu flips up. */
const MENU_MARGIN_PX = 8;
const MENU_MIN_DOWN_PX = 320;

/** Open downward unless the space below is short and the space above is larger. */
function menuPlacement(el: HTMLElement | null): { up: boolean; maxHeight: number } {
  if (!el) return { up: false, maxHeight: 480 };
  const rect = el.getBoundingClientRect();
  const below = window.innerHeight - rect.bottom - MENU_MARGIN_PX;
  const above = rect.top - MENU_MARGIN_PX;
  const up = below < MENU_MIN_DOWN_PX && above > below;
  return { up, maxHeight: Math.max(160, up ? above : below) };
}

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

function TraitBars({ profile }: { profile: BotProfile }) {
  const { t } = useI18n();
  return (
    <div className="flex flex-col gap-1" data-id={`bot-profile-traits-${profile}`}>
      {TRAITS.map((trait) => (
        <div key={trait.key} className="flex items-center gap-2 text-[11px]">
          <span className="w-20 shrink-0 text-[var(--card-face)]/70">{t(trait.key)}</span>
          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--card-face)]/15">
            <span
              className="block h-full rounded-full bg-[var(--accent-yellow)]"
              style={{ width: `${Math.round(trait.value(profile) * 100)}%` }}
            />
          </span>
        </div>
      ))}
    </div>
  );
}

function ProfileRow({ profile, withTraits }: { profile: BotProfile; withTraits: boolean }) {
  const { t } = useI18n();
  return (
    <div className="flex items-start gap-3 text-left">
      {/* eslint-disable-next-line @next/next/no-img-element -- tiny static avatar, no optimisation needed */}
      <img src={botAvatarSrc(profile)} alt="" width={40} height={40} className="h-10 w-10 shrink-0 rounded-full" />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-sm font-bold">{t(NAME_KEY[profile])}</span>
        <span className="text-[11px] leading-tight text-[var(--card-face)]/60">{t(BLURB_KEY[profile])}</span>
        {withTraits && <TraitBars profile={profile} />}
      </div>
    </div>
  );
}

/**
 * Dropdown on a bot seat: avatar, name and trait bars per profile. Read-only
 * (avatar + name) when `onChange` is absent, e.g. a guest viewing the lobby.
 */
export function BotProfilePicker({
  value,
  onChange,
  dataId,
  disabled = false,
}: {
  value: BotProfile | undefined;
  onChange?: (profile: BotProfile) => void;
  dataId: string;
  disabled?: boolean;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState({ up: false, maxHeight: 0 });
  const rootRef = useRef<HTMLDivElement>(null);
  const current = value ?? DEFAULT_BOT_PROFILE;

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  const editable = !!onChange && !disabled;
  return (
    <div ref={rootRef} className="relative" data-id={dataId} onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        data-id={`${dataId}-toggle`}
        disabled={!editable}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("botProfileLabel")}
        onClick={() => {
          if (!open) setPlacement(menuPlacement(rootRef.current));
          setOpen((o) => !o);
        }}
        className="flex w-full items-center gap-2 rounded-lg bg-[var(--card-face)]/10 px-2 py-1 text-xs font-bold disabled:cursor-default"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- tiny static avatar */}
        <img src={botAvatarSrc(current)} alt="" width={24} height={24} className="h-6 w-6 rounded-full" />
        <span className="flex-1 text-left">{t(NAME_KEY[current])}</span>
        {editable && <span aria-hidden="true">▾</span>}
      </button>
      {open && (
        <ul
          role="listbox"
          data-id={`${dataId}-menu`}
          style={{ maxHeight: placement.maxHeight }}
          className={`absolute left-0 z-30 flex w-64 overflow-y-auto ${placement.up ? "bottom-full mb-1" : "top-full mt-1"} flex-col gap-1 rounded-xl bg-[var(--surface)] p-2 text-[var(--card-face)] shadow-xl ring-1 ring-[var(--accent-cyan)]/30`}
        >
          {BOT_PROFILES.map((profile) => (
            <li key={profile} role="option" aria-selected={profile === current}>
              <button
                type="button"
                data-id={`${dataId}-option-${profile}`}
                onClick={() => {
                  onChange?.(profile);
                  setOpen(false);
                }}
                className={`w-full rounded-lg p-2 ${profile === current ? "bg-[var(--accent-cyan)]/20 ring-1 ring-[var(--accent-cyan)]" : "hover:bg-[var(--card-face)]/10"}`}
              >
                <ProfileRow profile={profile} withTraits />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
