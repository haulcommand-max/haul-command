$json = Get-Content 'c:\Users\PC User\Biz\data\pilot_cars_clean.json' -Raw
$arr = ConvertFrom-Json $json
Write-Host "Total records: $($arr.Count)"
$emails = @{}
foreach ($r in $arr) {
    $e = $r.email.ToLower().Trim()
    if (-not $emails.ContainsKey($e)) { $emails[$e] = 0 }
    $emails[$e]++
}
Write-Host "Unique emails: $($emails.Count)"
