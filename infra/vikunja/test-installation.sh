#!/bin/bash

# Script de test pour valider l'installation de Vikunja

set -e

echo "=== Test de l'installation Vikunja ==="
echo ""

# Chemin du répertoire
dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Vérifier Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé"
    exit 1
fi

# Vérifier Docker Compose
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose n'est pas installé"
    exit 1
fi

echo "✅ Docker et Docker Compose sont installés"
echo ""

# Lancer Vikunja si ce n'est pas déjà fait
echo "🚀 Lancement de Vikunja..."
cd "$dir"

if [ "$(docker compose ps -q | wc -l)" -eq "0" ]; then
    docker compose up -d
    echo "⏳ Attente du démarrage des services..."
    sleep 15
fi

echo ""

# Vérifier que les conteneurs sont en cours d'exécution
echo "🔍 Vérification des conteneurs..."
container_count=$(docker compose ps | grep -E 'vikunja|vikunja-db' | grep -v "Command" | wc -l)

if [ "$container_count" -lt 2 ]; then
    echo "❌ Les conteneurs ne sont pas tous en cours d'exécution"
    docker compose ps
    exit 1
fi

echo "✅ Les conteneurs sont en cours d'exécution"
echo ""

# Tester la santé de la base de données
echo "🗄️  Test de la base de données..."
max_retries=30
retry=0

while [ $retry -lt $max_retries ]; do
    if docker exec vikunja-db pg_isready -U vikunja -d vikunja &> /dev/null; then
        echo "✅ La base de données est prête"
        break
    fi
    retry=$((retry + 1))
    sleep 2
done

if [ $retry -eq $max_retries ]; then
    echo "❌ La base de données n'est pas prête après $max_retries tentatives"
    exit 1
fi

echo ""

# Tester l'API Vikunja
echo "🌐 Test de l'API Vikunja..."
max_retries=30
retry=0

while [ $retry -lt $max_retries ]; do
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:3456/api/v1/info | grep -q "200"; then
        echo "✅ L'API Vikunja répond correctement"
        
        # Afficher les informations de l'API
        echo ""
        echo "ℹ️  Informations de l'API:"
        curl -s http://localhost:3456/api/v1/info | head -20
        break
    fi
    retry=$((retry + 1))
    sleep 2
done

if [ $retry -eq $max_retries ]; then
    echo "❌ L'API Vikunja n'est pas accessible après $max_retries tentatives"
    echo "Logs Vikunja:"
    docker compose logs vikunja | tail -20
    exit 1
fi

echo ""
echo "🎉 Installation et validation de Vikunja réussies !"
echo ""
echo "Accédez à Vikunja à l'adresse : http://localhost:3456"
echo ""
echo "Pour arrêter les services :"
echo "  docker compose down"
