# Connexion de Vibe au Serveur MCP BookStack

## 🎯 Pour une utilisation **locale** (toutes les instances sur la même machine)

### Option 1: Configuration via CLI (recommandé)

```bash
# Pour chaque instance Vibe, exécutez:
vibe mcp add bookstack \
  --url http://localhost:3000 \
  --header "Authorization: Bearer <VOTRE_MCP_AUTH_TOKEN>"

# Remplacez <VOTRE_MCP_AUTH_TOKEN> par le token dans votre .env
# Exemple:
grep BOOKSTACK_MCP_AUTH_TOKEN ../.env | cut -d= -f2
```

### Option 2: Configuration dans vibe config

Ajoutez dans votre fichier de configuration Vibe (`~/.vibe/config.json` ou équivalent) :

```json
{
  "mcp": {
    "servers": {
      "bookstack": {
        "url": "http://localhost:3000",
        "headers": {
          "Authorization": "Bearer votre_token_mcp_32_chars"
        }
      }
    }
  }
}
```

---

## 🌐 Pour une utilisation **réseau** (plusieurs machines)

### Architecture recommandée

```
┌─────────────────────────────────────────────────────────┐
│                   Réseau Local                             │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌─────────────┐     ┌─────────────┐     ┌───────────┐ │
│  │  Machine 1  │     │  Machine 2  │     │ Serveur  │ │
│  │   Vibe      │────▶│   Vibe      │────▶│   MCP     │ │
│  └─────────────┘     └─────────────┘     │ BookStack │ │
│                    ┌─────────────┐        └───────────┘ │
│                    │  Machine N  │                         │
│                    │   Vibe      │─────────────────────┘ │
│                    └─────────────┘                          │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

### Configuration

Sur le **serveur central** (où tourne le MCP Server) :

```bash
# Dans le dossier bookstack
cd infra/bookstack

# Générer un token MCP sécurisé
export BOOKSTACK_MCP_AUTH_TOKEN=$(openssl rand -hex 32)
echo "BOOKSTACK_MCP_AUTH_TOKEN=$BOOKSTACK_MCP_AUTH_TOKEN" >> .env

# Démarrer le MCP Server (accessible sur le réseau)
docker compose up -d bookstack-mcp
```

Sur **chaque machine cliente** (avec Vibe) :

```bash
# Remplacer <SERVER_IP> par l'IP du serveur
vibe mcp add bookstack \
  --url http://<SERVER_IP>:3000 \
  --header "Authorization: Bearer $BOOKSTACK_MCP_AUTH_TOKEN"
```

---

## 📋 Configuration Docker pour déploiement réseau

### Modifiez `docker-compose.yml` pour exposer sur le réseau :

```yaml
services:
  bookstack-mcp:
    ports:
      - "0.0.0.0:3000:3000"  # Accessible depuis toutes les IPs
    environment:
      - BOOKSTACK_MCP_AUTH_TOKEN=${BOOKSTACK_MCP_AUTH_TOKEN}
```

### Redémarrez :

```bash
docker compose down
docker compose up -d
```

---

## 🔐 Configuration de sécurité pour le réseau

### 1. Utiliser HTTPS (recommandé en production)

Utilisez un reverse proxy (Nginx, Traefik, Caddy) avec SSL :

```nginx
# Exemple de configuration Nginx
server {
    listen 443 ssl;
    server_name bookstack-mcp.votre-domaine.com;
    
    ssl_certificate /etc/letsencrypt/live/bookstack-mcp.votre-domaine.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/bookstack-mcp.votre-domaine.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header Authorization $http_authorization;
    }
}
```

### 2. Restreindre l'accès par IP

```bash
# Dans docker-compose.yml
# Utiliser un réseau Docker spécifique
networks:
  bookstack-network:
    internal: false  # Accessible depuis l'extérieur
    
# Ou configurer iptables sur le serveur
iptables -A INPUT -p tcp --dport 3000 -s 192.168.1.0/24 -j ACCEPT
iptables -A INPUT -p tcp --dport 3000 -j DROP
```

### 3. Rotations des tokens

```bash
# Pour changer le token MCP
cd infra/bookstack

