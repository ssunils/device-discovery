# Docker Deployment Guide

## Quick Start with Docker Compose

The Device Activity Tracker is fully containerized and ready to deploy using Docker.

### Prerequisites

- Docker (v20+)
- Docker Compose (v2.0+)

### Setup

1. **Clone the repository:**
```bash
git clone https://github.com/yourusername/device-activity-tracker.git
cd device-activity-tracker
```

2. **Configure environment variables:**
```bash
cp .env.example .env
```

3. **Review `.env` file and adjust settings as needed:**
```bash
# Backend
BACKEND_PORT=3001
NODE_ENV=production

# Frontend
CLIENT_PORT=3000
REACT_APP_API_URL=http://localhost:3001

# Signal API (optional)
SIGNAL_API_URL=http://signal-api:8080
SIGNAL_API_ENABLED=false
```

### Running with Docker Compose

**Start all services:**
```bash
docker-compose up -d
```

This will start:
- **Backend** (Node.js/Express): http://localhost:3001
- **Frontend** (React): http://localhost:3000
- **Signal API** (optional): http://localhost:8080

**View logs:**
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f client
```

**Stop services:**
```bash
docker-compose down
```

**Remove everything (including volumes):**
```bash
docker-compose down -v
```

---

## Production Deployment

### Environment Variables for Production

```bash
# .env (production)
BACKEND_PORT=3001
NODE_ENV=production
CLIENT_PORT=3000
REACT_APP_API_URL=https://your-domain.com:3001
SIGNAL_API_URL=http://signal-api:8080
HOST=0.0.0.0
```

### Docker Compose for Production

Replace the default `docker-compose.yml` with production settings:

```yaml
services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile
    restart: always
    ports:
      - "3001:3001"
    environment:
      - PORT=3001
      - NODE_ENV=production
      - SIGNAL_API_URL=http://signal-api:8080
    volumes:
      - baileys_auth:/app/baileys_auth_info
      - app_data:/app/data
    networks:
      - app-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  client:
    build:
      context: ./client
      dockerfile: Dockerfile
      args:
        - REACT_APP_API_URL=https://your-domain.com:3001
    restart: always
    ports:
      - "3000:3000"
    depends_on:
      - backend
    networks:
      - app-network

  signal-api:
    image: bbernhard/signal-cli-rest-api:latest
    restart: always
    ports:
      - "8080:8080"
    environment:
      - MODE=json-rpc
    networks:
      - app-network

volumes:
  baileys_auth:
    driver: local
  app_data:
    driver: local

networks:
  app-network:
    driver: bridge
```

### Using Nginx Reverse Proxy (Recommended)

Create `nginx.conf`:

```nginx
upstream backend {
    server backend:3001;
}

upstream frontend {
    server client:3000;
}

server {
    listen 80;
    server_name your-domain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL certificates (use Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Frontend
    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket support
    location /socket.io {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Update `docker-compose.yml` to include Nginx:

```yaml
  nginx:
    image: nginx:alpine
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
    depends_on:
      - backend
      - client
    networks:
      - app-network
```

---

## Building Docker Images Manually

### Build Backend Only

```bash
docker build -t device-tracker-backend:latest \
  --build-arg PORT=3001 \
  -f Dockerfile .
```

### Build Frontend Only

```bash
cd client
docker build -t device-tracker-frontend:latest \
  --build-arg REACT_APP_API_URL=http://localhost:3001 \
  -f Dockerfile .
```

### Run Individual Containers

**Backend:**
```bash
docker run -d \
  --name tracker-backend \
  -p 3001:3001 \
  -e PORT=3001 \
  -e NODE_ENV=production \
  -v baileys_auth:/app/baileys_auth_info \
  device-tracker-backend:latest
```

**Frontend:**
```bash
docker run -d \
  --name tracker-frontend \
  -p 3000:3000 \
  device-tracker-frontend:latest
```

---

## Data Persistence

### Volumes

- **baileys_auth**: Stores WhatsApp authentication state
- **app_data**: Stores history.json and cached profile pictures

To persist data across container restarts:

```bash
# List volumes
docker volume ls

# View volume content
docker volume inspect baileys_auth

# Backup volume
docker run --rm -v baileys_auth:/data -v $(pwd):/backup \
  alpine tar czf /backup/baileys_auth.tar.gz -C /data .
```

---

## Troubleshooting

### Backend failing to start

```bash
# Check logs
docker-compose logs backend

# Rebuild without cache
docker-compose build --no-cache backend
```

### Frontend not connecting to backend

Ensure `REACT_APP_API_URL` environment variable is set correctly in `docker-compose.yml`

### WhatsApp authentication issues

- Check `baileys_auth` volume is properly mounted
- View logs: `docker-compose logs backend | grep -i whatsapp`
- Clear auth state: `docker volume rm baileys_auth`

### Port conflicts

If ports 3000 or 3001 are already in use:

```bash
# Change in .env
BACKEND_PORT=3001
CLIENT_PORT=3000

# Or stop conflicting services
sudo lsof -i :3000
kill -9 <PID>
```

---

## CI/CD Integration

### GitHub Actions Example

Create `.github/workflows/docker.yml`:

```yaml
name: Docker Build & Push

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker images
        run: |
          docker-compose build
      
      - name: Login to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}
      
      - name: Push images
        run: |
          docker tag device-tracker-backend:latest yourusername/device-tracker-backend:latest
          docker tag device-tracker-frontend:latest yourusername/device-tracker-frontend:latest
          docker push yourusername/device-tracker-backend:latest
          docker push yourusername/device-tracker-frontend:latest
```

---

## Monitoring & Health Checks

### Health Check Endpoints

Add to backend (`src/server.ts`):

```typescript
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date(),
    uptime: process.uptime()
  });
});
```

### Docker Health Check

Update `docker-compose.yml`:

```yaml
services:
  backend:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s
```

### Monitor Logs

```bash
# Real-time logs
docker-compose logs -f --tail=100

# Search logs
docker-compose logs | grep error
```

---

## Security Best Practices

1. **Use `.env` for secrets** - Never commit environment variables
2. **Use official base images** - `node:20-alpine`, `nginx:alpine`
3. **Set `NODE_ENV=production`** - Optimize for production
4. **Use restart policies** - `restart: unless-stopped`
5. **Enable healthchecks** - Monitor container health
6. **Use HTTPS in production** - Set up SSL/TLS with nginx
7. **Limit container resources**:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

---

## Support

For issues, check:
- Docker logs: `docker-compose logs -f`
- Volume mounts: `docker volume ls`
- Network connectivity: `docker network ls`
- Container status: `docker ps -a`
