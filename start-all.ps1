# E:\Development\Wave\start-all.ps1

Write-Host "Starting Wave Terminal Microservices..." -ForegroundColor Cyan

# 1. Start Spring Boot Services in separate PowerShell windows
Write-Host "Starting Gateway..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd E:\Development\Wave\terminal; mvn spring-boot:run -pl gateway"

Write-Host "Starting Auth Service..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd E:\Development\Wave\terminal; mvn spring-boot:run -pl auth-service"

Write-Host "Starting Swap Engine..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd E:\Development\Wave\terminal; mvn spring-boot:run -pl swap-engine"

Write-Host "Starting Market Streaming..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd E:\Development\Wave\terminal; mvn spring-boot:run -pl market-streaming"

# Optional: Risk Audit Worker (if needed)
# Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd E:\Development\Wave\terminal; mvn spring-boot:run -pl risk-audit-worker"

# 2. Start Next.js Frontend in current terminal
Write-Host "Starting Next.js Frontend..." -ForegroundColor Green
Set-Location -Path "E:\Development\Wave"
npm run dev