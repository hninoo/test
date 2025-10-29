# Docker Compose Management Commands

## Current Issue Resolution

Based on your terminal output, you have an orphaned phpMyAdmin container. Here are the commands to resolve this:

### 1. Clean Up Orphaned Containers

```bash
# Navigate to your docker-compose directory
cd /path/to/your/docker-compose-directory

# Stop all services and remove orphaned containers
docker-compose down --remove-orphans

# Alternative: Force remove specific orphaned container
docker rm -f pfc-docker-base-pfc_phpmyadmin-1
```

### 2. Clean Up Networks

```bash
# Remove unused networks
docker network prune -f

# Or remove specific network if needed
docker network rm pfc-docker-base_default
```

### 3. Restart Services Cleanly

```bash
# Start services with orphan cleanup
docker-compose up -d --remove-orphans
```

## Using the Management Script

The workspace now includes a comprehensive Docker management script at `scripts/docker-management.sh`:

```bash
# Make sure you're in a directory with docker-compose.yml
cd /path/to/your/docker-compose-directory

# Use the management script
/workspace/scripts/docker-management.sh [command]
```

### Available Commands:

- `start` - Start Docker Compose services
- `stop` - Stop Docker Compose services  
- `restart` - Restart Docker Compose services
- `status` - Show Docker system information
- `logs [service]` - Show logs (optionally for specific service)
- `cleanup-orphans` - Clean up orphaned containers
- `cleanup-networks` - Clean up unused networks
- `cleanup-volumes` - Clean up unused volumes
- `full-cleanup` - Perform full cleanup (interactive)

### Examples:

```bash
# Clean up orphaned containers
/workspace/scripts/docker-management.sh cleanup-orphans

# Start services cleanly
/workspace/scripts/docker-management.sh start

# Show system status
/workspace/scripts/docker-management.sh status

# View logs for specific service
/workspace/scripts/docker-management.sh logs pfc_mysql
```

## Common Docker Compose Commands

### Basic Operations
```bash
# Start services in background
docker-compose up -d

# Start services with orphan cleanup
docker-compose up -d --remove-orphans

# Stop services
docker-compose down

# Stop services and remove orphans
docker-compose down --remove-orphans

# Restart services
docker-compose restart

# View running services
docker-compose ps

# View logs
docker-compose logs
docker-compose logs -f  # Follow logs
docker-compose logs [service_name]  # Logs for specific service
```

### Cleanup Operations
```bash
# Remove stopped containers
docker container prune -f

# Remove unused networks
docker network prune -f

# Remove unused volumes
docker volume prune -f

# Remove unused images
docker image prune -f

# Complete system cleanup (use with caution)
docker system prune -a -f
```

### Network Management
```bash
# List networks
docker network ls

# Inspect network
docker network inspect [network_name]

# Create network
docker network create [network_name]

# Remove network
docker network rm [network_name]
```

### Container Management
```bash
# List all containers
docker ps -a

# Stop specific container
docker stop [container_name]

# Remove specific container
docker rm [container_name]

# Force remove running container
docker rm -f [container_name]
```

## Troubleshooting

### Orphaned Containers
When you see warnings about orphaned containers, it means containers exist that are not defined in your current docker-compose.yml file. This usually happens when:
- Services are removed from docker-compose.yml
- Service names are changed
- Multiple docker-compose files are used

**Solution:** Use `--remove-orphans` flag with docker-compose commands.

### Network Conflicts
If you get network conflicts:
```bash
# Remove the conflicting network
docker network rm [network_name]

# Or prune all unused networks
docker network prune -f
```

### Port Conflicts
If ports are already in use:
```bash
# Find what's using the port
lsof -i :[port_number]

# Or change the port in docker-compose.yml
ports:
  - "8081:80"  # Changed from 8080:80
```

## Best Practices

1. Always use `--remove-orphans` when you've modified your compose file
2. Regularly clean up unused resources with `docker system prune`
3. Use named volumes for persistent data
4. Use networks to isolate services
5. Keep your docker-compose.yml in version control
6. Use environment files (.env) for configuration
7. Regularly update your base images

## Sample .env File

Create a `.env` file in your docker-compose directory:

```env
# Database Configuration
MYSQL_ROOT_PASSWORD=your_secure_password
MYSQL_DATABASE=your_database_name
MYSQL_USER=your_username
MYSQL_PASSWORD=your_password

# Application Configuration
APP_ENV=development
APP_DEBUG=true

# Ports
MYSQL_PORT=3306
REDIS_PORT=6379
WEB_PORT=80
PHPMYADMIN_PORT=8080
```