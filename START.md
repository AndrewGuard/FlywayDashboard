# Flyway Dashboard - Quick Start Guide

## 🚀 Starting the Application

### Single Command (Recommended)

From the **project root**, run:

```bash
npm run dev
```

This starts **both**:
- ✅ Backend server on `http://localhost:3001` (with auto-restart via nodemon)
- ✅ Frontend React app on `http://localhost:3000` (with hot reload)

The dashboard will automatically open in your browser at `http://localhost:3000`.

---

## Development Tools

### Nodemon (Auto-Restart)
- **Best for:** Development
- **Features:**
  - Auto-restarts server on file changes
  - Watches `.js`, `.json`, `.env` files
  - 500ms delay to batch rapid changes
  - Ignores database files to prevent restart loops

### What Gets Auto-Restarted?
- ✅ JavaScript files (`index.js`, routes, etc.)
- ✅ JDBC configuration (`jdbc-connections.json`)
- ✅ Environment variables (`.env`)
- ❌ Database files (`.db` files are ignored)

---

## Individual Commands

If you need to run components separately:

### Backend Only
```bash
cd server
npm run dev          # With auto-restart (development)
npm start            # Without auto-restart (production-like)
```

### Frontend Only
```bash
npm start            # From project root
```

---

## Configuration Files

### Project Root (`package.json`)
```json
{
  "scripts": {
    "dev": "Start both server and client",
    "server": "Start server only",
    "start": "Start client only"
  }
}
```

### Server (`server/package.json`)
```json
{
  "scripts": {
    "dev": "nodemon index.js",
    "start": "node index.js"
  }
}
```

### Nodemon Config (`server/nodemon.json`)
- Watches relevant files
- 500ms delay for batch restarts
- Ignores database files

---

## Port Configuration

| Component | Port | Environment Variable |
|-----------|------|---------------------|
| Backend | 3001 | `PORT=3001` (in `.env`) |
| Frontend | 3000 | (React default) |

---

## Troubleshooting

### Server won't restart?
```bash
# Kill any stuck processes
Get-Process -Name node | Stop-Process -Force

# Restart with clean slate
npm run dev
```

### Port already in use?
```bash
# Windows - Kill process on port 3001
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Or change port in server/.env
PORT=3002
```

### Changes not being picked up?
- Check `server/nodemon.json` includes your file type
- Verify file is not in `ignore` list
- Check console for nodemon restart messages

---

## Production Deployment

For production, use PM2 instead of nodemon:

```bash
# Install PM2 globally
npm install -g pm2

# Start server with PM2
cd server
pm2 start index.js --name flyway-dashboard

# PM2 features
pm2 restart flyway-dashboard  # Restart
pm2 stop flyway-dashboard     # Stop
pm2 logs flyway-dashboard     # View logs
pm2 monit                     # Monitor
```

PM2 provides:
- ✅ Auto-restart on crash
- ✅ Zero-downtime reloads
- ✅ Process monitoring
- ✅ Log management
- ✅ Cluster mode for scaling

---

## Summary

| Environment | Command | Auto-Restart | Use Case |
|-------------|---------|--------------|----------|
| **Development** | `npm run dev` | ✅ Yes (nodemon) | Active coding |
| **Testing** | `npm start` (server) | ❌ No | Manual control |
| **Production** | `pm2 start` | ✅ Yes (PM2) | Deployed app |

**Recommendation:** Use `npm run dev` for all development work. It's fast, reliable, and provides the best developer experience.
