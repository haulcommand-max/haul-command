Get-ChildItem -Path "app\api" -Recurse -Filter "route.ts" | ForEach-Object {
    $path = $_.FullName
    $content = Get-Content $path -Raw
    if ($content -match '(?m)^const supabase = createClient\(' -and $content -notmatch 'export const dynamic') {
        $new = "export const dynamic = 'force-dynamic';" + "`r`n" + $content
        [System.IO.File]::WriteAllText($path, $new)
        Write-Host "Patched: $path"
    }
}
Write-Host "Done"
