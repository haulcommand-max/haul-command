$envs = @(
    "FLY_API_TOKEN",
    "FLY_WORKER_MACHINE_ID",
    "RESEND_API_KEY",
    "LIVEKIT_API_KEY",
    "LIVEKIT_API_SECRET",
    "NEXT_PUBLIC_LIVEKIT_WS_URL",
    "TWENTY_API_KEY",
    "CRON_SECRET"
)

Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host " VERCEL PRODUCTION ENVIRONMENT FORCER" -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "This script will forcefully sync your missing API keys directly into"
Write-Host "the Vercel production dashboard without needing the web UI."
Write-Host ""
Write-Host "Make sure you are logged in via 'npx vercel login' first." -ForegroundColor Yellow
Write-Host ""

foreach ($env in $envs) {
    $val = Read-Host "Paste value for [$env] (leave blank to skip)"
    
    if (![string]::IsNullOrWhiteSpace($val)) {
        Write-Host "Pushing $env to production..." -ForegroundColor Yellow
        # Vercel env add accepts standard input for the value
        $val | npx vercel env add $env production
        Write-Host "✓ Successfully synced $env" -ForegroundColor Green
    } else {
        Write-Host "Skipped $env" -ForegroundColor DarkGray
    }
}

Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "Sync Complete! To finalize, trigger a fresh deployment:"
Write-Host "npx vercel --prod" -ForegroundColor Green
