# Commit staged-worthy changes and push the current branch.
# Usage, from anywhere in the repo:
#   powershell -File scripts/ship.ps1 -Message "fix(president): why this change"
param(
  [Parameter(Mandatory = $true, Position = 0)]
  [string]$Message
)

$ErrorActionPreference = "Stop"

function Invoke-Git {
  param([Parameter(ValueFromRemainingArguments = $true)][string[]]$GitArgs)
  & git @GitArgs
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

$repoRoot = (& git rev-parse --show-toplevel).Trim()
Set-Location $repoRoot

if ([string]::IsNullOrWhiteSpace($Message)) {
  Write-Error "Commit message is empty."
  exit 1
}

Invoke-Git add -A

# Local launcher and secrets stay out of the commit.
$blocked = @(
  "apps/coinchapp/run.bat"
)
$staged = @(Invoke-Git diff --cached --name-only)
foreach ($path in $staged) {
  $name = $path -replace '\\', '/'
  $isEnv = $name -match '(^|/)\.env($|\.)' -or $name -match '(^|/)credentials\.json$'
  $isBlocked = $blocked -contains $name
  if ($isEnv -or $isBlocked) {
    Write-Host "Left unstaged: $name"
    Invoke-Git reset -q -- $path
  }
}

$staged = @(Invoke-Git diff --cached --name-only | Where-Object { $_ -ne "" })
if ($staged.Count -eq 0) {
  Write-Host "Nothing to commit."
  exit 0
}

Write-Host "Committing:"
$staged | ForEach-Object { Write-Host "  $_" }

Invoke-Git commit -m $Message
Invoke-Git push origin HEAD
Invoke-Git status -sb
