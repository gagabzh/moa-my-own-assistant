#!/bin/bash

# Directus Start Script
# This script starts the Directus containers

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR" || exit

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Error: .env file not found!"
    echo "Please copy .env.example to .env and configure it."
    echo "Run: cp .env.example .env"
    exit 1
fi

# Check if docker is running
if ! docker info > /dev/null 2>&1; then
    echo "Error: Docker daemon is not running!"
    exit 1
fi

# Start containers
 echo "Starting Directus containers..."
docker compose up -d

# Check if containers are running
if docker compose ps | grep -q "directus"; then
    echo "Directus is now running!"
    echo "Access the admin interface at: http://localhost:8055"
else
    echo "Error: Failed to start containers"
    exit 1
fi

echo "Container status:"
docker compose ps
