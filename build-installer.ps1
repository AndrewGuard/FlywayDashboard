# Build Desktop Installer Script
# This script builds the Flyway Dashboard as a desktop application

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Building Flyway Dashboard Installer" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Step 1: Install Electron dependencies if needed
Write-Host "Checking Electron dependencies..." -ForegroundColor Yellow
$electronInstalled = Test-Path "node_modules\electron"
if (-not $electronInstalled) {
    Write-Host "Installing Electron dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Failed to install dependencies!" -ForegroundColor Red
        exit 1
    }
}
Write-Host "✓ Dependencies ready`n" -ForegroundColor Green

# Step 2: Install server dependencies
Write-Host "Installing server dependencies..." -ForegroundColor Yellow
Set-Location server
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to install server dependencies!" -ForegroundColor Red
    exit 1
}
Set-Location ..
Write-Host "✓ Server dependencies installed`n" -ForegroundColor Green

# Step 3: Build React app
Write-Host "Building React application..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ React app built`n" -ForegroundColor Green

# Step 4: Build Electron installer
Write-Host "Building Windows installer..." -ForegroundColor Yellow
Write-Host "This may take several minutes...`n" -ForegroundColor Gray
npm run dist-win
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Installer build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Build Complete!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Installer location: dist\Flyway Dashboard Setup.exe" -ForegroundColor Yellow
Write-Host "File size: ~150-200 MB (includes Node.js runtime)`n" -ForegroundColor Gray

Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Test the installer on a clean Windows machine" -ForegroundColor White
Write-Host "2. Distribute the .exe file to end users" -ForegroundColor White
Write-Host "3. Users double-click to install - no technical knowledge needed!`n" -ForegroundColor White
