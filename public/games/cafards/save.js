// localStorage: the match in progress, so leaving it by any route and coming
// back resumes it exactly. Everything read back is validated before use.
(function () {
  const SAVE_KEY = "cafards-current";
  const VERSION = 1;
  const VEG_KEYS = ["tomate", "salade", "poivron", "chou-fleur"];
  const TYPES = ["legume", "tabou"];
  const LANGS = ["fr", "en", "es"];

  const isObject = (value) => typeof value === "object" && value !== null;
  const inRange = (value, min, max) =>
    Number.isFinite(value) && value >= min && value <= max;
  const isIndex = (value, length) =>
    Number.isInteger(value) && value >= 0 && value < length;

  const cardOut = (card) => ({ type: card.type, veg: card.veg });
  const pileCardOut = (card) => ({
    ...cardOut(card),
    pose: { left: card.pose.left, top: card.pose.top, angle: card.pose.angle }
  });

  function encodeMatch(state) {
    return JSON.stringify({
      v: VERSION,
      started: true,
      lang: state.lang,
      config: { ...state.config },
      players: state.players.map((player) => ({
        hand: player.hand.map(cardOut),
        losses: player.losses,
        alreadyWon: player.alreadyWon === true
      })),
      piles: state.piles.map((pile) => pile.map(pileCardOut)),
      activePile: state.activePile,
      current: state.current
    });
  }

  const validCard = (card) =>
    isObject(card) && TYPES.includes(card.type) && VEG_KEYS.includes(card.veg);

  const validPose = (pose) =>
    isObject(pose) &&
    [pose.left, pose.top, pose.angle].every((n) => Number.isFinite(n));

  function validConfig(config) {
    if (!isObject(config)) return false;
    return (
      Number.isInteger(config.count) &&
      inRange(config.count, 2, 8) &&
      inRange(config.deckSize, 32, 256) &&
      inRange(config.winners, 1, config.count) &&
      typeof config.timerOn === "boolean" &&
      inRange(config.timerMs, 500, 600000)
    );
  }

  function validPlayer(player) {
    return (
      isObject(player) &&
      Array.isArray(player.hand) &&
      player.hand.every(validCard) &&
      Number.isInteger(player.losses) &&
      player.losses >= 0 &&
      typeof player.alreadyWon === "boolean"
    );
  }

  const validPiles = (piles) =>
    Array.isArray(piles) &&
    piles.length === 2 &&
    piles.every(
      (pile) =>
        Array.isArray(pile) &&
        pile.every((card) => validCard(card) && validPose(card.pose))
    );

  // Same total as the deal, and still playable: fewer empty hands than winners.
  function consistent(data) {
    const { count, deckSize, winners } = data.config;
    const dealt = Math.max(count, deckSize - (deckSize % count));
    const cards = [...data.players.map((p) => p.hand), ...data.piles];
    const total = cards.reduce((sum, list) => sum + list.length, 0);
    const empty = data.players.filter((p) => p.hand.length === 0).length;
    return total === dealt && empty < winners;
  }

  function validMatch(data) {
    return (
      isObject(data) &&
      data.v === VERSION &&
      data.started === true &&
      LANGS.includes(data.lang) &&
      validConfig(data.config) &&
      Array.isArray(data.players) &&
      data.players.length === data.config.count &&
      data.players.every(validPlayer) &&
      validPiles(data.piles) &&
      isIndex(data.activePile, 2) &&
      isIndex(data.current, data.config.count) &&
      consistent(data)
    );
  }

  function decodeMatch(text) {
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return null;
    }
    if (!validMatch(data)) return null;
    return {
      lang: data.lang,
      config: { ...data.config },
      players: data.players.map((player) => ({
        hand: player.hand.map(cardOut),
        losses: player.losses,
        alreadyWon: player.alreadyWon
      })),
      piles: data.piles.map((pile) => pile.map(pileCardOut)),
      activePile: data.activePile,
      current: data.current
    };
  }

  function loadMatch() {
    try {
      const text = localStorage.getItem(SAVE_KEY);
      if (text === null) return null;
      const match = decodeMatch(text);
      if (!match) localStorage.removeItem(SAVE_KEY);
      return match;
    } catch {
      return null;
    }
  }

  function storeMatch(state) {
    try {
      localStorage.setItem(SAVE_KEY, encodeMatch(state));
    } catch {
      // Storage unavailable or full: the match only lasts for this visit.
    }
  }

  function clearMatch() {
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch {
      // Storage unavailable: nothing was saved.
    }
  }

  window.CafardsSave = {
    encodeMatch,
    decodeMatch,
    loadMatch,
    storeMatch,
    clearMatch
  };
})();
