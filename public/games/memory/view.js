import { backUrl, faceUrl } from "./faces.js";

function faceSpan(className) {
  const node = document.createElement("span");
  node.className = className;
  return node;
}

function picture(url) {
  const img = document.createElement("img");
  img.src = url;
  img.alt = "";
  img.draggable = false;
  return img;
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

function paintBack(back, url) {
  if (back.dataset.ready === "yes") return;
  back.dataset.ready = "yes";
  back.append(picture(url));
}

function sync(host, card, config, labels) {
  const button = host.querySelector(`[data-instance-id="${card.instanceId}"]`);
  const up = card.status === "FLIPPED" || card.status === "MATCHED";
  const front = button.querySelector(".memory-card-front");
  button.classList.toggle("is-up", up);
  button.dataset.status = card.status.toLowerCase();
  button.setAttribute("aria-pressed", up ? "true" : "false");
  paintBack(button.querySelector(".memory-card-back"), labels.backUrl);
  if (!up) {
    front.replaceChildren();
    button.setAttribute("aria-label", labels.hidden);
    return;
  }
  if (!front.childElementCount) {
    front.append(picture(faceUrl(config.theme, card.faceId)));
  }
  button.setAttribute("aria-label", labels.face(card.faceId));
}

export function paintBoard(host, state, labels) {
  const key = state.cards.map((card) => card.instanceId).join(".");
  if (host.dataset.deck !== key) {
    host.dataset.deck = key;
    host.replaceChildren(...state.cards.map(cardElement));
  }
  const all = { ...labels, backUrl: backUrl(state.config.back) };
  state.cards.forEach((card) => sync(host, card, state.config, all));
  host.style.setProperty("--cols", String(state.config.cols));
  host.style.setProperty("--rows", String(state.config.rows));
  host.dataset.locked = state.phase === "TURN" ? "false" : "true";
}
