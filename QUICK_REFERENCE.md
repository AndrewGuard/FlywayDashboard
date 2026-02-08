# Quick Reference - New Features

## 🐳 Docker Installation (30 seconds)

```bash
# Start everything
docker-compose up

# Open browser
http://localhost:3000
```

That's it! The app runs in demo mode with sample data.

### Production Mode
```bash
# 1. Configure server
cd server
cp .env.example .env
# Edit .env: DEMO_MODE=false
# Edit jdbc-connections.json with your databases

# 2. Start
docker-compose up -d

# 3. View logs
docker-compose logs -f
```

### Common Commands
```bash
docker-compose up -d        # Start in background
docker-compose down         # Stop everything
docker-compose logs -f      # View logs (live)
docker-compose restart      # Restart services
docker-compose build        # Rebuild after code changes
```

---

## 🔔 Notification System

### In Any Component
```typescript
import { useNotification } from './hooks/useNotification';

function MyComponent() {
  const { showSuccess, showError, showWarning, showInfo } = useNotification();

  const handleSave = async () => {
    try {
      await saveData();
      showSuccess('Data saved successfully!');
    } catch (error) {
      showError('Failed to save data');
    }
  };

  return <button onClick={handleSave}>Save</button>;
}
```

### Types of Notifications
```typescript
showSuccess('Operation completed!');      // Green toast
showError('Something went wrong');        // Red toast  
showWarning('Check your configuration');  // Orange toast
showInfo('New data available');           // Blue toast
```

### Features
- ✅ Auto-hides after 6 seconds
- ✅ Dismissible by clicking X
- ✅ Bottom-right positioning
- ✅ Color-coded by severity

---

## 🔄 Automatic Retry Logic

**Already built-in!** No code needed.

All data fetching automatically retries:
- 3 attempts
- Exponential backoff (1s, 2s, 3s)
- Applies to: migrations, metrics, deployments, lead times

```typescript
// This already has retry logic:
const { data, loading, error } = useMigrationHistory();

// If the API fails:
// - Retry #1 after 1 second
// - Retry #2 after 2 seconds  
// - Retry #3 after 3 seconds
// - Then show error
```

---

## 🧪 Testing

### Run Tests
```bash
npm test                # Run once
npm run test:watch      # Auto-rerun on changes
npm run test:ui         # Browser-based test UI
npm run test:coverage   # Generate coverage report
```

### Write a Test
```typescript
// src/utils/myFunction.test.ts
import { describe, it, expect } from 'vitest';
import { myFunction } from './myFunction';

describe('myFunction', () => {
  it('should return correct value', () => {
    expect(myFunction(2, 3)).toBe(5);
  });
});
```

### React Component Test
```typescript
// src/components/MyComponent.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

---

## 📦 NPM Scripts

### Development
```bash
npm run dev             # Start both UI + server (auto-reload)
npm start               # UI only
npm run server          # Server only
```

### Docker
```bash
npm run docker:build    # Build Docker images
npm run docker:up       # Start containers
npm run docker:down     # Stop containers
npm run docker:start    # Start in background (-d)
npm run docker:logs     # View container logs
```

### Testing
```bash
npm test                # Run tests
npm run test:watch      # Watch mode
npm run test:ui         # Browser UI
npm run test:coverage   # Coverage report
```

### Production
```bash
npm run build           # Build React app
npm run server:build    # Build server TypeScript
```

---

## 📁 Key Files

### Docker
- `docker-compose.yml` - Orchestration (UI + server)
- `Dockerfile` - UI container (React + nginx)
- `server/Dockerfile` - Server container (Node + Express)
- `nginx.conf` - nginx configuration (React Router, security)

### Configuration
- `server/.env` - Server environment (ports, CORS, demo mode)
- `server/jdbc-connections.json` - Database connections
- `public/config.json` - UI runtime configuration

### Code
- `src/hooks/useNotification.tsx` - Notification system
- `src/hooks/useFlywayData.ts` - Data fetching with retry logic
- `vitest.config.ts` - Test configuration

### Documentation
- `DOCKER_INSTALL.md` - Complete Docker guide
- `IMPROVEMENTS_SUMMARY.md` - What was implemented
- `IMPLEMENTATION_CHECKLIST.md` - Testing checklist
- `INSTALL_SERVER.md` - Server-only deployment
- `INSTALL_UI.md` - UI-only deployment

---

## 🎯 Common Scenarios

### Scenario: Deploy to Production

```bash
# 1. Clone repo
git clone <repo> && cd flyway-dashboard

