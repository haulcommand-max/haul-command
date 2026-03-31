for ($i=1; $i -le 15; $i++) {
    Write-Host "Batch $i/15 executing..."
    $output = npx supabase db query --linked -f scripts/delete_small.sql 2>&1
    Write-Host $output
    
    if ($output -match "rem_dl") {
        # Successfully fetched counts, it means it didn't timeout
        if ($output -match '"rem_dl": 0' -and $output -match '"rem_sd": 0') {
            Write-Host "All fake data deleted!"
            break
        }
    }
}
