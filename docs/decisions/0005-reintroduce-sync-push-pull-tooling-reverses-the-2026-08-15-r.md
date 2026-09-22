# 0005 — Reintroduce Sync-Push/Pull tooling (reverses the 2026-08-15 retirement)

Date: 2026-08-16
Status: Accepted
Decision: User chose to bring back `Sync-Push.bat`/`Sync-Pull.bat` (and their `.ps1` scripts) for multi-machine sync, reversing the 2026-08-15 decision that retired this tooling in favor of plain `git pull`/`git push`.
Context: The four files reappeared untracked in the working tree (not restored from git history). Flagged to the user that this contradicts the prior decision and its known risks ? blind `git add -A`/commit with no diff review, "last write wins by file mtime" conflict resolution (fragile after clone/checkout, since mtimes reset), and direct unreviewed pushes to `main`. User was asked to choose between plain git, reintroducing the scripts as-is, or deleting them, and picked reintroduction with the risks understood.
Rationale: User's explicit choice, made with the risks stated up front.
Consequences: `Sync-Push.bat`/`Sync-Pull.bat`/`Sync-Push.ps1`/`Sync-Pull.ps1` are tracked again. The date-based "last write wins" merge behavior is back in use for this repo; anyone using it should be aware a file can be silently overwritten in either direction if local/remote timestamps don't reflect true recency (e.g. right after a fresh clone or checkout).
Alternatives_Rejected: Plain `git pull`/`git push` (the 2026-08-15 replacement) ? user preferred the one-click scripts despite the risks. Deleting the reappeared files ? rejected by user.
