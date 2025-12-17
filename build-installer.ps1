# Build Desktop Installer for Flyway Dashboard
# Creates a standalone .exe with embedded Node.js runtime

Write-Host ""
Write-Host "=== Flyway Dashboard Installer Builder ===" -ForegroundColor Cyan
Write-Host "Building standalone desktop application..." -ForegroundColor White
Write-Host ""

# Step 1: Clean previous builds
Write-Host "[1/6] Cleaning previous builds..." -ForegroundColor Yellow
if (Test-Path "dist") { Remove-Item -Recurse -Force "dist" }
if (Test-Path "build") { Remove-Item -Recurse -Force "build" }
Write-Host "✓ Clean complete" -ForegroundColor Green
Write-Host ""

# Step 2: Install dependencies
Write-Host "[2/6] Installing dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ npm install failed" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Dependencies installed" -ForegroundColor Green
Write-Host ""

# Step 3: Build React frontend
Write-Host "[3/6] Building React frontend..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ React build failed" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Frontend built" -ForegroundColor Green
Write-Host ""

# Step 4: Seed demo data
Write-Host "[4/6] Generating demo data..." -ForegroundColor Yellow
Push-Location server
node seed-realistic-data.js
$seedResult = $LASTEXITCODE
Pop-Location
if ($seedResult -ne 0) {
    Write-Host "✗ Demo data generation failed" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Demo data seeded" -ForegroundColor Green
Write-Host ""

# Step 5: Package with Electron
Write-Host "[5/6] Packaging desktop application..." -ForegroundColor Yellow
Write-Host "This may take several minutes..." -ForegroundColor Gray
npm run electron:build
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Electron build failed" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Application packaged" -ForegroundColor Green
Write-Host ""

# Step 6: Verify output
Write-Host "[6/6] Verifying installer..." -ForegroundColor Yellow
$installer = Get-ChildItem -Path "dist" -Filter "*.exe" -ErrorAction SilentlyContinue | Select-Object -First 1

if (-not $installer) {
    Write-Host "✗ Installer not found in dist/" -ForegroundColor Red
    Write-Host "Check build logs above" -ForegroundColor Yellow
    exit 1
}

# Success path
$size = [math]::Round($installer.Length / 1MB, 1)
Write-Host "✓ Installer created successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "=== Build Complete ===" -ForegroundColor Cyan
Write-Host "Installer: dist\$($installer.Name)" -ForegroundColor White
Write-Host "Size: $size MB" -ForegroundColor White
Write-Host ""
Write-Host "Includes:" -ForegroundColor Yellow
Write-Host "  • Node.js runtime (embedded)" -ForegroundColor White
Write-Host "  • React frontend" -ForegroundColor White
Write-Host "  • Express server" -ForegroundColor White
Write-Host "  • SQLite database with demo data" -ForegroundColor White
Write-Host "  • All dependencies bundled" -ForegroundColor White
Write-Host ""
Write-Host "Ready to distribute!" -ForegroundColor Green
Write-Host "Double-click installer - no tech knowledge needed" -ForegroundColor White
Write-Host ""