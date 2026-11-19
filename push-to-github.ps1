# push-to-github.ps1
# The only GitHub sync script for https://github.com/Potatoe415/muchogames (including apps/coinchapp and apps/tranquil).
# Run it from PowerShell (right-click > "Run with PowerShell", or .\push-to-github.ps1 in a terminal).
# Agents run: powershell -NoProfile -ExecutionPolicy Bypass -File push-to-github.ps1 -Message "<why>" -NoPause
#
# Order: commit local changes, pull --rebase what the other computer pushed, then push.
# Never committed, even if .gitignore misses them: secrets (.env*, credentials.json, *.pem, *.key)
# and the local launcher apps/coinchapp/run.bat.
#
# Options:
#   -Message "feat: ..."   commit message (default: "chore: sync from <computer name>")
#   -NoPause               do not wait for Enter at the end (when run from a terminal or a script)
param(
  [string]$Message = "chore: sync from $env:COMPUTERNAME",
  [switch]$NoPause
)

$ErrorActionPreference = "Stop"
Set-Location -Path $PSScriptRoot

function Close-Script([int]$Code) {
  Write-Host ""
  if (-not $NoPause) { Read-Host "Press Enter to close" | Out-Null }
  exit $Code
}

function Stop-WithError([string]$Text) {
  Write-Host ""
  Write-Host "FAILED: $Text" -ForegroundColor Red
  Close-Script 1
}

Write-Host "=== GitHub sync: muchogames ===" -ForegroundColor Cyan
Write-Host "Working folder: $PSScriptRoot" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path ".git")) { Stop-WithError "this folder is not a git repository (.git not found)." }
if ((Test-Path ".git/rebase-merge") -or (Test-Path ".git/rebase-apply")) {
  Stop-WithError "a previous sync stopped in the middle of a rebase. Finish it with 'git rebase --continue' or cancel it with 'git rebase --abort', then run this script again."
}
$branch = "$(git rev-parse --abbrev-ref HEAD)".Trim()
if ($LASTEXITCODE -ne 0 -or $branch -eq "HEAD") { Stop-WithError "not on a branch (detached HEAD)." }
# All work happens on main: no feature branches, so both computers always see the same code.
if ($branch -ne "main") {
  Stop-WithError "you are on branch '$branch', but all work happens on 'main'. Run 'git checkout main', then run this script again."
}

Write-Host "Step 1/5: Local changes on '$branch':" -ForegroundColor Cyan
$changes = @(git status --short)
if ($changes.Count -gt 0) { $changes | ForEach-Object { Write-Host "  $_" } } else { Write-Host "  (none)" }
Write-Host ""

Write-Host "Step 2/5: Staging all local changes, secrets and local launchers left out..." -ForegroundColor Cyan
git add -A
if ($LASTEXITCODE -ne 0) { Stop-WithError "git add failed." }
$localOnly = @("apps/coinchapp/run.bat")
foreach ($path in @(git diff --cached --name-only)) {
  $name = $path -replace '\\', '/'
  $isSecret = $name -match '(^|/)\.env($|\.)' -and $name -notmatch '(^|/)\.env\.example$'
  $isSecret = $isSecret -or $name -match '(^|/)credentials\.json$' -or $name -match '\.(pem|key)$'
  if ($isSecret -or $localOnly -contains $name) {
    git reset -q -- $path
    Write-Host "  Left out: $name" -ForegroundColor Yellow
  }
}
Write-Host ""

Write-Host "Step 3/5: Committing..." -ForegroundColor Cyan
$staged = @(git diff --cached --name-only | Where-Object { $_ -ne "" })
if ($staged.Count -gt 0) {
  git --no-pager diff --cached --stat
  git commit -q -m $Message
  if ($LASTEXITCODE -ne 0) { Stop-WithError "git commit failed." }
  Write-Host "Commit created: $Message" -ForegroundColor Green
} else {
  Write-Host "Nothing new to commit on this computer." -ForegroundColor Green
}
Write-Host ""

Write-Host "Step 4/5: Pulling what the other computer pushed..." -ForegroundColor Cyan
git ls-remote --exit-code --heads origin $branch | Out-Null
$remoteState = $LASTEXITCODE
if ($remoteState -eq 2) {
  Write-Host "Branch '$branch' is not on GitHub yet, nothing to pull." -ForegroundColor Green
} elseif ($remoteState -ne 0) {
  Stop-WithError "cannot reach GitHub (no internet connection, or not signed in)."
} else {
  $before = "$(git rev-parse HEAD)".Trim()
  git pull --rebase --autostash origin $branch
  if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "CONFLICT: the same file was changed differently on both computers." -ForegroundColor Red
    Write-Host "Fix it manually:" -ForegroundColor Yellow
    Write-Host "  1. Run 'git status' to see which files are in conflict." -ForegroundColor Yellow
    Write-Host "  2. Open those files and resolve the <<<<<<< / ======= / >>>>>>> markers." -ForegroundColor Yellow
    Write-Host "  3. Run 'git add <file>' for each resolved file." -ForegroundColor Yellow
    Write-Host "  4. Run 'git rebase --continue', then run this script again." -ForegroundColor Yellow
    Write-Host "  (Or run 'git rebase --abort' to go back to where you started.)" -ForegroundColor Yellow
    Close-Script 1
  }
  Write-Host "Up to date with GitHub." -ForegroundColor Green
  # Warn when the other computer changed the dependencies: node_modules is not synced by git.
  $depsChanged = @(git diff --name-only $before HEAD -- package.json package-lock.json "apps/*/package.json" "apps/*/package-lock.json")
  if ($depsChanged.Count -gt 0) {
    Write-Host "WARNING: dependencies changed on the other computer. Run 'npm install' on this one:" -ForegroundColor Yellow
    $depsChanged | ForEach-Object { Write-Host "  $_" -ForegroundColor Yellow }
  }
}
Write-Host ""

Write-Host "Step 5/5: Pushing to origin/$branch..." -ForegroundColor Cyan
git push -u origin $branch
if ($LASTEXITCODE -ne 0) {
  Stop-WithError "the push did not go through. If the other computer pushed in the meantime, just run this script again."
}

# Verify: after the push, local and GitHub must point to the same commit.
git fetch -q origin
$local = "$(git rev-parse HEAD)".Trim()
$remote = "$(git rev-parse "origin/$branch")".Trim()
if ($local -ne $remote) { Stop-WithError "local ($local) and GitHub ($remote) differ after the push. Run this script again." }
$dirty = @(git status --short)
if ($dirty.Count -gt 0) { Write-Host "Note: some files were left out of the commit (see above):" -ForegroundColor Yellow; $dirty | ForEach-Object { Write-Host "  $_" } }

Write-Host ""
Write-Host "SUCCESS: GitHub is up to date and identical to this folder. The other computer can now pull this update." -ForegroundColor Green
Close-Script 0
