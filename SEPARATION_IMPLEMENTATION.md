# Server-UI Separation - Implementation Summary

This document summarizes the changes made to separate the Flyway Dashboard server and UI for production deployment.

## What Changed

### 1. Configuration System

**New Files:**
- `src/config.ts` - Runtime configuration loader
- `src/apiClient.ts` - Centralized API client with automatic URL handling
- `public/config.json` - Runtime config file (editable after deployment)
- `public/config.example.json` - Example configuration template

**How it works:**
- UI loads `config.json` on startup
- Gets API server URL from config
- Falls back to `REACT_APP_API_URL` env var or `localhost:3001`
- All API calls automatically use configured URL

### 2. Enhanced CORS Support

**Server Changes (`server/index.js`):**
- Added configurable CORS origins via `ALLOWED_ORIGINS` environment variable
- Supports comma-separated list of allowed domains
- Development mode allows all origins
- Production mode restricts to configured origins

**Configuration (`.env`):**
```bash
ALLOWED_ORIGINS=https://dashboard.example.com,https://flyway-ui.yourcompany.com
```

### 3. Health Check Endpoint

**New Endpoint:** `GET /health`

Returns:
```json
{
  "status": "healthy",
  "mode": "production",
  "timestamp": "2025-12-22T..."
}
```

Use for monitoring, load balancer health checks, or deployment verification.

### 4. Deployment Documentation

**New Files:**
- `DEPLOYMENT_SERVER.md` - Complete server deployment guide
  - PM2, systemd, Windows Service options
  - JDBC configuration
  - Security best practices
  - Troubleshooting

- `DEPLOYMENT_UI.md` - Complete UI deployment guide
  - IIS, nginx, Apache configurations
  - Static hosting options (S3, Azure, Netlify)
  - HTTPS setup with Let's Encrypt
  - URL rewrite rules for React Router

### 5. Build Scripts

**New Files:**
- `build-server.sh` - Packages server for distribution
- `build-ui.sh` - Builds and packages UI for deployment

**Output:**
- `flyway-dashboard-server-{version}.tar.gz`
- `flyway-dashboard-server-{version}.zip`
- `flyway-dashboard-ui-{version}.tar.gz`
- `flyway-dashboard-ui-{version}.zip`

## Deployment Workflow

### Server Deployment (One Time)

1. Install on machine with database access
2. Configure JDBC connections
3. Set `ALLOWED_ORIGINS` to UI URLs
4. Run as service (PM2/systemd/Windows Service)

```bash
# Extract
tar -xzf flyway-dashboard-server-1.0.0.tar.gz
cd server

# Install
npm install

# Configure
cp .env.example .env
nano .env  # Edit configuration

# Start
pm2 start index.js --name flyway-dashboard-server
```

### UI Deployment (Distribute to Users)

1. Build static files
2. Update config.json with server URL
3. Deploy to web server
4. Users access via browser

```bash
# Build
npm run build

# Configure
nano build/config.json  # Set apiBaseUrl

# Deploy (example: nginx)
sudo cp -r build/* /var/www/flyway-dashboard/
```

## For End Users

**Before (Required):**
- Install Node.js
- Clone repository
- Run npm install
- Configure databases
- Run server and client

**After (Simple):**
- Just browse to URL
- No installation
- No configuration
- No database access needed

## API Client Usage

### Before (Direct fetch):
```typescript
const response = await fetch('/api/flyway/history/all');
```

### After (Using config):
```typescript
import { apiFetch, apiGet } from './apiClient';

// Option 1: Using wrapper
const data = await apiGet('/api/flyway/history/all');

// Option 2: Using fetch wrapper
const response = await apiFetch('/api/flyway/history/all');
```

The config system automatically prepends the correct API base URL.

## Migration Path

### Existing Installations

For users currently running in development mode:

1. **No changes needed** - Development mode still works
2. `config.json` defaults to `http://localhost:3001`
3. Proxy in package.json still functions during `npm start`

### New Deployments

For new production deployments:

1. Follow **DEPLOYMENT_SERVER.md** for server setup
2. Follow **DEPLOYMENT_UI.md** for UI deployment
3. Update `config.json` to point UI at server
4. Distribute UI URL to end users

## Configuration Examples

### Development
```json
{
  "apiBaseUrl": "http://localhost:3001"
}
```

### Production (Internal)
```json
{
  "apiBaseUrl": "http://flyway-server.internal:3001"
}
```

### Production (HTTPS with Reverse Proxy)
```json
{
  "apiBaseUrl": "https://flyway-api.yourcompany.com"
}
```

## Security Features

- ✅ JDBC credentials encrypted at rest (AES-256-GCM)
- ✅ CORS protection (configurable allowed origins)
- ✅ HTTPS support via reverse proxy
- ✅ No database credentials in UI
- ✅ Read-only database access recommended
- ✅ Environment variable support for secrets

## Testing

### Test Server Health
```bash
curl http://localhost:3001/health
```

### Test API Endpoint
```bash
curl http://localhost:3001/api/flyway/history/all
```

### Test UI Configuration
1. Open browser to UI URL
2. Check browser console (F12)
3. Look for "✓ Loaded config from config.json"
4. Verify API calls succeed

## Troubleshooting

### UI shows "Failed to load configuration"
- Check `config.json` exists in deployed folder
- Verify JSON syntax is valid
- Check web server is serving the file

### API requests return CORS errors
- Add UI domain to `ALLOWED_ORIGINS` in server `.env`
- Restart server after changing `.env`
- Check browser console for specific origin blocked

### Can't connect to server
- Verify server is running: `curl http://server:3001/health`
- Check firewall rules allow port 3001
- Verify `config.json` has correct server URL
- Test from UI server: `curl http://server:3001/health`

## Next Steps

Optional enhancements:

1. **Authentication** - Add JWT or OAuth
2. **Docker** - Containerize server and UI
3. **Kubernetes** - Deploy at scale
4. **Monitoring** - Add Prometheus metrics
5. **API Rate Limiting** - Protect server from abuse
6. **WebSockets** - Real-time metric updates

## Files Created/Modified

### New Files
- `src/config.ts`
- `src/apiClient.ts`
- `public/config.json`
- `public/config.example.json`
- `DEPLOYMENT_SERVER.md`
- `DEPLOYMENT_UI.md`
- `build-server.sh`
- `build-ui.sh`

### Modified Files
- `src/index.tsx` - Added config loading
- `server/index.js` - Enhanced CORS, added health check
- `server/.env.example` - Added ALLOWED_ORIGINS
- `README.md` - Updated with new architecture

### Note
Individual widget files were NOT modified yet. They still use direct `fetch()` calls. For full production use, optionally migrate to use `apiFetch()` from `apiClient.ts`.

## Rollback

If you need to revert these changes:

```bash
git checkout HEAD~1 -- src/config.ts src/apiClient.ts public/config.json
git checkout HEAD~1 -- server/index.js server/.env.example
```

Development mode will continue to work as before.
