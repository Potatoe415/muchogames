# 0057 — Scrabble French definitions ship with the game

Date: 2026-11-01
Status: Accepted
Decision: French "Définir" reads our own copy of French Wiktionary definitions (`public/data/scrabble/defs/fr/`, one file per first two letters plus `forms.txt`, built by `scripts/scrabble_defs.mjs` from the kaikki.org wiktextract extract). The live Wiktionary API is only asked for words missing there. English and Spanish stay live. The definition sheet credits Wiktionnaire under CC BY-SA 4.0; `public/data/scrabble/defs/LICENSE.txt` says the same.
Context: Owner chose offline definitions over keeping live-only lookups (2026-11-01), French only, live fallback for missing words.
Rationale: 97.4 % of ODS 9 words are covered; a tap loads one file (≤ 250 KB gzip, most far smaller) instead of 2–4 Wikimedia calls, and the tapped word no longer leaves the site for covered words. Inflection texts shared by 2+ forms are stored once (`forms.txt`), which cut the data from 32 MB to 13.6 MB (4 MB gzip).
Consequences: Definitions are frozen at the extract's date until the script is run again (~1 min, ~700 MB source kept outside the repo). The data is CC BY-SA: the attribution line and licence file must stay. Each rebuild adds ~4 MB to Git history.
Alternatives_Rejected: Parsing the raw Wiktionary XML dump (wikitext templates; wiktextract already does it). One file for all words (13.6 MB on a phone). Lexique (openlexicon) for base words (Wiktionary's own "forme de" links already give them).
