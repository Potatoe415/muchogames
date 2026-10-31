import { buildDeck } from "./deck.js";
import { deckUrls } from "./faces.js";
import {
  ERRORS,
  forget,
  idleOnline,
  ownName,
  readSeat,
  seatProof,
  storeSeat
} from "./online-seat.js";
import { preload } from "./preload.js";
import { createState } from "./reducer.js";
import { packWire, readWire, sameBoard } from "./wire.js";

const ROOM = window.MuchogamesRoom;
const GAME_ID = "memory";

// Room lifecycle for the online mode: create / join / resume, the waiting
// screen, the coin, the board sync and the away notices. `enter(state)` mounts
// the match, `exit()` returns to the setup after the room closed.
export function createOnline({
  page,
  paint,
  repaint,
  show,
  enter,
  exit,
  text
}) {
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

  function notify(kind) {
    if (page.online.status !== "playing" || !page.match || page.ended) return;
    client.sendNotice({ kind, seat: page.online.seat });
  }

  function onNotice(payload) {
    if (page.online.status !== "playing") return;
    if (payload?.seat !== 1 - page.online.seat) return;
    if (payload.kind !== "away" && payload.kind !== "back") return;
    page.online.away = payload.kind === "away";
    repaint();
  }

  function adopt(data) {
    Object.assign(page.online, {
      code: data.code,
      seat: data.localPlayerIndex
    });
    storeSeat(data);
    ROOM.setLinkedCode(data.code);
  }

  // A failed join of another code keeps the seat stored for an earlier room.
  function fail(error) {
    if (page.online.status === "idle") return;
    if (readSeat()?.gameCode === page.online.code) forget();
    else ROOM.clearLinkedCode();
    reset(ERRORS[error?.code] || "errGeneric");
    show("setup");
  }

  // Cancelled while the request was in flight: stop listening, keep the seat.
  function cancelled(data) {
    if (page.online.status !== "idle") return false;
    if (data) storeSeat(data);
    void client.leaveGame().catch(() => {});
    paint();
    return true;
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
    notify("back");
  }

  function sync(remote) {
    if (client.pendingWrites() > 0) return;
    if (page.online.away && !sameBoard(page.state, remote)) {
      page.online.away = false;
    }
    page.match.apply(remote);
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
    if (remote) sync(remote.state);
  }

  async function onRecord(record) {
    if (page.online.status === "idle") return;
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
    gameClosedCallback: onClosed,
    noticeReceivedCallback: onNotice
  });

  async function create() {
    if (!client || page.online.status !== "idle") return;
    Object.assign(page.online, { status: "creating", error: "", seat: 0 });
    show("wait");
    try {
      const data = await client.createGame(callbacks());
      if (cancelled()) return;
      adopt(data);
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
    const known = readSeat();
    const seat = known?.gameCode === code ? known.localPlayerIndex : 1;
    Object.assign(page.online, { status: "joining", code, seat, error: "" });
    show("wait");
    try {
      const data = await client.joinGame(code, callbacks(), seatProof(code));
      if (!cancelled(data)) adopt(data);
    } catch (error) {
      fail(error);
    }
  }

  const storedCode = () => (client && readSeat()?.gameCode) || "";

  function resume() {
    const seat = client && readSeat();
    if (!seat || page.online.status !== "idle") return;
    page.setup.mode = "online";
    Object.assign(page.online, {
      status: "restoring",
      code: seat.gameCode,
      seat: seat.localPlayerIndex
    });
    ROOM.setLinkedCode(seat.gameCode);
    show("wait");
    client
      .resumeGame(seat.gameCode, seat.role, seat.resumeToken, callbacks())
      .then(() => cancelled())
      .catch(fail);
  }

  // A link to the stored room waits for "Reprendre" instead of rejoining.
  function joinFromLink() {
    const code = client ? ROOM.linkedCode() : "";
    if (!code || code === storedCode()) return false;
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

  // Stepping away keeps the seat and the room for "Reprendre"; the opponent is
  // told and waits. A room nobody joined yet is deleted.
  async function away() {
    const { status } = page.online;
    if (status === "idle") return;
    if (status === "creating" || status === "waiting") return leave();
    if (page.ended) forget();
    else notify("away");
    ROOM.clearLinkedCode();
    reset();
    await client.leaveGame().catch(() => {});
  }

  const presence = (visible) => notify(visible ? "back" : "away");

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

  return {
    create,
    join,
    resume,
    storedCode,
    joinFromLink,
    share,
    leave,
    away,
    presence,
    ended,
    publish
  };
}
