# Flyway Dashboard

Visualize Flyway database migration metrics with DORA-aligned performance indicators and ROI calculations.

## ⚡ Quick Start

### 🐳 Docker (Easiest - 30 seconds)

```bash
docker-compose up
```

Open http://localhost:3000 — Done! Runs in demo mode with sample data.

**Production:** See [DOCKER_INSTALL.md](DOCKER_INSTALL.md)

### 💻 Development (Local)

```bash
npm install
cd server && npm install && cd ..
npm run dev
```

Open http://localhost:3000

### 📦 Production Deployment

Choose your deployment method:
- **🐳 Docker**: [DOCKER_INSTALL.md](DOCKER_INSTALL.md) - One command, full stack
- **🖥️ Server Only**: [INSTALL_SERVER.md](INSTALL_SERVER.md) - Node.js server (Windows/Linux)
- **🌐 UI Only**: [INSTALL_UI.md](INSTALL_UI.md) - Static hosting (IIS/nginx/Netlify/S3)

---

## 🏗️ Architecture

**Client-Server separation** for flexible deployment:

```
┌─────────────────┐                    ┌──────────────────┐
│  React UI       │ ←── REST API ────→ │  Express Server  │
│  (Port 3000)    │                    │  (Port 3001)     │
│  Static Files   │                    │  + SQLite DB     │
└─────────────────┘                    └────────┬─────────┘
                                                │ JDBC
                                                ▼
                                       ┌─────────────────┐
                                       │  Your Databases │
                                       │  (PostgreSQL,   │
                                       │   SQL Server)   │
                                       └─────────────────┘
```

**Benefits:**
- ✅ Server runs where databases are accessible
- ✅ UI deploys anywhere (no DB access needed)
- ✅ Users need only a web browser
- ✅ Automatic credential encryption (AES-256-GCM)

---

## ⚙️ Configuration

### Connect to Your Databases

**Option 1: Using the UI** (Recommended)
1. Open **Project Configuration** in the sidebar
2. Add JDBC connection strings
3. Test connections
4. Save

**Option 2: Edit Configuration File**

Edit `server/jdbc-connections.json`:
```json
{
  "prod": [{
    "name": "Production DB",
    "jdbcUrl": "jdbc:postgresql://host:5432/db",
    "username": "flyway_readonly",
    "password": "your_password"
  }],
  "nonProd": [{
    "name": "Test DB",
    "jdbcUrl": "jdbc:sqlserver://host:1433;databaseName=db",
    "username": "flyway_readonly",
    "password": "your_password"
  }]
}
```

**Security:** Credentials are automatically encrypted at rest (AES-256-GCM).

### Customize Ports

By default: UI → 3000, Server → 3001

To change: See [PORT_CONFIGURATION.md](PORT_CONFIGURATION.md)

---

## ✨ Features

### DORA Metrics
- 📊 **Deployment Frequency** - Tracked per database/environment
- ⏱️ **Lead Time for Changes** - Commit to production
- ❌ **Change Failure Rate** - Failed deployments percentage
- 🔧 **Time to Restore** - Recovery time metrics

### ROI Calculator
Calculate Flyway's business value:
- Baseline vs Flyway comparison
- Cost savings from reduced lead times
- Deployment frequency improvements
- Annual ROI % with payback period

### Visualizations
- Change in deployment metrics
- Lead time trends over time
- Deployments by database/platform
- Migration activity and history
- Top platforms and databases

### Export
Download any chart as high-resolution PNG image.

---

## 🔧 Development

### Prerequisites
- Node.js 16+

### Setup

```bash
# Clone and install
git clone <repo-url>
cd flyway-dashboard
npm install
cd server && npm install && cd ..

# Configure server (choose one)
cd server
npm run setup           # Interactive wizard
# OR
cp .env.example .env    # Manual setup
```

### Run Development Servers

```bash
npm run dev   # Starts both UI (3000) and server (3001)
```

Browser opens automatically to http://localhost:3000

### Useful Commands

```bash
# Server only
cd server && npm start

# UI only  
npm start

# Run diagnostics
cd server && npm run diagnostics

# Test connections
cd server && npm run test-connections
```

See [server/QUICKSTART.md](server/QUICKSTART.md) for detailed setup.

---

## 🚀 Building Packages

### Server Package
```bash
cd server && npm run package-source
```
Creates `dist/flyway-dashboard-server-source-{version}.zip`

### UI Package
```bash
npm run package-ui
```
Creates `dist/flyway-dashboard-ui-{version}.zip`

---

## 📚 API Endpoints

**Health:** `GET /health`

**Metrics:**
- `GET /api/metrics/deployments-per-quarter`
- `GET /api/metrics/lead-times`
- `GET /api/metrics/lead-time-history/refresh`
- `GET /api/user-defined-metrics`

