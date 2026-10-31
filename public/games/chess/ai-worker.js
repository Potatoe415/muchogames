// Module worker: runs the computer player off the main thread.
import { chooseMove } from "./ai.js";

self.addEventListener("message", ({ data }) => {
  const index = chooseMove(data.pos, data.level, data.seen);
  self.postMessage({ id: data.id, index });
});
