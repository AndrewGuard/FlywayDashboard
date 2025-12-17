## Quick Start

### For End Users (Non-Technical)

Download the pre-built installer - **no coding or technical skills required!**

**Windows Users:**
1. Download `Flyway Dashboard Setup.exe`
2. Double-click to install
3. Launch from Start Menu
4. **Done!** No Node.js, npm, or terminal needed

The installer includes everything: Node.js runtime, React app, Express server, SQLite database, and demo data. Just double-click and go! 🚀

---

### For Developers

#### Prerequisites
- **Node.js 16+** - Download from [nodejs.org](https://nodejs.org/)

#### Installation Options

**Option 1: Automated Installation (Recommended)

**Windows:**
```powershell
.\install.ps1
```

**Linux/Mac:**
```bash
chmod +x install.sh
./install.sh
```

This will:
- Install all dependencies
- Generate demo data
- Prepare the application for first run

#### Option 2: Manual Installation

1. **Install dependencies:**
   ```bash
   npm install
   cd server
   npm install
   cd ..
   ```

2. **Generate demo data (optional):**
   ```bash
   cd server
   node refresh-all-demo-data.js
   cd ..
   ```

### Running the Application

#### Quick Start (Recommended)

**Windows:**
```powershell
.\start.ps1
```

**Linux/Mac:**
```bash
chmod +x start.sh
./start.sh
```

#### Manual Start

1. **Terminal 1 - Start the server:**
   ```bash
   cd server
   node index.js
   ```

2. **Terminal 2 - Start the frontend:**
   ```bash
   npm start
   ```

3. **Open your browser to:** `http://localhost:3000`

### Configuration (Optional)

#### Connect to Real Databases

By default, the dashboard uses demo data. To connect to your Flyway databases:

1. Edit `server/jdbc-connections.json`:
   ```json
   {
     "prod": [
       "jdbc:postgresql://host:port/db?user=username&password=password"
     ],
     "nonProd": [
       "jdbc:sqlserver://host:port;databaseName=db;user=username;password=password"
     ]
   }
   ```

2. Restart the server

#### Customize Metrics

Go to **Deployment Metrics Configuration** in the dashboard to enter your organization's metrics for ROI calculations

---

## Building Desktop Installer

Package the app as a standalone executable for distribution to non-technical users.

### Quick Build

1. **Install Electron dependencies:**
   ```bash
   npm install
   ```

2. **Build the installer:**
   
   **Windows:**
   ```powershell
   .\build-installer.ps1
   ```
   
   **Mac/Linux:**
   ```bash
   chmod +x build-installer.sh
   ./build-installer.sh
   ```

3. **Find your installer:**
   - Creates: `dist/Flyway Dashboard Setup.exe` (~150MB)
   - Includes: Node.js runtime, React app, Express server, SQLite database, demo data

4. **Test on a clean machine** (VM recommended)

5. **Distribute the installer** from the `dist/` folder

### What End Users Get

The installer bundles everything needed - users simply:
- Download one .exe file
- Double-click to install
- Launch from Start Menu
- No Node.js, npm, or technical knowledge required!

See [BUILD_GUIDE.md](./BUILD_GUIDE.md) for detailed packaging instructions and customization options.

---

## Documentation

- **[SETUP.md](./SETUP.md)** - Comprehensive setup guide
- **[BUILD_GUIDE.md](./BUILD_GUIDE.md)** - Build desktop installers
- **[ELECTRON_SETUP.md](./ELECTRON_SETUP.md)** - Electron configuration details
- **[PACKAGING.md](./PACKAGING.md)** - Packaging options overview

---

## Known Limitations and Improvements

1. Scan a server for jdbc connections
2. Data presumes a flyway schema history table exists, so currently only works with the migrations model of flyway
3 . Bring lead time into ROI
4. currently only parsing top platforms for the big 4 DBs (MSSQL, Oracle, Postgres, MySQL)