**Migration History:**
- `GET /api/flyway/history/all`
- `POST /api/flyway/history/refresh`

**Configuration:**
- `GET /api/jdbc-connections/config`
- `POST /api/jdbc-connections/config`
- `POST /api/jdbc-connections/test`

---

## 🐛 Troubleshooting

### Server Won't Start

```bash
cd server && npm run diagnostics   # Identifies issues
```

Common fixes:
- **Port conflict**: Change `PORT` in `server/.env`
- **Missing deps**: Run `npm install` in `server/`
- **Invalid config**: Compare `.env` with `.env.example`
- **Corrupted DB**: Delete `server/db/dashboard.db` to recreate

### Database Connection Fails

1. Test connection:
```bash
curl -X POST http://localhost:3001/api/jdbc-connections/test \
  -H "Content-Type: application/json" \
  -d '{"jdbcUrl": "...", "username": "...", "password": "..."}'
```

2. Check JDBC URL format:
   - PostgreSQL: `jdbc:postgresql://host:5432/dbname`
   - SQL Server: `jdbc:sqlserver://host:1433;databaseName=dbname`

3. Verify `flyway_schema_history` table exists

### CORS Errors (Production)

Add UI domain to `server/.env`:
```bash
ALLOWED_ORIGINS=https://dashboard.yourcompany.com,https://app.internal
```

Restart server: `pm2 restart flyway-dashboard-server`

### UI Can't Connect to Server

1. Check `public/config.json` has correct API URL
2. Verify server health: `curl http://server:3001/health`
3. Check CORS settings in `server/.env`
4. Check browser console for errors

### Export Images Not Working

1. Check browser console for html2canvas errors
2. Disable browser extensions that block canvas
3. Try Chrome/Edge (recommended browsers)

---

## 📂 Project Structure

```
flyway-dashboard/
├── public/              # Static assets
│   ├── config.json     # Runtime API config (editable)
│   └── index.html
├── src/                # React UI source
│   ├── Dashboard.tsx
│   ├── RoiCalculationPage.tsx
│   ├── widgets/        # Dashboard widgets
│   └── utils/          # Utilities
└── server/             # Express API server
    ├── index.ts        # Entry point
    ├── .env.example    # Config template
    ├── routes/         # API routes
    ├── db/             # SQLite database
    └── utils/          # Encryption, etc.
```

---

## 🛠️ Technology Stack

**Frontend:** React 18, TypeScript, Material-UI v5, MUI X-Charts, Chart.js, React Router v7

**Backend:** Node.js, Express, SQLite (better-sqlite3), PostgreSQL (pg), SQL Server (tedious)

**Security:** AES-256-GCM credential encryption

---

## 📖 Additional Documentation

- **Installation**
  - [DOCKER_INSTALL.md](DOCKER_INSTALL.md) - Docker deployment (recommended)
  - [INSTALL_SERVER.md](INSTALL_SERVER.md) - Server-only deployment
  - [INSTALL_UI.md](INSTALL_UI.md) - UI-only deployment
  - [server/QUICKSTART.md](server/QUICKSTART.md) - Server setup guide

- **Configuration**
  - [PORT_CONFIGURATION.md](PORT_CONFIGURATION.md) - Custom port setup
  - [SECURITY.md](SECURITY.md) - Security best practices

- **Advanced**
  - [DEPLOYMENT_SERVER.md](DEPLOYMENT_SERVER.md) - Advanced server deployment
  - [DEPLOYMENT_UI.md](DEPLOYMENT_UI.md) - Advanced UI deployment
  - [SEPARATION_IMPLEMENTATION.md](SEPARATION_IMPLEMENTATION.md) - Architecture details
  - [EXE_BUILD_GUIDE.md](EXE_BUILD_GUIDE.md) - EXE build (advanced users)

---

## 🗺️ Roadmap

- [ ] Automatic JDBC connection discovery
- [ ] Support for Flyway's versioned model
- [ ] Enhanced platform detection (MariaDB, MongoDB, etc.)
- [ ] Real-time metrics via WebSockets
- [ ] Multi-tenancy support
- [ ] Authentication/authorization (OAuth, SAML)
- [ ] Kubernetes deployment manifests
- [ ] Custom alerting and notifications

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature/my-feature`
5. Submit Pull Request

---

## 📄 License

[Your License Here]

---

## 💬 Support

- **Quick Issues**: Check [Troubleshooting](#-troubleshooting) section
- **Deployment Help**: See docs in [Additional Documentation](#-additional-documentation)
- **Bug Reports**: Open GitHub issue
- **Feature Requests**: Open GitHub issue with "enhancement" label
