"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { DEFAULT_CARD_BACK, readCardBack, writeCardBack, type CardBackId } from "@/lib/client/cardBack";

const CardBackContext = createContext<CardBackId>(DEFAULT_CARD_BACK);

/** The back stored for `game`, read after mount so the server render and the
 *  first client render agree (classic). */
export function useCardBackChoice(game: string | undefined) {
  const [back, setBack] = useState<CardBackId>(DEFAULT_CARD_BACK);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBack(readCardBack(game));
  }, [game]);

  const choose = useCallback(
    (next: CardBackId) => {
      setBack(next);
      if (game) writeCardBack(game, next);
    },
    [game],
  );

  return [back, choose] as const;
}

export function CardBackProvider({ game, children }: { game: string | undefined; children: ReactNode }) {
  const [back] = useCardBackChoice(game);
  return <CardBackContext.Provider value={back}>{children}</CardBackContext.Provider>;
}

export const useCardBack = () => useContext(CardBackContext);