# Générer un nouveau token
export NEW_MCP_TOKEN=$(openssl rand -hex 32)

# Mettre à jour .env
sed -i "s/BOOKSTACK_MCP_AUTH_TOKEN=.*/BOOKSTACK_MCP_AUTH_TOKEN=$NEW_MCP_TOKEN/" .env

# Redémarrer le MCP Server
docker compose restart bookstack-mcp

# Mettre à jour toutes les instances Vibe avec le nouveau token
```

---

## 🧪 Test de connexion

### Tester manuellement avec curl

```bash
# Récupérer le token depuis .env
MCP_TOKEN=$(grep BOOKSTACK_MCP_AUTH_TOKEN ../.env | cut -d= -f2)

# Tester l'endpoint /message
curl -X POST http://localhost:3000/message \
  -H "Authorization: Bearer $MCP_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list",
    "params": {}
  }'
```

Réponse attendue : Une liste des 59 outils disponibles.

### Tester avec Vibe

Une fois configuré, dans Vibe vous pouvez utiliser :

```
> Lister tous les livres BookStack
> Créer une page dans BookStack
> Chercher "Warhammer 40k" dans BookStack
```

Vibe reconnaîtra automatiquement le serveur MCP et utilisera les outils disponibles.

---

## 📊 Liste des outils disponibles

### Livres (Books)
- `bookstack_book_create` - Créer un livre
- `bookstack_book_delete` - Supprimer un livre
- `bookstack_book_list` - Lister les livres
- `bookstack_book_read` - Lire un livre
- `bookstack_book_update` - Mettre à jour un livre

### Pages
- `bookstack_page_create` - Créer une page
- `bookstack_page_delete` - Supprimer une page
- `bookstack_page_list` - Lister les pages
- `bookstack_page_read` - Lire une page
- `bookstack_page_update` - Mettre à jour une page
- `bookstack_page_export_html` - Exporter en HTML
- `bookstack_page_export_markdown` - Exporter en Markdown
- `bookstack_page_export_pdf` - Exporter en PDF
- `bookstack_page_export_plaintext` - Exporter en texte brut
- `bookstack_page_export_zip` - Exporter en ZIP

### Chapitres (Chapters)
- `bookstack_chapter_create` - Créer un chapitre
- `bookstack_chapter_delete` - Supprimer un chapitre
- `bookstack_chapter_list` - Lister les chapitres
- `bookstack_chapter_read` - Lire un chapitre
- `bookstack_chapter_update` - Mettre à jour un chapitre

### Étagères (Shelves/Bookshelves)
- `bookstack_shelf_create` - Créer une étagère
- `bookstack_shelf_delete` - Supprimer une étagère
- `bookstack_shelf_list` - Lister les étagères
- `bookstack_shelf_read` - Lire une étagère
- `bookstack_shelf_update` - Mettre à jour une étagère

### Recherche
- `bookstack_search_all` - Rechercher dans tout BookStack
- `bookstack_search_book` - Rechercher dans un livre
- `bookstack_search_chapter` - Rechercher dans un chapitre

### Utilisateurs
- `bookstack_user_create` - Créer un utilisateur
- `bookstack_user_delete` - Supprimer un utilisateur
- `bookstack_user_list` - Lister les utilisateurs
- `bookstack_user_read` - Lire un utilisateur
- `bookstack_user_update` - Mettre à jour un utilisateur

### Rôles et Permissions
- `bookstack_role_create` - Créer un rôle
- `bookstack_role_delete` - Supprimer un rôle
- `bookstack_role_list` - Lister les rôles
- `bookstack_role_read` - Lire un rôle
- `bookstack_role_update` - Mettre à jour un rôle
- `bookstack_permission_list` - Lister les permissions

### Pièces jointes et Images
- `bookstack_attachment_create` - Créer une pièce jointe
- `bookstack_attachment_delete` - Supprimer une pièce jointe
- `bookstack_attachment_list` - Lister les pièces jointes
- `bookstack_attachment_read` - Lire une pièce jointe
- `bookstack_image_gallery_create` - Créer une image
- `bookstack_image_gallery_delete` - Supprimer une image
- `bookstack_image_gallery_list` - Lister les images
- `bookstack_image_gallery_read` - Lire une image

### Autre
- `bookstack_recyclebin_list` - Lister la corbeille
- `bookstack_recyclebin_restore` - Restaurer depuis la corbeille
- `bookstack_auditlog_list` - Lister le journal d'audit
- `bookstack_system_info` - Infos système

---

## 🛠️ Exemples d'utilisation avec Vibe

### Exemple 1: Lire une page
```
Utilisateur: "Lis la page Inquisition - Ordo Xenos dans BookStack"
Vibe: Utilise automatiquement bookstack_page_read avec l'ID de la page
```

### Exemple 2: Créer une nouvelle page
```
Utilisateur: "Crée une page 'Nouveau Document' dans le livre 'Warhammer 40k Lore', chapitre 'Factions' avec le contenu suivant: ..."
Vibe: Utilise bookstack_page_create avec les bons paramètres
```

### Exemple 3: Chercher du contenu
```
Utilisateur: "Cherche toutes les pages qui parlent de 'Tyranides'"
Vibe: Utilise bookstack_search_all avec la requête 'Tyranides'
```

### Exemple 4: Déplacer une page
```
Utilisateur: "Déplace la page 'Inquisition - Ordo Xenos' dans le chapitre 'Organisations'"
Vibe: Utilise bookstack_page_update avec le nouveau chapter_id
```

---

## 💡 Astuces

### 1. Trouver l'ID d'une page

```bash
# Lister toutes les pages
curl -X POST http://localhost:3000/message \
  -H "Authorization: Bearer $MCP_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "bookstack_page_list",
    "params": {"limit": 50}
  }'
