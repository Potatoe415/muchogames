(function attachOnlineRoom(global) {
  const SUPABASE_JS_URL = "https://esm.sh/@supabase/supabase-js@2";
  // Public Supabase project values (safe to expose to the browser): access to
  // room rows is blocked by Row Level Security, not by keeping these secret.
  // This project ("multigames-db") is shared with coinchapp.
  const SUPABASE_CONFIG = {
    url: "https://bpkituleqxhpqoojfegu.supabase.co",
    anonKey: "sb_publishable_es6QfUaGUyVaS0nwmWg5bA_JRleLqBH"
  };
  const GAME_TTL_MS = 10800000;
  const CODE_LENGTH = 3;
  const POLL_INTERVAL_MS = 15000;
  const LINK_PARAM = "game";

  let supabaseClientPromise = null;

  function createRoomError(code, message) {
    const error = new Error(message);
    error.code = code;
    return error;
  }

  function normalizeCode(code) {
    return String(code || "")
      .trim()
      .toUpperCase()
      .replace(/[^A-Z]/g, "")
      .slice(0, CODE_LENGTH);
  }

  function loadSupabaseClient() {
    if (!supabaseClientPromise) {
      supabaseClientPromise = import(SUPABASE_JS_URL).then(({ createClient }) =>
        createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey)
      );
    }

    return supabaseClientPromise;
  }

  function create(gameId) {
    const apiBase = `/api/rooms/${encodeURIComponent(gameId)}`;
    let activeChannel = null;
    let activePollTimer = null;
    let activeVisibilityHandler = null;
    let activeCode = "";
    let activeSession = null;
    let lastKnownVersion = -1;
    let writeChain = Promise.resolve();
    let pendingWrites = 0;

    async function request(method, path, body) {
      const response = await fetch(`${apiBase}${path}`, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        const errorInfo = payload?.error || {};
        throw createRoomError(
          errorInfo.code || "server-error",
          errorInfo.message || "Matchmaking request failed."
        );
      }

      return payload;
    }

    function fetchAuthorizedState(code, sessionSeat) {
      if (sessionSeat?.role && sessionSeat?.resumeToken) {
        return request("POST", `/${code}/resume`, {
          role: sessionSeat.role,
          resumeToken: sessionSeat.resumeToken
        });
      }

      return request("GET", `/${code}`);
    }

    function stopListening() {
      if (activeChannel) {
        activeChannel.unsubscribe();
        activeChannel = null;
      }

      if (activePollTimer) {
        clearInterval(activePollTimer);
        activePollTimer = null;
      }

      if (activeVisibilityHandler) {
        document.removeEventListener(
          "visibilitychange",
          activeVisibilityHandler
        );
        activeVisibilityHandler = null;
      }

      activeCode = "";
      activeSession = null;
    }

    async function startListening(code, callbacks = {}, sessionSeat = null) {
      stopListening();
      activeCode = code;
      activeSession = sessionSeat;
      lastKnownVersion = -1;

      let started = false;

      async function refetch() {
        let record;

        try {
          record = await fetchAuthorizedState(code, sessionSeat);
        } catch (error) {
          const reason = {
            "game-not-found": "missing",
            "game-expired": "expired",
            "resume-denied": "replaced"
          }[error.code];

          if (reason && activeCode === code) {
            stopListening();
            callbacks.gameClosedCallback?.({ code, reason });
          }

          return; // Transient/network error: the next tick or poll will retry.
        }

        if (activeCode !== code) {
          return;
        }

        // refetch() is triggered from four independent sources (poll timer,
        // tab visibility, the postgres_changes INSERT, and the broadcast
        // "tick"), so several requests can be in flight at once with no
        // ordering guarantee. `version` only ever increases server-side, so
        // any response carrying a version we've already moved past (including
        // our own last write, see publish) is stale and gets discarded.
        if (Number.isInteger(record.version)) {
          if (record.version < lastKnownVersion) {
            return;
          }

          lastKnownVersion = record.version;
        }

        callbacks.stateChangeCallback?.(record);

        if (record.status === "playing" && !started) {
          started = true;
          callbacks.startGameCallback?.(record);
        }
      }

      activeVisibilityHandler = () => {
        if (document.visibilityState === "visible") {
          refetch();
        }
      };
      document.addEventListener("visibilitychange", activeVisibilityHandler);
      activePollTimer = setInterval(refetch, POLL_INTERVAL_MS);

      const supabase = await loadSupabaseClient();

      if (activeCode !== code) {
        return;
      }

      activeChannel = supabase
        .channel(`yatzy-game-${code}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "yatzy_game_events",
            filter: `game_code=eq.${code}`
          },
          refetch
        )
        .on("broadcast", { event: "tick" }, refetch)
        .on("broadcast", { event: "emoji" }, ({ payload }) => {
          callbacks.emojiReceivedCallback?.(payload);
        })
        .on("broadcast", { event: "notice" }, ({ payload }) => {
          callbacks.noticeReceivedCallback?.(payload);
        })
        .subscribe();

      await refetch();
    }

    function checkedCode(code) {
      const normalizedCode = normalizeCode(code);

      if (normalizedCode.length !== CODE_LENGTH) {
        throw createRoomError(
          "invalid-code",
          "Game code must contain exactly 3 letters."
        );
      }

      return normalizedCode;
    }

    async function createGame(callbacks = {}) {
      const data = await request("POST", "");

      await startListening(data.code, callbacks, {
        role: "creator",
        resumeToken: data.resumeToken
      });

      return data;
    }

    // `seat` lets a player who already holds credentials for this room reclaim
    // their own seat. Without it, joining a room that is already playing is
    // refused, since both seats are taken.
    async function joinGame(code, callbacks = {}, seat = null) {
      const normalizedCode = checkedCode(code);
      const credentials =
        seat?.role && seat?.resumeToken
          ? { role: seat.role, resumeToken: seat.resumeToken }
          : undefined;

      const data = await request(
        "POST",
        `/${normalizedCode}/join`,
        credentials
      );

      await startListening(normalizedCode, callbacks, {
        role: data.role,
        resumeToken: data.resumeToken
      });

      return data;
    }

    async function resumeGame(code, role, resumeToken, callbacks = {}) {
      const normalizedCode = checkedCode(code);

      if (!role || !resumeToken) {
        throw createRoomError("resume-denied", "Missing resume credentials.");
      }

      const data = await request("POST", `/${normalizedCode}/resume`, {
        role,
        resumeToken
      });

      await startListening(normalizedCode, callbacks, { role, resumeToken });

      return {
        code: data.code,
        status: data.status,
        gameState: data.gameState
      };
    }

    async function writeState(code, stateObject) {
      if (!activeSession || code !== activeCode) {
        throw createRoomError(
          "resume-denied",
          "No active session for this game."
        );
      }

      const result = await request("PUT", `/${code}/state`, {
        role: activeSession.role,
        resumeToken: activeSession.resumeToken,
        gameState: JSON.parse(JSON.stringify(stateObject))
      });

      if (Number.isInteger(result?.version)) {
        lastKnownVersion = Math.max(lastKnownVersion, result.version);
      }

      activeChannel?.send({ type: "broadcast", event: "tick", payload: {} });
    }

    // Writes are chained, not fired in parallel: quick, repeated moves must
    // reach the server in the order they happened, otherwise an earlier request
    // finishing last could overwrite a later one. `readState` runs at send
    // time, so it always picks up the freshest local state. A failed write is
    // dropped: the listener stays authoritative and the next move publishes
    // again.
    function publish(code, readState) {
      const normalizedCode = normalizeCode(code);
      pendingWrites += 1;
      writeChain = writeChain
        .catch(() => {})
        .then(() => writeState(normalizedCode, readState()))
        .catch(() => {})
        .finally(() => {
          pendingWrites -= 1;
        });

      return writeChain;
    }

    function sendReaction(payload) {
      activeChannel?.send({ type: "broadcast", event: "emoji", payload });
    }

    function sendEmoji(seat, emoji) {
      sendReaction({ seat, kind: "emoji", emoji });
    }

    // Generic ephemeral broadcast, separate from reactions, for short one-off
    // announcements that don't map to the reaction shape.
    function sendNotice(payload) {
      activeChannel?.send({ type: "broadcast", event: "notice", payload });
    }

    async function leaveGame(options = {}) {
      const code = activeCode;
      const seat = activeSession;
      stopListening();

      if (code) {
        await request("DELETE", `/${code}`, {
          deleteCurrent: !!options.deleteCurrent,
          role: seat?.role,
          resumeToken: seat?.resumeToken
        });
      }
    }

    return {
      GAME_TTL_MS,
      normalizeCode,
      createGame,
      joinGame,
      resumeGame,
      publish,
      pendingWrites: () => pendingWrites,
      flush: () => writeChain,
      sendEmoji,
      sendReaction,
      sendNotice,
      leaveGame
    };
  }

  function readJSON(key) {
    try {
      const raw = global.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function writeJSON(key, value) {
    try {
      global.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage unavailable: the seat is simply not resumable after a reload.
    }
  }

  function readSeat(key) {
    const seat = readJSON(key);
    const valid =
      seat?.gameCode &&
      seat?.role &&
      seat?.resumeToken &&
      Number.isInteger(seat?.localPlayerIndex);
    return valid ? seat : null;
  }

  function writeSeat(key, seat) {
    writeJSON(key, {
      gameCode: seat.gameCode,
      role: seat.role,
      resumeToken: seat.resumeToken,
      localPlayerIndex: seat.localPlayerIndex
    });
  }

  function clearSeat(key) {
    try {
      global.localStorage.removeItem(key);
    } catch {
      // Storage unavailable.
    }
  }

  // A room that is already playing has both seats taken, so joining it by code
  // only works for a player reclaiming the seat they already hold.
  function seatFor(key, code) {
    const seat = readSeat(key);

    if (!seat || seat.gameCode !== code) {
      return null;
    }

    return { role: seat.role, resumeToken: seat.resumeToken };
  }

  function linkedCode() {
    const params = new URLSearchParams(global.location.search);
    const code = normalizeCode(params.get(LINK_PARAM) || "");
    return code.length === CODE_LENGTH ? code : "";
  }

  function shareUrl(code) {
    const url = new URL(global.location.href);
    url.searchParams.set(LINK_PARAM, code);
    return url.toString();
  }

  function setLinkedCode(code) {
    global.history.replaceState({}, "", shareUrl(code));
  }

  function clearLinkedCode() {
    const url = new URL(global.location.href);

    if (!url.searchParams.has(LINK_PARAM)) {
      return;
    }

    url.searchParams.delete(LINK_PARAM);
    global.history.replaceState({}, "", url);
  }

  // Resolves "shared", "copied", "prompted" or "aborted"; rejects when every
  // channel failed.
  async function share({ title, text, url }) {
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
        return "shared";
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        return "copied";
      }
    } catch (error) {
      if (error?.name === "AbortError") {
        return "aborted";
      }

      throw error;
    }

    global.prompt("Copy this link", url);
    return "prompted";
  }

  // Each seat pays once per room, when the match starts (both seats filled).
  // Every online rematch opens a new room, so a code seen again here is a
  // reload/resume of the same match: no second coin. `false` = out of coins.
  async function chargeOnce(
    gameId,
    code,
    key = `muchogames-charged-room-${gameId}`
  ) {
    if (readJSON(key) === code) {
      global.MuchogamesMatch.resume(gameId);
      return true;
    }

    if (await global.MuchogamesMatch.start(gameId)) {
      writeJSON(key, code);
      return true;
    }

    return false;
  }

  global.MuchogamesRoom = {
    CODE_LENGTH,
    GAME_TTL_MS,
    normalizeCode,
    create,
    readSeat,
    writeSeat,
    clearSeat,
    seatFor,
    linkedCode,
    shareUrl,
    setLinkedCode,
    clearLinkedCode,
    share,
    chargeOnce
  };
})(window);
