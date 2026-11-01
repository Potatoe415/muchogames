import type { ReactNode } from "react";
import type { MatchInfo } from "@/lib/client/matchCoin";
import { CardBackProvider } from "./CardBackContext";
import { MatchGate } from "./MatchGate";

/**
 * Full-viewport game table: fills `100svh` (stable mobile chrome), exposes
 * `--card-*-w` / `--table-hud-top` / `--slap-circle-size` on `.table-shell-metrics`
 * (`12svmin` / `36svmin`, clamped), and keeps a safe-area spacer under the hand.
 * Scene children should be `relative h-0 min-h-0 flex-1`.
 * `match` turns on the platform's per-match coin and leave confirmation, and
 * picks the card back stored for `match.game`.
 */
export function TableShell({
  children,
  dataId,
  match,
}: {
  children: ReactNode;
  dataId: string;
  match?: MatchInfo;
}) {
  return (
    <main
      className="relative mx-auto flex h-svh w-full flex-1 flex-col overflow-hidden bg-felt text-[var(--card-face)] [container-type:size]"
      data-id={dataId}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,#3aa59b_0%,#2f877f_48%,#276f69_100%)]"
        aria-hidden="true"
      />
      <div className="table-shell-metrics relative flex min-h-0 flex-1 flex-col">
        <CardBackProvider game={match?.game}>{children}</CardBackProvider>
        <div
          className="min-h-[calc(env(safe-area-inset-bottom,0px)+12px)] shrink-0"
          aria-hidden="true"
        />
      </div>
      {match && <MatchGate match={match} />}
    </main>
  );
}
