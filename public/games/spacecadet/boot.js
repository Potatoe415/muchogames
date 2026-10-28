// Emscripten Module object. Classic script, before the WASM glue.
const scStatus = document.querySelector("[data-id='spacecadet-status']");
const scProgress = document.querySelector("[data-id='spacecadet-progress']");
const scCanvas = document.getElementById("canvas");

// score.js copies pixels out of the WebGL canvas between frames.
const scGetContext = HTMLCanvasElement.prototype.getContext;
HTMLCanvasElement.prototype.getContext = function getContext(type, attrs) {
  if (this === scCanvas && String(type).startsWith("webgl")) {
    attrs = Object.assign({}, attrs, { preserveDrawingBuffer: true });
  }
  return scGetContext.call(this, type, attrs);
};

function scLogTo(method) {
  return function print(text) {
    const line =
      arguments.length > 1
        ? Array.prototype.slice.call(arguments).join(" ")
        : text;
    console[method](line);
  };
}

function scOnContextLost(event) {
  event.preventDefault();
  window.alert("WebGL context lost. You will need to reload the page.");
}

function scSetPads(ready) {
  document.querySelectorAll("[data-key]").forEach((el) => {
    el.disabled = !ready;
  });
}

function scApplyStatus(text, match) {
  if (match) {
    scProgress.value = 100 * parseInt(match[2], 10);
    scProgress.max = 100 * parseInt(match[4], 10);
    scProgress.hidden = false;
    text = match[1];
  } else {
    scProgress.hidden = true;
    scCanvas.style.display = "";
    scSetPads(true);
  }
  scStatus.textContent = text;
  scStatus.hidden = text === "";
}

function scSetStatus(text) {
  const last = window.Module.setStatus.last || { time: 0, text: "" };
  window.Module.setStatus.last = last;
  if (text === last.text) return;
  const match = text.match(/([^(]+)\((\d+(\.\d+)?)\/(\d+)\)/);
  const now = Date.now();
  if (match && now - last.time < 30) return;
  last.time = now;
  last.text = text;
  scApplyStatus(text, match);
}

function scMonitorRunDependencies(left) {
  this.totalDependencies = Math.max(this.totalDependencies, left);
  const done = this.totalDependencies - left;
  window.Module.setStatus(
    left
      ? "Preparing... (" + done + "/" + this.totalDependencies + ")"
      : "All downloads complete."
  );
}

function scOnWindowError() {
  window.Module.setStatus(scStatus.dataset.error || "Exception thrown");
  window.Module.setStatus = function silence(text) {
    if (text) window.Module.printErr("[post-exception status] " + text);
  };
}

window.Module = {
  preRun: [],
  postRun: [],
  print: scLogTo("log"),
  printErr: scLogTo("error"),
  canvas: scCanvas,
  setStatus: scSetStatus,
  totalDependencies: 0,
  monitorRunDependencies: scMonitorRunDependencies,
  locateFile(path) {
    return "vendor/" + path.replace(/^vendor\//, "");
  }
};

scSetPads(false);
scCanvas.addEventListener("contextmenu", (event) => event.preventDefault());
scCanvas.addEventListener("webglcontextlost", scOnContextLost, false);
window.Module.setStatus(scStatus.dataset.loading || "Downloading...");
window.onerror = scOnWindowError;
