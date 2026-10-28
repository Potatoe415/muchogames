// Module worker: runs the computer player off the main thread.
import { chooseMove } from "./ai.js";

self.addEventListener("message", ({ data }) => {
  const board = Int8Array.from(data.board);
  const index = chooseMove(board, data.variant, data.side, data.level);
  self.postMessage({ id: data.id, index });
});
