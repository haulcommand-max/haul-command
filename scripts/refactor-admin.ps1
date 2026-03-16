# Batch refactor: replace inline getSupabase() with canonical getSupabaseAdmin()
# Targets all .ts/.tsx files in app/ that define function getSupabase()

$files = Get-ChildItem -Path "C:\Users\PC User\Biz\app" -Recurse -Include "*.ts","*.tsx" |
    Select-String -Pattern "function getSupabase\(\)" |
    ForEach-Object { $_.Path } |
    Sort-Object -Unique

$count = 0

foreach ($file in $files) {
    $content = Get-Content $file -Raw
    $original = $content

    # 1. Remove the old createClient import from @supabase/supabase-js (only the one used for admin)
    $content = $content -replace 'import \{ createClient \} from "@supabase/supabase-js";\r?\n', ''
    $content = $content -replace "import \{ createClient \} from '@supabase/supabase-js';\r?\n", ''

    # 2. Remove the function getSupabase() block (handles various whitespace patterns)
    # Pattern: optional newlines, function getSupabase() { return createClient(...); }
    $content = $content -replace '(?s)\r?\n*function getSupabase\(\) \{\r?\n\s+return createClient\(\r?\n\s+process\.env\.NEXT_PUBLIC_SUPABASE_URL!,\r?\n\s+process\.env\.SUPABASE_SERVICE_ROLE_KEY!\r?\n\s*\);\r?\n\}\r?\n', "`n"

    # Also handle the pattern with auth options
    $content = $content -replace '(?s)\r?\n*function getSupabase\(\) \{\r?\n\s+return createClient\(\r?\n\s+process\.env\.NEXT_PUBLIC_SUPABASE_URL!,\r?\n\s+process\.env\.SUPABASE_SERVICE_ROLE_KEY!,\r?\n\s+\{[^}]*\}\r?\n\s*\);\r?\n\}\r?\n', "`n"

    # 3. Add the canonical import (after the last existing import line)
    if ($content -notmatch "getSupabaseAdmin") {
        # Find first import or export line to add after
        if ($content -match "(?m)^(import .+;)\r?\n") {
            $lastImport = $Matches[0]
            $content = $content -replace [regex]::Escape($lastImport), ($lastImport + "import { getSupabaseAdmin } from '@/lib/supabase/admin';`r`n")
        }
    }

    # 4. Replace getSupabase() calls with getSupabaseAdmin()
    $content = $content -replace 'getSupabase\(\)', 'getSupabaseAdmin()'

    # Only write if changed
    if ($content -ne $original) {
        Set-Content $file -Value $content -NoNewline
        $count++
        $relativePath = $file -replace [regex]::Escape("C:\Users\PC User\Biz\"), ""
        Write-Host "  Updated: $relativePath"
    }
}

Write-Host "`nRefactored $count files"
