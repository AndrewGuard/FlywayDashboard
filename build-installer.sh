#!/bin/bash
# Build Desktop Installer Script (Linux/Mac)

echo "========================================"
echo "  Building Flyway Dashboard Installer"
echo "========================================"
echo ""

# Check Electron dependencies
echo "Checking Electron dependencies..."
if [ ! -d "node_modules/electron" ]; then
    echo "Installing Electron dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "✗ Failed to install dependencies!"
        exit 1
    fi
fi
echo "✓ Dependencies ready"
echo ""

# Install server dependencies
echo "Installing server dependencies..."
cd server
npm install
if [ $? -ne 0 ]; then
    echo "✗ Failed to install server dependencies!"
    exit 1
fi
cd ..
echo "✓ Server dependencies installed"
echo ""

# Build React app
echo "Building React application..."
npm run build
if [ $? -ne 0 ]; then
    echo "✗ Build failed!"
    exit 1
fi
echo "✓ React app built"
echo ""

# Detect platform and build
echo "Building installer for your platform..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "Building macOS .dmg..."
    npm run dist-mac
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "Building Linux AppImage..."
    npm run dist-linux
else
    echo "Building for all platforms..."
    npm run dist
fi

if [ $? -ne 0 ]; then
    echo "✗ Installer build failed!"
    exit 1
fi

echo ""
echo "========================================"
echo "  Build Complete!"
echo "========================================"
echo ""
echo "Installers are in the dist/ folder"
echo "File size: ~150-200 MB (includes Node.js runtime)"
echo ""
echo "Next steps:"
echo "1. Test the installer on a clean machine"
echo "2. Distribute to end users"
echo "3. Users double-click to install!"
echo ""
