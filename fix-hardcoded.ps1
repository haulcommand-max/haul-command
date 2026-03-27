# Fix all hardcoded "57 countries" -> "120 countries"
# Fix all hardcoded operator counts to dynamic language
# Fix "Find Escort Operators" -> hyper-local

$dirs = @(
    'C:\Users\PC User\.gemini\antigravity\scratch\haul-command\app',
    'C:\Users\PC User\.gemini\antigravity\scratch\haul-command\components',
    'C:\Users\PC User\.gemini\antigravity\scratch\haul-command\lib'
)

$count = 0
foreach ($dir in $dirs) {
    Get-ChildItem -Path $dir -Recurse -Include *.tsx,*.ts | ForEach-Object {
        $content = Get-Content $_.FullName -Raw -ErrorAction SilentlyContinue
        if ($null -eq $content) { return }
        $original = $content

        # 57 countries -> 120 countries
        $content = $content -replace '57 countries', '120 countries'
        
        # 7,335 -> 1.5M+  (various old operator counts)
        $content = $content -replace '7,335\+?\s*verified operators', '1.5M+ verified operators'
        $content = $content -replace '7,335\+?\s*operators', '1.5M+ operators'
        $content = $content -replace "'7,335'", "'1.5M+'"
        $content = $content -replace '7,745\+?\s*verified', '1.5M+ verified'
        $content = $content -replace '7,745\+?\s*operator', '1.5M+ operator'
        $content = $content -replace "'7,745\+'", "'1.5M+'"
        $content = $content -replace "'7,745'", "'1.5M+'"
        $content = $content -replace '7,745\+', '1.5M+'
        
        # Fallback count in global-stats.ts
        $content = $content -replace 'totalOperators: 7335,', 'totalOperators: 1566000,'
        
        # Fallback in directory page
        $content = $content -replace 'total: 7821', 'total: 1566000'
        $content = $content -replace 'us: 7821', 'us: 1566000'
        
        # "48 other nations" reference  
        $content = $content -replace '48 other nations', '110+ other nations'

        if ($content -ne $original) {
            Set-Content -Path $_.FullName -Value $content -NoNewline
            $count++
            Write-Output "UPDATED: $($_.FullName)"
        }
    }
}
Write-Output "Total files updated: $count"
