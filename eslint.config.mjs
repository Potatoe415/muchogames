import js from "@eslint/js";
import importPlugin from "eslint-plugin-import";
import prettier from "eslint-config-prettier";
import globals from "globals";

export default [
  {
    // apps/** (coinchapp, tranquil) are self-governing sub-apps colocated for
    // Git history + LLM context, each with its own eslint config/TypeScript
    // setup — see docs/GAMES_MAP.md. This repo's JS-only config would either
    // skip their .ts/.tsx files silently or misconfigure their globals.
    ignores: ["dist/**", ".vercel/**", "public/games/**/vendor/**", "apps/**"]
  },

  js.configs.recommended,

  // Browser code: the hub, the shared frontend utilities and every game.
  // Games live in public/, not apps/ - an earlier glob mismatch left this whole
  // tree without browser globals, which reported 1164 phantom no-undef errors.
  {
    files: [
      "hub.js",
      "auth.js",
      "auth-admin.js",
      "hub-shelf.js",
      "hub-tags.js",
      "version.js",
      "wordplayer.js",
      "public/**/*.js",
      "shared/**/*.js"
    ],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.browser
      }
    },
    plugins: { import: importPlugin },
    rules: {
      "no-unused-vars": ["warn"],
      "import/order": [
        "warn",
        {
          alphabetize: { order: "asc", caseInsensitive: true },
          "newlines-between": "always"
        }
      ]
    }
  },

  // Service worker: self, caches and clients instead of window and document.
  {
    files: ["**/sw.js"],
    languageOptions: {
      globals: {
        ...globals.serviceworker
      }
    }
  },

  // Node config files (Vite config, tooling) + Vercel serverless functions
  {
    files: ["vite.config.js", "eslint.config.mjs", "**/*.cjs", "api/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.node
      }
    }
  },

  prettier
];
