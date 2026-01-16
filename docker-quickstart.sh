#!/bin/bash

# Device Activity Tracker - Docker Quick Start Script
# Usage: ./docker-quickstart.sh [start|stop|build|logs|clean]

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$PROJECT_DIR/.env"
COMPOSE_FILE="$PROJECT_DIR/docker-compose.yml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check prerequisites
check_requirements() {
    log_info "Checking prerequisites..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker (https://www.docker.com)"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose"
        exit 1
    fi
    
    log_success "Docker and Docker Compose are installed"
}

# Setup environment
setup_env() {
    if [ ! -f "$ENV_FILE" ]; then
        log_warning ".env file not found. Creating from .env.example..."
        if [ -f "$PROJECT_DIR/.env.example" ]; then
            cp "$PROJECT_DIR/.env.example" "$ENV_FILE"
            log_success ".env file created"
        else
            log_error ".env.example not found"
            exit 1
        fi
    else
        log_success ".env file exists"
    fi
}

# Build images
build() {
    log_info "Building Docker images..."
    cd "$PROJECT_DIR"
    docker-compose build "$@"
    log_success "Docker images built successfully"
}

# Start services
start() {
    check_requirements
    setup_env
    
    log_info "Starting services..."
    cd "$PROJECT_DIR"
    docker-compose up -d
    
    log_success "Services started"
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}Device Activity Tracker is running!${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "📱 Frontend:    http://localhost:3000"
    echo "🔗 Backend:     http://localhost:3001"
    echo "📡 Signal API:  http://localhost:8080"
    echo ""
    echo "View logs:      ./docker-quickstart.sh logs"
    echo "Stop services:  ./docker-quickstart.sh stop"
    echo ""
}

# Stop services
stop() {
    log_info "Stopping services..."
    cd "$PROJECT_DIR"
    docker-compose down
    log_success "Services stopped"
}

# View logs
show_logs() {
    log_info "Showing logs (Ctrl+C to exit)..."
    cd "$PROJECT_DIR"
    docker-compose logs -f --tail=50
}

# Clean up everything
clean() {
    log_warning "This will remove all containers, volumes, and cached data"
    read -p "Are you sure? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "Cleaning up..."
        cd "$PROJECT_DIR"
        docker-compose down -v
        log_success "Cleanup complete"
    else
        log_info "Cleanup cancelled"
    fi
}

# Status check
status() {
    log_info "Checking service status..."
    cd "$PROJECT_DIR"
    echo ""
    docker-compose ps
    echo ""
}

# Health check
health() {
    log_info "Checking service health..."
    cd "$PROJECT_DIR"
    
    echo ""
    log_info "Backend health:"
    curl -s http://localhost:3001/health 2>/dev/null | jq '.' || echo "Backend not responding"
    
    echo ""
    log_info "Frontend status:"
    curl -s -I http://localhost:3000 2>/dev/null | head -1 || echo "Frontend not responding"
    
    echo ""
}

# Rebuild and restart
restart() {
    log_info "Restarting services..."
    stop
    start
}

# Main script
main() {
    case "${1:-start}" in
        start)
            start
            ;;
        stop)
            stop
            ;;
        restart)
            restart
            ;;
        build)
            build "${@:2}"
            ;;
        logs)
            show_logs
            ;;
        status)
            status
            ;;
        health)
            health
            ;;
        clean)
            clean
            ;;
        *)
            echo "Usage: $0 [start|stop|restart|build|logs|status|health|clean]"
            echo ""
            echo "Commands:"
            echo "  start       - Start all services (default)"
            echo "  stop        - Stop all services"
            echo "  restart     - Restart all services"
            echo "  build       - Build Docker images"
            echo "  logs        - View service logs"
            echo "  status      - Show container status"
            echo "  health      - Check service health"
            echo "  clean       - Remove all containers and volumes"
            echo ""
            exit 1
            ;;
    esac
}

main "$@"
