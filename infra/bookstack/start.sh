#!/bin/bash

# BookStack Start Script
# This script starts the BookStack containers

echo "Starting BookStack..."
cd "$(dirname "$0")"
docker compose up -d
echo ""
echo "BookStack is starting up..."
echo "You can access it at: http://localhost:6875"
echo ""
echo "To check the status:"
echo "  docker compose ps"
echo ""
echo "To view logs:"
echo "  docker compose logs -f"
