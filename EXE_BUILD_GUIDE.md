# Flyway Dashboard - EXE Distribution Guide

Three approaches for creating standalone executables for end users:

---

## Option 1: Server-Only EXE with pkg (Simplest) ⚡

**Best for:** Distributing just the server component as a command-line tool

### Setup

```powershell
# Install pkg globally
npm install -g pkg

# Navigate to server directory
cd server

# Build executables
node build-exe.js
```

### Result

Creates standalone executables in `dist/executables/`:
- `server.exe` (Windows, ~50MB)
- `server` (Linux)
- `server` (macOS)

### Distribution Package

Users need:
```
flyway-server/
├── server.exe           # The executable
├── .env.example         # Rename to .env and configure
├── jdbc-connections.json # Configure database connections
└── README.txt           # Usage instructions
```

### User Experience

1. Extract ZIP
2. Rename `.env.example` to `.env`
3. Edit `jdbc-connections.json`
4. Double-click `server.exe`
5. Open browser to `http://localhost:3001`

**Pros:**
- ✅ Small size (~50MB)
- ✅ No Node.js required
- ✅ Fast to build
- ✅ Cross-platform

**Cons:**
- ❌ Command-line only (no GUI)
- ❌ Users must configure manually
- ❌ Users need separate browser

---

## Option 2: Electron Desktop App (Full Experience) 🖥️

**Best for:** Complete desktop application with embedded browser and GUI

### Setup

```powershell
# Install Electron dependencies
npm install --save-dev electron electron-builder

# Build for Windows
npm run electron-build-win

# Build for macOS
npm run electron-build-mac

# Build for Linux
npm run electron-build-linux
```

### Result

Creates installers in `dist-electron/`:

**Windows:**
- `Flyway Dashboard Setup 0.1.0.exe` (NSIS installer, ~150MB)
- `Flyway Dashboard 0.1.0.exe` (Portable, ~150MB)

**macOS:**
- `Flyway Dashboard-0.1.0.dmg` (Drag-and-drop installer)
- `Flyway Dashboard-0.1.0-mac.zip` (Portable)

**Linux:**
- `Flyway Dashboard-0.1.0.AppImage` (Portable)
- `flyway-dashboard_0.1.0_amd64.deb` (Debian/Ubuntu)

### User Experience

1. Download installer
2. Run installer (Windows: Setup.exe, Mac: DMG, Linux: AppImage)
3. Desktop shortcut created
4. Launch app → Server starts automatically → UI opens
5. Configure databases in built-in UI

**Pros:**
- ✅ Professional installer
- ✅ Desktop shortcut
- ✅ Auto-updates possible
- ✅ Embedded browser (no external browser needed)
- ✅ Built-in UI for configuration
- ✅ Native look and feel

**Cons:**
- ❌ Large size (~150MB)
- ❌ Longer build time
- ❌ Requires more disk space

---

## Option 3: NSIS Installer Only (Professional) 📦

**Best for:** Enterprise deployment with custom branding

### Setup

1. **Install NSIS:**
   - Download from: https://nsis.sourceforge.io/
   - Or: `choco install nsis` (Windows)

2. **Create installer script** (see `installer.nsi` below)

3. **Build:**
   ```powershell
   makensis installer.nsi
   ```

### Custom NSIS Script

Create `installer.nsi`:

```nsis
!define APP_NAME "Flyway Dashboard Server"
!define VERSION "1.0.0"
!define PUBLISHER "Your Company"

Name "${APP_NAME}"
OutFile "dist\FlywayDashboardSetup-${VERSION}.exe"
InstallDir "$PROGRAMFILES64\${APP_NAME}"

Page directory
Page instfiles

Section "Install"
  SetOutPath "$INSTDIR"
  
  ; Copy server files
  File /r "server\*.*"
  
  ; Create desktop shortcut
  CreateShortcut "$DESKTOP\Flyway Dashboard.lnk" "$INSTDIR\server.exe"
  
  ; Create start menu folder
  CreateDirectory "$SMPROGRAMS\${APP_NAME}"
  CreateShortcut "$SMPROGRAMS\${APP_NAME}\Flyway Dashboard.lnk" "$INSTDIR\server.exe"
  CreateShortcut "$SMPROGRAMS\${APP_NAME}\Uninstall.lnk" "$INSTDIR\Uninstall.exe"
  
  ; Registry keys
  WriteRegStr HKLM "Software\${APP_NAME}" "InstallPath" "$INSTDIR"
  
  ; Uninstaller
  WriteUninstaller "$INSTDIR\Uninstall.exe"
SectionEnd

Section "Uninstall"
  Delete "$INSTDIR\*.*"
  RMDir /r "$INSTDIR"
  Delete "$DESKTOP\Flyway Dashboard.lnk"
  RMDir /r "$SMPROGRAMS\${APP_NAME}"
  DeleteRegKey HKLM "Software\${APP_NAME}"
SectionEnd
```

---

## Recommended Approach by Use Case

### For Internal Tools / IT Teams
→ **Option 1 (pkg)** - Simple, small, command-line

### For End Users / Business Users
→ **Option 2 (Electron)** - Full desktop app experience

### For Enterprise Deployment
→ **Option 3 (NSIS)** - Custom branding, GPO deployment

---

## Build Commands Quick Reference

```powershell
# Option 1: pkg (server only)
cd server
npm install -g pkg
node build-exe.js

# Option 2: Electron (desktop app)
npm install
npm run electron-build-win      # Windows installer
npm run electron-build-mac      # macOS DMG
npm run electron-build-linux    # Linux AppImage

# Option 3: NSIS (custom installer)
makensis installer.nsi
```

---

## File Size Comparison

| Method | Size | Platforms |
|--------|------|-----------|
| pkg (server.exe) | ~50 MB | Win/Mac/Linux |
| Electron (portable) | ~150 MB | Win/Mac/Linux |
| Electron (installer) | ~150 MB | Win/Mac/Linux |
| NSIS (custom) | Varies | Windows only |

---

## Distribution Checklist

### For pkg:
- [ ] `server.exe`
- [ ] `.env.example`
- [ ] `jdbc-connections.json.template`
- [ ] `README.txt` with setup instructions
- [ ] `LICENSE.txt`

### For Electron:
- [ ] Installer file (.exe, .dmg, .AppImage)
- [ ] Quick start guide (optional - app has built-in UI)
- [ ] `LICENSE.txt`

### For NSIS:
- [ ] `FlywayDashboardSetup.exe`
- [ ] Silent install parameters documentation
- [ ] Deployment guide for IT admins
- [ ] `LICENSE.txt`

---

## Testing Your EXE

1. **Fresh VM/Machine:** Test on Windows machine without Node.js
2. **Fresh User:** Test with non-admin user account
3. **Network:** Test database connectivity from target network
4. **Firewall:** Verify port 3001 isn't blocked
5. **Antivirus:** Check for false positives (especially with pkg)

---

## Signing Your EXE (Production)

For production, sign your executables:

### Windows Code Signing (Electron)
```json
"win": {
  "certificateFile": "cert.pfx",
  "certificatePassword": "your-password",
  "publisherName": "Your Company"
}
```

### macOS Code Signing
```json
"mac": {
  "identity": "Developer ID Application: Your Name",
  "hardenedRuntime": true,
  "gatekeeperAssess": false,
  "entitlements": "build/entitlements.mac.plist"
}
```

---

## Support

- **pkg issues:** https://github.com/vercel/pkg
- **Electron Builder:** https://www.electron.build/
- **NSIS:** https://nsis.sourceforge.io/
