import { resolve } from "path";

import { defineConfig, loadEnv } from "vite";

import { runGifSearch } from "./api/_lib/giphy.js";
import { seoPlugin } from "./scripts/seo.mjs";

function staticPageDevPlugin() {
  return {
    name: "static-page-dev",
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const path = (req.originalUrl || req.url || "").split("?")[0];
        if (path === "/profile" || path === "/profile/") {
          req.url = "/profile/index.html";
        }
        next();
      });
    }
  };
}

function yatzyGifsDevPlugin(apiKey) {
  return {
    name: "yatzy-gifs-dev",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = (req.originalUrl || req.url || "").split("?")[0];
        if (path !== "/api/yatsy/gifs") {
          next();
          return;
        }
        void answerGifSearch(req, res, apiKey);
      });
    }
  };
}

async function answerGifSearch(req, res, apiKey) {
  if (req.method !== "GET") {
    res.statusCode = 405;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: { code: "method-not-allowed" } }));
    return;
  }

  const url = new URL(req.originalUrl || req.url, "http://localhost");
  const result = await runGifSearch({
    query: url.searchParams.get("q") || "",
    lang: url.searchParams.get("lang") || "fr",
    apiKey
  });
  res.statusCode = result.status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(result.body));
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [
      yatzyGifsDevPlugin(env.GIPHY_API_KEY),
      staticPageDevPlugin(),
      seoPlugin()
    ],
    server: {
      host: true, // Autorise l'accès via l'IP locale (0.0.0.0)
      port: 5173 // Optionnel : fixe le port si tu veux être sûr
    },
    build: {
      rollupOptions: {
        input: {
          main: resolve(__dirname, "index.html"),
          wordplayer: resolve(__dirname, "wordplayer.html")
        }
      }
    },
    publicDir: "public"
  };
});