# 2. Configure server
cd server
cp .env.example .env
nano .env  # Set DEMO_MODE=false

# Edit database connections
nano jdbc-connections.json

# 3. Start with Docker
cd ..
docker-compose up -d

# 4. Verify
curl http://localhost:3001/health
curl http://localhost:3000
```

### Scenario: Show Error to User

```typescript
const { showError } = useNotification();

try {
  const result = await apiGet('/api/data');
} catch (error) {
  showError('Failed to load data. Please try again.');
}
```

### Scenario: Development Workflow

```bash
# Terminal 1: Start dev servers
npm run dev

# Terminal 2: Run tests in watch mode
npm run test:watch

# Make changes → Both auto-reload!
```

### Scenario: View Docker Logs

```bash
# All logs (live)
docker-compose logs -f

# Server only
docker-compose logs -f server

# UI only  
docker-compose logs -f ui

# Last 100 lines
docker-compose logs --tail=100
```

### Scenario: Backup Database

```bash
# Create backup
docker-compose exec server tar czf /tmp/backup.tar.gz /app/db

# Copy to host
docker cp $(docker-compose ps -q server):/tmp/backup.tar.gz ./backup.tar.gz
```

### Scenario: Change Ports

Edit `docker-compose.yml`:

```yaml
services:
  ui:
    ports:
      - "8080:80"  # Change from 3000 to 8080
  
  server:
    ports:
      - "8081:3001"  # Change from 3001 to 8081
```

Then restart:
```bash
docker-compose down
docker-compose up -d
```

---

## 🚨 Troubleshooting

### Docker won't start
```bash
# Check if ports are in use
netstat -ano | findstr :3000
netstat -ano | findstr :3001

# Rebuild from scratch
docker-compose down -v
docker-compose build --no-cache
docker-compose up
```

### Can't connect to database from Docker
Use `host.docker.internal` instead of `localhost`:

```json
{
  "prod": [
    "jdbc:postgresql://host.docker.internal:5432/db?user=user&password=pass"
  ]
}
```

### Tests not running
```bash
# Reinstall dependencies
npm install

# Check Vitest installed
npm list vitest

# Run with verbose output
npm test -- --reporter=verbose
```

### Notifications not showing
1. Check `src/App.tsx` includes `<NotificationComponent />`
2. Verify no console errors
3. Check MUI Snackbar CSS not overridden

---

## 📊 Performance Tips

### Docker
- Use multi-stage builds (already configured)
- Add `.dockerignore` (already configured)
- Use volume mounts sparingly
- Set resource limits for production

### Caching
- Client cache: 30 seconds (already configured)
- Server cache: 30 seconds (already configured)
- Browser cache: Static assets 1 year (nginx config)

### Testing
- Use `test:watch` for development (faster)
- Use `test:coverage` only when needed (slower)
- Mock API calls in tests (faster, more reliable)

---

## 🎉 What You Get

### Before
- ❌ 10+ step installation
- ❌ Silent errors
- ❌ No retry logic
- ❌ No testing infrastructure

### After
- ✅ 1-command installation (`docker-compose up`)
- ✅ User feedback (toast notifications)
- ✅ Automatic retries (3x with backoff)
- ✅ Test infrastructure (Vitest ready to go)

**Installation time: 15 minutes → 30 seconds** 🚀
