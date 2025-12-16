#!/bin/bash
# Flyway Dashboard Startup Script (Linux/Mac)

echo "========================================"
echo "  Starting Flyway Dashboard"
echo "========================================"
echo ""

# Start server in background
echo "Starting server on port 3001..."
cd server
node index.js &
SERVER_PID=$!
cd ..

# Wait for server to start
sleep 2

# Start frontend
echo "Starting frontend on port 3000..."
npm start

# Cleanup on exit
trap "kill $SERVER_PID" EXIT
