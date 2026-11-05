// Game Dashboard settings -> window.CafardsSetup: read / write the four
// number inputs and the red-light toggle, the − / + steppers (touch and the
// remote never need to type), and the red-light countdown of a turn.
(function () {
  const isOn = (toggle) => toggle.getAttribute("aria-pressed") === "true";

  function readNumber(input, fallback) {
    const value = Number(input.value);
    return Number.isFinite(value) && input.value !== "" ? value : fallback;
  }

  function renderTimerToggle(el, t) {
    const on = isOn(el.timerEnabled);
    el.timerEnabled.textContent = t(on ? "lightOn" : "lightOff");
    el.timerSeconds.disabled = !on;
    el.steps.filter((b) => b.dataset.target === "timerSeconds").forEach((b) => (b.disabled = !on));
  }

  function readConfig(el, config) {
    const count = Math.min(8, Math.max(2, Math.round(readNumber(el.playerCount, 4))));
    config.count = count;
    config.deckSize = Math.min(256, Math.max(32, readNumber(el.deckSize, 128)));
    config.winners = Math.min(count, Math.max(1, Math.round(readNumber(el.winnersCount, 1))));
    config.timerOn = isOn(el.timerEnabled);
    config.timerMs = Math.min(5000, Math.max(500, readNumber(el.timerSeconds, 1.5) * 1000));
  }

  function writeConfig(el, config, t) {
    el.playerCount.value = config.count;
    el.deckSize.value = config.deckSize;
    el.winnersCount.value = config.winners;
    el.timerSeconds.value = config.timerMs / 1000;
    el.timerEnabled.setAttribute("aria-pressed", String(config.timerOn));
    renderTimerToggle(el, t);
  }

  function stepInput(el, button) {
    const input = document.getElementById(button.dataset.target);
    const step = Number(input.step) || 1;
    const value = readNumber(input, Number(input.min)) + step * Number(button.dataset.dir);
    const cap = input === el.winnersCount ? readNumber(el.playerCount, 8) : Infinity;
    input.value = String(Math.min(Number(input.max), cap, Math.max(Number(input.min), value)));
  }

  function bind(el, t) {
    el.steps.forEach((button) => button.addEventListener("click", () => stepInput(el, button)));
    el.timerEnabled.addEventListener("click", () => {
      el.timerEnabled.setAttribute("aria-pressed", String(!isOn(el.timerEnabled)));
      renderTimerToggle(el, t);
    });
  }

  // One turn's red light: a countdown, then the light turns on.
  const timer = { id: null, tickId: null };

  function clearTimer() {
    clearTimeout(timer.id);
    clearInterval(timer.tickId);
    timer.id = null;
    timer.tickId = null;
  }

  function startTimer(el, config, t) {
    clearTimer();
    el.timerLight.classList.remove("on");
    if (!config.timerOn) {
      el.timerText.textContent = t("timerOff");
      return;
    }
    const deadline = Date.now() + config.timerMs;
    const update = () => {
      const remaining = Math.max(0, deadline - Date.now());
      el.timerText.textContent = t("alertIn", { value: (remaining / 1000).toFixed(1) });
    };
    update();
    timer.tickId = setInterval(update, 100);
    timer.id = setTimeout(() => {
      clearInterval(timer.tickId);
      timer.tickId = null;
      el.timerLight.classList.add("on");
      el.timerText.textContent = t("timeUp");
    }, config.timerMs);
  }

  window.CafardsSetup = { bind, readConfig, writeConfig, renderTimerToggle, clearTimer, startTimer };
})();
