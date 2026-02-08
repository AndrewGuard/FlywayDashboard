# Server-Only Installation Guide

Deploy the Flyway Dashboard server on a machine with database access.

## Prerequisites
- Node.js 18+
- Network access to your Flyway databases

## Installation

### 1. Get the Server Files

**Option A: Clone full repository (then use server folder)**
```bash
git clone https://github.com/your-org/flyway-dashboard.git
cd flyway-dashboard/server
```

**Option B: Download server package only**
```bash
# Download from releases page
unzip flyway-dashboard-server.zip
cd flyway-dashboard-server
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Setup Wizard

```bash
npm run setup
```

The wizard will:
- Generate encryption keys
- Configure environment variables (port, CORS, demo mode)
- Set up database connections (optional)
- Test everything

### 4. Start Server

```bash
npm start
# OR for development with auto-restart:
npm run dev
```

Server runs on **http://localhost:3001** by default.

## Configuration

### Environment Variables (`.env`)

```bash
# Demo mode (true = mock data, false = real databases)
DEMO_MODE=false

# Server port
PORT=3001

# CORS - Add your UI URL(s)
ALLOWED_ORIGINS=https://flyway-dashboard.yourcompany.com,http://localhost:3000

# Encryption key (generated during setup)
JDBC_ENCRYPTION_KEY=your_generated_key
```

### Database Connections

Edit `jdbc-connections.json` or use the UI:
```json
{
  "prod": [
    "jdbc:postgresql://host:5432/db?user=user&password=pass"
  ],
  "nonProd": [
    "jdbc:sqlserver://host:1433;databaseName=db;user=user;password=pass"
  ]
}
```

All credentials are **automatically encrypted** at rest.

## Health Check

```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "healthy",
  "mode": "production",
  "timestamp": "..."
}
```

## Production Deployment

### As a System Service (Windows)

Using NSSM (Non-Sucking Service Manager):

```powershell
# Install NSSM
choco install nssm

# Create service
nssm install FlywayDashboardServer "C:\Program Files\nodejs\node.exe"
nssm set FlywayDashboardServer AppDirectory "C:\path\to\server"
nssm set FlywayDashboardServer AppParameters "dist\index.js"

# Start service
nssm start FlywayDashboardServer
```

### As a System Service (Linux)

Create `/etc/systemd/system/flyway-dashboard.service`:

```ini
[Unit]
Description=Flyway Dashboard Server
After=network.target

[Service]
Type=simple
User=flyway
WorkingDirectory=/opt/flyway-dashboard/server
ExecStart=/usr/bin/node dist/index.js
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable flyway-dashboard
sudo systemctl start flyway-dashboard
```

## Standalone Server Features

When deployed independently:
- ✅ Serves REST API on configured port
- ✅ Connects to databases via JDBC
- ✅ Stores user metrics in local SQLite database
- ✅ Encrypts all credentials automatically
- ✅ No UI files needed (served separately)

## Updating

```bash
# Pull latest changes
git pull

# Install any new dependencies
npm install

# Rebuild (if TypeScript changed)
npm run build

# Restart service
npm start
```

## Firewall Configuration

Open these ports:
- **3001** (or your custom port) - API access from UI servers

## Troubleshooting

### Check Server Logs
```bash
# If running as service (Linux)
sudo journalctl -u flyway-dashboard -f

# If running directly
# Logs output to console
```

### Test Database Connectivity
```bash
npm run diagnostics
```

### Common Issues

**Port already in use:**
- Change `PORT` in `.env` file
- Update `ALLOWED_ORIGINS` to match

**CORS errors from UI:**
- Add UI URL to `ALLOWED_ORIGINS` in `.env`
- Restart server after changes

**Database connection fails:**
- Verify JDBC URL format
- Check network connectivity: `telnet db-host 5432`
- Verify user permissions on `flyway_schema_history` table

## Security Recommendations

1. **Use environment-specific credentials** - Don't hardcode in JDBC URLs
2. **Restrict CORS** - Only allow known UI domains in `ALLOWED_ORIGINS`
3. **Use HTTPS** - Put server behind reverse proxy (nginx, Apache)
4. **Rotate encryption keys** - Periodically regenerate `JDBC_ENCRYPTION_KEY`
5. **Limit database permissions** - Server only needs SELECT on `flyway_schema_history`

## Next Steps

Once server is running:
1. Deploy the UI separately (see `INSTALL_UI.md`)
2. Point UI to this server's URL
3. Access dashboard from any browser