```

### 2. Voir la structure complète

```bash
# Lister les livres
curl -X POST http://localhost:3000/message \
  -H "Authorization: Bearer $MCP_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "bookstack_book_list",
    "params": {}
  }'
```

### 3. Créer un livre complet

```bash
# Créer un livre
curl -X POST http://localhost:3000/message \
  -H "Authorization: Bearer $MCP_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "bookstack_book_create",
    "params": {
      "name": "Nouveau Livre de Test",
      "description": "Description du livre"
    }
  }'
```

---

## 📞 Dépannage

### Problème: Connection refused sur le port 3000
```bash
# Vérifier que le conteneur est en cours d'exécution
docker compose ps

# Vérifier les logs
docker compose logs bookstack-mcp
```

### Problème: Erreur 401 Unauthorized
```bash
# Vérifier que le token MCP est correct
MCP_TOKEN=$(grep BOOKSTACK_MCP_AUTH_TOKEN ../.env | cut -d= -f2)
echo "Token: $MCP_TOKEN"

# Tester la connexion
curl -X POST http://localhost:3000/message \
  -H "Authorization: Bearer $MCP_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

### Problème: Erreur 500 BookStack connection
```bash
# Vérifier que BookStack est accessible depuis le conteneur MCP
docker exec bookstack-mcp curl -v http://bookstack:80/api/books

# Vérifier le token BookStack
TOKEN=$(grep BOOKSTACK_MCP_API_TOKEN ../.env | cut -d= -f2)
docker exec bookstack-mcp curl -v -H "Authorization: Token $TOKEN" http://bookstack:80/api/books
```

### Problème: Vibe ne reconnaît pas le serveur MCP
```bash
# Vérifier la configuration de Vibe
vibe mcp list

# Réajouter le serveur MCP
vibe mcp remove bookstack
vibe mcp add bookstack --url http://localhost:3000 --header "Authorization: Bearer $MCP_TOKEN"
```

---

## ✅ Résumé

Vous avez maintenant :
- ✅ Un **serveur MCP BookStack** fonctionnel dans Docker
- ✅ **59 outils** + **11 ressources** disponibles
- ✅ Une **architecture conteneurisée** facile à déployer
- ✅ Une **intégration possible avec toutes les instances Vibe** de votre réseau

Pour déployer sur votre serveur de production :
1. Copiez le dossier `infra/bookstack/` sur votre serveur
2. Ajustez les variables d'environnement dans `.env`
3. Exécutez `docker compose up -d`
4. Configurez chaque instance Vibe pour utiliser `http://<serveur-ip>:3000`

**Prêt pour les tests !** 🚀
