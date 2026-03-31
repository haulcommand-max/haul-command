Add-Type -AssemblyName PresentationFramework
$sql = Get-Content -Raw "C:\Users\PC User\Biz\haul-command-hub\supabase\migrations\20260326100000_rls_and_security_hardening.sql"
[System.Windows.Forms.Clipboard]::SetText($sql)

Start-Process "https://supabase.com/dashboard/project/hvjyfyzotqobfkakjozp/sql/new"
Start-Sleep -Seconds 2

[System.Windows.MessageBox]::Show('Hey! Supabase CLI needs a database password I do not have, and the browser agent keeps stalling on the editor autocomplete. 

BUT I have placed the entire SQL script in your clipboard!

I just opened a fresh SQL Editor tab for you. 
1. Click inside the text area.
2. Press Ctrl+V (Paste).
3. Press Ctrl+Enter (Run). 

Let me know once done!', 'Action Required', 'OK', 'Information')
