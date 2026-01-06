# Flyway Dashboard Server - Standalone Edition

Welcome! This is the standalone server for Flyway Dashboard.

## Quick Start (No Node.js Required!)

This package includes everything you need to run the Flyway Dashboard server.

### Step 1: Extract Files

Extract this ZIP to a folder, for example:
```
C:\FlywayDashboard\
```

### Step 2: Configure Environment

1. Rename `.env.example` to `.env`
2. Open `.env` in Notepad
3. Update these settings:

```
# Use demo data or connect to real databases?
DEMO_MODE=false

# Server port (change if 3001 is already in use)
PORT=3001

# If you're accessing from another machine, add that URL here
ALLOWED_ORIGINS=http://localhost:3000
```

### Step 3: Configure Database Connections

1. Open `jdbc-connections.json` in Notepad
2. Add your database connection strings:

```json
{
  "prod": [
    "jdbc:postgresql://your-db-host:5432/database?user=username&password=password"
  ],
  "nonProd": [
    "jdbc:sqlserver://your-db-host:1433;databaseName=testdb;user=username;password=password"
  ]
}
```

**Supported databases:**
- PostgreSQL: `jdbc:postgresql://host:5432/dbname?user=user&password=pass`
- SQL Server: `jdbc:sqlserver://host:1433;databaseName=db;user=user;password=pass`

### Step 4: Start the Server

**Windows:**
- Double-click `server.exe`
- Or open Command Prompt and run: `server.exe`

**Linux/Mac:**
```bash
chmod +x server
./server
```

### Step 5: Access the Dashboard

Open your web browser to:
```
http://localhost:3001/health
```

You should see:
```json
{"status":"healthy","mode":"production"}
```

Then open the React UI (if installed separately) at:
```
http://localhost:3000
```

---

## Demo Mode (Try Without Databases)

Want to see the dashboard without connecting to databases?

**In `.env` file:**
```
DEMO_MODE=true
```

Then just run `server.exe` - it will use sample data!

---

## Troubleshooting

### "Port already in use"

Change the port in `.env`:
```
PORT=3005
```

### "Cannot connect to database"

1. Check your database is running
2. Verify the JDBC connection string format
3. Test network connectivity
4. Ensure firewall allows connections

### "CORS error" in browser

Add your UI URL to `.env`:
```
ALLOWED_ORIGINS=http://localhost:3000,http://your-ui-url:8080
```

### Still having issues?

Run the diagnostics tool:
```
server.exe --diagnostics
```

Or check the server logs in the console window.

---

## Files Included

```
├── server.exe              # The main server executable
├── .env.example           # Configuration template
├── jdbc-connections.json  # Database connections
├── db/                    # SQLite database (auto-created)
└── README.txt            # This file
```

---

## Running as Windows Service (Optional)

To run the server as a Windows service that starts automatically:

1. Download NSSM: https://nssm.cc/
2. Run as administrator:
   ```
   nssm install FlywayDashboard "C:\FlywayDashboard\server.exe"
   nssm start FlywayDashboard
   ```

---

## Support

- Documentation: See main README.md
- Issues: Contact your IT administrator
- Source: https://github.com/your-org/flyway-dashboard

---

## License

[Your License Here]

---

**Version:** 1.0.0  
**Build Date:** [Build Date]
