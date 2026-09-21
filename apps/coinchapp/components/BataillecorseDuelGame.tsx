"use client";

import { useState } from "react";
import type { DeckSize } from "@/lib/bataillecorse";
import { useLocalBataillecorseDuelGame } from "@/lib/client/useLocalBataillecorseDuelGame";
import { LOCAL_BATAILLECORSE_DUEL_STORAGE_KEY, clearPersistedGame } from "@/lib/client/localGamePersistence";
import { BataillecorseDuelTable } from "./BataillecorseDuelTable";

/** Same reset-by-remount pattern as `BataillecorseLocalGame`: bumping
 *  `gameKey` remounts `BataillecorseDuelGameInner` with a fresh seed instead
 *  of trying to reset the hook's internal state in place. */
export function BataillecorseDuelGame({ seed, deckSize }: { seed: number; deckSize: DeckSize }) {
  const [gameKey, setGameKey] = useState(0);
  return (
    <BataillecorseDuelGameInner
      key={gameKey}
      seed={seed + gameKey * 131071}
      deckSize={deckSize}
      onReset={() => {
        clearPersistedGame(LOCAL_BATAILLECORSE_DUEL_STORAGE_KEY);
        setGameKey((k) => k + 1);
      }}
    />
  );
}

function BataillecorseDuelGameInner({
  seed,
  deckSize,
  onReset,
}: {
  seed: number;
  deckSize: DeckSize;
  onReset: () => void;
}) {
  const { viewA, viewB, actions } = useLocalBataillecorseDuelGame(seed, deckSize);
  return <BataillecorseDuelTable viewA={viewA} viewB={viewB} actions={actions} onReset={onReset} />;
}
