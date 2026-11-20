"use client";

import { useI18n } from "@/lib/client/i18n";
import type { Team } from "@/lib/coinche";
import type { TableReaction } from "@/lib/client/reactions";
import { ReactionBubble } from "./ReactionBubble";

/** Side seats show the name horizontally under the avatar: cap it to fit. */
const SIDE_NAME_MAX_CHARS = 10;

export interface PlayerBadgeProps {
  name: string;
  team: Team;
  isTurn: boolean;
  isDealer: boolean;
  isThinking?: boolean;
  /** Shows a dimmed dot when false (seat's responsible party gone quiet). */
  connected?: boolean;
  reaction?: TableReaction;
  dataId?: string;
  orientation?: "horizontal" | "vertical";
  /** Président only: this seat is the round's president (first to empty
   *  their hand) - shows a small crown before the name. */
  isPresident?: boolean;
  /** Bot profile avatar (Coinche / Belote bot seats). */
  avatarSrc?: string;
  /** Vertical right-side seat: row mirrored so the reaction sits toward the table centre. */
  flipped?: boolean;
}

export function PlayerBadge({
  name,
  team,
  isTurn,
  isDealer,
  isThinking = false,
  connected = true,
  reaction,
  dataId,
  orientation = "horizontal",
  isPresident = false,
  avatarSrc,
  flipped = false,
}: PlayerBadgeProps) {
  const { t } = useI18n();
  const teamClass = team === "A" ? "text-team-a" : "text-team-b";
  const turnClass = isTurn ? "underline decoration-2 underline-offset-2" : "";
  const dimClass = connected ? "" : "opacity-50";

  if (orientation === "vertical") {
    return (
      <div data-id={dataId} className={`flex items-center gap-1 drop-shadow-lg ${flipped ? "flex-row-reverse" : ""}`}>
        {isThinking && <ThinkingIndicator />}
        <div className="flex flex-col items-center gap-0.5">
          {avatarSrc && <BadgeAvatar src={avatarSrc} />}
          <div
            className={`whitespace-nowrap px-1 text-center text-sm font-black uppercase leading-none ${teamClass} ${turnClass} ${dimClass}`}
          >
            {isPresident && (
              <span className="mr-0.5 align-middle text-xs" data-id="player-crown-icon" aria-hidden="true">
                👑
              </span>
            )}
            {Array.from(name).slice(0, SIDE_NAME_MAX_CHARS).join("")}
            {isDealer && <span className="ml-0.5 align-middle text-[10px]">D</span>}
          </div>
        </div>
        {!connected && <DisconnectedDot label={t("disconnected")} />}
        {reaction && (
          <ReactionBubble
            reaction={reaction}
            size="md"
            dataId={reaction.kind === "gif" ? "player-gif-reaction" : "player-emoji-reaction"}
          />
        )}
      </div>
    );
  }

  return (
    <div data-id={dataId} className="flex items-center gap-1 drop-shadow-lg">
      {isThinking && <ThinkingIndicator />}
      {avatarSrc && <BadgeAvatar src={avatarSrc} />}
      <div className={`px-1 py-0.5 text-xl font-black uppercase leading-none ${teamClass} ${turnClass} ${dimClass}`}>
        {isPresident && (
          <span className="mr-1 align-middle text-base" data-id="player-crown-icon" aria-hidden="true">
            👑
          </span>
        )}
        {name}
        {isDealer && <span className="ml-1 align-middle text-[10px]">D</span>}
      </div>
      {!connected && <DisconnectedDot label={t("disconnected")} />}
      {reaction && (
        <ReactionBubble
          reaction={reaction}
          size="lg"
          dataId={reaction.kind === "gif" ? "player-gif-reaction" : "player-emoji-reaction"}
        />
      )}
    </div>
  );
}

function BadgeAvatar({ src }: { src: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- tiny static avatar
    <img src={src} alt="" width={28} height={28} className="h-7 w-7 shrink-0 rounded-full" data-id="player-bot-avatar" />
  );
}

function DisconnectedDot({ label }: { label: string }) {
  return (
    <span
      className="h-2 w-2 shrink-0 rounded-full bg-[var(--accent-red)]/70"
      data-id="player-disconnected-dot"
      aria-label={label}
    />
  );
}

function ThinkingIndicator() {
  return (
    <svg
      className="h-3.5 w-3.5 animate-spin text-yellow-300 drop-shadow-[0_0_5px_rgba(253,224,71,0.8)]"
      viewBox="0 0 24 24"
      fill="none"
      data-id="bot-thinking-indicator"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3.5" strokeOpacity="0.25" />
      <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
