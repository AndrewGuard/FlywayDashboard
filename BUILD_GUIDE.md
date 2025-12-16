# Quick Guide: Building the Installer

## For Non-Technical Users

Your users will receive a **single .exe file** (Windows) that they double-click to install. No Node.js, npm, or technical knowledge required!

---

## Building the Installer (Developer)

### Quick Build

**Windows:**
```powershell
.\build-installer.ps1
```

**Mac/Linux:**
```bash
chmod +x build-installer.sh
./build-installer.sh
```

This creates:
- **Windows**: `dist/Flyway Dashboard Setup.exe` (~150MB)
- **macOS**: `dist/Flyway Dashboard.dmg` (~150MB)
- **Linux**: `dist/Flyway Dashboard.AppImage` (~150MB)

### Manual Build Steps

1. **Install Electron tools:**
   ```bash
   npm install
   ```

2. **Build the installer:**
   ```bash
   # Windows
   npm run dist-win
   
   # macOS
   npm run dist-mac
   
   # Linux
   npm run dist-linux
   
   # All platforms
   npm run dist
   ```

3. **Find installer in `dist/` folder**

---

## Distribution

### What to Share

Give users the installer file:
- `Flyway Dashboard Setup.exe` (Windows)
- `Flyway Dashboard.dmg` (macOS)
- `Flyway Dashboard.AppImage` (Linux)

### Installation Instructions for End Users

**Windows:**
1. Download `Flyway Dashboard Setup.exe`
2. Double-click the file
3. Follow the installation wizard
4. Launch from Start Menu or Desktop shortcut

**macOS:**
1. Download `Flyway Dashboard.dmg`
2. Open the DMG file
3. Drag app to Applications folder
4. Launch from Applications

**Linux:**
1. Download `Flyway Dashboard.AppImage`
2. Make executable: `chmod +x Flyway*.AppImage`
3. Double-click to run

---

## What's Included

The installer bundles:
- ✅ Node.js runtime
- ✅ React frontend
- ✅ Express backend
- ✅ SQLite database
- ✅ Demo data
- ✅ All dependencies

Users don't need to install anything else!

---

## Customization

### Change App Icon

1. Create icons:
   - Windows: `assets/icon.ico` (256x256)
   - macOS: `assets/icon.icns` (512x512)
   - Linux: `assets/icon.png` (512x512)

2. Use converters:
   - [IcoConverter](https://icoconvert.com/)
   - [CloudConvert](https://cloudconvert.com/)

3. Rebuild: `npm run dist`

### Change App Name

Edit `package.json`:
```json
"build": {
  "productName": "Your Custom Name"
}
```

### Installer Options

Edit `package.json` → `build.nsis`:
```json
"nsis": {
  "oneClick": true,  // One-click install
  "perMachine": true,  // Install for all users
  "allowToChangeInstallationDirectory": false
}
```

---

## Testing

### Test Before Distribution

1. Build installer
2. Test on clean Windows VM (no dev tools)
3. Verify:
   - Installation works
   - App launches
   - Demo data loads
   - All features work

### Recommended Testing Tools

- **Windows**: Windows Sandbox or VirtualBox
- **macOS**: Clean user account
- **Linux**: Docker container or VM

---

## File Size

**Why so large?**
- Includes Node.js runtime (~50MB)
- Includes Chromium browser (~100MB)
- Includes all dependencies

**Benefits:**
- Works on any machine
- No dependencies needed
- Consistent experience

---

## Troubleshooting

### Build fails with "Cannot find module"
```bash
rm -rf node_modules
npm install
npm run dist
```

### "Application is damaged" (macOS)
App needs code signing for macOS Gatekeeper. Options:
- Sign with Apple Developer certificate
- Users right-click → Open (first time only)

### Antivirus blocks installer (Windows)
- Submit to Microsoft for whitelisting
- Purchase code signing certificate
- Users can add exception

---

## Advanced: Code Signing

### Windows

1. Purchase code signing certificate (~$200/year)
2. Add to package.json:
   ```json
   "win": {
     "certificateFile": "cert.pfx",
     "certificatePassword": "password"
   }
   ```

### macOS

1. Enroll in Apple Developer Program ($99/year)
2. Create signing identity
3. Add to package.json:
   ```json
   "mac": {
     "identity": "Developer ID Application: Your Name"
   }
   ```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Build Installers
on: [push]
jobs:
  build:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run dist-win
      - uses: actions/upload-artifact@v2
        with:
          name: installer
          path: dist/*.exe
```

---

## Next Steps

1. ✅ Build installer: `.\build-installer.ps1`
2. ✅ Test on clean machine
3. ✅ Create user documentation
4. ✅ Distribute installer
5. ⚡ Consider code signing for production
6. ⚡ Set up auto-updates (electron-updater)
