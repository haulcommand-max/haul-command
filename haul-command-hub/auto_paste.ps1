Add-Type -AssemblyName System.Windows.Forms
$sql = Get-Content -Raw "C:\Users\PC User\Biz\haul-command-hub\supabase\migrations\20260326100000_rls_and_security_hardening.sql"
[System.Windows.Forms.Clipboard]::SetText($sql)

$signature = @'
[DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
[DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
'@
$win32 = Add-Type -MemberDefinition $signature -Name "Win32API" -PassThru

# Find ANY Chrome process that has a window
$chromeProcess = Get-Process chrome | Where-Object { $_.MainWindowHandle -ne 0 } | Select-Object -First 1

if ($chromeProcess) {
    Write-Host "Activating Chrome window..."
    $win32::SetForegroundWindow($chromeProcess.MainWindowHandle)
    Start-Sleep -Seconds 1

    $found = $false
    for ($i = 0; $i -lt 15; $i++) {
        $title = (Get-Process chrome | Where-Object { $_.MainWindowHandle -eq $chromeProcess.MainWindowHandle } | Select-Object -ExpandProperty MainWindowTitle)
        Write-Host "Current Tab: $title"
        
        if ($title -match "SQL Editor") {
            $found = $true
            break
        }
        
        # Switch tab
        [System.Windows.Forms.SendKeys]::SendWait("^{TAB}")
        Start-Sleep -Milliseconds 500
    }

    if ($found) {
        Write-Host "Found Supabase tab! Sending keys..."
        Start-Sleep -Milliseconds 500
        [System.Windows.Forms.SendKeys]::SendWait("^{a}")
        Start-Sleep -Milliseconds 200
        [System.Windows.Forms.SendKeys]::SendWait("{BACKSPACE}")
        Start-Sleep -Milliseconds 200
        [System.Windows.Forms.SendKeys]::SendWait("^{v}")
        Start-Sleep -Milliseconds 500
        [System.Windows.Forms.SendKeys]::SendWait("^{ENTER}")
        Write-Host "Pasted & Ran Query!"
    } else {
        Write-Host "Could not find the Supabase SQL Editor tab."
    }
} else {
    Write-Host "Could not find Chrome process."
}
