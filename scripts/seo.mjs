// Build-time SEO for the hub, generated from public/hub-config.json so a new
// game needs no change here (decision 0066):
// - index.html: JSON-LD (WebSite + ItemList) and a crawlable list of links to
//   every game, readable without JavaScript;
// - dist/sitemap.xml and dist/llms.txt (also served by `npm run dev`);
// - dist/games/<id>/index.html: title, description, canonical, Open Graph and
//   VideoGame JSON-LD, injected into the copied page (sources stay untouched).
import { existsSync, readFileSync, writeFileSync } from "fs";
import { join, resolve } from "path";

import { TYPES, tagLabel } from "../hub-taxonomy.js";

export const SITE = "https://www.muchogames.win";
const SITE_NAME = "Muchogames";
const SITE_DESCRIPTION =
  "Jeux de société, de cartes, de soirée et d'arcade gratuits en ligne, sans inscription : échecs, belote, coinche, sudoku, quiz, Yams et plus encore.";
const LIST_MARKER = "<!-- seo:game-list -->";
const JSON_LD_MARKER = "<!-- seo:json-ld -->";
const OWN_GAME_PAGE = /^\/games\/([a-z0-9-]+)\/index\.html$/;

const ROOT = resolve(import.meta.dirname, "..");

function readGames() {
  const file = join(ROOT, "public", "hub-config.json");
  return JSON.parse(readFileSync(file, "utf8"));
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function jsonLd(data) {
  const json = JSON.stringify(data).replaceAll("<", "\\u003c");
  return `<script type="application/ld+json">${json}</script>`;
}

// Public URL of a game hosted on this site, or null for external games.
function pageUrl(game) {
  const own = OWN_GAME_PAGE.exec(game.launch);
  if (own) return `${SITE}/games/${own[1]}/`;
  if (game.launch.startsWith("/")) return `${SITE}${game.launch}`;
  return null;
}

function absolute(path) {
  return path.startsWith("http") ? path : `${SITE}${path}`;
}

function genres(game) {
  return (game.tags || []).map((tag) => tagLabel(tag, "fr"));
}

function videoGame(game, url) {
  const [min, max] = game.players || [1, 1];
  return {
    "@type": "VideoGame",
    name: game.title,
    description: game.description,
    url,
    image: absolute(game.thumbnail),
    genre: genres(game),
    gamePlatform: "Navigateur web",
    applicationCategory: "Game",
    operatingSystem: "Web",
    inLanguage: ["fr", "en", "es"],
    numberOfPlayers: {
      "@type": "QuantitativeValue",
      minValue: min,
      maxValue: max
    },
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: 0, priceCurrency: "EUR" }
  };
}

function hubJsonLd(games) {
  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: `${SITE}/`,
    description: SITE_DESCRIPTION,
    inLanguage: ["fr", "en", "es"]
  };
  const list = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Jeux gratuits en ligne sur Muchogames",
    itemListElement: games.map((game, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: videoGame(game, pageUrl(game) || `${SITE}/`)
    }))
  };
  return `${jsonLd(website)}\n    ${jsonLd(list)}`;
}

function gameLink(game) {
  const url = pageUrl(game);
  const name = escapeHtml(game.title);
  const label = url ? `<a href="${url}">${name}</a>` : name;
  return `<li data-id="hub-seo-game-${game.id}">${label}</li>`;
}

function gameList(games) {
  return [
    `<h2 class="hub-seo__title" data-id="hub-seo-title">Tous les jeux Muchogames</h2>`,
    `<p class="hub-seo__intro" data-id="hub-seo-intro">${escapeHtml(SITE_DESCRIPTION)}</p>`,
    `<ul class="hub-seo__list" data-id="hub-seo-list">${games.map(gameLink).join("")}</ul>`
  ].join("\n");
}

function transformHub(html) {
  const games = readGames();
  return html
    .replace(JSON_LD_MARKER, hubJsonLd(games))
    .replace(LIST_MARKER, gameList(games));
}

