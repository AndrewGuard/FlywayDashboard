# Electron Setup Guide for Flyway Dashboard

This guide will help you package the Flyway Dashboard as a native desktop application.

## Step 1: Install Electron Dependencies

```bash
npm install --save-dev electron electron-builder concurrently wait-on cross-env
```

## Step 2: Create Electron Main Process

Create `electron-main.js` in the root directory (see the file in this repository).

## Step 3: Update package.json

Add the following to your `package.json`:

```json
{
  "main": "electron-main.js",
  "homepage": "./",
  "scripts": {
    "electron-dev": "concurrently \"cross-env BROWSER=none npm start\" \"wait-on http://localhost:3000 && electron .\"",
    "electron-build": "npm run build && electron-builder",
    "dist": "npm run build && electron-builder --win --mac --linux"
  },
  "build": {
    "appId": "com.flyway.dashboard",
    "productName": "Flyway Dashboard",
    "files": [
      "build/**/*",
      "electron-main.js",
      "server/**/*",
      "!server/node_modules/**/*"
    ],
    "extraResources": [
      {
        "from": "server",
        "to": "server",
        "filter": ["**/*"]
      }
    ],
    "directories": {
      "buildResources": "assets"
    },
    "win": {
      "target": ["nsis"],
      "icon": "assets/icon.ico"
    },
    "mac": {
      "target": ["dmg"],
      "icon": "assets/icon.icns"
    },
    "linux": {
      "target": ["AppImage"],
      "icon": "assets/icon.png"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true
    }
  }
}
```

## Step 4: Test Development Mode

```bash
npm run electron-dev
```

This starts the app in Electron with hot-reloading.

## Step 5: Build for Distribution

### Build for all platforms:
```bash
npm run dist
```

### Build for specific platform:
```bash
# Windows only
npm run build && electron-builder --win

# macOS only
npm run build && electron-builder --mac

# Linux only
npm run build && electron-builder --linux
```

## Step 6: Find Your Installers

After building, find installers in the `dist` folder:
- **Windows**: `Flyway Dashboard Setup.exe` (~150MB)
- **macOS**: `Flyway Dashboard.dmg` (~150MB)
- **Linux**: `Flyway Dashboard.AppImage` (~150MB)

## Distribution

Share the installer with users. They simply:
1. Download the installer
2. Double-click to install
3. Launch "Flyway Dashboard" from their applications

No Node.js, npm, or technical knowledge required!

## Adding an Icon

1. Create icon files:
   - Windows: `assets/icon.ico` (256x256)
   - macOS: `assets/icon.icns` (512x512)
   - Linux: `assets/icon.png` (512x512)

2. Use online tools to convert:
   - [IcoConverter](https://icoconvert.com/) for .ico
   - [IconUtil](https://iconutil.com/) for .icns

## Customization

### Change App Name
Update `productName` in package.json build section.

### Auto Updates
Add electron-updater for automatic updates:
```bash
npm install electron-updater
```

### Code Signing
For production apps, sign your installers:
- Windows: Purchase code signing certificate
- macOS: Enroll in Apple Developer Program
- Linux: Not required

## Troubleshooting

### "Cannot find module" errors
Ensure all dependencies are listed in `dependencies` (not `devDependencies`).

### Build fails
- Clear cache: `rm -rf dist build node_modules && npm install`
- Check Node.js version (16+ required)
- Run with verbose: `electron-builder --win --verbose`

### Large file size
This is normal for Electron apps (includes Chromium + Node.js).

## File Size Optimization

To reduce installer size:
1. Remove unused dependencies
2. Use `asar` packaging (enabled by default)
3. Exclude unnecessary files in `build.files`
4. Use compression in NSIS config

## Next Steps

1. Test the installer on a clean machine
2. Create documentation for end users
3. Set up CI/CD for automated builds
4. Consider code signing for production
