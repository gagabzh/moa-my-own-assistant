#!/bin/bash

# =============================================================================
# MOA - Script d'arrêt de la stack complète
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=========================================="
echo "Arrêt de la stack MOA"
echo "=========================================="
echo ""

# Vérifier que Docker est disponible
if ! command -v docker &> /dev/null; then
    echo "❌ ERREUR : Docker n'est pas installé ou n'est pas dans le PATH"
    exit 1
fi

# Arrêter tous les services
echo "🛑 Arrêt des conteneurs..."
docker compose -f docker-compose.global.yml down

echo ""
echo "=========================================="
echo "Stack MOA arrêtée"
echo "=========================================="
echo ""
echo "Pour redémarrer :"
echo "  ./start-all.sh"
echo ""
