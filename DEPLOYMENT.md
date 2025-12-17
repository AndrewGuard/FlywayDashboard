# Flyway Dashboard - Deployment Guide

## Demo vs Production Mode

The Flyway Dashboard supports two operating modes:

### 🎭 Demo Mode (Development/Testing)
- Uses mock migration data across multiple platforms (SQL Server, PostgreSQL, Oracle, MySQL)
- Auto-seeds database with sample data on startup
- No JDBC connections required
- Perfect for demos, development, and testing

**To enable Demo Mode:**
```bash
# Set environment variable
DEMO_MODE=true

# Or in PowerShell
$env:DEMO_MODE="true"
node index.js
```

### 🚀 Production Mode (Real Client Deployment)
- Connects to real Flyway schema history tables via JDBC
- No mock data or auto-seeding
- Requires configured JDBC connections
- Reads from actual `flyway_schema_history` tables

**To enable Production Mode:**
```bash
# Leave DEMO_MODE unset or set to false
DEMO_MODE=false

# Or simply don't set it at all (default)
node index.js
```

## Production Deployment Steps

1. **Environment Configuration**
   ```bash
   # Create .env file from example
   cp .env.example .env
   
   # Edit .env and ensure DEMO_MODE is false or unset
   DEMO_MODE=false
   PORT=3001
   ```

2. **Database Setup**
   - The SQLite database (`server/db/flyway-dashboard.db`) will be created automatically
   - It stores user-defined ROI metrics and JDBC connection strings
   - No manual schema creation needed

3. **JDBC Connections**
   - Configure JDBC connections through the UI or directly in the database
   - Supported databases: SQL Server, PostgreSQL, MySQL, Oracle
   - Connection strings are stored in the `jdbc_connections` table
   
   Example connection format:
   ```json
   {
     "server": "production-db.company.com",
     "database": "production_db",
     "username": "flyway_reader",
     "password": "secure_password",
     "port": 1433,
     "type": "mssql"
   }
   ```

4. **Flyway Requirements**
   - Target databases must have Flyway installed and configured
   - `flyway_schema_history` table must exist
   - The dashboard user needs SELECT permissions on this table

5. **Start the Server**
   ```bash
   cd server
   npm install
   node index.js
   ```
   
   You should see:
   ```
   🚀 Running in PRODUCTION MODE - using real JDBC connections
   Server running on port 3001
   ```

6. **Start the Frontend**
   ```bash
   cd .. # back to root
   npm install
   npm start
   ```

## Switching Between Modes

The mode is determined solely by the `DEMO_MODE` environment variable:

| Scenario | DEMO_MODE Value | Behavior |
|----------|----------------|----------|
| Development/Testing | `true` | Mock data, auto-seed, no JDBC required |
| Production | `false` or unset | Real JDBC connections, no mock data |

**Current Status Check:**
- ✅ When server starts, it logs which mode it's running in
- ✅ Demo mode shows: "🎭 Running in DEMO MODE"
- ✅ Production mode shows: "🚀 Running in PRODUCTION MODE"

## Verifying Production Setup

After deployment, verify the setup:

1. **Check Server Logs**
   - Should show "🚀 Running in PRODUCTION MODE"
   - Should NOT show any auto-seeding messages

2. **Test JDBC Connections**
   - Navigate to JDBC connections page in UI
   - Add a test connection
   - Verify it can read from `flyway_schema_history`

3. **Check Migration History**
   - Navigate to migration history page
   - Should show real migrations from your databases
   - Should NOT show mock migrations like "V100_add_customer_table"

## Security Considerations

- Store `.env` file outside version control (already in `.gitignore`)
- Use read-only database users for JDBC connections
- Secure the SQLite database file with appropriate file permissions
- Consider encrypting JDBC passwords in the database
- Use HTTPS in production deployments

## Troubleshooting

**Problem: Dashboard shows no data**
- Check: Is `DEMO_MODE=false`?
- Check: Are JDBC connections configured?
- Check: Can the app connect to target databases?
- Check: Do target databases have `flyway_schema_history` tables?

**Problem: Still seeing mock data in production**
- Check: Environment variable is set correctly (`DEMO_MODE=false`)
- Check: Server was restarted after changing environment variable
- Check: Server logs confirm "PRODUCTION MODE"

**Problem: Database connection errors**
- Check: Connection strings are correct
- Check: Firewall allows connections from dashboard server
- Check: Database user has SELECT permission on `flyway_schema_history`
