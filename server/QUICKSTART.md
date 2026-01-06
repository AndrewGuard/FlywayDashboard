# Flyway Dashboard Server - Quick Setup Guide

Get your Flyway Dashboard server up and running in 3 minutes!

## Prerequisites

- **Node.js 16+** installed
- Access to databases with Flyway migrations (PostgreSQL, SQL Server)
- Or run in demo mode without database access

---

## Option 1: Interactive Setup (Recommended) ✨

Run the guided setup wizard:

```bash
npm install
npm run setup
```

The wizard will:
- ✓ Configure environment variables
- ✓ Set up database connections with live testing
- ✓ Generate encryption keys
- ✓ Create demo data (optional)
- ✓ Validate everything

Then start the server:

```bash
npm start
```

---

## Option 2: Manual Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy and edit `.env`:

```bash
cp .env.example .env
```

**Edit `.env`:**

```bash
# Demo mode (true = sample data, false = real databases)
DEMO_MODE=false

# Server port
PORT=3001

# CORS allowed origins (your React UI URL)
ALLOWED_ORIGINS=http://localhost:3000

# Generate encryption key:
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JDBC_ENCRYPTION_KEY=your_generated_key_here
```

### 3. Configure Databases

Edit `jdbc-connections.json`:

```json
{
  "prod": [
    "jdbc:postgresql://localhost:5432/mydb?user=postgres&password=secret"
  ],
  "nonProd": [
    "jdbc:sqlserver://localhost:1433;databaseName=testdb;user=sa;password=secret"
  ]
}
```

**Supported formats:**

**PostgreSQL:**
```
jdbc:postgresql://host:5432/database?user=username&password=password
```

**SQL Server:**
```
jdbc:sqlserver://host:1433;databaseName=database;user=username;password=password
```

### 4. Test Connections

```bash
npm run test-connections
```

### 5. Start Server

```bash
npm start          # Production
npm run dev        # Development (auto-restart)
```

---

## Verify Installation

### Check Server Health

```bash
curl http://localhost:3001/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "mode": "production",
  "timestamp": "2026-01-06T..."
}
```

### Run Diagnostics

```bash
npm run diagnostics
```

This checks:
- ✓ Environment configuration
- ✓ Database connectivity
- ✓ Port availability
- ✓ File permissions
- ✓ Migration data

---

## Demo Mode (No Database Required)

Want to try the dashboard without setting up databases?

**In `.env`:**
```bash
DEMO_MODE=true
```

Then:
```bash
npm start
```

The server will use sample data for all metrics and charts.

---

## Troubleshooting

### Port Already in Use

**Error:** `EADDRINUSE`

**Fix:** Change PORT in `.env`:
```bash
PORT=3005
```

Don't forget to update your React client's `config.json`:
```json
{
  "apiBaseUrl": "http://localhost:3005"
}
```

### Database Connection Failed

**Error:** `Connection refused` or `Authentication failed`

**Fix:**
1. Run diagnostics: `npm run diagnostics`
2. Check database is running
3. Verify credentials in `jdbc-connections.json`
4. Test firewall/network access
5. Ensure `flyway_schema_history` table exists

### Missing flyway_schema_history

**Error:** `relation "flyway_schema_history" does not exist`

**Fix:** Your database needs Flyway migrations. Either:
- Run Flyway migrate on the database first
- Use a different database that has Flyway data
- Enable DEMO_MODE in `.env`

### CORS Errors

**Error:** Browser shows CORS policy blocked

**Fix:** Add your UI URL to ALLOWED_ORIGINS in `.env`:
```bash
ALLOWED_ORIGINS=http://localhost:3000,https://dashboard.yourcompany.com
```

---

## Quick Commands Reference

| Command | Purpose |
|---------|---------|
| `npm run setup` | Interactive setup wizard |
| `npm run diagnostics` | Health check and validation |
| `npm run test-connections` | Test all database connections |
| `npm start` | Start server (production) |
| `npm run dev` | Start with auto-restart (development) |

---

## Next Steps

1. **Start the server:** `npm start`
2. **Access the UI:** Open http://localhost:3000 (if running the React app)
3. **Configure metrics:** Navigate to "Project Configuration" in the UI
4. **Calculate ROI:** Navigate to "ROI Calculator" to see business value

---

## Production Deployment

For production deployment (IIS, nginx, PM2, systemd), see:
- [DEPLOYMENT_SERVER.md](../DEPLOYMENT_SERVER.md) - Comprehensive production guide

---

## Support

- **Setup Issues:** Run `npm run diagnostics`
- **Connection Issues:** Run `npm run test-connections`
- **Documentation:** See [README.md](../README.md)
- **Advanced Config:** See [DEPLOYMENT_SERVER.md](../DEPLOYMENT_SERVER.md)
