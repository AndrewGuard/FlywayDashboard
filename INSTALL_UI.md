# UI-Only Installation Guide

Deploy the Flyway Dashboard UI on any web server, separately from the backend.

## Prerequisites
- A web server (IIS, nginx, Apache, or static hosting)
- URL of your deployed Flyway Dashboard Server

## Installation

### 1. Build the UI

On your **development machine** (or CI/CD pipeline):

```bash
# Clone repository
git clone https://github.com/your-org/flyway-dashboard.git
cd flyway-dashboard

# Install dependencies
npm install

# Build for production
npm run build
```

This creates an optimized `build/` folder with static files.

### 2. Configure Server URL

**Before deploying**, edit `build/config.json`:

```json
{
  "apiBaseUrl": "http://your-server-hostname:3001"
}
```

**Examples:**
- `"http://10.0.1.50:3001"` - Internal server IP
- `"https://api.flyway.yourcompany.com"` - Server behind HTTPS proxy
- `"http://localhost:3001"` - For local development

### 3. Deploy Static Files

Copy the entire `build/` folder to your web server.

---

## Deployment Options

### Option 1: IIS (Windows)

1. **Install IIS** with "Static Content" feature

2. **Create website:**
   ```powershell
   # Copy files
   xcopy /E /I build C:\inetpub\flyway-dashboard
   
   # Create site in IIS Manager
   # - Physical path: C:\inetpub\flyway-dashboard
   # - Port: 80 or 443
   # - Host: flyway.yourcompany.com
   ```

3. **Configure URL Rewrite** for React Router:
   
   Install [URL Rewrite Module](https://www.iis.net/downloads/microsoft/url-rewrite)
   
   Create `web.config` in site root:
   ```xml
   <?xml version="1.0" encoding="UTF-8"?>
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
     </system.webServer>
   </configuration>
   ```

### Option 2: nginx (Linux)

1. **Install nginx:**
   ```bash
   sudo apt update
   sudo apt install nginx
   ```

2. **Copy files:**
   ```bash
   sudo cp -r build/* /var/www/flyway-dashboard/
   ```

3. **Configure nginx** (`/etc/nginx/sites-available/flyway-dashboard`):
   ```nginx
   server {
       listen 80;
       server_name flyway.yourcompany.com;
       root /var/www/flyway-dashboard;
       index index.html;

       # React Router support
       location / {
           try_files $uri $uri/ /index.html;
       }

       # Cache static assets
       location /static {
           expires 1y;
           add_header Cache-Control "public, immutable";
       }
   }
   ```

4. **Enable and restart:**
   ```bash
   sudo ln -s /etc/nginx/sites-available/flyway-dashboard /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

### Option 3: Apache (Linux)

1. **Copy files:**
   ```bash
   sudo cp -r build/* /var/www/html/flyway-dashboard/
   ```

2. **Configure Apache** (`.htaccess` in site root):
   ```apache
   <IfModule mod_rewrite.c>
     RewriteEngine On
     RewriteBase /
     RewriteRule ^index\.html$ - [L]
     RewriteCond %{REQUEST_FILENAME} !-f
     RewriteCond %{REQUEST_FILENAME} !-d
     RewriteCond %{REQUEST_FILENAME} !-l
     RewriteRule . /index.html [L]
   </IfModule>
   ```

3. **Enable mod_rewrite:**
   ```bash
   sudo a2enmod rewrite
   sudo systemctl restart apache2
   ```

### Option 4: Static Hosting Services

#### Netlify
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
cd build
netlify deploy --prod
```

Then update `config.json` with your server URL.

#### Vercel
```bash
npm install -g vercel
vercel --prod
```

#### AWS S3 + CloudFront
```bash
# Upload to S3
aws s3 sync build/ s3://your-bucket-name/ --delete

# Configure CloudFront to serve index.html for all routes
```

---

## Configuration Files

### `config.json` (Required)

Located in `build/` folder (or `public/` before building):

```json
{
  "apiBaseUrl": "http://your-server-url:3001"
}
```

**Important:** Update this before deploying!

### Environment Variables (Build Time)

These are baked into the build and **cannot** be changed after deployment:

In `.env` (root directory):
```bash
# This is only used during development proxy
REACT_APP_API_URL=http://localhost:3001
```

For production, always use `config.json` instead.

---

## Testing the Deployment

1. **Open browser** to your UI URL (e.g., `http://flyway.yourcompany.com`)

2. **Check Network tab:**
   - Should see API calls to your server URL
   - If CORS errors, update server's `ALLOWED_ORIGINS`

3. **Verify dashboard loads:**
   - Widgets should display data
   - No console errors

---

## Updating the UI

1. **Build new version:**
   ```bash
   git pull
   npm install
   npm run build
   ```

2. **Update config** (if server URL changed):
   ```bash
   # Edit build/config.json
   ```

3. **Deploy:**
   ```bash
   # Copy to web server
   xcopy /E /Y build C:\inetpub\flyway-dashboard
   # OR
   sudo cp -r build/* /var/www/flyway-dashboard/
   ```

---

## Standalone UI Features

When deployed independently:
- ✅ Serves static HTML, CSS, JS
- ✅ Makes API calls to separate server
- ✅ No database or JDBC dependencies
- ✅ Can be served from CDN
- ✅ No Node.js required on web server

---

## Troubleshooting

### CORS Errors

**Symptom:** Browser console shows: `Access to fetch at 'http://server:3001/api/...' has been blocked by CORS policy`

**Fix:** On the **server** machine, edit `server/.env`:
```bash
ALLOWED_ORIGINS=http://your-ui-domain.com,http://another-domain.com
```

Restart server after changes.

### UI Loads But No Data

**Check:**
1. Is `config.json` pointing to correct server URL?
2. Can you access server directly? Try: `http://your-server:3001/health`
3. Are server and UI on same network? Check firewall rules.

### React Router 404s

**Symptom:** Refreshing page shows 404 error

**Fix:** Configure web server to serve `index.html` for all routes (see deployment options above).

### Wrong Server URL After Deployment

**Fix:** Don't rebuild! Just edit `config.json` on the web server:
```bash
# On web server
cd /var/www/flyway-dashboard  # or C:\inetpub\flyway-dashboard
nano config.json  # Update apiBaseUrl
```

No restart needed - refresh browser.

---

## Security Recommendations

1. **Use HTTPS** - Serve UI over HTTPS in production
2. **Set CSP headers** - Content Security Policy to prevent XSS
3. **Enable HSTS** - Force HTTPS connections
4. **Minimize attack surface** - UI is just static files, no backend

**nginx HTTPS example:**
```nginx
server {
    listen 443 ssl http2;
    server_name flyway.yourcompany.com;
    
    ssl_certificate /etc/ssl/certs/flyway.crt;
    ssl_certificate_key /etc/ssl/private/flyway.key;
    
    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    
    root /var/www/flyway-dashboard;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## Next Steps

Once UI is deployed:
1. Ensure server is running (see `INSTALL_SERVER.md`)
2. Access dashboard from any browser
3. Configure JDBC connections via UI (Project Configuration page)
