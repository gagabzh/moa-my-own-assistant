#!/bin/bash

# Forgejo Start Script
# This script starts the Forgejo container with proper configuration

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "Starting Forgejo..."

# Check if .env file exists, if not use .env.example
if [ ! -f .env ]; then
    echo "No .env file found, using .env.example"
    cp .env.example .env
fi

# Check if docker and docker-compose are available
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed"
    exit 1
fi

# Create a temporary docker-compose.override.yml if .env has custom ports
if [ -f .env ]; then
    # Load environment variables from .env
    set -a
    source .env
    set +a
fi

# Start the container
docker compose up -d

# Wait for container to be healthy
 echo "Waiting for Forgejo to start..."
MAX_ATTEMPTS=60
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    if docker ps | grep -q "forgejo" && docker inspect --format='{{.State.Health.Status}}' forgejo 2>/dev/null | grep -q "healthy"; then
        echo "Forgejo is running and healthy!"
        break
    fi
    sleep 2
    ATTEMPT=$((ATTEMPT + 1))
    if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
        echo "Forgejo started but health check may not be available yet"
    fi
done

# Display access information
HTTP_PORT=${FORGEJO_HTTP_PORT:-3000}
SSH_PORT=${FORGEJO_SSH_PORT:-2222}

cat << EOF

Forgejo is now running!
========================

🌐 Web Interface: http://localhost:$HTTP_PORT
🔑 SSH Access:    ssh -p $SSH_PORT git@localhost

First user to register will be the administrator.

To stop: ./stop.sh
To view logs: docker logs -f forgejo

EOF

echo "Done!"
