# Fix remaining files that the first script missed (no -Raw)
$files = @(
    'C:\Users\PC User\.gemini\antigravity\scratch\haul-command\app\services\[slug]\page.tsx',
    'C:\Users\PC User\.gemini\antigravity\scratch\haul-command\app\blog\[slug]\page.tsx',
    'C:\Users\PC User\.gemini\antigravity\scratch\haul-command\app\alternatives\[competitor]\page.tsx',
    'C:\Users\PC User\.gemini\antigravity\scratch\haul-command\app\(public)\glossary\[country]\page.tsx'
)

foreach ($f in $files) {
    if (Test-Path $f) {
        $content = [System.IO.File]::ReadAllText($f)
        $content = $content -replace '57 countries', '120 countries'
        $content = $content -replace '7,335\+?\s*verified operators', '1.5M+ verified operators'
        $content = $content -replace '7,335\+?\s*operators', '1.5M+ operators'
        $content = $content -replace '7,745\+?\s*verified', '1.5M+ verified'
        $content = $content -replace '7,745\+?\s*operator', '1.5M+ operator'
        $content = $content -replace '7,745\+', '1.5M+'
        $content = $content -replace '48 other nations', '110+ other nations'
        [System.IO.File]::WriteAllText($f, $content)
        Write-Output "FIXED: $f"
    } else {
        Write-Output "NOT FOUND: $f"
    }
}
