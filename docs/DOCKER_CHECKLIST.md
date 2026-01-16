# Docker Deployment Checklist

## Pre-Deployment

- [ ] Docker installed (version 20+)
- [ ] Docker Compose installed (version 2.0+)
- [ ] Git cloned or source code copied
- [ ] `.env` file created from `.env.example`
- [ ] Required ports available (3000, 3001, 8080)

## Configuration

### Environment Variables

- [ ] `BACKEND_PORT` configured (default: 3001)
- [ ] `CLIENT_PORT` configured (default: 3000)
- [ ] `NODE_ENV` set appropriately (development/production)
- [ ] `REACT_APP_API_URL` set correctly for frontend
- [ ] `SIGNAL_API_URL` configured if using Signal
- [ ] `HOST` set to `0.0.0.0` for production

### Docker Compose File

- [ ] Using `docker-compose.yml` for development
- [ ] Using `docker-compose.prod.yml` for production
- [ ] All services properly defined (backend, client, signal-api)
- [ ] Volume mounts configured (baileys_auth, app_data)
- [ ] Networks configured (app-network)
- [ ] Health checks enabled
- [ ] Resource limits defined

## Building

- [ ] Run `docker-compose build` or `make docker-build`
- [ ] No build errors
- [ ] Images created successfully
- [ ] Backend image includes TypeScript compiled code
- [ ] Frontend image includes optimized React build

## Starting Services

### Initial Start

```bash
# Development
docker-compose up -d

# OR with quick start script
./docker-quickstart.sh start

# OR with make
make docker-up
```

- [ ] All services started
- [ ] No critical errors in logs
- [ ] Containers are running (check `docker ps`)

### Service Verification

- [ ] Backend accessible: `curl http://localhost:3001/health`
- [ ] Frontend accessible: `http://localhost:3000`
- [ ] Signal API accessible: `curl http://localhost:8080`
- [ ] Services can communicate with each other

## WhatsApp Authentication

- [ ] Backend logs show WhatsApp connection status
- [ ] QR code generated in web interface
- [ ] User can scan QR with WhatsApp
- [ ] Authentication successful
- [ ] `baileys_auth` volume persists credentials
- [ ] Credentials survive container restart

## Data Persistence

- [ ] Verify `baileys_auth` volume is mounted
- [ ] Verify `app_data` volume is mounted
- [ ] History file (`history.json`) created in `data/` directory
- [ ] Profile images cached in `data/images/`
- [ ] Data persists after container restart

## Frontend Testing

- [ ] Page loads without errors
- [ ] Can enter phone number
- [ ] Can select WhatsApp/Signal platform
- [ ] Blue/black theme loads correctly
- [ ] Navigation between Dashboard and History works
- [ ] Real-time updates work via Socket.io

## Backend Testing

- [ ] Server responds to health check
- [ ] WhatsApp connection works
- [ ] RTT probing starts successfully
- [ ] OS detection working
- [ ] Real-time Socket.io events sent to frontend
- [ ] History logged to file

## Monitoring

- [ ] Logs viewable: `docker-compose logs -f`
- [ ] Container status healthy: `docker ps`
- [ ] No memory warnings
- [ ] No CPU warnings
- [ ] Health checks passing

## Production Deployment

### Pre-Production

- [ ] `NODE_ENV=production` set
- [ ] `.env` file has production values
- [ ] SSL/TLS certificates ready (for HTTPS)
- [ ] Reverse proxy configured (nginx recommended)
- [ ] Resource limits defined in docker-compose

### Deployment

- [ ] Using `docker-compose.prod.yml`
- [ ] All services have restart policies
- [ ] Health checks enabled and working
- [ ] Logging configured
- [ ] Backup strategy defined

### Post-Deployment

- [ ] Verify HTTPS working (if configured)
- [ ] Test from external network
- [ ] Verify WebSocket connections work
- [ ] Monitor resource usage
- [ ] Check logs for errors
- [ ] Setup automated backups

## Troubleshooting

If issues occur:

```bash
# Check service status
docker-compose ps

# View detailed logs
docker-compose logs backend
docker-compose logs client

# Restart services
docker-compose restart

# Clear and rebuild
docker-compose down -v
docker-compose build --no-cache
docker-compose up

# Check specific service
docker-compose logs backend | grep -i error
```

## Maintenance

### Regular Tasks

- [ ] Weekly: Review logs for errors
- [ ] Monthly: Update base images
- [ ] Monthly: Backup baileys_auth volume
- [ ] Quarterly: Security updates

### Commands

```bash
# View logs
docker-compose logs -f --tail=100

# Backup data
make docker-volume-backup

# Update images
docker-compose pull
docker-compose build

# Cleanup
make docker-prune
```

## Backup & Recovery

### Backup Strategy

- [ ] Backup `baileys_auth` volume regularly
- [ ] Backup `app_data` volume (history.json, images)
- [ ] Backup `.env` file (without secrets)
- [ ] Document backup procedure

### Backup Command

```bash
docker run --rm -v baileys_auth:/data -v $(pwd):/backup \
  alpine tar czf /backup/baileys_auth_backup.tar.gz -C /data .
```

### Recovery Command

```bash
docker run --rm -v baileys_auth:/data -v $(pwd):/backup \
  alpine tar xzf /backup/baileys_auth_backup.tar.gz -C /data
```

## Security Checklist

- [ ] `.env` file not committed to git
- [ ] `.env` file has restrictive permissions (600)
- [ ] No hardcoded credentials in code
- [ ] No secrets in docker-compose files
- [ ] HTTPS enabled in production
- [ ] Firewall configured to allow only necessary ports
- [ ] Regular security updates applied
- [ ] Base images are official and verified
- [ ] No privileged container access needed
- [ ] Volume permissions correctly set

## Documentation

- [ ] README updated with Docker instructions
- [ ] DOCKER_DEPLOYMENT.md created
- [ ] Environment variables documented
- [ ] Troubleshooting guide created
- [ ] Health check endpoints documented

## Support & Debugging

If deployment fails, gather:

```bash
# Docker version
docker --version
docker-compose --version

# System info
docker system info

# Container logs
docker-compose logs backend > backend.log
docker-compose logs client > client.log

# Container stats
docker stats

# Network info
docker network inspect app-network
```

Then refer to [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md) troubleshooting section.

---

**Status:** ✅ Ready for Docker deployment
