Add-Type -AssemblyName System.Windows.Forms
$sql = Get-Content -Raw "C:\Users\PC User\Biz\supabase\migrations\20260326_rls_and_security_hardening.sql"
[System.Windows.Forms.Clipboard]::SetText($sql)

# Define native methods to click the mouse and move cursor
$signature = @'
[DllImport("user32.dll")] public static extern bool SetCursorPos(int X, int Y);
[DllImport("user32.dll")] public static extern void mouse_event(uint dwFlags, uint dx, uint dy, uint dwData, int dwExtraInfo);
'@
$win32 = Add-Type -MemberDefinition $signature -Name "Mouse" -PassThru

# Open the Supabase query editor window
Start-Process "https://supabase.com/dashboard/project/hvjyfyzotqobfkakjozp/sql/new"

Write-Host "Waiting 8 seconds for page to load..."
Start-Sleep -Seconds 8

# Move to roughly the center-right of a 1920x1080 screen (where the editor pane is)
$x = 1000
$y = 500
$win32::SetCursorPos($x, $y)
Start-Sleep -Milliseconds 500

# Left click down and up (0x02 = LDOWN, 0x04 = LUP)
Write-Host "Clicking to focus editor..."
$win32::mouse_event(0x02, 0, 0, 0, 0)
$win32::mouse_event(0x04, 0, 0, 0, 0)
Start-Sleep -Milliseconds 500

Write-Host "Select All..."
[System.Windows.Forms.SendKeys]::SendWait("^{a}")
Start-Sleep -Milliseconds 200

Write-Host "Backspace..."
[System.Windows.Forms.SendKeys]::SendWait("{BACKSPACE}")
Start-Sleep -Milliseconds 200

Write-Host "Pasting SQL..."
[System.Windows.Forms.SendKeys]::SendWait("^{v}")
Start-Sleep -Milliseconds 1500

Write-Host "Running Query..."
[System.Windows.Forms.SendKeys]::SendWait("^{ENTER}")
Write-Host "DONE!"
