const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logInfo(message) {
  log(message, 'cyan');
}

// Get package version
const packageJson = require('./package.json');
const version = packageJson.version;

console.log('');
log('========================================', 'bright');
log('  Flyway Dashboard - UI Package Builder', 'bright');
log(`  Version: ${version}`, 'bright');
log('========================================', 'bright');
console.log('');

// Paths
const rootDir = __dirname;
const distDir = path.join(rootDir, 'dist');
const uiPackageDir = path.join(distDir, `flyway-dashboard-ui-${version}`);
const zipPath = path.join(distDir, `flyway-dashboard-ui-${version}.zip`);

try {
  // Step 1: Build React app
  log('Building React application...', 'yellow');
  log('This may take a few minutes...', 'yellow');
  console.log('');
  
  try {
    execSync('npm run build', { 
      cwd: rootDir,
      stdio: 'inherit'
    });
    console.log('');
    logSuccess('React app built successfully');
  } catch (error) {
    logError('Build failed: ' + error.message);
    process.exit(1);
  }

  // Step 2: Create directories
  log('Creating package directories...', 'yellow');
  
  if (fs.existsSync(uiPackageDir)) {
    fs.rmSync(uiPackageDir, { recursive: true, force: true });
  }
  fs.mkdirSync(uiPackageDir, { recursive: true });
  
  logSuccess('Directories created');

  // Step 3: Copy built React app
  log('Packaging distribution files...', 'yellow');
  
  const buildDir = path.join(rootDir, 'build');
  const destBuildDir = uiPackageDir;
  
  // Copy all build files
  copyRecursive(buildDir, destBuildDir);
  logSuccess('Built files copied');

  // Step 4: Create config.example.json
  const configExample = {
    apiBaseUrl: "http://your-server:3001",
    _comment: "Change apiBaseUrl to point to your Flyway Dashboard server"
  };
  
  fs.writeFileSync(
    path.join(uiPackageDir, 'config.example.json'),
    JSON.stringify(configExample, null, 2)
  );
  logSuccess('config.example.json created');

  // Step 5: Create web.config for IIS
  const webConfig = `<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="React Routes" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
          </conditions>
          <action type="Rewrite" url="/" />
        </rule>
      </rules>
    </rewrite>
    <staticContent>
      <mimeMap fileExtension=".json" mimeType="application/json" />
    </staticContent>
  </system.webServer>
</configuration>`;
  
  fs.writeFileSync(path.join(uiPackageDir, 'web.config'), webConfig);
  logSuccess('web.config created (IIS)');

  // Step 6: Create .htaccess for Apache
  const htaccess = `<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME} !-l
  RewriteRule . /index.html [L]
</IfModule>

# Disable caching for config.json
<FilesMatch "config\\.json$">
  Header set Cache-Control "no-store, no-cache, must-revalidate"
</FilesMatch>`;
  
  fs.writeFileSync(path.join(uiPackageDir, '.htaccess'), htaccess);
  logSuccess('.htaccess created (Apache)');

  // Step 7: Create README
  const readme = `Flyway Dashboard UI - Version ${version}
${'='.repeat(50)}

This package contains the pre-built Flyway Dashboard web interface.

QUICK START
-----------

1. Configure Server Connection:
   Edit config.json and set the apiBaseUrl to your server:
   
   {
     "apiBaseUrl": "http://your-server:3001"
   }

2. Deploy to Web Server:

   IIS (Windows):
   - Copy all files to C:\\inetpub\\wwwroot\\flyway-dashboard
   - web.config is already included for React Router support
   
   nginx (Linux):
   - Copy all files to /var/www/flyway-dashboard/
   - Configure nginx (see DEPLOYMENT_UI.md)
   
   Apache (Linux):
   - Copy all files to /var/www/flyway-dashboard/
   - .htaccess is already included for React Router support

3. Set Up HTTPS (Recommended):
   Use Let's Encrypt or your organization's SSL certificates

4. Open in Browser:
   Navigate to https://your-domain.com

CONFIGURATION
-------------

config.json:
  - apiBaseUrl: URL of your Flyway Dashboard server
  - Must match the server's ALLOWED_ORIGINS setting

web.config:
  - IIS configuration for React Router
  - Automatically included

.htaccess:
  - Apache configuration for React Router
  - Automatically included

TROUBLESHOOTING
---------------

UI Can't Connect to Server:
1. Check config.json has correct server URL
2. Verify server is running: curl http://server:3001/health
3. Check CORS settings on server (ALLOWED_ORIGINS)
4. Check browser console for detailed error messages

React Router Not Working:
- IIS: Ensure web.config is in the root directory
- Apache: Ensure .htaccess is in the root directory and mod_rewrite is enabled
- nginx: Configure try_files directive (see DEPLOYMENT_UI.md)

SUPPORT
-------

For detailed deployment instructions, see:
- Main README: https://github.com/your-org/flyway-dashboard
- UI Deployment Guide: DEPLOYMENT_UI.md
- Server Setup: DEPLOYMENT_SERVER.md

For issues or questions:
- GitHub Issues: https://github.com/your-org/flyway-dashboard/issues
`;
  
  fs.writeFileSync(path.join(uiPackageDir, 'README.txt'), readme);
  logSuccess('README.txt created');

  console.log('');
  logSuccess('Package assembled');
  console.log('');

  // Step 8: Create ZIP archive
  log('Creating ZIP archive...', 'yellow');
  
  if (fs.existsSync(zipPath)) {
    fs.unlinkSync(zipPath);
  }

  try {
    // Use PowerShell to create ZIP with proper path escaping
    const escapedSourcePath = uiPackageDir.replace(/\\/g, '\\\\');
    const escapedDestPath = zipPath.replace(/\\/g, '\\\\');
    const psCommand = `Compress-Archive -Path '${uiPackageDir}\\*' -DestinationPath '${zipPath}' -Force`;
    execSync(`powershell -Command "${psCommand}"`, { stdio: 'pipe' });
    
    logSuccess(`ZIP created: ${zipPath}`);
  } catch (error) {
    logError('ZIP creation failed: ' + error.message);
    logInfo('Package files are available in: ' + uiPackageDir);
  }

  // Step 9: Display package info
  console.log('');
  log('Package contents:', 'yellow');
  
  const files = getAllFiles(uiPackageDir);
  files.forEach(file => {
    const relativePath = path.relative(uiPackageDir, file);
    console.log(`  ${relativePath}`);
  });

  // Get package size
  if (fs.existsSync(zipPath)) {
    const stats = fs.statSync(zipPath);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log('');
    log(`Package size: ${sizeMB} MB`, 'cyan');
  }

  // Success summary
  console.log('');
  log('========================================', 'bright');
  log('  Build Complete! 🚀', 'green');
  log('========================================', 'bright');
  console.log('');

  log('Distribution package:', 'bright');
  log(`  Location: ${zipPath}`, 'cyan');
  if (fs.existsSync(zipPath)) {
    const stats = fs.statSync(zipPath);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    log(`  Size: ${sizeMB} MB`, 'cyan');
  }
  console.log('');

  log('Contents:', 'bright');
  log('  - Built React app (HTML/JS/CSS)', 'cyan');
  log('  - config.json (API server configuration)', 'cyan');
  log('  - config.example.json (configuration template)', 'cyan');
  log('  - web.config (IIS configuration)', 'cyan');
  log('  - .htaccess (Apache configuration)', 'cyan');
  log('  - README.txt (deployment guide)', 'cyan');
  console.log('');

  log('Next steps:', 'bright');
  log('  1. Extract the ZIP on your web server', 'cyan');
  log('  2. Edit config.json to point to your API server', 'cyan');
  log('  3. Configure your web server (IIS/nginx/Apache)', 'cyan');
  log('  4. Set up HTTPS (recommended)', 'cyan');
  log('  5. Open in browser', 'cyan');
  console.log('');

  log('Deployment:', 'bright');
  log(`  Extract: ${zipPath}`, 'cyan');
  log('  Configure: Edit config.json', 'cyan');
  log('  Deploy: Copy files to web server', 'cyan');
  console.log('');

} catch (error) {
  console.log('');
  logError('Build failed: ' + error.message);
  console.error(error);
  process.exit(1);
}

// Helper functions
function copyRecursive(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach(childItemName => {
      copyRecursive(
        path.join(src, childItemName),
        path.join(dest, childItemName)
      );
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);
  
  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
    } else {
      arrayOfFiles.push(filePath);
    }
  });
  
  return arrayOfFiles;
}
