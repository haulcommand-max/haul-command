# ═══════════════════════════════════════════════════════════════
# Haul Command — Typesense Deployment Script
# Run this from the Biz/ root directory.
# ═══════════════════════════════════════════════════════════════

$FLY = "$env:USERPROFILE\.fly\bin\flyctl.exe"
$ADMIN_KEY = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object { [char]$_ })
$SEARCH_KEY = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object { [char]$_ })

Write-Host ""
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host "  HAUL COMMAND — Typesense Deployment" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host ""

# Step 1: Auth check
Write-Host "[1/6] Checking Fly.io auth..." -ForegroundColor Cyan
try {
    & $FLY auth whoami 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  → Not logged in. Opening browser..." -ForegroundColor Yellow
        & $FLY auth login
    }
} catch {
    Write-Host "  → Running fly auth login..." -ForegroundColor Yellow
    & $FLY auth login
}

# Step 2: Create app
Write-Host ""
Write-Host "[2/6] Creating Typesense app on Fly.io..." -ForegroundColor Cyan
& $FLY apps create hc-typesense --org personal 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "  → App 'hc-typesense' created" -ForegroundColor Green
} else {
    Write-Host "  → App may already exist (OK)" -ForegroundColor Yellow
}

# Step 3: Create persistent volume
Write-Host ""
Write-Host "[3/6] Creating persistent volume (10GB)..." -ForegroundColor Cyan
& $FLY volumes create typesense_data --app hc-typesense --size 10 --region iad --yes 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "  → Volume 'typesense_data' created in iad" -ForegroundColor Green
} else {
    Write-Host "  → Volume may already exist (OK)" -ForegroundColor Yellow
}

# Step 4: Set the bootstrap API key as a secret
Write-Host ""
Write-Host "[4/6] Setting TYPESENSE_API_KEY secret..." -ForegroundColor Cyan
Write-Host "  → Admin key: $ADMIN_KEY" -ForegroundColor Magenta
& $FLY secrets set "TYPESENSE_API_KEY=$ADMIN_KEY" --app hc-typesense
Write-Host "  → Secret set" -ForegroundColor Green

# Step 5: Deploy
Write-Host ""
Write-Host "[5/6] Deploying Typesense v27.1..." -ForegroundColor Cyan
& $FLY deploy --config typesense/fly.toml --app hc-typesense
if ($LASTEXITCODE -eq 0) {
    Write-Host "  → Deployed successfully!" -ForegroundColor Green
} else {
    Write-Host "  → Deploy failed. Check output above." -ForegroundColor Red
    exit 1
}

# Step 6: Get the hostname
Write-Host ""
Write-Host "[6/6] Getting deployment info..." -ForegroundColor Cyan
$info = & $FLY info --app hc-typesense --json 2>$null | ConvertFrom-Json
$hostname = "hc-typesense.fly.dev"

Write-Host ""
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  TYPESENSE IS LIVE" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "  Host: $hostname" -ForegroundColor White
Write-Host "  Admin Key: $ADMIN_KEY" -ForegroundColor Magenta
Write-Host ""
Write-Host "  Add these to your .env.local:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  # Typesense (Fly.io self-hosted)" -ForegroundColor Gray
Write-Host "  TYPESENSE_HOST=$hostname" -ForegroundColor White
Write-Host "  TYPESENSE_PORT=443" -ForegroundColor White
Write-Host "  TYPESENSE_PROTOCOL=https" -ForegroundColor White
Write-Host "  TYPESENSE_ADMIN_KEY=$ADMIN_KEY" -ForegroundColor White
Write-Host "  TYPESENSE_API_KEY=$ADMIN_KEY" -ForegroundColor White
Write-Host "  NEXT_PUBLIC_TYPESENSE_HOST=$hostname" -ForegroundColor White
Write-Host "  NEXT_PUBLIC_TYPESENSE_PORT=443" -ForegroundColor White
Write-Host "  NEXT_PUBLIC_TYPESENSE_PROTOCOL=https" -ForegroundColor White
Write-Host "  FEATURE_TYPESENSE=true" -ForegroundColor White
Write-Host ""
Write-Host "  NEXT STEP: Generate a search-only key:" -ForegroundColor Yellow
Write-Host "  curl -X POST 'https://$hostname/keys' \" -ForegroundColor Gray
Write-Host "    -H 'X-TYPESENSE-API-KEY: $ADMIN_KEY' \" -ForegroundColor Gray
Write-Host "    -H 'Content-Type: application/json' \" -ForegroundColor Gray
Write-Host "    -d '{`"description`":`"Search only`",`"actions`":[`"documents:search`"],`"collections`":[`"*`"]}'" -ForegroundColor Gray
Write-Host ""
Write-Host "  Then add the returned key as:" -ForegroundColor Yellow
Write-Host "  NEXT_PUBLIC_TYPESENSE_SEARCH_KEY=<returned-key>" -ForegroundColor White
Write-Host ""
