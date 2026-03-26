Get-ChildItem -Path "app/api" -Recurse -Filter "*.ts" | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $updated = $content `
        -replace "2024-12-18\.acacia", "2026-02-25.clover" `
        -replace "2025-12-18\.acacia", "2026-02-25.clover"
    if ($updated -ne $content) {
        Set-Content -Path $_.FullName -Value $updated -NoNewline
        Write-Host "Fixed: $($_.Name)"
    }
}
Write-Host "All Stripe API versions updated."
