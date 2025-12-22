# Flyway Dashboard - UI Deployment Guide

This guide covers deploying the **Flyway Dashboard UI** on any web server accessible to end users.

## Prerequisites

- A web server (IIS, nginx, Apache, or static hosting service)
- URL of your deployed Flyway Dashboard Server

## Quick Start

### 1. Build the UI

On your development machine:

```bash
# Navigate to project root
cd flyway-dashboard

# Install dependencies (if not already done)
npm install

# Build for production
npm run build
```

This creates a `build/` folder with optimized static files.

### 2. Configure Server Connection

Edit `build/config.json` to point to your server:

```json
{
  "apiBaseUrl": "http://your-server-hostname:3001"
}
```

**Examples:**
- `"http://flyway-api.yourcompany.com:3001"`
- `"https://flyway-api.yourcompany.com"` (with HTTPS reverse proxy)
- `"http://10.0.1.50:3001"` (internal IP)

### 3. Deploy to Web Server

Copy the entire `build/` folder to your web server.

---

## Deployment Options

### Option 1: IIS (Windows Server)

1. **Install IIS** with "Static Content" feature
2. **Create new website**:
   - Physical path: `C:\inetpub\flyway-dashboard`
   - Binding: Port 80 or 443 (HTTPS)
   - Host name: `flyway-dashboard.yourcompany.com`

3. **Copy files**:
   ```powershell
   xcopy /E /I build C:\inetpub\flyway-dashboard
   ```

