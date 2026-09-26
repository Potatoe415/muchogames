"use client";

import { useState } from "react";
import type { DeckSize } from "@/lib/bataillecorse";
import { useLocalBataillecorseGame } from "@/lib/client/useLocalBataillecorseGame";
import { LOCAL_BATAILLECORSE_STORAGE_KEY, clearPersistedGame } from "@/lib/client/localGamePersistence";
import type { ReactionPick } from "@/lib/client/reactions";
import { useReactions } from "@/lib/client/useReactions";
import { BataillecorseTable } from "./BataillecorseTable";

export function BataillecorseLocalGame({
  seed,
  botThinkMs,
  deckSize,
}: {
  seed: number;
  botThinkMs: number;
  deckSize: DeckSize;
}) {
  const [gameKey, setGameKey] = useState(0);
  return (
    <BataillecorseLocalGameInner
      key={gameKey}
      seed={seed + gameKey * 131071}
      botThinkMs={botThinkMs}
      deckSize={deckSize}
      onReset={() => {
        clearPersistedGame(LOCAL_BATAILLECORSE_STORAGE_KEY);
        setGameKey((k) => k + 1);
      }}
    />
  );
}

function BataillecorseLocalGameInner({
  seed,
  botThinkMs,
  deckSize,
  onReset,
}: {
  seed: number;
  botThinkMs: number;
  deckSize: DeckSize;
  onReset: () => void;
}) {
  const { gv, actions } = useLocalBataillecorseGame(seed, botThinkMs, deckSize);
  const { reactions, addReaction } = useReactions();

  function onSendReaction(pick: ReactionPick) {
    addReaction(gv.mySeat ?? 0, pick);
  }

  return (
    <BataillecorseTable gv={gv} reactions={reactions} actions={{ ...actions, onReset, onSendReaction }} debugMode="solo" />
  );
}
