# Infrastructure MOA - Stack d'outils

Ce répertoire contient l'infrastructure Docker et les configurations pour les différents outils qui soutiendront tes skills.

## Architecture

```
infra/
├── .gitignore                    # Fichiers à ignorer par Git
├── .env.global                  # Configuration globale
├── .env.global.example           # Configuration globale (exemple)
├── README.md                     # Ce fichier
├── docker-compose.global.yml    # Configuration globale pour tous les services
├── start-all.sh                  # Démarre toute la stack
├── stop-all.sh                   # Arrête toute la stack
├── test-connectivity.sh          # Teste la connectivité entre services
├── caddy/                        # Reverse Proxy HTTPS
│   ├── docker-compose.yml        # Configuration Docker
│   ├── Caddyfile                 # Configuration Caddy (routage)
│   ├── .env                      # Variables d'environnement
│   ├── .env.example              # Exemple de configuration
│   └── README.md                 # Documentation Caddy
├── vikunja/                      # Gestionnaire de tâches
│   ├── docker-compose.yml        # Configuration Docker Compose
│   ├── docker-compose.override.yml
│   ├── .env                      # Variables d'environnement
│   ├── config.yml                # Configuration optionnelle
│   ├── test-installation.sh      # Script de validation
│   └── README.md                 # Documentation Vikunja
├── bookstack/                    # Documentation et wiki
│   ├── mcp-server/               # Serveur MCP pour BookStack
│   ├── docker-compose.yml        # Configuration Docker Compose
│   ├── .env                      # Variables d'environnement
│   └── ...
├── directus/                     # Gestion de données
│   └── docker-compose.yml        # Configuration Docker Compose
└── forgejo/                      # Gestion de code
    └── docker-compose.yml        # Configuration Docker Compose
```

## Organisation

**Pourquoi un répertoire par outil ?**
- **Isolation**: Chaque outil a ses propres dépendances et configurations
- **Maintenabilité**: Plus facile de mettre à jour ou modifier un outil sans affecter les autres
- **Clarté**: Structure claire et compréhensible
- **Scalabilité**: Facile d'ajouter de nouveaux outils

## Prérequis

- Docker (version 20.10+ recommandée)
- Docker Compose (version 2.0+)
- Minimum 2 Go de RAM disponibles
- Ports disponibles: 3456 (Vikunja), 5432 (PostgreSQL), etc.

## Quick Start - Vikunja

1. **Naviguer dans le répertoire Vikunja**
   ```bash
   cd moa-my-own-assistant/infra/vikunja
   ```

2. **Copier et configurer l'environnement**
   ```bash
   cp .env .env.local
   # Éditer .env.local avec vos propres valeurs
   ```

3. **Lancer Vikunja**
   ```bash
   docker compose up -d
   ```

4. **Valider l'installation**
   ```bash
   ./test-installation.sh
   ```

5. **Accéder à Vikunja**
   - Interface web: http://localhost:3456
   - API: http://localhost:3456/api/v1

## Ajout d'un nouvel outil

Pour ajouter un nouvel outil à l'infrastructure :

1. Créer un répertoire dédié dans `infra/`
2. Ajouter les fichiers de configuration Docker
3. Créer un `.env` avec les variables par défaut
4. Ajouter un `docker-compose.yml`
5. Créer un `README.md` avec la documentation
6. Optionnellement ajouter un script de test

## Gestion des dépendances

### Réseau Docker

Chaque outil peut avoir son propre réseau Docker, mais pour une intégration optimale, tu peux :
- Créer un réseau partagé pour tous les outils
- Utiliser des noms de service cohérents
- Configurer les dépendances correctement

### Volumes persistants

Tous les outils utilisent des volumes Docker pour persister les données :
- `vikunja_files`: Fichiers uploadés dans Vikunja
- `vikunja_db_data`: Base de données PostgreSQL

## Sécurité

- **Secrets**: Ne jamais committer les fichiers `.env.local` ou `.env.production`
- **Ports**: Limiter l'exposition des ports aux réseaux nécessaires
- **Mises à jour**: Mettre à jour régulièrement les images Docker
- **Sauvegardes**: Prévoir des sauvegardes régulières des volumes

## Intégration avec les Skills

Chaque outil expose une API REST que tes skills peuvent utiliser :

- **Vikunja**: Gestion de tâches, projets, temps
- **BookStack** (à venir): Documentation et wiki
- **Directus** (à venir): Gestion de bases de données
- **Forgejo** (à venir): Gestion de code source

### Exemple d'intégration

```typescript
// Dans une skill, tu peux utiliser fetch pour appeler les APIs
const vikunjaBaseUrl = 'http://localhost:3456/api/v1';
const apiToken = process.env.VIKUNJA_API_TOKEN;

// Créer une tâche depuis une skill
const createTask = async (title: string) => {
  const response = await fetch(`${vikunjaBaseUrl}/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiToken}`
    },
    body: JSON.stringify({ title })
  });
  return response.json();
};
```

## Commandes utiles

### Vikunja

```bash
# Démarrer
cd infra/vikunja
docker compose up -d

# Arrêter
docker compose down

# Voir les logs
docker compose logs -f

# Mettre à jour
docker compose pull && docker compose up -d

# Sauvegarder les données
docker run --rm --volumes-from vikunja_db -v $(pwd):/backup busybox tar cvf /backup/vikunja_db_backup.tar /var/lib/postgresql/data
```

