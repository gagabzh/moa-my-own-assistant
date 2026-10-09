#!/bin/bash

# Forgejo Stop Script
# This script stops the Forgejo container

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "Stopping Forgejo..."

# Check if container exists
if docker ps -a | grep -q "forgejo"; then
    # Stop the container
    docker compose down
    echo "Forgejo container stopped and removed"
else
    echo "Forgejo container not found"
fi

echo "Done!"
