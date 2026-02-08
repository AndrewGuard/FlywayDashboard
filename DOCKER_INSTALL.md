# Docker Installation Guide

The fastest way to get Flyway Dashboard running!

## Prerequisites

- **Docker** and **Docker Compose** installed
  - Windows: [Docker Desktop](https://www.docker.com/products/docker-desktop)
  - Mac: [Docker Desktop](https://www.docker.com/products/docker-desktop)
  - Linux: `sudo apt install docker.io docker-compose`

## Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/your-org/flyway-dashboard.git
cd flyway-dashboard
```

### 2. Start with Docker Compose

```bash
docker-compose up
```

**That's it!** Open http://localhost:3000 in your browser.

The application starts in **demo mode** by default with sample data.

## Configuration

### Connect to Real Databases

1. **Stop the containers:**
   ```bash
   docker-compose down
   ```

2. **Edit server/.env:**
   ```bash
   DEMO_MODE=false
   JDBC_ENCRYPTION_KEY=your_generated_key
   ```

3. **Edit server/jdbc-connections.json:**
   ```json
   {
     "prod": [
       "jdbc:postgresql://host:5432/db?user=user&password=pass"
     ],
     "nonProd": []
   }
   ```

4. **Restart:**
   ```bash
   docker-compose up
   ```

### Custom Ports

Edit `docker-compose.yml`:

```yaml
services:
  ui:
    ports:
      - "8080:80"  # Change 8080 to your desired port
  
  server:
    ports:
      - "8081:3001"  # Change 8081 to your desired port
```

## Docker Commands

```bash
# Start in background
docker-compose up -d

# Stop containers
docker-compose down

# View logs
docker-compose logs -f

# View server logs only
docker-compose logs -f server

# View UI logs only
docker-compose logs -f ui

# Rebuild after code changes
docker-compose build

# Restart services
docker-compose restart

# Remove everything (including volumes)
docker-compose down -v
```

## Production Deployment

### With Environment Variables

Create `.env` file:

```bash
DEMO_MODE=false
JDBC_ENCRYPTION_KEY=your_64_char_hex_key
```

Start with env file:

```bash
docker-compose --env-file .env up -d
```

### Behind a Reverse Proxy

#### nginx

```nginx
server {
    listen 80;
    server_name flyway.yourcompany.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### With HTTPS

Update `docker-compose.yml`:

```yaml
services:
  ui:
    environment:
      - HTTPS=true
    volumes:
      - ./ssl/cert.pem:/etc/ssl/cert.pem:ro
      - ./ssl/key.pem:/etc/ssl/key.pem:ro
```

## Persistence

Data is persisted in Docker volumes:

- `./server/db` - SQLite database with user metrics
- Mounted to containers automatically

To backup:

```bash
# Backup database
docker-compose exec server tar czf /tmp/backup.tar.gz /app/db
docker cp $(docker-compose ps -q server):/tmp/backup.tar.gz ./backup.tar.gz
```

## Troubleshooting

### Containers won't start

```bash
# Check if ports are available
netstat -ano | findstr :3000
netstat -ano | findstr :3001

# View detailed logs
docker-compose logs

# Rebuild from scratch
docker-compose down -v
docker-compose build --no-cache
docker-compose up
```

### Can't connect to database from container

If your database is on the host machine:

- **Windows/Mac**: Use `host.docker.internal` instead of `localhost`
- **Linux**: Use `--network host` or configure bridge network

Example JDBC URL:
```
jdbc:postgresql://host.docker.internal:5432/db?user=user&password=pass
```

### Permission errors (Linux)

```bash
# Fix file permissions
sudo chown -R $USER:$USER server/db

# Or run with sudo
sudo docker-compose up
```

## Health Checks

Both containers have health checks:

```bash
# Check container health
docker-compose ps

# Test server health endpoint
curl http://localhost:3001/health

# Test UI
curl http://localhost:3000
```

## Development with Docker

Mount local code for live updates:

```yaml
services:
  server:
    volumes:
      - ./server:/app
      - /app/node_modules  # Prevent overwrite
    command: npm run dev
```

## Resource Limits

Add resource limits in `docker-compose.yml`:

```yaml
services:
  server:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
```

## Multi-Container Scaling

Run multiple UI instances:

```bash
docker-compose up --scale ui=3
```

## Next Steps

- Configure your JDBC connections via the UI
- Explore the dashboard at http://localhost:3000
- Check logs: `docker-compose logs -f`
- See [INSTALL_SERVER.md](INSTALL_SERVER.md) for server configuration
- See [INSTALL_UI.md](INSTALL_UI.md) for UI deployment options
