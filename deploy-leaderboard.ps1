# TOWERLORDS leaderboard deploy — run from E:\AI Work\APPSCC
# One-time prerequisite (opens a browser to authorize Cloudflare, free account):
#   npx wrangler login
# Then:  .\deploy-leaderboard.ps1
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

# 1. logged in?
$who = npx --yes wrangler whoami 2>&1 | Out-String
if ($who -match 'not authenticated') {
  Write-Host "Not logged in. Run:  npx wrangler login   (free Cloudflare account) then re-run this script." -ForegroundColor Yellow
  exit 1
}

# 2. ensure the KV namespace exists and the id is in wrangler.toml
$toml = Get-Content wrangler.toml -Raw
if ($toml -match 'REPLACE_WITH_KV_ID') {
  Write-Host "Creating KV namespace 'LB'..."
  $out = npx --yes wrangler kv namespace create LB 2>&1 | Out-String
  if ($out -match 'id\s*=\s*"([0-9a-f]+)"') {
    $id = $Matches[1]
    ($toml -replace 'REPLACE_WITH_KV_ID', $id) | Set-Content wrangler.toml -Encoding utf8
    Write-Host "KV namespace created: $id"
  } else { Write-Host $out; throw "Could not parse the KV namespace id — create it manually and paste the id into wrangler.toml." }
}

# 3. deploy
npx --yes wrangler deploy
Write-Host ""
Write-Host "Done. Copy the printed https://towerlords-lb.<subdomain>.workers.dev URL into" -ForegroundColor Green
Write-Host "LEADERBOARD_URL in towerlords.html, then run: node .claude/build-offline.js" -ForegroundColor Green
