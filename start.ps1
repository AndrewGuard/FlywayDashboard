# Flyway Dashboard Startup Script
# Starts both the server and frontend

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting Flyway Dashboard" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Start server in background
Write-Host "Starting server on port 3001..." -ForegroundColor Yellow
$serverPath = Join-Path $PSScriptRoot "server"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$serverPath'; node index.js" -WindowStyle Normal

# Wait a moment for server to start
Start-Sleep -Seconds 2

# Start frontend
Write-Host "Starting frontend on port 3000..." -ForegroundColor Yellow
Start-Sleep -Seconds 1
npm start

Write-Host "`nDashboard should open at http://localhost:3000" -ForegroundColor Green
