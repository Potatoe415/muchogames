import { NAME_MAX, ONLINE_SEAT_KEY } from "./config.js";

const ROOM = window.MuchogamesRoom;

export const ERRORS = {
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
  return {
    status: "idle",
    code: "",
    seat: null,
    error,
    note: "",
    away: false
  };
}

export function ownName() {
  const name = window.PlayerProfile?.getName("") || "";
  return name.trim().slice(0, NAME_MAX);
}

export const readSeat = () => ROOM?.readSeat(ONLINE_SEAT_KEY) ?? null;

export const seatProof = (code) => ROOM.seatFor(ONLINE_SEAT_KEY, code);

export function forget() {
  ROOM.clearSeat(ONLINE_SEAT_KEY);
  ROOM.clearLinkedCode();
}

export function storeSeat(data) {
  ROOM.writeSeat(ONLINE_SEAT_KEY, {
    gameCode: data.code,
    role: data.role,
    resumeToken: data.resumeToken,
    localPlayerIndex: data.localPlayerIndex
  });
}
