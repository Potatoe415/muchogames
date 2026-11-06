// Table rendering -> window.CafardsBoard: the two piles (last three cards,
// with a small random pose each) and the player chips (cards left in hand;
// tapping a chip makes that player collect the piles).
(function () {
  const ASSETS = {
    tomate: { legume: "tomate.webp", tabou: "tomate_x.webp" },
    salade: { legume: "salade.webp", tabou: "salad_x.webp" },
    poivron: { legume: "poivron.webp", tabou: "poivron_x.webp" },
    "chou-fleur": { legume: "choux.webp", tabou: "choux_x.webp" }
  };
  const VISIBLE_CARDS = 3;
  // Saved poses are offsets of about 24-70 around 40; clamp old ones.
  const clampOffset = (value) => Math.max(-30, Math.min(30, value - 40));

  const cardAsset = (card) => `assets/cards/${ASSETS[card.veg][card.type === "tabou" ? "tabou" : "legume"]}`;
  // Every card face, for preload.js.
  const cardUrls = Object.values(ASSETS).flatMap((files) => [files.legume, files.tabou].map((file) => `assets/cards/${file}`));

  function cardNode(template, card, index, isNew) {
    const node = template.content.firstElementChild.cloneNode(true);
    const dx = (clampOffset(card.pose.left) * 0.12).toFixed(2);
    const dy = (clampOffset(card.pose.top) * 0.12).toFixed(2);
    node.dataset.id = `cafards-card-${card.veg}-${card.type}`;
    node.classList.toggle("tabou", card.type === "tabou");
    node.classList.toggle("card-new", isNew);
    node.style.zIndex = String(index + 1);
    node.style.setProperty("--card-move", `translate(${dx}vmin, ${dy}vmin) rotate(${card.pose.angle}deg)`);
    node.style.backgroundImage = `url("${cardAsset(card)}")`;
    return node;
  }

  function renderPile(container, pile, template, showMessage, message) {
    container.innerHTML = "";
    if (showMessage) {
      const hint = document.createElement("span");
      hint.className = "pile-message";
      hint.textContent = message;
      container.appendChild(hint);
    }
    const start = Math.max(0, pile.length - VISIBLE_CARDS);
    pile.slice(start).forEach((card, offset) => {
      const index = start + offset;
      const isNew = index === pile.length - 1 && card.justRevealed === true;
      container.appendChild(cardNode(template, card, index, isNew));
      card.justRevealed = false;
    });
  }

  function renderPiles(state, el, t) {
    [el.pileA, el.pileB].forEach((container, index) => {
      const pile = state.piles[index];
      const hint = state.started && index === state.activePile && pile.length === 0;
      renderPile(container, pile, el.cardTpl, hint, t("tapHere"));
    });
  }

  // Only the active pile carries data-tv-focus, so the remote lands on it.
  function markActivePile(state, el) {
    el.pileShells.forEach((shell, index) => {
      const active = index === state.activePile;
      shell.classList.toggle("active", active);
      shell.querySelector(".pile-hit").toggleAttribute("data-tv-focus", active);
    });
  }

  function animateChipCount(chip, from, to) {
    let current = from;
    const step = () => {
      if (current >= to) return;
      current += 1;
      chip.textContent = String(current);
      if (current < to) window.setTimeout(step, 35);
    };
    step();
  }

  function playerChip(state, player, index, t, onCollect) {
    const chip = document.createElement("button");
    const active = index === state.current && state.started;
    const name = t("playerName", { n: index + 1 });
    chip.type = "button";
    chip.className = `player-chip player-${index}${active ? " active" : ""}`;
    chip.dataset.id = `cafards-player-${index + 1}`;
    chip.setAttribute("aria-label", t("collectBtn", { player: name, count: player.hand.length }));
    if (active) chip.setAttribute("aria-current", "true");
    chip.addEventListener("click", () => onCollect(index));
    const animated = typeof player.animateFrom === "number" && player.animateTo > player.animateFrom;
    chip.textContent = String(animated ? player.animateFrom : player.hand.length);
    if (animated) animateChipCount(chip, player.animateFrom, player.animateTo);
    delete player.animateFrom;
    delete player.animateTo;
    return chip;
  }

  function renderPlayers(state, el, t, onCollect) {
    el.players.innerHTML = "";
    state.players.forEach((player, index) => {
      el.players.appendChild(playerChip(state, player, index, t, onCollect));
    });
  }

  window.CafardsBoard = { renderPiles, markActivePile, renderPlayers, cardUrls };
})();
