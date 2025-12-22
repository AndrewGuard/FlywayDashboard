#!/bin/bash

# Flyway Dashboard - UI Package Builder
# Creates a distribution package for UI deployment

set -e

echo "🚀 Building Flyway Dashboard UI Package..."

# Configuration
VERSION=$(node -p "require('./package.json').version")
PACKAGE_NAME="flyway-dashboard-ui"

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf build

# Build React app
echo "⚛️  Building React application..."
npm run build

# Copy deployment documentation
echo "📄 Copying documentation..."
cp DEPLOYMENT_UI.md build/README.md

# Create example config
echo "📝 Creating config files..."
cat > build/config.example.json << EOF
{
  "apiBaseUrl": "http://your-flyway-server:3001",
  "_comment": "Edit config.json with your actual server URL before deployment"
}
EOF

# Ensure default config exists
if [ ! -f build/config.json ]; then
  cp build/config.example.json build/config.json
fi

# Create deployment script
cat > build/INSTALL.txt << 'EOF'
Flyway Dashboard UI - Installation

1. Upload all files to your web server document root
2. Edit config.json with your server URL:
   {
     "apiBaseUrl": "http://your-server:3001"
   }
3. Configure web server for React Router (see README.md)
4. Navigate to your website URL

Examples:
- IIS: C:\inetpub\wwwroot\flyway-dashboard\
- nginx: /var/www/flyway-dashboard/
- Apache: /var/www/html/flyway-dashboard/

See README.md for detailed deployment instructions.
EOF

# Create archive
echo "📦 Creating archive..."
cd build
tar -czf "../dist/${PACKAGE_NAME}-${VERSION}.tar.gz" .
zip -r "../dist/${PACKAGE_NAME}-${VERSION}.zip" . -q
cd ..

echo "✅ UI package created successfully!"
echo ""
echo "📦 Packages created:"
echo "   - dist/${PACKAGE_NAME}-${VERSION}.tar.gz"
echo "   - dist/${PACKAGE_NAME}-${VERSION}.zip"
echo ""
echo "📝 Deployment:"
echo "   1. Extract package on web server"
echo "   2. Edit config.json with server URL"
echo "   3. Configure web server (see README.md)"
echo "   4. Access via browser"
echo ""
echo "ℹ️  The UI is just static files - deploy anywhere!"
