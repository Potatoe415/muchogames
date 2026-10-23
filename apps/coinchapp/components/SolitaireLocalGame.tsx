"use client";

import { useState } from "react";
import { LOCAL_SOLITAIRE_STORAGE_KEY, clearPersistedGame } from "@/lib/client/localGamePersistence";
import { useLocalSolitaireGame } from "@/lib/client/useLocalSolitaireGame";
import type { DrawCount } from "@/lib/solitaire";
import { SolitaireTable } from "./SolitaireTable";

export function SolitaireLocalGame({ seed, drawCount }: { seed: number; drawCount: DrawCount }) {
  const [gameKey, setGameKey] = useState(0);
  return (
    <SolitaireLocalGameInner
      key={gameKey}
      seed={seed + gameKey * 131071}
      drawCount={drawCount}
      onReset={() => {
        clearPersistedGame(LOCAL_SOLITAIRE_STORAGE_KEY);
        setGameKey((k) => k + 1);
      }}
    />
  );
}

function SolitaireLocalGameInner({ seed, drawCount, onReset }: { seed: number; drawCount: DrawCount; onReset: () => void }) {
  const game = useLocalSolitaireGame(seed, drawCount);
  return <SolitaireTable {...game} onReset={onReset} />;
}
