# 0016 — Ship porklike.gb only as a test cartridge

Date: 2026-09-01
Status: Accepted
Decision: Commit the homebrew `porklike.gb` plus `ROM/index.json` so the live hub has one playable cartridge; do not commit Nintendo ROMs (Zelda, Tetris).
Context: The user asked to push ROMs so the deployed player can be tested without picking a local file. The sibling `ROM/` folder also holds copyrighted Zelda and Tetris dumps.
Rationale: Vite/Vercel do not serve directory indexes, so a static `index.json` is required for the splash to see any shipped ROM. porklike is a redistributable homebrew already sitting in binjgb's docs. Zelda/Tetris dumps cannot go on GitHub.
Consequences: The live picker shows Porklike. Users can still open other `.gb`/`.gbc` files locally via the file picker. Nintendo ROMs remain on the author's machine only.
Alternatives_Rejected: Commit the full local `ROM/` folder - rejected, that would publish copyrighted games. Keep the picker empty on production - rejected, the user asked for a test cartridge.
