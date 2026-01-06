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

3. **Server setup - Choose one:**

   **Option A: Interactive Setup Wizard (Recommended) ✨**
   ```bash
   cd server
   npm run setup
   ```
   
   The wizard guides you through:
   - Environment configuration (ports, CORS, demo mode)
   - Database connections with live testing
   - Encryption key generation
   - Health validation
   
   **Option B: Manual Setup**
   ```bash
   cd server
   cp .env.example .env
   # Edit .env for your environment
   
   # Edit jdbc-connections.json for your databases
   
   # Test everything
   npm run diagnostics
   ```
   
   See [server/QUICKSTART.md](server/QUICKSTART.md) for detailed server setup guide.

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

By default, the client runs on port **3000** and the server runs on port **3001**. 

To use custom ports, see [PORT_CONFIGURATION.md](PORT_CONFIGURATION.md) for complete configuration steps.

---

## Production Deployment

Deploy the server and UI separately for production. See detailed guides: [DEPLOYMENT_SERVER.md](DEPLOYMENT_SERVER.md) and [DEPLOYMENT_UI.md](DEPLOYMENT_UI.md).

### Server Deployment

#### Prerequisites
- **Node.js 18+** on the server machine
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
   NODE_ENV=production
   DEMO_MODE=false
   PORT=3001
   ALLOWED_ORIGINS=https://dashboard.yourcompany.com
   ```

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
     "apiBaseUrl": "https://api.yourcompany.com"
   }
   ```

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

### Server Package (Source Distribution)

Create a distributable server source package:

```bash
cd server
npm run package-source
```

**Creates:**
- `dist/flyway-dashboard-server-source-{version}.zip` (60 KB)

**Includes:**
- Complete server source code
- `package.json` with all dependencies
- `.env.example` configuration template
- `jdbc-connections.json` configuration file
- Setup wizard and diagnostics tools
- Documentation and quick start guide

**User Requirements:**
- Node.js 18+ (only dependency needed)
- Run `npm install` to install dependencies
- Configure `.env` and `jdbc-connections.json`
- Run `npm start` to launch server

### UI Package (Pre-Built Static Files)

Create a distributable UI package:

```bash
npm run package-ui
```

**Creates:**
- `dist/flyway-dashboard-ui-{version}.zip` (1.58 MB)

**Includes:**
- Pre-built React app (HTML/JS/CSS)
- `config.json` configuration file
- `config.example.json` template
- `web.config` for IIS deployment
- `.htaccess` for Apache deployment
- README with deployment instructions

**User Requirements:**
- Web server (IIS, Apache, Nginx, or any static file server)
- No build tools needed - ready to deploy

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

## Server Setup Tools

The server includes helpful tools to make installation easier:

### Setup Wizard (Interactive)
```bash
cd server
npm run setup
```
Guided wizard that configures environment, tests connections, and generates encryption keys.

### Diagnostics
```bash
cd server
npm run diagnostics
```
Validates your entire server configuration:
- ✓ Environment variables
- ✓ Database connectivity
- ✓ Port availability  
- ✓ File permissions
- ✓ Migration data

### Test Connections
```bash
cd server
npm run test-connections
```
Tests all JDBC connections in `jdbc-connections.json`.

### Validate Single Connection
```bash
cd server
node validate-connection.js "jdbc:postgresql://localhost:5432/mydb?user=user&password=pass"
```
Quick validation of a JDBC URL before adding to config.

See [server/QUICKSTART.md](server/QUICKSTART.md) for complete server setup guide.

---

## Troubleshooting

### Server Won't Start

**Run diagnostics first:**
```bash
cd server
npm run diagnostics
```

This will identify configuration issues, port conflicts, or permission problems.

### Port Already in Use

If port 3000 or 3001 is already taken, see [PORT_CONFIGURATION.md](PORT_CONFIGURATION.md) for complete instructions on changing ports.

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

## Additional Documentation

- [PORT_CONFIGURATION.md](PORT_CONFIGURATION.md) - Custom port configuration
- [DEPLOYMENT_SERVER.md](DEPLOYMENT_SERVER.md) - Advanced server deployment (PM2, systemd, Windows Service)
- [DEPLOYMENT_UI.md](DEPLOYMENT_UI.md) - Advanced UI deployment (IIS, nginx, Apache, cloud hosting)
- [DEPLOYMENT.md](DEPLOYMENT.md) - General deployment overview
- [SEPARATION_IMPLEMENTATION.md](SEPARATION_IMPLEMENTATION.md) - Architecture details
- [SECURITY.md](SECURITY.md) - Security best practices
- [EXE_BUILD_GUIDE.md](EXE_BUILD_GUIDE.md) - EXE build troubleshooting (for advanced users)

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
