#!/bin/bash

# Directus Stop Script
# This script stops the Directus containers

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR" || exit

# Stop containers
echo "Stopping Directus containers..."
docker compose down

# Check if containers are stopped
if docker compose ps | grep -q "directus"; then
    echo "Error: Containers are still running"
    exit 1
else
    echo "Directus containers stopped successfully!"
fi
