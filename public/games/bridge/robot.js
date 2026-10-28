// Main-thread client of the robots' worker. Falls back to the main thread
// where module workers are not supported.
const WORKER_URL = new URL("./robot-worker.js", import.meta.url);

async function computeHere(message) {
  await new Promise((resolve) => setTimeout(resolve, 0));
  if (message.type === "claim") {
    const { createSolver } = await import("./dds.js");
    return createSolver({ ...message.position, limit: 3e6 }).value();
  }
  const { chooseCard } = await import("./play-ai.js");
  return chooseCard(message.view);
}

export function createRobot() {
  let worker = null;
  let broken = typeof Worker === "undefined";
  let seq = 0;
  const pending = new Map();

  function fallBack() {
    broken = true;
    worker?.terminate();
    worker = null;
    pending.forEach(({ message, resolve }) =>
      computeHere(message).then(resolve)
    );
    pending.clear();
  }

  function spawn() {
    try {
      worker = new Worker(WORKER_URL, { type: "module" });
    } catch {
      broken = true;
      return null;
    }
    worker.addEventListener("message", ({ data }) => {
      pending.get(data.id)?.resolve(data.result);
      pending.delete(data.id);
    });
    worker.addEventListener("error", fallBack);
    return worker;
  }

  function ask(type, payload) {
    const message = { type, ...payload, id: ++seq };
    if (broken || !(worker || spawn())) return computeHere(message);
    return new Promise((resolve) => {
      pending.set(message.id, { message, resolve });
      worker.postMessage(message);
    });
  }

  // Drops any search in progress; its answer never arrives.
  function reset() {
    worker?.terminate();
    worker = null;
    pending.clear();
  }

  return {
    card: (view) => ask("card", { view }),
    claim: (position) => ask("claim", { position }),
    reset
  };
}
