# Docker Quick Reference

## 🚀 Quick Start (30 seconds)

```bash
# One command to start everything
docker-compose up -d

# View the app
open http://localhost:3000
```

## 📋 Common Commands

### Start & Stop

```bash
make docker-up          # Start services
make docker-down        # Stop services
make docker-restart     # Restart services
make docker-logs        # View logs
```

### Or with docker-compose

```bash
docker-compose up -d                  # Start
docker-compose down                   # Stop
docker-compose logs -f --tail=50      # Logs
docker-compose ps                     # Status
```

### Or with bash script

```bash
./docker-quickstart.sh start           # Start
./docker-quickstart.sh stop            # Stop
./docker-quickstart.sh logs            # Logs
./docker-quickstart.sh status          # Status
./docker-quickstart.sh health          # Health check
```

## 🔧 Configuration

**Edit `.env` to customize:**

```bash
# Ports
BACKEND_PORT=3001
CLIENT_PORT=3000

# URLs
REACT_APP_API_URL=http://localhost:3001

# Environment
NODE_ENV=production
```

## 🌐 Access Points

| Service    | URL                   | Purpose            |
| ---------- | --------------------- | ------------------ |
| Frontend   | http://localhost:3000 | Web UI             |
| Backend    | http://localhost:3001 | API                |
| Signal API | http://localhost:8080 | Signal integration |

## 📊 Monitoring

```bash
# View live logs
docker-compose logs -f

# Check service health
curl http://localhost:3001/health

# View running containers
docker-compose ps

# View resource usage
docker stats
```

## 🐛 Troubleshooting

```bash
# Restart everything
docker-compose restart

# Rebuild from scratch
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d

# Check specific service logs
docker-compose logs backend
docker-compose logs client

# Access container shell
docker-compose exec backend sh
docker-compose exec client sh
```

## 💾 Data Management

```bash
# Backup authentication
docker run --rm -v baileys_auth:/data -v $(pwd):/backup \
  alpine tar czf /backup/auth_backup.tar.gz -C /data .

# Restore authentication
docker run --rm -v baileys_auth:/data -v $(pwd):/backup \
  alpine tar xzf /backup/auth_backup.tar.gz -C /data

# View volumes
docker volume ls

# Remove all volumes (WARNING: deletes data!)
docker-compose down -v
```

## 🔐 Production Tips

```bash
# Use production compose file
docker-compose -f docker-compose.prod.yml up -d

# Set environment
NODE_ENV=production

# Enable SSL/TLS with nginx (see DOCKER_DEPLOYMENT.md)
```

## 🧹 Cleanup

```bash
# Remove stopped containers
docker container prune

# Remove unused images
docker image prune

# Remove unused volumes
docker volume prune

# Full cleanup (DANGEROUS!)
docker system prune -a
```

## 📚 Full Documentation

See [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md) for complete guide.

---

**Need help?** Check [DOCKER_CHECKLIST.md](DOCKER_CHECKLIST.md) or view [README.md](README.md#docker-recommended)
