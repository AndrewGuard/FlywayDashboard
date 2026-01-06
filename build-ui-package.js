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
  const readme = `================================================================================
         Flyway Dashboard - UI Installation Guide
================================================================================

Thank you for downloading Flyway Dashboard UI!

This package contains pre-built static files ready to deploy to any web server.
No build tools, Node.js, or compilation needed.

================================================================================
                           REQUIREMENTS
================================================================================

Required:
  - Web server (IIS, nginx, Apache, or any static file server)
  - Flyway Dashboard Server running (get from server package)

Optional:
  - SSL certificate (recommended for production)
  - Domain name or IP address

================================================================================
                        QUICK START GUIDE
================================================================================

1. EXTRACT FILES
   Extract this ZIP to a temporary location.
   Example: C:\\temp\\flyway-dashboard-ui\\

2. CONFIGURE SERVER CONNECTION
   Edit config.json in the extracted folder:
   
   {
     "apiBaseUrl": "http://your-server-address:3001"
   }

   Replace "your-server-address" with:
   - Same machine: "http://localhost:3001"
   - Different machine: "http://192.168.1.100:3001"
   - Domain name: "http://flyway-server.company.com:3001"

   IMPORTANT: This must match where your Flyway Dashboard Server is running!

3. DEPLOY TO WEB SERVER

   Choose your web server:

   ═══ IIS (Windows) ═══
   a) Open IIS Manager
   b) Right-click "Sites" → "Add Website"
   c) Site name: Flyway Dashboard
   d) Physical path: Browse to extracted folder
   e) Port: 80 (or 8080 if 80 is in use)
   f) Click OK
   g) web.config is already included - no additional setup needed

   ═══ nginx (Linux) ═══
   a) Copy files to web root:
      sudo cp -r /path/to/extracted/folder/* /var/www/flyway-dashboard/
   
   b) Create nginx config (/etc/nginx/sites-available/flyway-dashboard):
      
      server {
          listen 80;
          server_name your-domain.com;
          root /var/www/flyway-dashboard;
          index index.html;

          # React Router support
          location / {
              try_files $uri $uri/ /index.html;
          }

          # Disable caching for config.json
          location = /config.json {
              add_header Cache-Control "no-store, no-cache, must-revalidate";
          }
      }
   
   c) Enable site and reload:
      sudo ln -s /etc/nginx/sites-available/flyway-dashboard /etc/nginx/sites-enabled/
      sudo nginx -t
      sudo systemctl reload nginx

   ═══ Apache (Linux) ═══
   a) Copy files to web root:
      sudo cp -r /path/to/extracted/folder/* /var/www/html/flyway-dashboard/
   
   b) Enable mod_rewrite:
      sudo a2enmod rewrite
   
   c) .htaccess is already included - no additional config needed
   
   d) Restart Apache:
      sudo systemctl restart apache2

   ═══ Python (Quick Test) ═══
   For quick testing only (not for production):
   
   cd /path/to/extracted/folder
   python -m http.server 8080
   
   Then open: http://localhost:8080

4. VERIFY SERVER CONNECTION
   Before opening the UI:
   
   a) Ensure server is running:
      - Check server console shows "Server running on port 3001"
      - OR test health endpoint: curl http://your-server:3001/health
   
   b) Server should respond with: {"status":"ok","timestamp":"..."}

5. OPEN IN BROWSER
   Navigate to your web server:
   
   - IIS: http://localhost (or http://localhost:8080)
   - nginx/Apache: http://your-domain.com
   - Python: http://localhost:8080

6. VERIFY UI IS WORKING
   You should see:
   - Dashboard page loads
   - Sidebar shows navigation
   - Metrics widgets display data
   
   If you see connection errors, check Step 2 (config.json)

================================================================================
                         CONFIGURATION
================================================================================

config.json (Required):
  {
    "apiBaseUrl": "http://your-server:3001"
  }

  This tells the UI where to find your Flyway Dashboard Server.
  Must match the server's actual address and port.

config.example.json (Template):
  Example configuration for reference.

web.config (IIS only):
  Already included - handles React Router URLs.
  Example: /deployments/123 redirects to index.html

.htaccess (Apache only):
  Already included - handles React Router URLs.
  Requires mod_rewrite to be enabled.

================================================================================
                         HTTPS SETUP (RECOMMENDED)
================================================================================

For production deployments, use HTTPS:

IIS:
1. Obtain SSL certificate (Let's Encrypt or commercial)
2. Import certificate into IIS
3. In IIS Manager, right-click site → "Edit Bindings"
4. Add HTTPS binding on port 443
5. Select your certificate

nginx with Let's Encrypt:
1. Install certbot:
   sudo apt install certbot python3-certbot-nginx

2. Obtain certificate:
   sudo certbot --nginx -d your-domain.com

3. Certbot automatically configures nginx for HTTPS

Apache with Let's Encrypt:
1. Install certbot:
   sudo apt install certbot python3-certbot-apache

2. Obtain certificate:
   sudo certbot --apache -d your-domain.com

================================================================================
                         TROUBLESHOOTING
================================================================================

Problem: UI shows "Cannot connect to server"
Solution: 1. Check config.json has correct server URL
          2. Verify server is running: curl http://server:3001/health
          3. Check firewall allows connection to port 3001
          4. Open browser console (F12) to see detailed error

Problem: UI loads but shows no data
Solution: 1. Check server logs for errors
          2. Verify database connections in server's jdbc-connections.json
          3. Check browser console (F12) for API errors

Problem: Page refresh shows 404 error
Solution: React Router issue:
          - IIS: Ensure web.config is in root folder
          - Apache: Ensure .htaccess is in root folder and mod_rewrite enabled
          - nginx: Ensure try_files is configured in nginx config

Problem: CORS errors in browser console
Solution: Update server's .env file:
          ALLOWED_ORIGINS=http://your-ui-domain:port
          Then restart server.

Problem: UI loads on localhost but not from other machines
Solution: 1. Change config.json apiBaseUrl from "localhost" to server's IP
          2. Check Windows Firewall allows inbound on web server port
          3. Verify network allows traffic between UI and server

================================================================================
                         DEPLOYMENT CHECKLIST
================================================================================

Before deploying to users:

□ Server is installed and running
□ Server has valid database connections
□ config.json points to correct server address
□ Web server is configured and tested
□ HTTPS is enabled (recommended)
□ Firewall rules allow necessary ports
□ CORS is configured on server (ALLOWED_ORIGINS)
□ Tested from a different machine
□ Browser console shows no errors (F12)

================================================================================
                         NGINX CONFIGURATION
================================================================================

Complete nginx configuration example:

server {
    listen 80;
    server_name flyway.company.com;
    root /var/www/flyway-dashboard;
    index index.html;

    # React Router support - all routes serve index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Prevent caching of config.json
    location = /config.json {
        add_header Cache-Control "no-store, no-cache, must-revalidate";
        add_header Pragma "no-cache";
        expires -1;
    }

    # Enable gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    gzip_vary on;
    gzip_min_length 1024;

    # Cache static assets
    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

================================================================================
                         SECURITY NOTES
================================================================================

1. HTTPS
   - Always use HTTPS in production
   - Protects data in transit
   - Free with Let's Encrypt

2. config.json
   - Contains server URL, no sensitive data
   - Safe to commit to source control

3. Firewall
   - Only expose web server port (80/443) to users
   - Server port (3001) should only be accessible to UI server
   - Use network segmentation in production

4. Authentication
   - Current version has no built-in authentication
   - Use reverse proxy authentication (nginx, Apache)
   - Or implement network-based access controls

================================================================================
                         NEXT STEPS
================================================================================

1. Extract the ZIP file
2. Edit config.json to point to your server
3. Deploy files to your web server
4. Ensure server is running
5. Open UI in browser
6. Verify dashboard loads and shows data

For server installation, see the server package's DISTRIBUTION_README.txt

For questions or issues:
- Run server diagnostics: npm run diagnostics (in server folder)
- Check browser console (F12) for UI errors
- Check server logs for API errors

================================================================================

Version: ${version}
Build Date: 2026
Static Files - No Runtime Dependencies

================================================================================
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
