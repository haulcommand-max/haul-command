$ErrorActionPreference = "Stop"

$supabaseUrl = "https://hvjyfyzotqobfkakjozp.supabase.co"
$serviceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2anlmeXpvdHFvYmZrYWtqb3pwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQ0NjMxNSwiZXhwIjoyMDg3MDIyMzE1fQ.xG-oo7qSFevW1JO9GVwd005ZXAMht86_C7P8RRHJ938"

$sqlFile = "C:\Users\PC User\.gemini\antigravity\brain\2d2e6211-98c2-4a6c-bc0d-28719b303fc2\combined_migration_029_030.sql"
$sql = Get-Content $sqlFile -Raw

$headers = @{
    "apikey"        = $serviceKey
    "Authorization" = "Bearer $serviceKey"
    "Content-Type"  = "application/json"
    "Prefer"        = "return=representation"
}

# Use the Supabase SQL execution RPC endpoint
$body = @{ query = $sql } | ConvertTo-Json -Depth 3

Write-Host "Executing migration against $supabaseUrl ..."
Write-Host "SQL length: $($sql.Length) characters"

try {
    # Try the pg_graphql / management API approach via REST RPC
    $response = Invoke-RestMethod `
        -Uri "$supabaseUrl/rest/v1/rpc/" `
        -Method POST `
        -Headers $headers `
        -Body $body `
        -ErrorAction Stop
    
    Write-Host "SUCCESS: Migration executed via RPC"
    Write-Host $response
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "RPC approach returned status: $statusCode"
    Write-Host "Trying direct SQL via pg endpoint..."
    
    # Fallback: Try executing SQL blocks individually via PostgREST
    # First test connectivity
    try {
        $testBody = @{ query = "SELECT 1 as test" } | ConvertTo-Json
        $testResult = Invoke-WebRequest `
            -Uri "$supabaseUrl/rest/v1/rpc/" `
            -Method POST `
            -Headers $headers `
            -Body $testBody `
            -ErrorAction Stop
        Write-Host "Connection test result: $($testResult.Content)"
    } catch {
        Write-Host "Direct SQL not available via REST RPC."
        Write-Host "Error: $($_.Exception.Message)"
        Write-Host ""
        Write-Host "=========================================="
        Write-Host "MANUAL ACTION REQUIRED:"
        Write-Host "=========================================="
        Write-Host "1. Open: https://supabase.com/dashboard/project/hvjyfyzotqobfkakjozp/sql"
        Write-Host "2. Paste the contents of: $sqlFile"
        Write-Host "3. Click Run"
        Write-Host "4. Expected output: COMMIT"
        Write-Host "=========================================="
    }
}
