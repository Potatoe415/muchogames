import { CARD_BACK, FACE_BY_ID } from "./faces.js";

function faceSpan(className) {
  const node = document.createElement("span");
  node.className = className;
  return node;
}

function cardElement(card) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "memory-card";
  button.dataset.id = `memory-card-${card.instanceId}`;
  button.dataset.instanceId = card.instanceId;
  const inner = document.createElement("span");
  inner.className = "memory-card-inner";
  inner.append(
    faceSpan("memory-card-face memory-card-back"),
    faceSpan("memory-card-face memory-card-front")
  );
  button.append(inner);
  return button;
}

function paintBack(back) {
  if (back.dataset.ready === "yes") return;
  back.dataset.ready = "yes";
  if (!CARD_BACK.image) return;
  const img = document.createElement("img");
  img.src = CARD_BACK.image;
  img.alt = "";
  img.draggable = false;
  back.append(img);
}

function fillFront(front, face) {
  const tile = document.createElement("span");
  tile.className = "memory-glyph";
  tile.style.backgroundColor = face.color;
  if (face.image) {
    const img = document.createElement("img");
    img.src = face.image;
    img.alt = "";
    img.draggable = false;
    tile.append(img);
    front.append(tile);
    return;
  }
  tile.textContent = face.glyph;
  front.append(tile);
}

function sync(host, card, hiddenLabel) {
  const button = host.querySelector(`[data-instance-id="${card.instanceId}"]`);
  const up = card.status === "FLIPPED" || card.status === "MATCHED";
  const front = button.querySelector(".memory-card-front");
  button.classList.toggle("is-up", up);
  button.dataset.status = card.status.toLowerCase();
  button.setAttribute("aria-pressed", up ? "true" : "false");
  paintBack(button.querySelector(".memory-card-back"));
  if (!up) {
    front.replaceChildren();
    button.setAttribute("aria-label", hiddenLabel);
    return;
  }
  if (!front.childElementCount) fillFront(front, FACE_BY_ID[card.faceId]);
  button.setAttribute("aria-label", FACE_BY_ID[card.faceId].glyph);
}

export function paintBoard(host, state, hiddenLabel) {
  const key = state.cards.map((card) => card.instanceId).join(".");
  if (host.dataset.deck !== key) {
    host.dataset.deck = key;
    host.replaceChildren(...state.cards.map(cardElement));
  }
  state.cards.forEach((card) => sync(host, card, hiddenLabel));
  host.style.setProperty("--cols", String(state.config.cols));
  host.style.setProperty("--rows", String(state.config.rows));
  host.dataset.locked = state.phase === "TURN" ? "false" : "true";
}
