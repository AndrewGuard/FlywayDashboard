================================================================================
         Flyway Dashboard - Server Installation Guide
================================================================================

Thank you for downloading Flyway Dashboard Server!

This package contains the complete server source code. You'll install
dependencies using npm, which will automatically compile native modules
for your specific Node.js version and platform.

================================================================================
                           REQUIREMENTS
================================================================================

Required Software:
  - Node.js 18 or higher (download from https://nodejs.org/)

That's it! No build tools, Python, or Visual Studio required.

To check your Node.js version:
  node --version

================================================================================
                        QUICK START GUIDE
================================================================================

1. EXTRACT FILES
   Extract this ZIP file to your desired installation directory.
   Example: C:\flyway-dashboard-server\

2. INSTALL DEPENDENCIES
   Open a command prompt or terminal in the extracted folder and run:

   npm install

   This will:
   - Download all required packages
   - Compile native modules (like better-sqlite3) for your system
   - Take 1-2 minutes on first install

3. CONFIGURE SERVER
   Before starting the server, you need to configure:

   a) Environment Variables (optional)
      Copy .env.example to .env and customize if needed:
      - PORT (default: 3001)
      - Enable/disable demo mode

   b) Database Connections (required)
      Edit jdbc-connections.json to add your database connections.
      
      Example for SQL Server:
      {
        "prod": "jdbc:sqlserver://localhost:1433;databaseName=flyway_prod;user=sa;password=YourPassword",
        "nonProd": "jdbc:sqlserver://localhost:1433;databaseName=flyway_test;user=sa;password=YourPassword"
      }

      Example for PostgreSQL:
      {
        "prod": "jdbc:postgresql://localhost:5432/flyway_prod?user=postgres&password=YourPassword",
        "nonProd": "jdbc:postgresql://localhost:5432/flyway_test?user=postgres&password=YourPassword"
      }

4. RUN SETUP WIZARD (Recommended)
   For interactive configuration with live database testing:

   npm run setup

   The wizard will:
   - Guide you through configuration
   - Test database connections
   - Validate settings
   - Save configuration automatically

5. START SERVER
   npm start

   The server will start on http://localhost:3001 (or your configured port)

   For development with auto-reload:
   npm run dev

6. VERIFY INSTALLATION
   Run diagnostics to check everything is configured correctly:

   npm run diagnostics

   This checks:
   - Node.js version
   - Port availability
   - Database connectivity
   - File permissions
   - Migration data

================================================================================
                         AVAILABLE COMMANDS
================================================================================

Production:
  npm start              - Start the server
  npm stop               - Stop the server (if running as service)

Development:
  npm run dev            - Start with auto-reload on file changes

Setup & Diagnostics:
  npm run setup          - Interactive setup wizard
  npm run diagnostics    - Run full system diagnostics
  npm run test-connections - Test all JDBC connections

================================================================================
                         CONFIGURATION
================================================================================

Environment Variables (.env file):
  PORT=3001              - Server port (default: 3001)
  DEMO_MODE=false        - Enable demo data without real databases
  NODE_ENV=production    - Environment mode

Database Connections (jdbc-connections.json):
  {
    "prod": "jdbc:...",      - Production database
    "nonProd": "jdbc:..."    - Non-production/test database
  }

  Supported databases:
  - PostgreSQL  (requires: pg package - included)
  - SQL Server  (requires: mssql package - included)
  - Oracle      (requires: oracledb package)
  - MySQL       (requires: mysql2 package)

================================================================================
                         DEMO MODE
================================================================================

If you want to explore the dashboard without connecting to real databases:

1. Edit .env file:
   DEMO_MODE=true

2. Start server:
   npm start

3. Access dashboard at:
   http://localhost:3001

Demo mode provides:
- Sample migration data
- Simulated deployment metrics
- Pre-configured ROI calculations
- No database connection required

================================================================================
                         TROUBLESHOOTING
================================================================================

Problem: "npm: command not found"
Solution: Install Node.js from https://nodejs.org/
          Node.js includes npm automatically.

Problem: "Cannot find module 'better-sqlite3'"
Solution: Run: npm install
          This will install all dependencies including native modules.

Problem: "Error: Module version mismatch"
Solution: Rebuild native modules for your Node.js version:
          npm rebuild

Problem: "EADDRINUSE: Port 3001 already in use"
Solution: Either:
          - Stop the application using port 3001
          - OR change PORT in .env file to a different port

Problem: "Database connection failed"
Solution: 1. Verify your JDBC connection string is correct
          2. Check username/password
          3. Ensure database server is running and accessible
          4. Run: npm run test-connections

Problem: "Permission denied" during npm install
Solution: On Linux/Mac, you may need sudo or fix npm permissions:
          https://docs.npmjs.com/resolving-eacces-permissions-errors

For more help, run:
  npm run diagnostics

================================================================================
                         DEPLOYMENT
================================================================================

Running as a Windows Service:
  Use pm2, node-windows, or NSSM to run as a Windows service.

  Example with pm2:
    npm install -g pm2
    pm2 start index.js --name flyway-dashboard
    pm2 save
    pm2 startup

Running as a Linux Service:
  Create a systemd service file or use pm2.

  Example systemd service (/etc/systemd/system/flyway-dashboard.service):
    [Unit]
    Description=Flyway Dashboard Server
    After=network.target

    [Service]
    Type=simple
    User=flyway
    WorkingDirectory=/opt/flyway-dashboard-server
    ExecStart=/usr/bin/node index.js
    Restart=on-failure

    [Install]
    WantedBy=multi-user.target

  Enable and start:
    sudo systemctl enable flyway-dashboard
    sudo systemctl start flyway-dashboard

Docker Deployment:
  Create a Dockerfile in the server directory:

    FROM node:18-alpine
    WORKDIR /app
    COPY . .
    RUN npm install --production
    EXPOSE 3001
    CMD ["npm", "start"]

  Build and run:
    docker build -t flyway-dashboard-server .
    docker run -p 3001:3001 flyway-dashboard-server

================================================================================
                         SECURITY NOTES
================================================================================

1. JDBC Connection Strings contain passwords
   - Keep jdbc-connections.json secure
   - Do not commit to source control
   - Use environment variables for sensitive data in production

2. SSL/TLS
   - The server runs HTTP by default
   - For production, use a reverse proxy (nginx, IIS, Apache) with HTTPS
   - Or configure Express to use HTTPS directly

3. Firewall
   - Only expose port 3001 to trusted networks
   - Use firewall rules to restrict access

4. Authentication
   - Current version has no authentication
   - Implement authentication via reverse proxy or custom middleware

================================================================================
                         NEXT STEPS
================================================================================

1. Configure your database connections in jdbc-connections.json
2. Run the setup wizard: npm run setup
3. Start the server: npm start
4. Deploy the UI package to your web server
5. Configure the UI's config.json to point to this server:
   {
     "apiBaseUrl": "http://your-server:3001"
   }

For detailed documentation, see:
- server/QUICKSTART.md - 3-minute setup guide
- EXE_KNOWN_ISSUES.md - Why we use source distribution

================================================================================
                         SUPPORT
================================================================================

If you encounter issues:
1. Run diagnostics: npm run diagnostics
2. Check the troubleshooting section above
3. Review server logs for error messages
4. Ensure all requirements are met (Node.js 18+)

For questions or feature requests, please contact your administrator.

================================================================================

Version: 1.0.0
Build Date: 2024
License: Private/Internal Use

================================================================================
