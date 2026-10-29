(function () {
  const STORAGE_KEY = "pyramide-current";
  const VERSION = 1;
  const LOCALES = ["fr", "en", "es"];

  const isInt = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;
  const isText = (value) => typeof value === "string" && value.length > 0;

  function create({ startingBricks, keywordCount, maxBet, phases }) {
    function snapshot(session, round) {
      return {
        version: VERSION,
        locale: session.locale,
        deckIds: session.deck.map((enigma) => enigma.id),
        deckIndex: session.deckIndex,
        activeTeamIndex: session.activeTeamIndex,
        teams: session.teams.map(({ id, name, points }) => ({ id, name, points })),
        round: {
          phase: round.phase,
          enigmaId: round.enigma.id,
          bricksRemaining: round.bricksRemaining,
          currentWordIndex: round.currentWordIndex,
          currentBet: round.currentBet,
          wordResults: round.wordResults.map(({ keyword, bet, success }) => ({ keyword, bet, success })),
          finalSolved: round.finalSolved,
          bonusApplied: round.bonusApplied,
        },
      };
    }

    function isValidTeam(team) {
      return isText(team?.id) && isText(team?.name) && isInt(team?.points, 0, Number.MAX_SAFE_INTEGER);
    }

    function isValidWordResult(entry) {
      return isText(entry?.keyword) && isInt(entry?.bet, 0, maxBet) && typeof entry?.success === "boolean";
    }

    function isValidRound(round, expectedEnigmaId) {
      return (
        phases.includes(round?.phase) &&
        round.enigmaId === expectedEnigmaId &&
        isInt(round.bricksRemaining, 0, startingBricks) &&
        isInt(round.currentWordIndex, 0, keywordCount) &&
        typeof round.currentBet === "string" &&
        /^\d*$/.test(round.currentBet) &&
        Array.isArray(round.wordResults) &&
        round.wordResults.length === round.currentWordIndex &&
        round.wordResults.every(isValidWordResult) &&
        (round.finalSolved === null || typeof round.finalSolved === "boolean") &&
        isInt(round.bonusApplied, 0, startingBricks)
      );
    }

    function isValid(data) {
      const ids = data?.deckIds;
      return (
        data?.version === VERSION &&
        LOCALES.includes(data.locale) &&
        Array.isArray(ids) &&
        ids.length > 0 &&
        ids.every(isText) &&
        new Set(ids).size === ids.length &&
        isInt(data.deckIndex, 1, ids.length) &&
        isInt(data.activeTeamIndex, 0, 1) &&
        Array.isArray(data.teams) &&
        data.teams.length === 2 &&
        data.teams.every(isValidTeam) &&
        isValidRound(data.round, ids[data.deckIndex - 1])
      );
    }

    function save(session, round) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot(session, round)));
      } catch {
        // Storage full or blocked: the match keeps running unsaved.
      }
    }

    function clear() {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Storage blocked: nothing to delete.
      }
    }

    function load() {
      try {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
        if (isValid(data)) return data;
      } catch {
        // Corrupt JSON: dropped below.
      }
      clear();
      return null;
    }

    // Returns null when the saved enigma ids no longer exist in the deck data.
    function restore(data, validDeck) {
      const byId = new Map(validDeck.map((enigma) => [enigma.id, enigma]));
      const deck = data.deckIds.map((id) => byId.get(id));
      if (deck.some((enigma) => !enigma)) return null;

      const { enigmaId, ...round } = data.round;
      return {
        session: {
          locale: data.locale,
          deck,
          deckIndex: data.deckIndex,
          activeTeamIndex: data.activeTeamIndex,
          teams: data.teams.map((team) => ({ ...team })),
        },
        round: { ...round, enigma: byId.get(enigmaId), wordResults: round.wordResults.map((entry) => ({ ...entry })) },
      };
    }

    return { save, load, clear, restore };
  }

  window.PYRAMIDE_SAVE = { create };
})();
