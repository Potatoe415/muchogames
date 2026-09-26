"use client";

import { useP2PBataillecorseHost, type P2PBataillecorseHostConfig } from "@/lib/client/useP2PBataillecorseHost";
import { BataillecorseTable, type BataillecorseGameView } from "@/components/BataillecorseTable";

/** Renders the table for the authoritative host of a la Bataille Corse ad-hoc table (also a player). */
export function P2PBataillecorseHostGame({ config }: { config: P2PBataillecorseHostConfig }) {
  const { gv, actions } = useP2PBataillecorseHost(config);
  return <BataillecorseTable gv={gv as BataillecorseGameView} actions={actions} debugMode="adhoc" />;
}
