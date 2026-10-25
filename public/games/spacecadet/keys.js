// Keyboard events the WASM/SDL2 build listens for on window.
export const KEYS = {
  left: { key: "z", code: "KeyZ", keyCode: 90 },
  plunge: { key: " ", code: "Space", keyCode: 32 },
  right: { key: "/", code: "Slash", keyCode: 191 },
  newgame: { key: "F2", code: "F2", keyCode: 113 },
  pause: { key: "F3", code: "F3", keyCode: 114 },
  tilt: { key: "x", code: "KeyX", keyCode: 88 }
};

export function emitKey(type, spec) {
  const event = new KeyboardEvent(type, {
    key: spec.key,
    code: spec.code,
    keyCode: spec.keyCode,
    which: spec.keyCode,
    bubbles: true,
    cancelable: true
  });
  patchLegacyCodes(event, spec.keyCode);
  window.dispatchEvent(event);
}

function patchLegacyCodes(event, keyCode) {
  try {
    Object.defineProperty(event, "keyCode", {
      configurable: true,
      get: () => keyCode
    });
    Object.defineProperty(event, "which", {
      configurable: true,
      get: () => keyCode
    });
  } catch {
    // Chromium already exposes keyCode from the constructor.
  }
}
