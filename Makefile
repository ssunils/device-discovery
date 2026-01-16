.PHONY: help docker-build docker-up docker-down docker-logs docker-clean docker-health docker-restart docker-status

help:
	@echo "Device Activity Tracker - Docker Commands"
	@echo "=========================================="
	@echo ""
	@echo "Development:"
	@echo "  make docker-up        - Start all services"
	@echo "  make docker-down      - Stop all services"
	@echo "  make docker-restart   - Restart all services"
	@echo "  make docker-build     - Build Docker images"
	@echo "  make docker-logs      - View service logs"
	@echo "  make docker-status    - Show container status"
	@echo "  make docker-health    - Check service health"
	@echo ""
	@echo "Maintenance:"
	@echo "  make docker-clean     - Remove all containers and volumes"
	@echo ""
	@echo "Configuration:"
	@echo "  make docker-env       - Create .env file from template"
	@echo ""

# Development targets
docker-env:
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "Created .env file"; \
	else \
		echo ".env file already exists"; \
	fi

docker-build: docker-env
	@echo "Building Docker images..."
	docker-compose build

docker-up: docker-env
	@echo "Starting services..."
	docker-compose up -d
	@echo ""
	@echo "✓ Services started!"
	@echo "  Frontend:    http://localhost:3000"
	@echo "  Backend:     http://localhost:3001"
	@echo "  Signal API:  http://localhost:8080"
	@echo ""

docker-down:
	@echo "Stopping services..."
	docker-compose down
	@echo "✓ Services stopped"

docker-restart: docker-down docker-up
	@echo "✓ Services restarted"

docker-logs:
	docker-compose logs -f --tail=50

docker-status:
	@echo "Service Status:"
	@docker-compose ps

docker-health:
	@echo "Checking service health..."
	@echo ""
	@echo "Backend:"
	@curl -s http://localhost:3001/health 2>/dev/null | jq '.' || echo "  ✗ Backend not responding"
	@echo ""
	@echo "Frontend:"
	@curl -s -I http://localhost:3000 2>/dev/null | head -1 || echo "  ✗ Frontend not responding"
	@echo ""

docker-clean:
	@echo "⚠ This will remove all containers, volumes, and cached data"
	@read -p "Are you sure? (y/N) " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker-compose down -v; \
		echo "✓ Cleanup complete"; \
	else \
		echo "Cleanup cancelled"; \
	fi

# Production targets
docker-prod-up:
	@echo "Starting production services..."
	docker-compose -f docker-compose.prod.yml up -d
	@echo "✓ Production services started"

docker-prod-down:
	@echo "Stopping production services..."
	docker-compose -f docker-compose.prod.yml down
	@echo "✓ Production services stopped"

docker-prod-logs:
	docker-compose -f docker-compose.prod.yml logs -f --tail=50

# Build targets
docker-backend-build:
	docker build -t device-tracker-backend:latest \
		--build-arg PORT=3001 \
		-f Dockerfile .

docker-frontend-build:
	cd client && docker build -t device-tracker-frontend:latest \
		--build-arg REACT_APP_API_URL=http://localhost:3001 \
		-f Dockerfile .

# Utility targets
docker-shell-backend:
	docker-compose exec backend sh

docker-shell-frontend:
	docker-compose exec client sh

docker-volume-backup:
	@echo "Backing up baileys_auth volume..."
	docker run --rm -v baileys_auth:/data -v $(PWD):/backup \
		alpine tar czf /backup/baileys_auth_backup.tar.gz -C /data .
	@echo "✓ Backup created: baileys_auth_backup.tar.gz"

docker-volume-restore:
	@echo "Restoring baileys_auth volume..."
	docker run --rm -v baileys_auth:/data -v $(PWD):/backup \
		alpine tar xzf /backup/baileys_auth_backup.tar.gz -C /data
	@echo "✓ Restore complete"

# Cleanup helpers
docker-remove-images:
	@echo "Removing Docker images..."
	docker rmi device-tracker-backend:latest device-tracker-frontend:latest 2>/dev/null || true
	@echo "✓ Images removed"

docker-prune:
	@echo "Pruning unused Docker resources..."
	docker system prune -f
	@echo "✓ Prune complete"
