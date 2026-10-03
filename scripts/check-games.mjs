// Enforces docs/PLATFORM_RULES.md for every game in public/hub-config.json.
// Known gaps of existing games live in check-games.baseline.json: a new
// violation fails, and so does a baseline entry that no longer occurs, so the
// baseline can only shrink.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BASELINE_FILE = join(ROOT, "scripts", "check-games.baseline.json");
const SKIP_DIRS = new Set([
  "node_modules",
  ".next",
  ".turbo",
  ".vercel",
  "dist",
  "docs",
  "vendor"
]);
const SKIP_FILES = new Set(["package-lock.json"]);
const CODE_EXTENSIONS = new Set([
  ".js",
  ".mjs",
  ".cjs",
  ".ts",
  ".tsx",
  ".html",
  ".json",
  ".css",
  ".sql"
]);

const CHROME_IDS = [
  "game-back-button",
  "game-options-button",
  "game-options-panel",
  "game-options-language",
  "game-options-rules"
];
const APP_CHROME_IDS = ["game-back-button", "game-options-button"];
const PAGE_INCLUDES = {
  "shared/css/game-header.css": "loads-game-header-css",
  "shared/js/game-header.js": "loads-game-header-js",
  "shared/js/game-session.js": "loads-game-session-js"
};
const PAGE_CALLS = {
  "initOptionsPanel(": "wires-options-panel",
  "MuchogamesMatch.start(": "starts-match",
  "MuchogamesMatch.finish(": "finishes-match"
};
const APP_MATCH_CALL = "start_muchogames_match";
const URL_SCAN_ROOTS = [
  "public",
  "shared",
  "api",
  "apps/coinchapp",
  "apps/tranquil"
];
const VERCEL_HOST = /[a-z0-9-]+\.vercel\.app/gi;

function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      return SKIP_DIRS.has(name) || name.startsWith(".") ? [] : walk(path);
    }
    const isCode = CODE_EXTENSIONS.has(extname(name)) && !SKIP_FILES.has(name);
    return isCode ? [path] : [];
  });
}

// Windows editors may prepend a byte-order mark, which JSON.parse rejects.
function readJson(file) {
  return JSON.parse(readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
}

function readAll(files) {
  return files.map((file) => readFileSync(file, "utf8")).join("\n");
}

function hasId(text, id) {
  return new RegExp(`["'\`]${id}["'\`]`).test(text);
}

function pageSources(game) {
  if (game.kind === "wordpack") {
    return {
      html: join(ROOT, "wordplayer.html"),
      scripts: [join(ROOT, "wordplayer.js")]
    };
  }
  const html = join(ROOT, "public", game.launch.split("?")[0]);
  const scripts = walk(dirname(html)).filter((f) => extname(f) === ".js");
  return { html, scripts };
}

function checkPage(game) {
  const { html, scripts } = pageSources(game);
  if (!existsSync(html)) return ["missing-page"];
  const page = readFileSync(html, "utf8");
  const all = `${page}\n${readAll(scripts)}`;
  return [
    ...Object.entries(PAGE_INCLUDES)
      .filter(([include]) => !page.includes(include))
      .map(([, rule]) => rule),
    ...Object.entries(PAGE_CALLS)
      .filter(([call]) => !all.includes(call))
      .map(([, rule]) => rule),
    ...CHROME_IDS.filter((id) => !hasId(all, id)).map((id) => `has-${id}`)
  ];
}

function checkApp(game) {
  const text = readAll(walk(join(ROOT, game.source)));
  if (!text) return ["missing-source"];
  return [
    ...(text.includes(APP_MATCH_CALL) ? [] : ["starts-match"]),
    ...APP_CHROME_IDS.filter((id) => !hasId(text, id)).map((id) => `has-${id}`)
  ];
}

function checkGame(game) {
  if (game.coinPolicy === "launch") {
    return game.kind === "external"
      ? []
      : ["coin-policy-launch-is-external-only"];
  }
  if (game.kind === "external") {
    return game.source
      ? checkApp(game)
      : ["external-needs-coin-policy-or-source"];
  }
  return checkPage(game);
}

function checkUrls() {
  const rootFiles = readdirSync(ROOT)
    .map((name) => join(ROOT, name))
    .filter(
      (path) => statSync(path).isFile() && CODE_EXTENSIONS.has(extname(path))
    );
  const files = [
    ...rootFiles,
    ...URL_SCAN_ROOTS.flatMap((dir) => walk(join(ROOT, dir)))
  ];
  return files.flatMap((file) => {
    const hosts = new Set(readFileSync(file, "utf8").match(VERCEL_HOST) || []);
    const path = relative(ROOT, file).replaceAll("\\", "/");
    return [...hosts].map(
      (host) => `url: ${path} references ${host.toLowerCase()}`
    );
  });
}

function collectViolations() {
  const games = readJson(join(ROOT, "public", "hub-config.json"));
  return [
    ...games.flatMap((game) =>
      checkGame(game).map((rule) => `${game.id}: ${rule}`)
    ),
    ...checkUrls()
  ];
}

function report(title, lines) {
  if (lines.length === 0) return;
  console.error(`\n${title}`);
  lines.forEach((line) => console.error(`  - ${line}`));
}

const violations = collectViolations();
const baseline = readJson(BASELINE_FILE);
const fresh = violations.filter((v) => !baseline.includes(v));
const fixed = baseline.filter((v) => !violations.includes(v));

report("New platform-rule violations (see docs/PLATFORM_RULES.md):", fresh);
report(
  "Fixed — remove these lines from scripts/check-games.baseline.json:",
  fixed
);

if (fresh.length > 0 || fixed.length > 0) process.exit(1);
console.log(
  `check-games: OK (${baseline.length} known gaps left in the baseline)`
);
