import { BOT_THRESHOLD } from "./config.js";

export function rollSmart(difficulty) {
  const threshold = BOT_THRESHOLD[difficulty] ?? BOT_THRESHOLD.medium;
  return Math.random() < threshold;
}

function idle(cards) {
  return cards.filter((card) => card.status === "IDLE");
}

function unseen(cards, known) {
  const seen = new Set(known.map((item) => item.instanceId));
  return idle(cards).filter((card) => !seen.has(card.instanceId));
}

function anyOf(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function rememberedPair(known, cards) {
  const down = new Set(idle(cards).map((card) => card.instanceId));
  const groups = new Map();
  known.forEach((item) => {
    if (!down.has(item.instanceId)) return;
    const bucket = groups.get(item.pairId) ?? [];
    bucket.push(item.instanceId);
    groups.set(item.pairId, bucket);
  });
  for (const bucket of groups.values()) {
    if (bucket.length >= 2) return bucket.slice(0, 2);
  }
  return null;
}

export function pickFirst(state, smart) {
  const down = idle(state.cards);
  if (!down.length) return null;
  if (!smart) return { first: anyOf(down).instanceId, second: null, smart };
  const pair = rememberedPair(state.known, state.cards);
  if (pair) return { first: pair[0], second: pair[1], smart };
  const pool = unseen(state.cards, state.known);
  const card = anyOf(pool.length ? pool : down);
  return { first: card.instanceId, second: null, smart };
}

function knownTwin(state, first) {
  const twin = state.known.find(
    (item) =>
      item.pairId === first.pairId && item.instanceId !== first.instanceId
  );
  if (!twin) return null;
  const stillDown = idle(state.cards).some(
    (card) => card.instanceId === twin.instanceId
  );
  return stillDown ? twin.instanceId : null;
}

export function pickSecond(state, firstId, plan) {
  if (plan.second && plan.second !== firstId) return plan.second;
  const first = state.cards.find((card) => card.instanceId === firstId);
  const down = idle(state.cards);
  if (plan.smart) return smartSecond(state, first, down);
  const others = down.filter((card) => card.pairId !== first.pairId);
  return anyOf(others.length ? others : down).instanceId;
}

function smartSecond(state, first, down) {
  const twin = knownTwin(state, first);
  if (twin) return twin;
  const pool = unseen(state.cards, state.known);
  return anyOf(pool.length ? pool : down).instanceId;
}
