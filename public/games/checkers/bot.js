// Main-thread client of the computer player. Searches in a module worker so
// the board stays smooth; falls back to the main thread where module workers
// are not supported.
const WORKER_URL = new URL("./ai-worker.js", import.meta.url);

function computeHere(request) {
  return new Promise((resolve) => {
    setTimeout(async () => {
      const { chooseMove } = await import("./ai.js");
      const board = Int8Array.from(request.board);
      resolve(chooseMove(board, request.variant, request.side, request.level));
    }, 0);
  });
}

export function createBot() {
  let worker = null;
  let broken = typeof Worker === "undefined";
  let seq = 0;
  const pending = new Map();

  function fallBack() {
    broken = true;
    worker?.terminate();
    worker = null;
    pending.forEach(({ request, resolve }) =>
      computeHere(request).then(resolve)
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
      pending.get(data.id)?.resolve(data.index);
      pending.delete(data.id);
    });
    worker.addEventListener("error", fallBack);
    return worker;
  }

  // { board, variant, side, level } -> Promise<index into legalMoves>
  function think(request) {
    const message = { ...request, board: Array.from(request.board), id: ++seq };
    if (broken || !(worker || spawn())) return computeHere(message);
    return new Promise((resolve) => {
      pending.set(message.id, { request: message, resolve });
      worker.postMessage(message);
    });
  }

  // Drops any search in progress; its answer will never arrive.
  function reset() {
    worker?.terminate();
    worker = null;
    pending.clear();
  }

  return { think, reset, destroy: reset };
}
