# E:\Development\Wave\stop-all.ps1

Write-Host "🛑 Stopping all Wave microservices & frontend..." -ForegroundColor Red

$ports = @(8080, 8081, 8082, 8083, 8084, 3000)

foreach ($port in $ports) {
    $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($connections) {
        $pidsToKill = $connections | Select-Object -ExpandProperty OwningProcess -Unique
        foreach ($procId in $pidsToKill) {
            Write-Host "Killing process (PID: $procId) listening on port $port..." -ForegroundColor Yellow
            Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
        }
    } else {
        Write-Host "Port $port is clear." -ForegroundColor Green
    }
}

Write-Host "✅ All processes cleared! You can now run .\start-all.ps1" -ForegroundColor Cyan