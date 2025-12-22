#!/bin/bash

# Flyway Dashboard - Server Package Builder
# Creates a distribution package for server deployment

set -e

echo "🚀 Building Flyway Dashboard Server Package..."

# Configuration
BUILD_DIR="dist/server"
PACKAGE_NAME="flyway-dashboard-server"
VERSION=$(node -p "require('./package.json').version")

# Clean previous builds
echo "📦 Cleaning previous builds..."
rm -rf dist
mkdir -p "$BUILD_DIR"

# Copy server files
echo "📋 Copying server files..."
cp -r server/* "$BUILD_DIR/"

# Copy deployment documentation
echo "📄 Copying documentation..."
cp DEPLOYMENT_SERVER.md "$BUILD_DIR/README.md"

# Create package.json for server
echo "📝 Creating server package.json..."
cat > "$BUILD_DIR/package.json" << EOF
{
  "name": "flyway-dashboard-server",
  "version": "$VERSION",
  "description": "Flyway Dashboard Server - Backend API for database metrics",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^17.2.3",
    "better-sqlite3": "^11.11.2",
    "pg": "^8.11.3",
    "tedious": "^16.6.1"
  },
  "devDependencies": {
    "nodemon": "^3.1.11"
  }
}
EOF

# Create installation script
echo "📝 Creating installation script..."
cat > "$BUILD_DIR/install.sh" << 'EOF'
#!/bin/bash

echo "Installing Flyway Dashboard Server..."
npm install

echo "✓ Installation complete!"
echo ""
echo "Next steps:"
echo "1. Copy .env.example to .env"
echo "2. Generate encryption key: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
echo "3. Edit .env with your configuration"
echo "4. Start server: npm start"
echo ""
echo "For production deployment, see README.md"
EOF

chmod +x "$BUILD_DIR/install.sh"

# Create Windows installation script
cat > "$BUILD_DIR/install.bat" << 'EOF'
@echo off
echo Installing Flyway Dashboard Server...
call npm install

echo.
echo Installation complete!
echo.
echo Next steps:
echo 1. Copy .env.example to .env
echo 2. Generate encryption key: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
echo 3. Edit .env with your configuration
echo 4. Start server: npm start
echo.
echo For production deployment, see README.md
pause
EOF

# Create archive
echo "📦 Creating archive..."
cd dist
tar -czf "${PACKAGE_NAME}-${VERSION}.tar.gz" server/
zip -r "${PACKAGE_NAME}-${VERSION}.zip" server/ -q

cd ..

echo "✅ Server package created successfully!"
echo ""
echo "📦 Packages created:"
echo "   - dist/${PACKAGE_NAME}-${VERSION}.tar.gz"
echo "   - dist/${PACKAGE_NAME}-${VERSION}.zip"
echo ""
echo "📝 Installation:"
echo "   1. Extract package on server machine"
echo "   2. Run install.sh (Linux) or install.bat (Windows)"
echo "   3. Configure .env file"
echo "   4. Start with: npm start"
