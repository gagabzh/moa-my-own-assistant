#!/bin/bash

# BookStack Stop Script
# This script stops the BookStack containers

echo "Stopping BookStack..."
cd "$(dirname "$0")"
docker compose down
echo "BookStack containers stopped."
