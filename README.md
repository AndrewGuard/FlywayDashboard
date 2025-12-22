# Flyway Dashboard

A comprehensive dashboard for visualizing and analyzing Flyway database migration metrics with DORA-aligned performance indicators and ROI calculations.

## Architecture

The Flyway Dashboard uses a **client-server architecture** for flexible deployment:

```
┌─────────────────┐     REST API      ┌──────────────────┐
│  React UI       │ ◄────────────────► │  Express Server  │
│  (Port 3000)    │    (HTTP/HTTPS)    │  (Port 3001)     │
│  Static Files   │                    │  + SQLite DB     │
└─────────────────┘                    └────────┬─────────┘
                                                │
                                                │ JDBC
                                                ▼
                                       ┌─────────────────┐
                                       │  Your Databases │
                                       │  (PostgreSQL,   │
                                       │   SQL Server)   │
                                       └─────────────────┘
```

**Benefits:**
- ✅ Server runs on machine with database access
- ✅ UI can be deployed separately (no DB access needed)
- ✅ End users just need a web browser
- ✅ Automatic JDBC credential encryption (AES-256-GCM)

---

## Quick Start - Development

### Prerequisites
- **Node.js 16+** - Download from [nodejs.org](https://nodejs.org/)

### Installation

1. **Clone repository:**
   ```bash
   git clone https://github.com/your-org/flyway-dashboard.git
   cd flyway-dashboard
   ```

2. **Install dependencies:**
   ```bash
   npm install
   cd server
   npm install
   cd ..
   ```

3. **Configure environment (optional):**
   ```bash
   # Client configuration (optional - uses defaults if not set)
   cp .env.example .env
   # Edit .env to customize:
   #   - PORT=3000 (client dev server port)
   #   - REACT_APP_API_URL=http://localhost:3001 (API server URL)
   
   # Server configuration (optional for demo mode)
   cd server
   cp .env.example .env
   # Edit .env to customize:
   #   - DEMO_MODE=true (use demo data)
   #   - PORT=3001 (API server port)
   #   - ALLOWED_ORIGINS=http://localhost:3000 (client URL)
   cd ..
   ```

### Running the Application

#### Development Mode (Recommended)

Start both server and frontend with auto-restart:

```bash
npm run dev
```

This single command:
- ✅ Starts backend server on `http://localhost:3001` (with auto-restart via nodemon)
- ✅ Starts frontend React app on `http://localhost:3000` (with hot reload)
- ✅ Color-coded console output for easy debugging
- ✅ Auto-restarts server when you edit code, JDBC configs, or `.env` files

**Your browser will automatically open to:** `http://localhost:3000`

#### Manual Start (Two Terminals)

**Terminal 1 - Server:**
```bash
cd server
npm run dev    # With auto-restart
# OR
npm start      # Without auto-restart
```

**Terminal 2 - Frontend:**
```bash
npm start
```

### Configuration

#### Connect to Real Databases

By default, the dashboard uses demo data. To connect to your Flyway databases:

**Option 1: Using the UI (Recommended)**
1. Navigate to **Project Configuration** in the sidebar
2. Add your JDBC connection strings
3. Test connections
4. Click "Save Configuration"

**Option 2: Manual Configuration**
1. Edit `server/jdbc-connections.json`:
   ```json
   {
     "prod": [
       {
         "name": "Production DB",
         "jdbcUrl": "jdbc:postgresql://host:5432/db",
         "username": "flyway_readonly",
         "password": "your_password"
       }
     ],
     "nonProd": [
       {
         "name": "Test DB",
         "jdbcUrl": "jdbc:sqlserver://host:1433;databaseName=db",
         "username": "flyway_readonly",
         "password": "your_password"
       }
     ]
   }
   ```

2. Server auto-restarts (if using `npm run dev`)

**Security Note:** All JDBC credentials are automatically encrypted at rest using AES-256-GCM encryption.

#### Customize Metrics

Navigate to **ROI Calculator** in the dashboard to enter your organization's baseline metrics for accurate ROI calculations.

#### Configure Ports (Optional)

By default, the client runs on port **3000** and the server runs on port **3001**. To use custom ports:

**Client Port (React dev server):**
```bash
# In .env (root folder)
PORT=3002
REACT_APP_API_URL=http://localhost:3001  # Keep pointing to server
```

**Server Port (API server):**
```bash
# In server/.env
PORT=3005
ALLOWED_ORIGINS=http://localhost:3000  # Must match client URL
```

**Important:** If you change the server port, you must also update:
1. Client proxy in [package.json](package.json): `"proxy": "http://localhost:3005"`
2. For production: [public/config.json](public/config.json): `{"apiBaseUrl": "http://localhost:3005"}`

---

## Production Deployment

For enterprise/production deployments, deploy the server and UI separately:

### Server Deployment

Deploy the server on a machine with access to your production databases.

#### Prerequisites
- **Node.js 16+** on the server machine
- Network access to Flyway databases
- Open port (default: 3001) for API access

#### Quick Setup

1. **Extract server package:**
   ```bash
   tar -xzf flyway-dashboard-server-{version}.tar.gz
   cd flyway-dashboard-server
   ```

2. **Install dependencies:**
   ```bash
   npm install --production
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env
   nano .env
   ```

   **Required settings:**
   ```bash
   # Server mode
   NODE_ENV=production
   DEMO_MODE=false
   
   # Server port (API will listen on this port)
   # Change if port 3001 is already in use or blocked by firewall
   PORT=3001
   
   # CORS - comma-separated UI domains
   # Must include the URL where your React client is running
   ALLOWED_ORIGINS=https://dashboard.yourcompany.com,https://flyway.internal
   
   # Optional: Override SQLite database location
   # DB_PATH=/opt/flyway-dashboard/data/dashboard.db
   
   # Optional: External secrets (Azure Key Vault, AWS Secrets Manager)
   # ENCRYPTION_KEY=your-256-bit-key
   ```

   **Note:** If you change PORT to something other than 3001, update your firewall rules and make sure to update the client's `config.json` with the new port.

4. **Configure JDBC connections:**
   ```bash
   nano jdbc-connections.json
   ```

   ```json
   {
     "prod": [
       {
         "name": "Production App DB",
         "jdbcUrl": "jdbc:postgresql://prod-db.internal:5432/app_db",
         "username": "flyway_readonly",
         "password": "secure_password"
       }
     ],
     "nonProd": [
       {
         "name": "Test Environment",
         "jdbcUrl": "jdbc:sqlserver://test-db.internal:1433;databaseName=test_db",
         "username": "flyway_readonly",
         "password": "secure_password"
       }
     ]
   }
   ```

   **Credentials are automatically encrypted on first run.**

5. **Start the server:**

   **Using PM2 (Recommended):**
   ```bash
   npm install -g pm2
   pm2 start index.js --name flyway-dashboard-server
   pm2 save
   pm2 startup  # Follow on-screen instructions
   ```

   **Using systemd:**
   ```bash
   sudo nano /etc/systemd/system/flyway-dashboard.service
   ```

   ```ini
   [Unit]
   Description=Flyway Dashboard Server
   After=network.target

   [Service]
   Type=simple
   User=flyway
   WorkingDirectory=/opt/flyway-dashboard-server
   ExecStart=/usr/bin/node index.js
   Restart=always
   RestartSec=10
   StandardOutput=syslog
   StandardError=syslog
   SyslogIdentifier=flyway-dashboard

   [Install]
   WantedBy=multi-user.target
   ```

   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable flyway-dashboard
   sudo systemctl start flyway-dashboard
   sudo systemctl status flyway-dashboard
   ```

   **Windows Service:**
   ```powershell
   npm install -g node-windows
   node windows-service-install.js
   ```

6. **Verify server is running:**
   ```bash
   curl http://localhost:3001/health
   # Should return: {"status":"healthy","mode":"production","timestamp":"..."}
   ```

#### Server Security Best Practices

- **Use read-only database accounts** for JDBC connections
- **Firewall**: Only allow UI server(s) to access port 3001
- **HTTPS**: Run behind reverse proxy (nginx/Apache) with SSL certificates
- **Environment Variables**: Use Azure Key Vault or AWS Secrets Manager for production secrets
- **Monitoring**: Set up health check monitoring on `/health` endpoint

---

### UI Deployment

Deploy the UI as static files to any web server (no database access required).

#### Prerequisites
- Web server (IIS, nginx, Apache, or cloud hosting)
- HTTPS certificate (recommended for production)

#### Quick Setup

1. **Build static files:**
   ```bash
   npm run build
   ```

2. **Configure API server URL:**
   ```bash
   nano build/config.json
   ```

   ```json
   {
     "apiBaseUrl": "http://your-server.internal:3001"
   }
   ```

   **Important:** 
   - Change `http://your-server.internal:3001` to your actual server URL
   - Use HTTPS in production: `https://api.yourcompany.com`
   - If your server uses a custom port (e.g., 3005), include it: `https://api.yourcompany.com:3005`
   - The port must match the PORT setting in your server's `.env` file

3. **Deploy to web server:**

   **IIS (Windows):**
   ```powershell
   # Copy files
   Copy-Item -Path build\* -Destination C:\inetpub\wwwroot\flyway-dashboard -Recurse
   
   # Create web.config for React Router
   $webConfig = @"
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
       <staticContent>
         <mimeMap fileExtension=".json" mimeType="application/json" />
       </staticContent>
     </system.webServer>
   </configuration>
   "@
   $webConfig | Out-File -FilePath C:\inetpub\wwwroot\flyway-dashboard\web.config -Encoding UTF8
   ```

   **nginx (Linux):**
   ```bash
   # Copy files
   sudo cp -r build/* /var/www/flyway-dashboard/
   
   # Configure nginx
   sudo nano /etc/nginx/sites-available/flyway-dashboard
   ```

   ```nginx
   server {
       listen 80;
       server_name dashboard.yourcompany.com;
       
       # Redirect to HTTPS
       return 301 https://$server_name$request_uri;
   }

   server {
       listen 443 ssl http2;
       server_name dashboard.yourcompany.com;
       
       ssl_certificate /etc/letsencrypt/live/dashboard.yourcompany.com/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/dashboard.yourcompany.com/privkey.pem;
       
       root /var/www/flyway-dashboard;
       index index.html;
       
       # React Router support
       location / {
           try_files $uri $uri/ /index.html;
       }
       
       # Cache static assets
       location /static/ {
           expires 1y;
           add_header Cache-Control "public, immutable";
       }
       
       # JSON config shouldn't be cached
       location /config.json {
           expires -1;
           add_header Cache-Control "no-store, no-cache, must-revalidate";
       }
   }
   ```

   ```bash
   sudo ln -s /etc/nginx/sites-available/flyway-dashboard /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

   **Apache (Linux):**
   ```bash
   # Copy files
   sudo cp -r build/* /var/www/flyway-dashboard/
   
   # Create .htaccess
   sudo nano /var/www/flyway-dashboard/.htaccess
   ```

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
   
   # Disable caching for config.json
   <FilesMatch "config\.json$">
     Header set Cache-Control "no-store, no-cache, must-revalidate"
   </FilesMatch>
   ```

   **Static Cloud Hosting:**
   
   - **AWS S3 + CloudFront:** Upload to S3, enable static website hosting, configure CloudFront for HTTPS
   - **Azure Static Web Apps:** `az staticwebapp create`, push to GitHub/Azure DevOps
   - **Netlify/Vercel:** Connect repo or drag-and-drop `build/` folder

4. **Set up HTTPS (Recommended):**

   **Let's Encrypt (Free):**
   ```bash
   sudo certbot --nginx -d dashboard.yourcompany.com
   # OR for Apache:
   sudo certbot --apache -d dashboard.yourcompany.com
   ```

5. **Verify deployment:**
   
   Open browser to `https://dashboard.yourcompany.com` and check:
   - Dashboard loads
   - Sidebar navigation works
   - Metrics display (test API connection)

#### UI Configuration Updates

After deployment, end users or IT can update the server URL without rebuilding:

1. **Edit config.json on web server:**
   ```bash
   # IIS
   notepad C:\inetpub\wwwroot\flyway-dashboard\config.json
   
   # nginx/Apache
   sudo nano /var/www/flyway-dashboard/config.json
   ```

2. **Change apiBaseUrl:**
   ```json
   {
     "apiBaseUrl": "https://new-server.yourcompany.com"
   }
   ```

3. **No rebuild needed** - just refresh browser

---

### End User Experience (Production)

After deployment, end users simply:
1. Open browser to `https://dashboard.yourcompany.com`
2. View metrics and reports
3. Export charts as images
4. Calculate ROI

**No installation, database access, or configuration required.**

---

## Build Distribution Packages

### Server Package

Create a distributable server package:

```bash
chmod +x build-server.sh
./build-server.sh
```

**Creates:**
- `dist/flyway-dashboard-server-{version}.tar.gz`
- `dist/flyway-dashboard-server-{version}.zip`

**Includes:**
- Server source code (`index.js`, routes, utils)
- `package.json` with dependencies
- `.env.example` configuration template
- `jdbc-connections.json` template
- Installation scripts
- DEPLOYMENT_SERVER.md documentation

### UI Package

Create a distributable UI package:

```bash
chmod +x build-ui.sh
./build-ui.sh
```

**Creates:**
- `dist/flyway-dashboard-ui-{version}.tar.gz`
- `dist/flyway-dashboard-ui-{version}.zip`

**Includes:**
- Built React app (HTML/JS/CSS)
- `config.json` configuration file
- `config.example.json` template
- `web.config` for IIS
- `.htaccess` for Apache
- DEPLOYMENT_UI.md documentation

---

## Features

### Dashboard Metrics (DORA-Aligned)

- **Deployment Frequency** - Tracked per database and environment
- **Lead Time for Changes** - From commit to production deployment
- **Change Failure Rate** - Percentage of deployments causing incidents
- **Time to Restore Service** - Failure recovery metrics

### ROI Calculator

Calculate the business value of Flyway adoption:
- Baseline vs. Flyway metrics comparison
- Cost savings from reduced lead times
- Deployment frequency improvements
- Failure rate reductions
- Annual ROI percentage with payback period

### Widgets

- Change in Deployment Metrics (Production only)
- Lead Time Over Time (Flyway vs Non-Flyway)
- Deployments Over Time by Database
- Average Deployment Time per Database
- Migration Activity (Monthly trends)
- Top Platforms (PostgreSQL, SQL Server, Oracle, MySQL)
- Top Databases by Migration Count
- Migration History (Searchable table)

### Export Capabilities

All graphs and the ROI calculator can be exported as high-resolution PNG images via download buttons in the top-right corner of each widget.

### Security

- **Encrypted Credentials** - All JDBC connections encrypted at rest (AES-256-GCM)
- **Automatic Key Generation** - Encryption key auto-generated on first run
- **Read-Only Access** - Recommend read-only database credentials
- **CORS Protection** - Configurable allowed origins for API
- **Environment Variables** - Support for Azure Key Vault, AWS Secrets Manager

---

## API Endpoints

The server exposes the following REST API endpoints:

### Health Check
- `GET /health` - Server health and status

### Metrics
- `GET /api/metrics/deployments-per-quarter` - Deployment frequency metrics
- `GET /api/metrics/lead-times` - Lead time analysis
- `GET /api/metrics/lead-time-history/refresh` - Lead time trends over time
- `GET /api/user-defined-metrics` - User's baseline metrics for ROI

### Migration History
- `GET /api/flyway/history/all` - All migration records
- `POST /api/flyway/history/refresh` - Refresh data from databases

### Configuration
- `GET /api/jdbc-connections/config` - Get JDBC configuration (encrypted)
- `POST /api/jdbc-connections/config` - Update JDBC configuration
- `POST /api/jdbc-connections/test` - Test database connection

---

## Troubleshooting

### Port Already in Use

If port 3000 or 3001 is already taken by another application:

**Change client port (React dev server):**
```bash
# In .env (root folder)
PORT=3002
```

**Change server port (API server):**
```bash
# In server/.env
PORT=3005

# Also update ALLOWED_ORIGINS to match new client port
ALLOWED_ORIGINS=http://localhost:3002
```

**Update client to point to new server port:**
```bash
# In .env (root folder)
REACT_APP_API_URL=http://localhost:3005

# AND in package.json, update the proxy
"proxy": "http://localhost:3005"
```

**For production**, update [public/config.json](public/config.json):
```json
{
  "apiBaseUrl": "http://your-server:3005"
}
```

### Database Connection Issues

1. **Test connection:**
   ```bash
   curl -X POST http://localhost:3001/api/jdbc-connections/test \
     -H "Content-Type: application/json" \
     -d '{"jdbcUrl": "jdbc:postgresql://host:5432/db", "username": "user", "password": "pass"}'
   ```

2. **Check JDBC URL format:**
   - PostgreSQL: `jdbc:postgresql://host:5432/dbname`
   - SQL Server: `jdbc:sqlserver://host:1433;databaseName=dbname`

3. **Verify credentials** - Use read-only database account

4. **Check firewall** - Ensure database port is accessible from server

5. **Verify Flyway schema table** - Query must return rows:
   ```sql
   SELECT * FROM flyway_schema_history;
   ```

### CORS Errors (Production)

If UI shows CORS errors when calling API:

1. **Add UI domain to ALLOWED_ORIGINS** in server `.env`:
   ```bash
   ALLOWED_ORIGINS=https://dashboard.yourcompany.com,https://flyway.internal
   ```

2. **Restart server:**
   ```bash
   pm2 restart flyway-dashboard-server
   # OR
   sudo systemctl restart flyway-dashboard
   ```

3. **Check server logs** for blocked origin messages

### Server Won't Start

Check for:
- **Missing dependencies:** `npm install` in `server/` folder
- **Port conflicts:** Change `PORT` in `server/.env`
- **Invalid `.env` file:** Compare with `.env.example`
- **Corrupted SQLite database:** Delete `server/db/dashboard.db` to recreate

### UI Can't Connect to Server

1. **Check config.json** has correct server URL
2. **Verify server is running:** `curl http://server:3001/health`
3. **Check CORS settings** in server `.env`
4. **Check network access** from UI server to API server
5. **Check browser console** for detailed error messages

### Export Images Not Working

1. **Check browser console** for html2canvas errors
2. **Disable browser extensions** that block canvas access
3. **Try different browser** (Chrome/Edge recommended)

---

## Project Structure

```
flyway-dashboard/
├── public/                 # Static assets
│   ├── config.json        # Runtime API configuration (editable)
│   ├── config.example.json
│   ├── favicon.ico
│   ├── index.html
│   └── manifest.json
├── src/                   # React UI source
│   ├── config.ts         # Configuration loader
│   ├── apiClient.ts      # API client wrapper
│   ├── App.tsx           # Main application
│   ├── Dashboard.tsx     # Main dashboard page
│   ├── RoiCalculationPage.tsx
│   ├── ProjectConfiguration.tsx
│   ├── MigrationHistory.tsx
│   ├── utils/
│   │   └── exportUtils.ts  # Image export utilities
│   └── widgets/          # Dashboard widgets
│       ├── LeadTimeOverTimeWidget.tsx
│       ├── DeploymentsOverTimeWidget.tsx
│       ├── ChangeInDeploymentMetricsWidget.tsx
│       ├── AverageDeploymentTimeWidget.tsx
│       ├── TopPlatformsWidget.tsx
│       └── TopDatabasesWidget.tsx
├── server/               # Express API server
│   ├── index.js         # Server entry point
│   ├── .env.example     # Configuration template
│   ├── db/              # SQLite database
│   ├── routes/          # API route handlers
│   │   ├── flywayRoutes.js
│   │   ├── jdbcConnectionRoutes.js
│   │   ├── metricsRoutes.js
│   │   └── userDefinedMetricsRoutes.js
│   ├── utils/           # Encryption utilities
│   │   └── encryption.js
│   └── jdbc-connections.json  # Encrypted JDBC config
├── build-server.sh      # Server package builder
├── build-ui.sh         # UI package builder
├── DEPLOYMENT_SERVER.md # Server deployment guide (advanced)
├── DEPLOYMENT_UI.md    # UI deployment guide (advanced)
├── SEPARATION_IMPLEMENTATION.md # Architecture details (advanced)
└── README.md           # This file
```

---

## Technology Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Material-UI (MUI) v5** - Component library
- **MUI X-Charts** - Data visualization
- **Chart.js** - Additional charting
- **React Router v7** - Client-side routing
- **html2canvas** - Image export

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **SQLite (better-sqlite3)** - Embedded database
- **PostgreSQL (pg)** - Database driver
- **SQL Server (tedious)** - Database driver
- **Node crypto** - Credential encryption

---

## Known Limitations and Roadmap

**Current Limitations:**
1. **JDBC Discovery** - No automatic scanning for JDBC connections (manual configuration required)
2. **Flyway Model** - Requires `flyway_schema_history` table (migrations model only, versioned model not supported)
3. **Lead Time in ROI** - Lead time not yet integrated into ROI calculations
4. **Platform Detection** - Limited to PostgreSQL, SQL Server, Oracle, MySQL (other databases show as "Unknown")

**Roadmap:**
- [ ] Automatic JDBC connection discovery via server/network scanning
- [ ] Support for Flyway's versioned model
- [ ] Integrate lead time metrics into ROI calculator
- [ ] Enhanced platform detection (MariaDB, MongoDB, Cassandra, etc.)
- [ ] Real-time metrics updates via WebSockets
- [ ] Multi-tenancy support
- [ ] Authentication/authorization system (OAuth, SAML)
- [ ] Docker containerization
- [ ] Kubernetes deployment manifests
- [ ] Custom alerting and notifications

---

## Advanced Documentation

For deep-dive technical details and advanced configurations:

- **[PORT_CONFIGURATION.md](PORT_CONFIGURATION.md)** - Complete guide to configuring custom ports for client and server
- **[DEPLOYMENT_SERVER.md](DEPLOYMENT_SERVER.md)** - Comprehensive server deployment guide (PM2, systemd, Windows Service, monitoring, backup strategies)
- **[DEPLOYMENT_UI.md](DEPLOYMENT_UI.md)** - Comprehensive UI deployment guide (IIS, nginx, Apache, cloud hosting, CDN setup)
- **[SEPARATION_IMPLEMENTATION.md](SEPARATION_IMPLEMENTATION.md)** - Technical architecture details, migration paths, API examples, security features

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -am 'Add my feature'`
4. Push to branch: `git push origin feature/my-feature`
5. Submit a Pull Request

---

## License

[Your License Here]

---

## Support

For issues, questions, or deployment assistance:
- **Quick Start Issues** - Check "Troubleshooting" section above
- **Server Deployment** - See [DEPLOYMENT_SERVER.md](DEPLOYMENT_SERVER.md)
- **UI Deployment** - See [DEPLOYMENT_UI.md](DEPLOYMENT_UI.md)
- **Architecture Questions** - See [SEPARATION_IMPLEMENTATION.md](SEPARATION_IMPLEMENTATION.md)
- **Bug Reports** - Open an issue on GitHub
- **Feature Requests** - Open an issue with "enhancement" label
