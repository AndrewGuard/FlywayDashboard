# Flyway Dashboard Installation Script
# This script automates the installation process

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Flyway Dashboard - Installation" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Check Node.js installation
Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js not found!" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Check npm installation
try {
    $npmVersion = npm --version
    Write-Host "✓ npm found: v$npmVersion`n" -ForegroundColor Green
} catch {
    Write-Host "✗ npm not found!" -ForegroundColor Red
    exit 1
}

# Install root dependencies
Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Frontend installation failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Frontend dependencies installed`n" -ForegroundColor Green

# Install server dependencies
Write-Host "Installing server dependencies..." -ForegroundColor Yellow
Set-Location server
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Server installation failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Server dependencies installed`n" -ForegroundColor Green

# Generate demo data
Write-Host "Generating demo data..." -ForegroundColor Yellow
node refresh-all-demo-data.js
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠ Demo data generation failed (optional)" -ForegroundColor Yellow
} else {
    Write-Host "✓ Demo data generated`n" -ForegroundColor Green
}

Set-Location ..

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Installation Complete!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Start the server: cd server && node index.js" -ForegroundColor White
Write-Host "2. Start the frontend: npm start" -ForegroundColor White
Write-Host "3. Open http://localhost:3000 in your browser`n" -ForegroundColor White

Write-Host "Optional: Configure database connections in server/jdbc-connections.json" -ForegroundColor Gray
Write-Host "For now, the dashboard will use demo data.`n" -ForegroundColor Gray
