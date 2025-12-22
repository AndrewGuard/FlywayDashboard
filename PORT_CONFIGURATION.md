# Port Configuration Guide

This guide explains how to configure custom ports for the Flyway Dashboard client and server.

## Default Ports

- **Client (React dev server)**: `3000`
- **Server (Express API)**: `3001`

## Development Mode

### Client Port Configuration

Configure the React development server port:

**File: `.env` (root folder)**
```bash
# React Development Server Port
PORT=3000

# API Server URL (must match server PORT)
REACT_APP_API_URL=http://localhost:3001
```

**Example: Change client to port 3002**
```bash
PORT=3002
REACT_APP_API_URL=http://localhost:3001
```

### Server Port Configuration

Configure the Express API server port:

**File: `server/.env`**
```bash
# Server Port
PORT=3001

# Allowed Origins (must match client URL and PORT)
ALLOWED_ORIGINS=http://localhost:3000
```

**Example: Change server to port 3005**
```bash
PORT=3005
ALLOWED_ORIGINS=http://localhost:3000
```

### Important: Update Proxy

When changing the server port, also update the proxy in `package.json`:

**File: `package.json`**
```json
{
  "proxy": "http://localhost:3001"
}
```

**Example: Server on port 3005**
```json
{
  "proxy": "http://localhost:3005"
}
```

## Production Mode

### Server Port

**File: `server/.env`**
```bash
# Production server port
PORT=3001

# CORS - Include all client URLs with their ports
ALLOWED_ORIGINS=https://dashboard.yourcompany.com,https://flyway.internal
```

**Custom port example:**
```bash
PORT=8080

# Update firewall to allow port 8080
# Update reverse proxy to forward to port 8080
ALLOWED_ORIGINS=https://dashboard.yourcompany.com
```

### Client Configuration

**File: `public/config.json` (or `build/config.json` after build)**
```json
{
  "apiBaseUrl": "http://localhost:3001"
}
```

**Custom port example:**
```json
{
  "apiBaseUrl": "https://api.yourcompany.com:8080"
}
```

## Complete Examples

### Example 1: Both Using Custom Ports (Development)

**Scenario:** Client on 3002, Server on 3005

**Step 1:** Configure client (`.env` in root):
```bash
PORT=3002
REACT_APP_API_URL=http://localhost:3005
```

**Step 2:** Configure server (`server/.env`):
```bash
PORT=3005
ALLOWED_ORIGINS=http://localhost:3002
```

**Step 3:** Update proxy (`package.json`):
```json
{
  "proxy": "http://localhost:3005"
}
```

**Step 4:** Start both:
```bash
npm run dev
```

- Client: http://localhost:3002
- Server API: http://localhost:3005

### Example 2: Production with Custom Server Port

**Scenario:** Server on port 8080, UI on standard HTTPS (443)

**Server setup:**
```bash
# server/.env
NODE_ENV=production
PORT=8080
ALLOWED_ORIGINS=https://dashboard.yourcompany.com
```

**Client setup (`build/config.json`):**
```json
{
  "apiBaseUrl": "https://api.yourcompany.com:8080"
}
```

**Nginx reverse proxy:**
```nginx
# Proxy API requests to server on port 8080
location /api/ {
    proxy_pass http://localhost:8080;
    proxy_set_header Host $host;
}
```

### Example 3: Multiple Environments

**Development:**
```bash
# .env
PORT=3000
REACT_APP_API_URL=http://localhost:3001

# server/.env
PORT=3001
ALLOWED_ORIGINS=http://localhost:3000
```

**Staging:**
```bash
# server/.env
PORT=3001
ALLOWED_ORIGINS=https://staging-dashboard.yourcompany.com

# build/config.json
{"apiBaseUrl": "https://staging-api.yourcompany.com"}
```

**Production:**
```bash
# server/.env
PORT=3001
ALLOWED_ORIGINS=https://dashboard.yourcompany.com

# build/config.json
{"apiBaseUrl": "https://api.yourcompany.com"}
```

## Troubleshooting

### Port Already in Use

**Error:** `Something is already running on port 3000` or `EADDRINUSE: address already in use :::3001`

**Solution:** Change ports in `.env` files as shown above.

### CORS Errors

**Error:** `Access to fetch at 'http://localhost:3001/api/...' from origin 'http://localhost:3002' has been blocked by CORS policy`

**Solution:** Update `ALLOWED_ORIGINS` in `server/.env` to include client URL:
```bash
ALLOWED_ORIGINS=http://localhost:3002
```

### API Connection Fails

**Error:** Client shows "Failed to fetch" or "Network error"

**Solutions:**
1. Verify server is running: `curl http://localhost:3001/health`
2. Check `config.json` has correct server URL and port
3. Check firewall allows the server port
4. Verify server logs for startup errors

### Proxy Not Working (Development)

**Error:** API calls in development mode fail

**Solutions:**
1. Check `package.json` proxy matches server port
2. Restart React dev server after changing proxy: `npm start`
3. Clear browser cache and reload

## Configuration Priority

The system checks configuration in this order:

### Development Mode
1. `.env` file (`PORT`, `REACT_APP_API_URL`)
2. `package.json` proxy
3. Defaults (3000 for client, 3001 for server)

### Production Mode
1. `public/config.json` (for client API URL)
2. `server/.env` (for server port)
3. Environment variables
4. Defaults

## Best Practices

1. **Use Standard Ports:** Stick with 3000/3001 unless there's a conflict
2. **Document Changes:** If using custom ports, document them in your deployment notes
3. **CORS Configuration:** Always update `ALLOWED_ORIGINS` when changing client URL/port
4. **Firewall Rules:** Open custom ports in firewall for production deployments
5. **Reverse Proxy:** Use nginx/Apache reverse proxy in production to handle HTTPS and standard ports
6. **Environment-Specific:** Use different ports for dev/staging/prod environments

## Port Ranges

**Recommended ranges:**
- Development: 3000-3999
- Staging: 4000-4999
- Production: Use reverse proxy on standard ports (80/443)

**Avoid ports:**
- 1-1023 (require root/admin privileges)
- Well-known service ports (22, 80, 443, 3306, 5432, etc.)
- Ephemeral ports (49152-65535)
