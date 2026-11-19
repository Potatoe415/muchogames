# 0065 — One GitHub script: `push-to-github.ps1`

Date: 2026-11-19
Status: Accepted
Decision: `push-to-github.ps1` at the repo root is the only script that talks to GitHub, for the whole repo including `apps/**`. It commits (secrets and `apps/coinchapp/run.bat` left out), runs `git pull --rebase --autostash`, pushes `main`, and checks that local and GitHub point to the same commit. Removed: `Sync-Push`/`Sync-Pull` (`.ps1`/`.bat`) at the root and in `apps/coinchapp` and `apps/tranquil`, `Sync-Log.ps1`, `GitHistory.txt`, `scripts/ship.ps1`/`ship.bat`, `.cursor/rules/ship.mdc`.
Context: Owner request: replace every GitHub interaction script with one file, modelled on the one used in `le-petit-french`.
Rationale: Rebase instead of the date-based "last write wins" merge (0005) never overwrites a file silently; a conflict stops the script with steps to fix it. One script for humans (double-click, waits for Enter) and agents (`-NoPause`).
Consequences: Supersedes 0005. Works on `main` only: a session on another branch cannot push with it. A conflict needs a manual resolve.
Alternatives_Rejected: Keeping `ship.ps1` for agents next to a human sync script (two scripts doing the same job).
