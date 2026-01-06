#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const VERSION = '1.0.0';

console.log('========================================');
console.log('  Flyway Dashboard - Package Builder');
console.log(`  Version: ${VERSION}`);
console.log('========================================\n');

// Check if pkg is installed
console.log('Checking for pkg...');
try {
  execSync('pkg --version', { stdio: 'ignore' });
  console.log('✓ pkg is installed\n');
} catch (error) {
  console.error('✗ pkg is not installed!');
  console.error('Install with: npm install -g pkg\n');
  process.exit(1);
}

// Create dist directory
const distDir = path.join(__dirname, '..', 'dist');
const execDir = path.join(distDir, 'executables');
const packageDir = path.join(distDir, `flyway-dashboard-server-${VERSION}`);

console.log('Creating directories...');
[distDir, execDir, packageDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});
console.log('✓ Directories created\n');

// Build executable
console.log('Building Windows executable...');
console.log('This may take a few minutes...\n');

try {
  execSync(`pkg . --targets node18-win-x64 --output "${path.join(execDir, 'server.exe')}"`, {
    stdio: 'inherit',
    cwd: __dirname
  });
  console.log(`✓ Executable built: ${execDir}\\server.exe\n`);
} catch (error) {
  console.error('✗ Build failed:', error.message);
  process.exit(1);
}

// Copy files to package directory
console.log('Packaging distribution files...');

const filesToCopy = [
  { src: path.join(execDir, 'server.exe'), dest: 'server.exe', label: 'server.exe' },
  { src: '.env.example', dest: '.env.example', label: '.env.example' },
  { src: 'jdbc-connections.json.template', dest: 'jdbc-connections.json', label: 'jdbc-connections.json' },
  { src: 'DISTRIBUTION_README.txt', dest: 'README.txt', label: 'README.txt' },
  { src: 'QUICKSTART.md', dest: 'QUICKSTART.md', label: 'QUICKSTART.md' }
];

filesToCopy.forEach(({ src, dest, label }) => {
  const srcPath = path.isAbsolute(src) ? src : path.join(__dirname, src);
  const destPath = path.join(packageDir, dest);
  fs.copyFileSync(srcPath, destPath);
  console.log(`  ✓ ${label}`);
});

// Create db directory
const dbDir = path.join(packageDir, 'db');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir);
}
console.log('  ✓ db\\ (folder)');

console.log('\n✓ Package assembled\n');

// Create ZIP archive (requires PowerShell)
console.log('Creating ZIP archive...');
const zipPath = path.join(distDir, `flyway-dashboard-server-${VERSION}.zip`);

if (fs.existsSync(zipPath)) {
  fs.unlinkSync(zipPath);
}

try {
  execSync(`powershell -Command "Compress-Archive -Path '${packageDir}\\*' -DestinationPath '${zipPath}' -CompressionLevel Optimal"`, {
    stdio: 'inherit'
  });
  console.log(`✓ ZIP created: ${zipPath}\n`);
} catch (error) {
  console.error('✗ ZIP creation failed:', error.message);
  console.log('Package files are available at:', packageDir);
}

// Show package contents
console.log('Package contents:');
const listDir = (dir, prefix = '') => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  entries.forEach(entry => {
    const fullPath = path.join(dir, entry.name);
    const relativePath = fullPath.substring(packageDir.length);
    console.log(`  ${relativePath}`);
    if (entry.isDirectory()) {
      listDir(fullPath, prefix + '  ');
    }
  });
};
listDir(packageDir);

// Show file size
if (fs.existsSync(zipPath)) {
  const stats = fs.statSync(zipPath);
  const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
  console.log(`\nPackage size: ${sizeMB} MB`);
}

// Final summary
console.log('\n========================================');
console.log('  Build Complete! 🚀');
console.log('========================================\n');

console.log('Distribution package:');
console.log(`  Location: ${zipPath}`);
if (fs.existsSync(zipPath)) {
  const stats = fs.statSync(zipPath);
  const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
  console.log(`  Size: ${sizeMB} MB\n`);
}

console.log('Contents:');
console.log('  - server.exe (standalone executable)');
console.log('  - .env.example (configuration template)');
console.log('  - jdbc-connections.json (database config)');
console.log('  - README.txt (user guide)');
console.log('  - QUICKSTART.md (setup guide)');
console.log('  - db\\ (auto-created SQLite folder)\n');

console.log('Next steps:');
console.log('  1. Test the package on a clean machine');
console.log(`  2. Distribute ${zipPath} to users`);
console.log('  3. Users extract and run server.exe\n');

console.log('Testing the package:');
console.log(`  cd ${packageDir}`);
console.log('  .\\server.exe\n');
