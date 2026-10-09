# BookStack MCP Server - Configuration Docker

Ce dossier contient la configuration pour exécuter le serveur MCP BookStack dans un conteneur Docker, permettant une intégration facile avec Mistral Vibe et d'autres assistants IA.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Réseau Local / Serveur                      │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐    ┌──────────────┐    ┌─────────────┐   │
│  │   Vibe       │───▶│   MCP        │───▶│   BookStack │   │
│  │  Instance 1  │    │   Server      │    │   (Port 6875)│   │
│  └──────────────┘    │   (Port 3000)│    └─────────────┘   │
│                     └──────────────┘                         │
└─────────────────────────────────────────────────────────────┘
```

- **BookStack**: Accès web sur `http://localhost:6875`
- **MCP Server**: API sur `http://localhost:3000`
- **Communication**: Toutes les instances Vibe peuvent se connecter au MCP Server

## 📦 Prérequis

- Docker et Docker Compose installés
- Accès à Internet pour télécharger l'image Bun
- Port 3000 disponible sur l'hôte

## 🚀 Démarrage rapide

### 1. Configurer les variables d'environnement

Éditez `.env` dans le dossier `infra/bookstack/` :

```bash
# Configuration BookStack (déjà configuré)
BOOKSTACK_APP_URL=http://localhost:6875
BOOKSTACK_DB_PASSWORD=bookstack
BOOKSTACK_APP_KEY=base64:...

# Configuration MCP Server
BOOKSTACK_MCP_BASE_URL=http://bookstack:80/api
BOOKSTACK_MCP_API_TOKEN=cb226ee78ddbd5834779835113e5d626:9ad2c132e691503a40674b748bce63031a0f2bb39d3a293e2abbd36c3f0dc302
BOOKSTACK_MCP_AUTH_TOKEN=changeme_mcp_auth_token_32_chars
BOOKSTACK_MCP_TRANSPORT=http
```

### 2. Générer un token MCP sécurisé

```bash
# Dans le dossier bookstack
cd infra/bookstack
export BOOKSTACK_MCP_AUTH_TOKEN=$(openssl rand -hex 32)
echo "MCP_AUTH_TOKEN=$BOOKSTACK_MCP_AUTH_TOKEN" >> .env
```

### 3. Démarrer tous les services

```bash
cd infra/bookstack
docker compose down  # Arrêter les services existants
docker compose build  # Construire l'image MCP
docker compose up -d  # Démarrer tout
```

### 4. Vérifier que tout fonctionne

```bash
# Vérifier BookStack
curl -I http://localhost:6875/login  # Doit retourner 200 OK

# Vérifier MCP Server
curl http://localhost:3000/  # Doit retourner {"status":"running",...}
curl -i http://localhost:3000/health  # Doit retourner 200 healthy
```

## 🔌 Configuration pour Vibe

### Option 1: Configuration manuelle par instance

Sur chaque machine avec Vibe, configurez le connecteur MCP :

```bash
# Ajouter le serveur MCP à Vibe
vibe mcp add bookstack \
  --url http://<serveur-ip>:3000 \
  --header "Authorization: Bearer $BOOKSTACK_MCP_AUTH_TOKEN"
```

### Option 2: Configuration centralisée (recommandé)

Déployez le MCP Server sur une machine centrale accessible par toutes les instances Vibe.

```yaml
# Exemple de configuration réseau
services:
  bookstack-mcp:
    ports:
      - "0.0.0.0:3000:3000"  # Accessible sur le réseau
    environment:
      - BOOKSTACK_MCP_AUTH_TOKEN=${BOOKSTACK_MCP_AUTH_TOKEN}
```

## 🛠️ Outils MCP disponibles

### Livres (Books)
- `bookstack_book_list` - Lister tous les livres
- `bookstack_book_read` - Lire un livre spécifique
- `bookstack_book_create` - Créer un livre
- `bookstack_book_update` - Mettre à jour un livre
- `bookstack_book_delete` - Supprimer un livre

### Pages
- `bookstack_page_list` - Lister les pages
- `bookstack_page_read` - Lire une page
- `bookstack_page_create` - Créer une page
- `bookstack_page_update` - Mettre à jour une page
- `bookstack_page_delete` - Supprimer une page

### Chapitres (Chapters)
- `bookstack_chapter_list` - Lister les chapitres
- `bookstack_chapter_read` - Lire un chapitre
- `bookstack_chapter_create` - Créer un chapitre
- `bookstack_chapter_update` - Mettre à jour un chapitre
- `bookstack_chapter_delete` - Supprimer un chapitre

### Étagères (Shelves)
- `bookstack_shelf_list` - Lister les étagères
- `bookstack_shelf_read` - Lire une étagère
- `bookstack_shelf_create` - Créer une étagère
- `bookstack_shelf_update` - Mettre à jour une étagère
- `bookstack_shelf_delete` - Supprimer une étagère

