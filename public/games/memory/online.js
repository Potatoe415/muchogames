import { NAME_MAX, ONLINE_SEAT_KEY } from "./config.js";
import { buildDeck } from "./deck.js";
import { deckUrls } from "./faces.js";
import { preload } from "./preload.js";
import { createState } from "./reducer.js";
import { packWire, readWire } from "./wire.js";

const ROOM = window.MuchogamesRoom;
const GAME_ID = "memory";

const ERRORS = {
  "invalid-code": "errCode",
  "game-not-found": "errMissing",
  "game-expired": "errExpired",
  expired: "errExpired",
  "game-in-progress": "errFull",
  "resume-denied": "errFull",
  replaced: "errFull",
  missing: "errClosed"
};

export function idleOnline(error = "") {
  return { status: "idle", code: "", seat: null, error, note: "" };
}

function ownName() {
  const name = window.PlayerProfile?.getName("") || "";
  return name.trim().slice(0, NAME_MAX);
}

function forget() {
  ROOM.clearSeat(ONLINE_SEAT_KEY);
  ROOM.clearLinkedCode();
}

// Room lifecycle for the online mode: create / join / resume, the waiting
// screen, the coin, and the board sync. `enter(state)` mounts the match,
// `exit()` returns to the setup after the opponent left.
export function createOnline({ page, paint, show, enter, exit, text }) {
  const client = ROOM?.create(GAME_ID);
  let charge = null;
  let building = false;
  let stash = null;

  function reset(error = "") {
    charge = null;
    building = false;
    stash = null;
    page.online = idleOnline(error);
  }

  function names() {
    const list = page.names.slice();
    list[page.online.seat] = ownName();
    return list;
  }

  function publish(state) {
    if (!page.online.code || !state) return;
    client.publish(page.online.code, () => packWire(state, names()));
  }

  function adopt(data) {
    Object.assign(page.online, {
      code: data.code,
      seat: data.localPlayerIndex
    });
    ROOM.writeSeat(ONLINE_SEAT_KEY, {
      gameCode: data.code,
      role: data.role,
      resumeToken: data.resumeToken,
      localPlayerIndex: data.localPlayerIndex
    });
    ROOM.setLinkedCode(data.code);
  }

  function fail(error) {
    forget();
    reset(ERRORS[error?.code] || "errGeneric");
    show("setup");
    paint();
  }

  function freshState() {
    const config = { ...page.setup, mode: "online" };
    return createState(config, buildDeck(config.grid, config.theme));
  }

  async function start(state, fresh) {
    const { code } = page.online;
    building = true;
    page.online.status = "playing";
    page.seat = page.online.seat;
    paint();
    await preload(deckUrls(state.config, state.cards));
    building = false;
    if (page.online.code !== code) return;
    enter(state);
    if (fresh) publish(state);
    if (stash && client.pendingWrites() === 0) page.match?.apply(stash);
    stash = null;
  }

  function onBoard(record) {
    const remote = record.gameState ? readWire(record.gameState) : null;
    if (remote) {
      page.names = remote.names;
      page.names[page.online.seat] = ownName();
    }
    if (building) {
      if (remote) stash = remote.state;
      return;
    }
    if (!page.match) {
      if (remote) return void start(remote.state, false);
      if (page.online.seat === 0) return void start(freshState(), true);
      page.online.status = "starting";
      paint();
      return;
    }
    if (remote && client.pendingWrites() === 0) page.match.apply(remote.state);
  }

  async function onRecord(record) {
    if (record.status === "waiting") {
      if (page.online.status !== "waiting") {
        page.online.status = "waiting";
        paint();
      }
      return;
    }
    charge ??= ROOM.chargeOnce(GAME_ID, record.code);
    const allowed = await charge;
    if (page.online.code !== record.code) return;
    if (!allowed) {
      await leave();
      show("setup");
      paint();
      return;
    }
    onBoard(record);
  }

  function onClosed({ reason }) {
    forget();
    const ended = page.ended;
    reset(ended ? "" : ERRORS[reason] || "errClosed");
    if (!ended) exit();
  }

  const callbacks = () => ({
    stateChangeCallback: (record) => void onRecord(record),
    gameClosedCallback: onClosed
  });

  async function create() {
    if (!client || page.online.status !== "idle") return;
    Object.assign(page.online, { status: "creating", error: "", seat: 0 });
    show("wait");
    paint();
    try {
      adopt(await client.createGame(callbacks()));
      paint();
    } catch (error) {
      fail(error);
    }
  }

  async function join(raw) {
    if (!client || page.online.status !== "idle") return;
    const code = ROOM.normalizeCode(raw);
    if (code.length !== ROOM.CODE_LENGTH) {
      page.online.error = "errCode";
      paint();
      return;
    }
    const known = ROOM.readSeat(ONLINE_SEAT_KEY);
    const seat = known?.gameCode === code ? known.localPlayerIndex : 1;
    Object.assign(page.online, { status: "joining", code, seat, error: "" });
    show("wait");
    paint();
    try {
      const seatProof = ROOM.seatFor(ONLINE_SEAT_KEY, code);
      adopt(await client.joinGame(code, callbacks(), seatProof));
    } catch (error) {
      fail(error);
    }
  }

  function restore() {
    const seat = client && ROOM.readSeat(ONLINE_SEAT_KEY);
    if (!seat) return false;
    page.setup.mode = "online";
    Object.assign(page.online, {
      status: "restoring",
      code: seat.gameCode,
      seat: seat.localPlayerIndex
    });
    show("wait");
    paint();
    client
      .resumeGame(seat.gameCode, seat.role, seat.resumeToken, callbacks())
      .catch(fail);
    return true;
  }

  function joinFromLink() {
    const code = client ? ROOM.linkedCode() : "";
    if (!code) return false;
    page.setup.mode = "online";
    void join(code);
    return true;
  }

  async function share() {
    try {
      const outcome = await ROOM.share({
        title: text("title"),
        text: text("shareText"),
        url: ROOM.shareUrl(page.online.code)
      });
      if (outcome === "copied") page.online.note = "copied";
    } catch {
      page.online.note = "errShare";
    }
    paint();
  }

  async function leave() {
    const active = page.online.status !== "idle";
    forget();
    reset();
    if (!active) return;
    await client.leaveGame({ deleteCurrent: true }).catch(() => {});
  }

  // A finished room is left without deleting it, so the opponent keeps the
  // end screen instead of being told the room closed.
  async function ended() {
    const code = page.online.code;
    if (!code) return;
    await client.flush();
    if (page.online.code !== code) return;
    forget();
    reset();
    await client.leaveGame().catch(() => {});
  }

  return { create, join, restore, joinFromLink, share, leave, ended, publish };
}
