#!/bin/bash
# Flyway Dashboard Installation Script (Linux/Mac)

echo "========================================"
echo "  Flyway Dashboard - Installation"
echo "========================================"
echo ""

# Check Node.js installation
echo "Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo "✗ Node.js not found!"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi
echo "✓ Node.js found: $(node --version)"

# Check npm installation
if ! command -v npm &> /dev/null; then
    echo "✗ npm not found!"
    exit 1
fi
echo "✓ npm found: v$(npm --version)"
echo ""

# Install root dependencies
echo "Installing frontend dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "✗ Frontend installation failed!"
    exit 1
fi
echo "✓ Frontend dependencies installed"
echo ""

# Install server dependencies
echo "Installing server dependencies..."
cd server
npm install
if [ $? -ne 0 ]; then
    echo "✗ Server installation failed!"
    exit 1
fi
echo "✓ Server dependencies installed"
echo ""

# Generate demo data
echo "Generating demo data..."
node refresh-all-demo-data.js
if [ $? -ne 0 ]; then
    echo "⚠ Demo data generation failed (optional)"
else
    echo "✓ Demo data generated"
fi
echo ""

cd ..

echo ""
echo "========================================"
echo "  Installation Complete!"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. Start the server: cd server && node index.js"
echo "2. Start the frontend: npm start"
echo "3. Open http://localhost:3000 in your browser"
echo ""
echo "Optional: Configure database connections in server/jdbc-connections.json"
echo "For now, the dashboard will use demo data."
echo ""