### Recherche
- `bookstack_search_all` - Rechercher dans tout BookStack
- `bookstack_search_book` - Rechercher dans un livre
- `bookstack_search_chapter` - Rechercher dans un chapitre

### Utilisateurs & Rôles
- `bookstack_user_list` - Lister les utilisateurs
- `bookstack_user_read` - Lire un utilisateur
- `bookstack_user_create` - Créer un utilisateur
- `bookstack_user_update` - Mettre à jour un utilisateur
- `bookstack_user_delete` - Supprimer un utilisateur

### Pièces jointes & Images
- `bookstack_attachment_list` - Lister les pièces jointes
- `bookstack_attachment_create` - Créer une pièce jointe
- `bookstack_attachment_delete` - Supprimer une pièce jointe

### Autre
- `bookstack_recyclebin_list` - Corbeille
- `bookstack_auditlog_list` - Journal d'audit
- `bookstack_system_info` - Infos système

## 📝 Exemples d'utilisation

### Créer un livre
```json
{
  "method": "bookstack_book_create",
  "params": {
    "name": "Nouveau Livre",
    "description": "Description du livre"
  }
}
```

### Lire une page
```json
{
  "method": "bookstack_page_read",
  "params": {
    "id": 42
  }
}
```

### Chercher du contenu
```json
{
  "method": "bookstack_search_all",
  "params": {
    "query": "Warhammer 40k"
  }
}
```

## 🔒 Sécurité

### Accès au MCP Server
- Le serveur MCP nécessite un `MCP_AUTH_TOKEN` pour toutes les requêtes
- Le token doit être garde secret et ne pas être exposé publiquement
- Utilisez HTTPS en production pour chiffrer le trafic

### Accès à BookStack
- Le MCP Server utilise un `BOOKSTACK_API_TOKEN` pour accéder à BookStack
- Ce token doit avoir les permissions nécessaires (role avec `access-api`)
- Le token est stocké dans les variables d'environnement du conteneur

### Bonnes pratiques
1. **Rotation des tokens**: Changez régulièrement les tokens MCP et BookStack
2. **Réseau isolé**: Exposez le MCP Server uniquement sur un réseau privé
3. **HTTPS**: Activez HTTPS pour le MCP Server en production
4. **Rate Limiting**: Configurez un reverse proxy (Nginx) avec rate limiting

## 📊 Déploiement en production

### Avec Docker (recommandé)

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  bookstack-mcp:
    build: ./mcp-server
    image: bookstack-mcp-server:latest
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - BOOKSTACK_BASE_URL=https://bookstack.votreserveur.com/api
      - BOOKSTACK_API_TOKEN=${BOOKSTACK_API_TOKEN}
      - MCP_AUTH_TOKEN=${MCP_AUTH_TOKEN}
      - MCP_TRANSPORT=http
    networks:
      - bookstack-network
```

### Avec Docker Swarm / Kubernetes

```yaml
# deployment.yml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: bookstack-mcp
spec:
  replicas: 1
  selector:
    matchLabels:
      app: bookstack-mcp
  template:
    metadata:
      labels:
        app: bookstack-mcp
    spec:
      containers:
      - name: mcp-server
        image: bookstack-mcp-server:latest
        ports:
        - containerPort: 3000
        env:
        - name: BOOKSTACK_BASE_URL
          value: "https://bookstack.votreserveur.com/api"
        - name: BOOKSTACK_API_TOKEN
          valueFrom:
            secretKeyRef:
              name: bookstack-secrets
              key: api-token
        - name: MCP_AUTH_TOKEN
          valueFrom:
            secretKeyRef:
              name: mcp-secrets
              key: auth-token
```

## 🛑 Dépannage

### Le serveur MCP ne démarre pas
```bash
# Vérifier les logs
docker compose logs bookstack-mcp

# Vérifier les variables d'environnement
docker exec bookstack-mcp printenv
```

### Erreur de connexion à BookStack
```bash
# Vérifier que BookStack est accessible depuis le conteneur MCP
docker exec bookstack-mcp curl -v http://bookstack:80/api/books

# Vérifier le token BookStack
docker exec bookstack-mcp curl -v -H "Authorization: Token <votre_token>" http://bookstack:80/api/books
```

### Le MCP Auth Token n'est pas accepté
```bash
# Générer un nouveau token
openssl rand -hex 32

# Redémarrer le conteneur
docker compose restart bookstack-mcp
```

## 📚 Documentation supplémentaire

- [BookStack MCP Server - GitHub](https://github.com/pnocera/bookstack-mcp-server)
- [Model Context Protocol](https://github.com/modelcontextprotocol/spec)
- [BookStack API Documentation](https://www.bookstackapp.com/docs)
