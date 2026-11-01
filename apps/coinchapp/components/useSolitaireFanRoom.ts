"use client";

import { useLayoutEffect, useRef, useState } from "react";

/** Board width in card widths (7 columns + gaps), see `SolitaireTable`. */
const BOARD_CARD_WIDTHS = 7.5;
const CARD_HEIGHT = 1.5;
const BOTTOM_MARGIN = 0.1;

/** How far down (in card widths) a column's last card may start so the column
 *  still ends above the scene's bottom. `Infinity` until measured. */
export function useSolitaireFanRoom() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const tableauRef = useRef<HTMLDivElement>(null);
  const [fanRoom, setFanRoom] = useState(Infinity);

  useLayoutEffect(() => {
    const scene = sceneRef.current;
    const tableau = tableauRef.current;
    if (!scene || !tableau) return;
    const measure = () => {
      const cardWidth = tableau.offsetWidth / BOARD_CARD_WIDTHS;
      if (cardWidth <= 0) return;
      const top = tableau.getBoundingClientRect().top - scene.getBoundingClientRect().top;
      setFanRoom(Math.max(0, (scene.clientHeight - top) / cardWidth - CARD_HEIGHT - BOTTOM_MARGIN));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(scene);
    return () => observer.disconnect();
  }, []);

  return { sceneRef, tableauRef, fanRoom };
}
