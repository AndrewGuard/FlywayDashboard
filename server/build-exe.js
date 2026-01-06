#!/usr/bin/env node

/**
 * Build standalone server executable using pkg
 * 
 * Creates Windows/Linux/Mac executables that include Node.js runtime
 * Users can run without installing Node.js
 * 
 * Install: npm install -g pkg
 * Run: node build-exe.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Building Flyway Dashboard Server Executable...\n');

// Check if pkg is installed
try {
  execSync('pkg --version', { stdio: 'ignore' });
} catch (e) {
  console.error('Error: pkg is not installed globally');
  console.log('Install with: npm install -g pkg');
  process.exit(1);
}

// Create package.json with pkg config if not exists
const pkgConfig = {
  pkg: {
    scripts: [
      'index.js',
      'routes/**/*.js',
      'utils/**/*.js',
      'db/**/*.js',
      'flywayHistory.js',
      'jdbcConnections.js'
    ],
    assets: [
      '.env.example',
      'jdbc-connections.json.template',
      'node_modules/better-sqlite3/**/*',
      'node_modules/pg/**/*',
      'node_modules/mssql/**/*'
    ],
    targets: [
      'node18-win-x64',
      'node18-linux-x64',
      'node18-macos-x64'
    ],
    outputPath: '../dist/executables'
  }
};

console.log('Building executables for:');
console.log('  - Windows (x64)');
console.log('  - Linux (x64)');
console.log('  - macOS (x64)\n');

try {
  // Build executables
  execSync('pkg . --out-path ../dist/executables', {
    stdio: 'inherit',
    cwd: __dirname
  });
  
  console.log('\n✓ Build complete!');
  console.log('\nExecutables created in: dist/executables/');
  console.log('  - server.exe (Windows)');
  console.log('  - server (Linux)');
  console.log('  - server (macOS)');
  
  console.log('\nDistribution files needed:');
  console.log('  1. server.exe');
  console.log('  2. .env.example (rename to .env)');
  console.log('  3. jdbc-connections.json');
  console.log('  4. db/ folder (auto-created on first run)');
  
} catch (e) {
  console.error('Build failed:', e.message);
  process.exit(1);
}
