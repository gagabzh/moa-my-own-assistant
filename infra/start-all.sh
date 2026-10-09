#!/bin/bash

# =============================================================================
# MOA - Script de démarrage de la stack complète
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=========================================="
echo "Démarrage de la stack MOA (Phase 1.5)"
echo "=========================================="
echo ""

# Vérifier que Docker est disponible
if ! command -v docker &> /dev/null; then
    echo "❌ ERREUR : Docker n'est pas installé ou n'est pas dans le PATH"
    exit 1
fi

if ! docker info &> /dev/null; then
    echo "❌ ERREUR : Le démon Docker ne tourne pas"
    exit 1
fi

# Vérifier que le réseau moa-network existe
if ! docker network inspect moa-network &> /dev/null; then
    echo "🔄 Création du réseau moa-network..."
    docker network create moa-network
    echo "✅ Réseau moa-network créé"
else
    echo "✅ Réseau moa-network existe déjà"
fi

# Vérifier les ports disponibles
echo ""
echo "⚠️  AVERTISSEMENT : Avec Caddy (Phase 1.5), les services sont accessibles via HTTPS uniquement."
echo "   Assure-toi d'avoir ajouté ces entrées dans /etc/hosts :"
echo "   127.0.0.1 vikunja.localhost bookstack.localhost directus.localhost forgejo.localhost git.moa.local"
echo ""
echo "Vérification des ports..."
echo ""

# Note: Avec Caddy, seuls les ports 80 et 443 sont exposés sur l'hôte
PORTS=(80 443 2223)
PORT_NAMES=("Caddy HTTP" "Caddy HTTPS" "Forgejo SSH")

for i in "${!PORTS[@]}"; do
    PORT=${PORTS[$i]}
    PORT_NAME=${PORT_NAMES[$i]}
    if command -v lsof >/dev/null 2>&1; then
        if lsof -i :$PORT >/dev/null 2>&1; then
            echo "⚠️  Port $PORT ($PORT_NAME) est déjà utilisé"
        else
            echo "✅ Port $PORT ($PORT_NAME) est disponible"
        fi
    else
        echo "⚠️  Impossible de vérifier le port $PORT (lsof non disponible)"
    fi
done

echo ""

# Fichier d'environnement
ENV_FILE="$SCRIPT_DIR/.env.global"
if [ -f "$ENV_FILE" ]; then
    echo "📄 Utilisation du fichier d'environnement : $ENV_FILE"
    ENV_CMD="--env-file $ENV_FILE"
else
    echo "⚠️  Fichier $ENV_FILE non trouvé. Utilisation des valeurs par défaut."
    echo "   Copiez .env.global.example en .env.global pour une configuration personnalisée."
    ENV_CMD=""
fi

echo ""
echo "🚀 Démarrage des conteneurs..."
echo ""

# Démarrer tous les services
docker compose $ENV_CMD -f docker-compose.global.yml up -d

echo ""
echo "=========================================="
echo "Vérification du statut des conteneurs..."
echo "=========================================="
echo ""

# Attendre quelques secondes pour que les services démarrent
sleep 5

# Afficher le statut
docker compose -f docker-compose.global.yml ps

echo ""
echo "=========================================="
echo "Stack MOA démarrée (Phase 1.5) !"
echo "=========================================="
echo ""
echo "🔒 URLs d'accès HTTPS (via Caddy reverse proxy) :"
echo "   ⚠️  Certificats auto-signés - Acceptes les avertissements de sécurité dans ton navigateur"
echo ""
echo "  Vikunja     : https://vikunja.localhost"
echo "  BookStack   : https://bookstack.localhost"
echo "  Directus    : https://directus.localhost"
echo "  Forgejo     : https://forgejo.localhost"
echo "  Forgejo SSH : ssh://git@git.moa.local:2223"
echo ""
echo "📌 Accès direct aux services (pour debugging) :"
echo "  Les ports directs (3456, 6875, 8055, 3001) sont désactivés."
echo "  Utilise les URLs HTTPS ci-dessus ou modifie docker-compose.global.yml"
echo ""
echo "Pour voir les logs :"
echo "  docker compose -f docker-compose.global.yml logs -f"
echo ""
echo "Pour arrêter la stack :"
echo "  ./stop-all.sh"
echo ""
