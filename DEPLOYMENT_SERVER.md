# Flyway Dashboard - Server Deployment Guide

This guide covers deploying the **Flyway Dashboard Server** on a machine with access to your production databases.

## Prerequisites

- Node.js 16+ installed
- Access to production databases (PostgreSQL, SQL Server, etc.)
- Network connectivity to databases
- Port 3001 available (or configure different port)

## Installation Steps

### 1. Extract Server Files

```bash
# Extract the server package
unzip flyway-dashboard-server.zip
cd flyway-dashboard-server
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Generate encryption key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Edit .env file with your settings
nano .env
```

**Required Configuration in `.env`:**

```bash
# Production mode (use real JDBC connections)
DEMO_MODE=false

# Server port
PORT=3001

# CORS - Add your UI URL(s)
ALLOWED_ORIGINS=https://flyway-dashboard.yourcompany.com,https://dashboard-ui.example.com

# Encryption key (paste the generated key from above)
JDBC_ENCRYPTION_KEY=your_generated_64_character_hex_key

# Database credentials
POSTGRES_USER=your_postgres_user
POSTGRES_PASSWORD=your_postgres_password
MSSQL_USER=your_mssql_user
MSSQL_PASSWORD=your_mssql_password
```

### 4. Configure JDBC Connections

Start the server temporarily to configure connections:

```bash
node index.js
```

Navigate to the configuration API or use the UI to add your JDBC connections via:
- POST `/api/jdbc-connections/config`

**Example JDBC configuration:**

```json
{
  "prod": [
    {
      "name": "Production Database 1",
      "jdbcUrl": "jdbc:postgresql://prod-db-1:5432/mydb",
      "username": "flyway_readonly",
      "password": "your_password"
    }
  ],
  "nonProd": [
    {
      "name": "Test Database",
      "jdbcUrl": "jdbc:postgresql://test-db:5432/mydb_test",
      "username": "flyway_readonly",
      "password": "your_password"
    }
  ]
}
```

**Security Note:** All JDBC connection strings are automatically encrypted at rest using AES-256-GCM.

### 5. Run as a Service (Production)

#### Option A: Using PM2 (Recommended)

```bash
# Install PM2 globally
npm install -g pm2

# Start the server
pm2 start index.js --name flyway-dashboard-server

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

**PM2 Commands:**
```bash
pm2 status                    # Check status
pm2 logs flyway-dashboard-server  # View logs
pm2 restart flyway-dashboard-server  # Restart
pm2 stop flyway-dashboard-server     # Stop
```

#### Option B: Using systemd (Linux)

Create `/etc/systemd/system/flyway-dashboard.service`:

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
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable flyway-dashboard
sudo systemctl start flyway-dashboard
sudo systemctl status flyway-dashboard
```

#### Option C: Using Windows Service (Windows Server)

Use [node-windows](https://www.npmjs.com/package/node-windows) or Task Scheduler.

### 6. Verify Installation

Test the server is running:

```bash
curl http://localhost:3001/health
```

Should return: `{"status":"healthy"}`

Test database connectivity:
```bash
curl http://localhost:3001/api/flyway/history/all
```

Should return migration history JSON.

## Firewall Configuration

If the UI will be hosted on a different machine, ensure:

1. **Port 3001** is accessible from the UI server
2. **Firewall rules** allow HTTP traffic on port 3001
3. Consider using **HTTPS with a reverse proxy** (nginx/IIS) in production

### Example nginx reverse proxy:

```nginx
server {
    listen 443 ssl;
    server_name flyway-api.yourcompany.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Monitoring

### Health Check Endpoint

The server exposes a health check at `/health`:

```bash
curl http://localhost:3001/health
```

### Log Files

When using PM2:
```bash
pm2 logs flyway-dashboard-server
pm2 logs flyway-dashboard-server --lines 100
```

When using systemd:
```bash
journalctl -u flyway-dashboard -f
```

## Troubleshooting

### Database Connection Issues

Check JDBC URLs and credentials in your configuration:
```bash
# View encrypted connections (will show structure, not passwords)
cat jdbc-connections.json
```

Test individual database connections using the test endpoint:
```bash
curl -X POST http://localhost:3001/api/jdbc-connections/test \
  -H "Content-Type: application/json" \
  -d '{"jdbcUrl": "jdbc:postgresql://host:5432/db", "username": "user", "password": "pass"}'
```

### CORS Errors

If the UI shows CORS errors:
1. Check `ALLOWED_ORIGINS` in `.env`
2. Ensure the UI's URL is listed
3. Restart the server after changing `.env`

### Port Already in Use

If port 3001 is taken:
1. Change `PORT` in `.env`
2. Update UI's `config.json` with new port
3. Restart the server

## Security Best Practices

1. ✅ Use read-only database credentials
2. ✅ Keep `JDBC_ENCRYPTION_KEY` secret
3. ✅ Use HTTPS in production (reverse proxy)
4. ✅ Restrict `ALLOWED_ORIGINS` to your UI domains
5. ✅ Run as non-root user
6. ✅ Keep Node.js and dependencies updated
7. ✅ Use Azure Key Vault/AWS Secrets Manager for credentials

## Updating

```bash
# Stop the server
pm2 stop flyway-dashboard-server

# Backup current installation
cp -r /opt/flyway-dashboard-server /opt/flyway-dashboard-server.backup

# Extract new version
unzip flyway-dashboard-server-v2.0.0.zip
cd flyway-dashboard-server

# Install dependencies
npm install

# Restart
pm2 restart flyway-dashboard-server
```

## Support

For issues or questions:
- Check logs: `pm2 logs flyway-dashboard-server`
- Test endpoints manually with curl
- Verify database connectivity
- Check firewall rules
