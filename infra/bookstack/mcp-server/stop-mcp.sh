#!/bin/bash

# Stop BookStack MCP Server
# This script stops the MCP server and related containers

cd "$(dirname "$0")/.."

echo "=========================================="
echo "Arrêt du MCP Server pour BookStack"
echo "=========================================="
echo ""

# Stop containers
docker compose down

echo "✓ Conteneurs arrêtés"
echo ""
echo "=========================================="
