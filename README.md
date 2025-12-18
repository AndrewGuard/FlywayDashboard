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

#### Development Mode (Recommended)

Start both server and frontend with auto-restart:

```bash
npm run dev
```

This single command:
- ✅ Starts backend server on `http://localhost:3001` (with **auto-restart** via nodemon)
- ✅ Starts frontend React app on `http://localhost:3000` (with hot reload)
- ✅ Color-coded console output for easy debugging
- ✅ Auto-restarts server when you edit code, JDBC configs, or `.env` files

**Your browser will automatically open to:** `http://localhost:3000`

#### Alternative Start Methods

**Quick Start Scripts:**

**Windows:**
```powershell
.\start.ps1
```

**Linux/Mac:**
```bash
chmod +x start.sh
./start.sh
```

**Manual Start (Two Terminals):**

1. **Terminal 1 - Server with auto-restart:**
   ```bash
   cd server
   npm run dev
   ```

2. **Terminal 2 - Frontend:**
   ```bash
   npm start
   ```

**Production-like (No auto-restart):**
```bash
cd server
npm start
```

### Configuration (Optional)

#### Connect to Real Databases

By default, the dashboard uses demo data. To connect to your Flyway databases:

**Option 1: Using the UI (Recommended)**
1. Navigate to **Project Configuration** in the sidebar
2. Add your JDBC connection strings
3. Test connections
4. Click "Save" and then "Restart Server"

**Option 2: Manual Edit**
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

2. Server automatically restarts (if using `npm run dev`)

**Security Note:** See [SECURITY.md](./SECURITY.md) for credential management best practices.

#### Customize Metrics

Go to **DORA ROI Calculation** in the dashboard to enter your organization's metrics for ROI calculations

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
- LaunTART.md](./START.md)** - Quick start guide with nodemon setup
- **[SETUP.md](./SETUP.md)** - Comprehensive setup guide
- **[SECURITY.md](./SECURITY.md)** - Credential management best practices
- **[BUILD_GUIDE.md](./BUILD_GUIDE.md)** - Build desktop installers
- **[ELECTRON_SETUP.md](./ELECTRON_SETUP.md)** - Electron configuration details
- **[PACKAGING.md](./PACKAGING.md)** - Packaging options overview
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Production deployment guidetructions and customization options.

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