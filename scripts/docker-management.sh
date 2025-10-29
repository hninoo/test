#!/bin/bash

# Docker Compose Management Script
# This script helps manage Docker Compose services and networks properly

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if Docker is running
check_docker() {
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
}

# Function to clean up orphaned containers
cleanup_orphans() {
    print_status "Cleaning up orphaned containers..."
    
    # Stop and remove orphaned containers
    if docker ps -a --filter "status=exited" --filter "label=com.docker.compose.project" -q | grep -q .; then
        print_status "Removing stopped containers..."
        docker ps -a --filter "status=exited" --filter "label=com.docker.compose.project" -q | xargs docker rm
        print_success "Stopped containers removed"
    else
        print_status "No stopped containers to remove"
    fi
    
    # Remove orphaned containers using docker-compose
    if [ -f "docker-compose.yml" ] || [ -f "docker-compose.yaml" ]; then
        print_status "Removing orphaned containers with docker-compose..."
        docker-compose down --remove-orphans
        print_success "Orphaned containers removed"
    else
        print_warning "No docker-compose.yml file found in current directory"
    fi
}

# Function to clean up unused networks
cleanup_networks() {
    print_status "Cleaning up unused networks..."
    
    # Remove unused networks
    UNUSED_NETWORKS=$(docker network ls --filter "dangling=true" -q)
    if [ -n "$UNUSED_NETWORKS" ]; then
        echo "$UNUSED_NETWORKS" | xargs docker network rm
        print_success "Unused networks removed"
    else
        print_status "No unused networks to remove"
    fi
    
    # Prune networks (with confirmation)
    print_status "Pruning all unused networks..."
    docker network prune -f
    print_success "Network pruning completed"
}

# Function to clean up unused volumes
cleanup_volumes() {
    print_status "Cleaning up unused volumes..."
    docker volume prune -f
    print_success "Volume pruning completed"
}

# Function to show Docker system information
show_docker_info() {
    print_status "Docker System Information:"
    echo ""
    
    print_status "Running Containers:"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    echo ""
    
    print_status "All Containers:"
    docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Image}}"
    echo ""
    
    print_status "Networks:"
    docker network ls
    echo ""
    
    print_status "Volumes:"
    docker volume ls
    echo ""
    
    print_status "Images:"
    docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"
}

# Function to start services
start_services() {
    if [ -f "docker-compose.yml" ] || [ -f "docker-compose.yaml" ]; then
        print_status "Starting Docker Compose services..."
        docker-compose up -d --remove-orphans
        print_success "Services started successfully"
        
        print_status "Service status:"
        docker-compose ps
    else
        print_error "No docker-compose.yml file found in current directory"
        exit 1
    fi
}

# Function to stop services
stop_services() {
    if [ -f "docker-compose.yml" ] || [ -f "docker-compose.yaml" ]; then
        print_status "Stopping Docker Compose services..."
        docker-compose down --remove-orphans
        print_success "Services stopped successfully"
    else
        print_error "No docker-compose.yml file found in current directory"
        exit 1
    fi
}

# Function to restart services
restart_services() {
    stop_services
    start_services
}

# Function to show logs
show_logs() {
    if [ -f "docker-compose.yml" ] || [ -f "docker-compose.yaml" ]; then
        if [ -n "$1" ]; then
            print_status "Showing logs for service: $1"
            docker-compose logs -f "$1"
        else
            print_status "Showing logs for all services"
            docker-compose logs -f
        fi
    else
        print_error "No docker-compose.yml file found in current directory"
        exit 1
    fi
}

# Function to perform full cleanup
full_cleanup() {
    print_warning "This will perform a full cleanup of Docker resources"
    read -p "Are you sure you want to continue? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cleanup_orphans
        cleanup_networks
        cleanup_volumes
        
        print_status "Cleaning up unused images..."
        docker image prune -f
        
        print_success "Full cleanup completed"
        show_docker_info
    else
        print_status "Cleanup cancelled"
    fi
}

# Function to show help
show_help() {
    echo "Docker Compose Management Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  start           Start Docker Compose services"
    echo "  stop            Stop Docker Compose services"
    echo "  restart         Restart Docker Compose services"
    echo "  status          Show Docker system information"
    echo "  logs [service]  Show logs (optionally for specific service)"
    echo "  cleanup-orphans Clean up orphaned containers"
    echo "  cleanup-networks Clean up unused networks"
    echo "  cleanup-volumes Clean up unused volumes"
    echo "  full-cleanup    Perform full cleanup (interactive)"
    echo "  help            Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 start                    # Start all services"
    echo "  $0 logs mysql              # Show logs for mysql service"
    echo "  $0 cleanup-orphans         # Clean up orphaned containers"
    echo "  $0 full-cleanup            # Interactive full cleanup"
}

# Main script logic
main() {
    check_docker
    
    case "${1:-help}" in
        "start")
            start_services
            ;;
        "stop")
            stop_services
            ;;
        "restart")
            restart_services
            ;;
        "status")
            show_docker_info
            ;;
        "logs")
            show_logs "$2"
            ;;
        "cleanup-orphans")
            cleanup_orphans
            ;;
        "cleanup-networks")
            cleanup_networks
            ;;
        "cleanup-volumes")
            cleanup_volumes
            ;;
        "full-cleanup")
            full_cleanup
            ;;
        "help"|"--help"|"-h")
            show_help
            ;;
        *)
            print_error "Unknown command: $1"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"