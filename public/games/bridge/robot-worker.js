// Module worker: robots' cards and claim checks off the main thread.
import { createSolver } from "./dds.js";
import { chooseCard } from "./play-ai.js";

const TASKS = {
  card: (data) => chooseCard(data.view),
  claim: (data) => createSolver({ ...data.position, limit: 3e6 }).value()
};

self.addEventListener("message", ({ data }) => {
  self.postMessage({ id: data.id, result: TASKS[data.type](data) });
});