4. **Configure URL Rewrite** (for React Router):
   
   Install [URL Rewrite Module](https://www.iis.net/downloads/microsoft/url-rewrite), then create `web.config` in the site root:

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
               <add input="{REQUEST_URI}" pattern="^/(api)" negate="true" />
             </conditions>
             <action type="Rewrite" url="/" />
           </rule>
         </rules>
       </rewrite>
     </system.webServer>
   </configuration>
   ```

5. **Edit config.json** with your server URL
6. **Test**: Browse to `http://flyway-dashboard.yourcompany.com`

### Option 2: nginx (Linux)

1. **Install nginx**:
   ```bash
   sudo apt update
   sudo apt install nginx
   ```

2. **Copy files**:
   ```bash
   sudo mkdir -p /var/www/flyway-dashboard
   sudo cp -r build/* /var/www/flyway-dashboard/
   ```

3. **Configure nginx** (`/etc/nginx/sites-available/flyway-dashboard`):
   ```nginx
   server {
       listen 80;
       server_name flyway-dashboard.yourcompany.com;
       root /var/www/flyway-dashboard;
       index index.html;

       # Enable gzip compression
       gzip on;
       gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

       # React Router support
       location / {
           try_files $uri $uri/ /index.html;
       }

       # Cache static assets
       location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
           expires 1y;
           add_header Cache-Control "public, immutable";
       }
   }
   ```

4. **Enable site**:
   ```bash
   sudo ln -s /etc/nginx/sites-available/flyway-dashboard /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

5. **Edit config.json** with your server URL:
   ```bash
   sudo nano /var/www/flyway-dashboard/config.json
   ```

### Option 3: Apache (Linux)

1. **Install Apache**:
   ```bash
   sudo apt install apache2
   ```

2. **Copy files**:
   ```bash
   sudo mkdir -p /var/www/flyway-dashboard
   sudo cp -r build/* /var/www/flyway-dashboard/
   ```

3. **Configure Apache** (`/etc/apache2/sites-available/flyway-dashboard.conf`):
   ```apache
   <VirtualHost *:80>
       ServerName flyway-dashboard.yourcompany.com
       DocumentRoot /var/www/flyway-dashboard

       <Directory /var/www/flyway-dashboard>
           Options -Indexes +FollowSymLinks
           AllowOverride All
           Require all granted

           # React Router support
           RewriteEngine On
           RewriteBase /
           RewriteRule ^index\.html$ - [L]
           RewriteCond %{REQUEST_FILENAME} !-f
           RewriteCond %{REQUEST_FILENAME} !-d
           RewriteRule . /index.html [L]
       </Directory>
   </VirtualHost>
   ```

4. **Enable modules and site**:
   ```bash
   sudo a2enmod rewrite
   sudo a2ensite flyway-dashboard
   sudo systemctl reload apache2
   ```

### Option 4: Static Hosting (Cloud)

#### Azure Static Web Apps
```bash
# Install Azure CLI
az login
az staticwebapp create \
  --name flyway-dashboard \
  --resource-group your-resource-group \
  --source build/ \
  --location "East US"
```

Edit `build/config.json` before uploading.

#### AWS S3 + CloudFront
```bash
# Upload to S3
aws s3 sync build/ s3://flyway-dashboard-bucket/

# Enable website hosting
aws s3 website s3://flyway-dashboard-bucket/ \
  --index-document index.html \
  --error-document index.html
```

#### Netlify / Vercel
```bash
# Install CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=build
```

Edit `build/config.json` after deployment via the hosting provider's dashboard.

---

## Configuration

### config.json

The UI reads `config.json` on startup to determine the API server location.

**Location**: `build/config.json` (or `/var/www/flyway-dashboard/config.json` after deployment)

**Format**:
```json
{
  "apiBaseUrl": "http://your-server:3001"
}
```

**Important**: This file must be editable after deployment, so end users (or IT) can update the server URL without rebuilding the app.

### Environment Variables (Build-time)

Alternatively, set the API URL at build time:

```bash
REACT_APP_API_URL=http://your-server:3001 npm run build
```

This bakes the URL into the build, but is less flexible for end users.

---

## HTTPS Setup

### Using Let's Encrypt (Free SSL)

For nginx:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d flyway-dashboard.yourcompany.com
```

For Apache:
```bash
sudo apt install certbot python3-certbot-apache
sudo certbot --apache -d flyway-dashboard.yourcompany.com
```

### Using Custom Certificate

Place your certificate files and update nginx config:
```nginx
server {
    listen 443 ssl;
    server_name flyway-dashboard.yourcompany.com;
    
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    # ... rest of config
}
```

---

## End User Experience

Once deployed:

1. **Users navigate to**: `http://flyway-dashboard.yourcompany.com`
2. **No installation required** - just a URL
3. **No configuration needed** - just browse
4. **Works from any device** with network access
5. **No database credentials needed** - server handles all DB connections

---

## Updating

### Update Process

1. **Build new version**:
   ```bash
   git pull
   npm install
   npm run build
   ```

2. **Backup current deployment**:
   ```bash
   sudo mv /var/www/flyway-dashboard /var/www/flyway-dashboard.backup
   ```

3. **Deploy new version**:
   ```bash
   sudo cp -r build /var/www/flyway-dashboard
   ```

4. **Restore config.json** (if overwritten):
   ```bash
   sudo cp /var/www/flyway-dashboard.backup/config.json /var/www/flyway-dashboard/
   ```

5. **Clear browser cache** or do a hard refresh (Ctrl+Shift+R)

---

## Troubleshooting

### "Failed to load configuration" error

- Check `config.json` exists in the deployed folder
- Verify JSON syntax is valid
- Check file permissions (must be readable)

### API requests failing

1. **Check config.json** has correct server URL
2. **Test server directly**:
   ```bash
   curl http://your-server:3001/health
   ```
3. **Check browser console** (F12) for specific error messages
4. **Verify CORS** - Server must allow your UI's domain in `ALLOWED_ORIGINS`

### React Router 404 errors

- Ensure URL rewrite rules are configured (see IIS/nginx/Apache sections above)
- Check web server error logs

### Blank page

- Check browser console (F12) for JavaScript errors
- Verify all static assets are deployed
- Check web server is serving files correctly

---

## Security Checklist

- ✅ Use HTTPS in production
- ✅ Ensure `config.json` doesn't contain sensitive data
- ✅ Set proper file permissions (755 for directories, 644 for files)
- ✅ Keep web server software updated
- ✅ Restrict access via firewall if needed (internal only)
- ✅ Configure Content Security Policy headers

---

## Support

For issues:
1. Check browser console (F12 → Console tab)
2. Verify `config.json` is correct
3. Test API server is reachable: `curl http://your-server:3001/health`
4. Check web server logs
