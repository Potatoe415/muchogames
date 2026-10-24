// Status box (top right, Windows 3.1 style): time, distance, speed, style
// and the running course. Writes the DOM only when a value changes.
import { PX_PER_M } from "./config.js";
import { runTime } from "./course.js";

export function formatTime(seconds) {
  const total = Math.max(0, Math.floor(seconds * 100));
  const cs = String(total % 100).padStart(2, "0");
  const s = String(Math.floor(total / 100) % 60).padStart(2, "0");
  const m = String(Math.floor(total / 6000) % 60).padStart(2, "0");
  return `${Math.floor(total / 360000)}:${m}:${s}.${cs}`;
}

function courseText(game, t) {
  const run = game.course.run;
  if (!run) return "";
  const name = t(`course_${run.mode}`);
  if (run.mode === "freestyle") {
    return t("courseStyle", { name, points: game.skier.style - run.style });
  }
  return t("courseTime", {
    name,
    time: formatTime(runTime(run)),
    missed: run.missed
  });
}

export function hudView(game, t) {
  const s = game.skier;
  return {
    time: formatTime(game.time),
    dist: `${Math.round(s.y / PX_PER_M)}m`,
    speed: `${Math.round(s.speed / PX_PER_M)}m/s`,
    style: String(s.style),
    course: courseText(game, t)
  };
}

export function createHud(root) {
  const fields = {};
  root.querySelectorAll("[data-hud]").forEach((node) => {
    fields[node.dataset.hud] = node;
  });
  const courseRow = root.querySelector('[data-id="skifree-status-course"]');
  const last = {};
  return {
    update(view) {
      Object.entries(view).forEach(([key, value]) => {
        if (last[key] === value || !fields[key]) return;
        last[key] = value;
        fields[key].textContent = value;
      });
      courseRow.hidden = !view.course;
    }
  };
}
