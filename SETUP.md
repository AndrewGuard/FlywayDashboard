# Flyway Dashboard - Setup Guide

## Overview
The Flyway Dashboard provides real-time insights into your database migrations, tracking lead times, deployment metrics, and ROI calculations.

## System Requirements
- **Node.js**: Version 16 or higher
- **npm**: Version 7 or higher (comes with Node.js)
- **Operating System**: Windows, macOS, or Linux
- **RAM**: 2GB minimum, 4GB recommended
- **Disk Space**: 500MB for installation

## Installation

### Step 1: Check Prerequisites

Open a terminal and verify Node.js installation:

```bash
node --version
npm --version
```

If not installed, download from: https://nodejs.org/

### Step 2: Install the Application

Choose your preferred method:

#### Automated Installation (Easiest)

**Windows (PowerShell):**
```powershell
.\install.ps1
```

**macOS/Linux (Terminal):**
```bash
chmod +x install.sh
./install.sh
```

This installs everything and generates demo data automatically.

#### Manual Installation

```bash
# Install frontend dependencies
npm install

# Install server dependencies
cd server
npm install

# Generate demo data (optional)
node refresh-all-demo-data.js
cd ..
```

## Running the Dashboard

### Quick Start (Easiest)

**Windows:**
```powershell
.\start.ps1
```

**macOS/Linux:**
```bash
./start.sh
```

The dashboard will open automatically at http://localhost:3000

### Manual Start

**Terminal 1 (Server):**
```bash
cd server
node index.js
```

**Terminal 2 (Frontend):**
```bash
npm start
```

## First Time Setup

### Using Demo Data (Recommended for First Run)

The application comes with pre-generated demo data to help you explore features immediately. No additional configuration needed!

### Connecting to Your Databases (Optional)

1. **Locate the configuration file:**
   - Path: `server/jdbc-connections.json`

2. **Add your database connections:**
   ```json
   {
     "prod": [
       "jdbc:postgresql://localhost:5432/mydb?user=username&password=password"
     ],
     "nonProd": [
       "jdbc:sqlserver://localhost:1433;databaseName=testdb;user=username;password=password"
     ]
   }
   ```

3. **Supported databases:**
   - PostgreSQL
   - Microsoft SQL Server
   - (More coming soon)

4. **Restart the server** to apply changes

### Customizing Metrics

1. Open the dashboard
2. Navigate to **Deployment Metrics Configuration**
3. Enter your organization's metrics:
   - Deployments per quarter
   - Average lead time
   - Script failure rate
   - Team size and salaries
   - Implementation costs

## Troubleshooting

### Port Already in Use

**Server (Port 3001):**
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:3001 | xargs kill
```

**Frontend (Port 3000):**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:3000 | xargs kill
```

### Cannot Connect to Database

- Verify database is running
- Check connection string format
- Ensure firewall allows connections
- Test with a database client first

### No Data Showing

- Run demo data generation: `cd server && node refresh-all-demo-data.js`
- Check browser console for errors (F12)
- Verify server is running on port 3001
- Check server logs for connection errors

### Installation Fails

- Delete `node_modules` folders and run `npm install` again
- Check Node.js version (must be 16+)
- Run with administrator/sudo privileges if permission errors occur

## Architecture

```
┌─────────────────┐         ┌──────────────────┐
│   React App     │ ────────│  Express Server  │
│  (Port 3000)    │  HTTP   │   (Port 3001)    │
└─────────────────┘         └──────────────────┘
                                     │
                                     ├─────────────┐
                                     │             │
                              ┌──────▼──────┐  ┌──▼────────────┐
                              │  SQLite DB  │  │  Flyway DBs   │
                              │  (Metrics)  │  │  (Optional)   │
                              └─────────────┘  └───────────────┘
```

## Next Steps

- **Explore the Demo**: Review pre-generated metrics and charts
- **Configure Connections**: Connect to your actual Flyway databases
- **Customize Metrics**: Input your organization's deployment data
- **Generate Reports**: Use the ROI calculator to demonstrate value

## Support

For issues or questions:
- Check the [README.md](./README.md)
- Review server logs: Check the terminal running `node index.js`
- Browser console: Press F12 to view errors

## Security Notes

- The `jdbc-connections.json` file contains passwords - **do not commit to version control**
- Add to `.gitignore` if sharing the repository
- Use environment variables for production deployments
- Limit network access to trusted sources only