export function sitemapXml(games) {
  const urls = [`${SITE}/`, ...games.map(pageUrl).filter(Boolean)];
  const entries = urls.map(
    (url) => `  <url><loc>${escapeHtml(url)}</loc></url>`
  );
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries,
    "</urlset>",
    ""
  ].join("\n");
}

function llmsEntry(game) {
  const url = pageUrl(game);
  // External games launch from the hub tile, so point to the hub.
  const name = `[${game.title}](${url || `${SITE}/`})`;
  const [min, max] = game.players || [1, 1];
  const players =
    min === max
      ? `${min} joueur${min > 1 ? "s" : ""}`
      : `${min} à ${max} joueurs`;
  return `- ${name} : ${game.description} (${players}, ~${game.duration} min)`;
}

export function llmsTxt(games) {
  const sections = TYPES.map((type) => {
    const inType = games.filter((game) => (game.tags || [])[0] === type);
    if (!inType.length) return "";
    return `## ${tagLabel(type, "fr")}\n\n${inType.map(llmsEntry).join("\n")}\n`;
  }).filter(Boolean);
  return [
    `# ${SITE_NAME}`,
    "",
    `> ${SITE_DESCRIPTION}`,
    "",
    `Muchogames (${SITE}/) est un site gratuit de jeux jouables dans le navigateur, sur téléphone, ordinateur et TV, en français, anglais et espagnol. Aucun compte n'est nécessaire ; une connexion Google facultative garde les statistiques. Beaucoup de jeux de soirée se jouent à plusieurs sur un seul téléphone ; certains jeux de cartes et le Yams se jouent en ligne entre amis ou contre des bots.`,
    "",
    ...sections,
    ""
  ].join("\n");
}

function gameHead(game, url) {
  const title = `${game.title} — jeu gratuit en ligne | ${SITE_NAME}`;
  const description = escapeHtml(game.description);
  const image = absolute(game.thumbnail);
  return [
    `<title>${escapeHtml(title)}</title>`,
    `<meta name="description" content="${description}" />`,
    `<link rel="canonical" href="${url}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:locale" content="fr_FR" />`,
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:image" content="${image}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    jsonLd({ "@context": "https://schema.org", ...videoGame(game, url) })
  ].join("\n    ");
}

function rewriteGamePages(outDir, games) {
  games.forEach((game) => {
    const own = OWN_GAME_PAGE.exec(game.launch);
    if (!own) return;
    const file = join(outDir, "games", own[1], "index.html");
    if (!existsSync(file)) return;
    const html = readFileSync(file, "utf8");
    const head = gameHead(game, pageUrl(game));
    writeFileSync(file, html.replace(/<title>[^<]*<\/title>/, head));
  });
}

function serveGenerated(server) {
  server.middlewares.use((req, res, next) => {
    const path = (req.originalUrl || req.url || "").split("?")[0];
    const body =
      path === "/sitemap.xml"
        ? sitemapXml(readGames())
        : path === "/llms.txt"
          ? llmsTxt(readGames())
          : null;
    if (body === null) {
      next();
      return;
    }
    const type = path.endsWith(".xml") ? "application/xml" : "text/plain";
    res.setHeader("Content-Type", `${type}; charset=utf-8`);
    res.end(body);
  });
}

export function seoPlugin() {
  let outDir = "dist";
  return {
    name: "muchogames-seo",
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir);
    },
    configureServer: serveGenerated,
    transformIndexHtml(html, ctx) {
      return ctx.path === "/index.html" ? transformHub(html) : html;
    },
    generateBundle() {
      const games = readGames();
      this.emitFile({
        type: "asset",
        fileName: "sitemap.xml",
        source: sitemapXml(games)
      });
      this.emitFile({
        type: "asset",
        fileName: "llms.txt",
        source: llmsTxt(games)
      });
    },
    closeBundle() {
      rewriteGamePages(outDir, readGames());
    }
  };
}
