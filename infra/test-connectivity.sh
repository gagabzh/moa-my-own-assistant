#!/bin/bash

# =============================================================================
# MOA - Script de test de connectivité entre services
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=========================================="
echo "Test de connectivité de la stack MOA"
echo "=========================================="
echo ""

# Vérifier que Docker est disponible
if ! command -v docker &> /dev/null; then
    echo "❌ ERREUR : Docker n'est pas installé"
    exit 1
fi

echo "🔍 Vérification du réseau moa-network..."
if docker network inspect moa-network &> /dev/null; then
    echo "✅ Réseau moa-network existe"
else
    echo "❌ ERREUR : Réseau moa-network n'existe pas"
    exit 1
fi

echo ""
echo "🔍 Vérification que tous les conteneurs sont en cours d'exécution..."
echo ""

# Fonction pour vérifier si un conteneur tourne
check_container() {
    local container_name=$1
    if docker ps --format '{{.Names}}' | grep -q "^${container_name}$"; then
        echo "✅ Conteneur $container_name tourne"
        return 0
    else
        echo "❌ Conteneur $container_name N'EST PAS en cours d'exécution"
        return 1
    fi
}

# Liste des conteneurs attendus
CONTAINERS=("vikunja" "vikunja-db" "bookstack" "bookstack-db" "bookstack-mcp" "directus" "directus-db" "forgejo")
ALL_RUNNING=true

for container in "${CONTAINERS[@]}"; do
    if ! check_container "$container"; then
        ALL_RUNNING=false
    fi
done

echo ""

if [ "$ALL_RUNNING" = false ]; then
    echo "❌ Certains conteneurs ne tournent pas. Veuillez démarrer la stack avec ./start-all.sh"
    exit 1
fi

echo "=========================================="
echo "Tests de connectivité entre services"
echo "=========================================="
echo ""

# Tester la connectivité de base vers chaque service
echo "1. Test de connectivité HTTP vers chaque service..."
echo ""

# Vikunja
if curl -s -f -o /dev/null http://localhost:3456; then
    echo "✅ Vikunja (http://localhost:3456) répond"
else
    echo "❌ Vikunja (http://localhost:3456) ne répond pas"
fi

# BookStack
if curl -s -f -o /dev/null http://localhost:6875; then
    echo "✅ BookStack (http://localhost:6875) répond"
else
    echo "❌ BookStack (http://localhost:6875) ne répond pas"
fi

# Directus
if curl -s -f -o /dev/null http://localhost:8055; then
    echo "✅ Directus (http://localhost:8055) répond"
else
    echo "❌ Directus (http://localhost:8055) ne répond pas"
fi

# Forgejo
if curl -s -f -o /dev/null http://localhost:3001; then
    echo "✅ Forgejo (http://localhost:3001) répond"
else
    echo "❌ Forgejo (http://localhost:3001) ne répond pas"
fi

echo ""
echo "2. Test de connectivité inter-conteneurs sur le réseau moa-network..."
echo ""

# Tester que Vikunja peut accéder à sa base de données
if docker exec vikunja pg_isready -h vikunja-db -p 5432 -U vikunja -d vikunja 2>/dev/null; then
    echo "✅ Vikunja peut accéder à vikunja-db"
else
    echo "⚠️  Vikunja ne peut pas accéder à vikunja-db (la base peut encore démarrer)"
fi

# Tester que BookStack peut accéder à sa base de données
if docker exec bookstack mysqladmin ping -h bookstack-db -u bookstack -pbookstack 2>/dev/null; then
    echo "✅ BookStack peut accéder à bookstack-db"
else
    echo "⚠️  BookStack ne peut pas accéder à bookstack-db (la base peut encore démarrer)"
fi

# Tester que Directus peut accéder à sa base de données
if docker exec directus pg_isready -h directus-db -p 5432 -U directus -d directus 2>/dev/null; then
    echo "✅ Directus peut accéder à directus-db"
else
    echo "⚠️  Directus ne peut pas accéder à directus-db (la base peut encore démarrer)"
fi

# Tester la connectivité entre BookStack et BookStack MCP
echo ""
echo "3. Test de connectivité BookStack MCP..."
if curl -s -f -o /dev/null http://localhost:3002; then
    echo "✅ BookStack MCP (http://localhost:3002) répond"
else
    echo "❌ BookStack MCP (http://localhost:3002) ne répond pas"
fi

echo ""
echo "=========================================="
echo "Test de connectivité terminé"
echo "=========================================="
echo ""
echo "Pour démarrer la stack : ./start-all.sh"
echo "Pour arrêter la stack : ./stop-all.sh"
echo "Pour voir les logs : docker compose -f docker-compose.global.yml logs -f"
echo ""