### Tous les services

```bash
# Démarrer tous les services (à configurer)
docker compose -f docker-compose.global.yml up -d

# Arrêter tous les services
docker compose -f docker-compose.global.yml down
```

## Quick Start - Phase 1 (Réseau Local)

La Phase 1 permet de faire fonctionner tous les outils sur le réseau local avec un **réseau Docker partagé** (`moa-network`).

### 1. Configurer l'environnement

```bash
cd moa-my-own-assistant/infra
cp .env.global.example .env.global
# Éditer .env.global avec vos propres valeurs
```

### 2. Démarrer toute la stack

```bash
./start-all.sh
```

Ce script :
- Vérifie que Docker tourne
- Crée le réseau `moa-network` si nécessaire
- Vérifie les ports disponibles
- Démarre tous les services avec `docker-compose.global.yml`

### 3. Vérifier la connectivité

```bash
./test-connectivity.sh
```

### 4. Accéder aux services

| Service | URL | Port |
|---------|-----|------|
| Vikunja | http://localhost:3456 | 3456 |
| BookStack | http://localhost:6875 | 6875 |
| BookStack MCP | http://localhost:3002 | 3002 |
| Directus | http://localhost:8055 | 8055 |
| Forgejo | http://localhost:3001 | 3001 |
| Forgejo SSH | ssh://git@localhost:2223 | 2223 |

### 5. Arrêter la stack

```bash
./stop-all.sh
```

## Quick Start - Phase 1.5 (Reverse Proxy HTTPS avec Caddy)

La Phase 1.5 ajoute un **reverse proxy HTTPS** avec Caddy pour centraliser l'accès à tous les services.

### ⚠️ Prérequis
- Avoir terminé la **Phase 1** (réseau moa-network fonctionnel)
- Ajouter les noms d'hôte dans `/etc/hosts` (voir ci-dessous)

### 1. Configurer /etc/hosts

Sur ta machine, ajoute ces entrées pour accéder aux services via des noms d'hôte :

```bash
# Linux/Mac
sudo sh -c 'echo "127.0.0.1 vikunja.localhost bookstack.localhost directus.localhost forgejo.localhost git.moa.local" >> /etc/hosts'

# Windows (PowerShell admin)
Add-Content -Path "C:\Windows\System32\drivers\etc\hosts" -Value "127.0.0.1 vikunja.localhost bookstack.localhost directus.localhost forgejo.localhost git.moa.local"
```

### 2. Démarrer la stack complète avec Caddy

```bash
cd moa-my-own-assistant/infra
./start-all.sh
```

> **Note** : Avec Caddy activé, les services ne sont **plus accessibles directement** sur leurs ports (3456, 6875, 8055, 3001). Ils sont désormais accessibles uniquement via Caddy sur les ports **80** (HTTP) et **443** (HTTPS).

### 3. Accéder aux services (via HTTPS)

| Service | URL HTTPS (Développement) | URL HTTPS (Production) | Port direct (désactivé) |
|---------|--------------------------|------------------------|-------------------------|
| **Vikunja** | https://vikunja.localhost | https://vikunja.moa.local | 3456 |
| **BookStack** | https://bookstack.localhost | https://bookstack.moa.local | 6875 |
| **Directus** | https://directus.localhost | https://directus.moa.local | 8055 |
| **Forgejo** | https://forgejo.localhost | https://forgejo.moa.local | 3001 |
| **Forgejo SSH** | - | ssh://git@git.moa.local:2223 | 2223 |

> ⚠️ **Certificats auto-signés** : ton navigateur affichera une alerte de sécurité. Clique sur "Avancé" puis accepte le certificat.

### 4. Vérifier que tout fonctionne

```bash
# Vérifier que Caddy tourne
docker ps | grep caddy

# Tester l'accès HTTPS (ignore les erreurs de certificat)
curl -k https://vikunja.localhost
curl -k https://bookstack.localhost
```

### 5. Arrêter la stack

```bash
./stop-all.sh
```

### ⚙️ Configuration de Caddy

Voir [infra/caddy/README.md](./caddy/README.md) pour plus de détails sur :
- Configuration pour la production avec Let's Encrypt
- Personnalisation du Caddyfile
- Gestion des certificats

## Prochaines étapes

1. **Valider Vikunja**: `cd infra/vikunja && ./test-installation.sh`
2. **Configurer les skills**: Mettre à jour les skills pour utiliser les nouvelles URLs HTTPS
3. **Tester la connectivité inter-services**: Vérifier que les outils peuvent communiquer entre eux
4. **Phase 2**: Configuration pour production (nom de domaine réel, Let's Encrypt, etc.)

## Dépannage

### Problèmes courants

1. **Ports déjà utilisés**: Vérifier avec `lsof -i :3456` ou `netstat -tulnp`
2. **Problèmes de permissions**: `chmod -R 755 infra/`
3. **Espace disque insuffisant**: Vérifier avec `docker system df`
4. **Problèmes de réseau**: `docker network inspect`

### Vider les ressources Docker

```bash
# Arrêter tous les conteneurs
docker stop $(docker ps -aq)

# Supprimer les conteneurs, réseaux et volumes inutilisés
docker system prune -a -f --volumes
```

## Ressources

- [Documentation Vikunja](https://vikunja.io/docs/)
- [API Vikunja](https://vikunja.io/api/)
- [Docker Compose](https://docs.docker.com/compose/)
