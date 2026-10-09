#!/bin/bash

# Start BookStack MCP Server
# This script starts the MCP server and BookStack if not already running

cd "$(dirname "$0")/.."

echo "=========================================="
echo "Démarrage du MCP Server pour BookStack"
echo "=========================================="
echo ""

# Check if docker-compose is available
if ! command -v docker &> /dev/null; then
    echo "ERROR: Docker is not installed"
    exit 1
fi

# Generate MCP_AUTH_TOKEN if not set in .env
if ! grep -q "BOOKSTACK_MCP_AUTH_TOKEN=" .env; then
    MCP_TOKEN=$(openssl rand -hex 32)
    echo "BOOKSTACK_MCP_AUTH_TOKEN=$MCP_TOKEN" >> .env
    echo "✓ Généré BOOKSTACK_MCP_AUTH_TOKEN"
fi

# Start services
echo "Démarrage des conteneurs..."
docker compose up -d --build

# Wait for services to start
echo "Attente du démarrage des services..."
sleep 10

# Check if services are running
echo ""
echo "Statut des services:"
docker compose ps

# Test MCP Server
echo ""
echo "Test du MCP Server..."
MCP_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health 2>/dev/null)
if [ "$MCP_HEALTH" = "200" ]; then
    echo "✓ MCP Server est en bonne santé (http://localhost:3000)"
else
    echo "⚠ MCP Server n'est pas encore prêt"
fi

# Test BookStack
BOOKSTACK_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:6875/login 2>/dev/null)
if [ "$BOOKSTACK_HEALTH" = "200" ]; then
    echo "✓ BookStack est accessible (http://localhost:6875)"
else
    echo "⚠ BookStack n'est pas encore prêt"
fi

echo ""
echo "=========================================="
echo "Configuration pour Vibe:"
echo "=========================================="
echo "MCP Server URL: http://localhost:3000"
echo "MCP Auth Token: $(grep BOOKSTACK_MCP_AUTH_TOKEN .env | cut -d= -f2 | head -c 16)..."
echo ""
echo "Pour configurer Vibe, utilisez:"
echo "  vibe mcp add bookstack --url http://localhost:3000 --header \"Authorization: Bearer <VOTRE_MCP_AUTH_TOKEN>\""
echo "=========================================="
