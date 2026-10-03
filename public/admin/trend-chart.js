const Y_TICKS = 4;
const MAX_X_LABELS = 8;
const SVG_NS = "http://www.w3.org/2000/svg";

/**
 * Draws the daily matches-started trend as one SVG polyline.
 *
 * The viewBox is a fixed 0-100 square stretched by preserveAspectRatio="none",
 * so points are plotted as percentages and the chart follows its container with
 * no resize listener. Strokes carry vector-effect="non-scaling-stroke" so they
 * stay thin despite that non-uniform stretch.
 */
export function renderTrendChart(container, points) {
  if (points.length === 0) {
    container.replaceChildren();
    return;
  }

  const peak = Math.max(1, ...points.map((point) => point.matches));
  const ticks = tickValues(peak);

  container.replaceChildren(
    buildYAxis(ticks),
    buildPlot(toCoordinates(points, peak), ticks.length)
  );
}

function toCoordinates(points, peak) {
  return points.map((point, index) => ({
    x: points.length > 1 ? (index / (points.length - 1)) * 100 : 50,
    y: 100 - (point.matches / peak) * 100,
    point
  }));
}

// Capped at peak + 1 values so a peak of 1 gives "1, 0" rather than repeating
// the same rounded number four times.
function tickValues(peak) {
  const count = Math.min(Y_TICKS, peak + 1);

  return Array.from({ length: count }, (unused, index) =>
    Math.round((peak * (count - 1 - index)) / (count - 1))
  );
}

function buildYAxis(ticks) {
  const axis = createDiv("admin-trend-y", "admin-trend-y-axis");

  ticks.forEach((value) => {
    const label = document.createElement("span");
    label.textContent = value;
    axis.appendChild(label);
  });

  return axis;
}

function buildPlot(coords, tickCount) {
  const plot = createDiv("admin-trend-plot", "admin-trend-plot");
  const canvas = createDiv("admin-trend-canvas");
  const marker = createDiv("admin-trend-marker");
  const tooltip = createDiv("admin-trend-tooltip", "admin-trend-tooltip");

  marker.hidden = true;
  tooltip.hidden = true;

  canvas.append(buildSvg(coords, tickCount), marker, tooltip);
  wireHover(canvas, coords, marker, tooltip);
  plot.append(canvas, buildXAxis(coords));

  return plot;
}

function buildSvg(coords, tickCount) {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", "0 0 100 100");
  svg.setAttribute("preserveAspectRatio", "none");
  svg.setAttribute("aria-hidden", "true");

  for (let index = 0; index < tickCount; index += 1) {
    svg.appendChild(buildGridLine((index / (tickCount - 1)) * 100));
  }

  svg.appendChild(buildPolyline(coords));

  return svg;
}

function buildGridLine(y) {
  const line = document.createElementNS(SVG_NS, "line");
  line.setAttribute("class", "admin-trend-grid");
  line.setAttribute("x1", "0");
  line.setAttribute("x2", "100");
  line.setAttribute("y1", y);
  line.setAttribute("y2", y);
  line.setAttribute("vector-effect", "non-scaling-stroke");
  return line;
}

function buildPolyline(coords) {
  const polyline = document.createElementNS(SVG_NS, "polyline");
  polyline.setAttribute("class", "admin-trend-line");
  polyline.setAttribute(
    "points",
    coords.map(({ x, y }) => `${x},${y}`).join(" ")
  );
  polyline.setAttribute("vector-effect", "non-scaling-stroke");
  return polyline;
}

// Labels are absolutely positioned at their own x, so thinning them out keeps
// each one aligned with its point instead of drifting.
function buildXAxis(coords) {
  const axis = createDiv("admin-trend-x", "admin-trend-x-axis");
  const step = Math.ceil(coords.length / MAX_X_LABELS);

  coords.forEach(({ x, point }, index) => {
    if (index % step !== 0) return;

    const label = document.createElement("span");
    label.textContent = point.date.slice(5);
    label.style.left = `${x}%`;

    // The leftmost label sits at x=0, where centring would clip half of it.
    if (index === 0) {
      label.style.transform = "translateX(0)";
    }

    axis.appendChild(label);
  });

  return axis;
}

function wireHover(canvas, coords, marker, tooltip) {
  canvas.addEventListener("mousemove", (event) => {
    const bounds = canvas.getBoundingClientRect();
    if (bounds.width === 0) return;

    const fraction = (event.clientX - bounds.left) / bounds.width;
    const index = Math.round(
      Math.min(1, Math.max(0, fraction)) * (coords.length - 1)
    );

    showHover(coords[index], marker, tooltip);
  });

  canvas.addEventListener("mouseleave", () => {
    marker.hidden = true;
    tooltip.hidden = true;
  });
}

function showHover({ x, y, point }, marker, tooltip) {
  marker.hidden = false;
  marker.style.left = `${x}%`;
  marker.style.top = `${y}%`;

  tooltip.hidden = false;
  tooltip.style.left = `${x}%`;
  tooltip.style.top = `${y}%`;
  tooltip.textContent = `${point.date} · ${point.matches}`;
}

function createDiv(className, dataId) {
  const element = document.createElement("div");
  element.className = className;

  if (dataId) {
    element.dataset.id = dataId;
  }

  return element;
}
