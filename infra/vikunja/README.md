# Vikunja - Installation Locale

Vikunja est un gestionnaire de tâches open-source, auto-hébergé, qui servira de base pour la gestion des tâches dans ton infrastructure.

## Prérequis

- Docker
- Docker Compose
- Ports 3456 (Vikunja) disponibles

## Installation

1. **Cloner et configurer**
   ```bash
   cd moa-my-own-assistant/infra/vikunja
   
   # Copier le fichier d'environnement
   cp .env .env.local
   
   # Modifier .env.local avec vos propres valeurs
   # Générer un JWT secret fort : openssl rand -base64 32
   ```

2. **Lancer Vikunja**
   ```bash
   docker compose up -d
   ```

3. **Vérifier l'installation**
   ```bash
   docker compose logs -f vikunja
   ```

4. **Accéder à Vikunja**
   - Interface web: http://localhost:3456
   - API: http://localhost:3456/api/v1

## Configuration

### Variables d'environnement principales

| Variable | Description | Valeur par défaut |
|----------|-------------|------------------|
| `VIKUNJA_SECRET` | Secret principal (remplace JWT_SECRET) | `your-super-secret-key-change-me-in-production` |
| `VIKUNJA_PUBLIC_URL` | URL publique pour CORS | `http://localhost:3456` |
| `VIKUNJA_DB_PASSWORD` | Mot de passe de la base de données | `vikunja` |
| `VIKUNJA_ENABLE_OPEN_REGISTRATION` | Activer l'inscription ouverte | `false` |

### Configuration de la base de données

- **Host**: `vikunja-db` (nom du service Docker)
- **Port**: `5432`
- **User**: `vikunja`
- **Database**: `vikunja`

## Test de validation

### 1. Vérifier que les conteneurs sont en cours d'exécution
```bash
docker compose ps
```

### 2. Tester l'API Vikunja
```bash
# Vérifier la santé de l'API
curl -X GET http://localhost:3456/api/v1/info

# Créer un utilisateur (si l'inscription est ouverte)
curl -X POST http://localhost:3456/api/v1/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test123","email":"test@example.com"}'

# Se connecter
curl -X POST http://localhost:3456/api/v1/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test123"}'
```

### 3. Vérifier la base de données
```bash
# Se connecter à la base de données
docker exec -it vikunja-db psql -U vikunja -d vikunja

# Vérifier les tables
\dt
```

## Arrêter les services

```bash
docker compose down
```

## Mise à jour

```bash
# Arrêter les services
docker compose down

# Mettre à jour l'image
docker compose pull

# Redémarrer
docker compose up -d
```

## Dépannage

### Problème : La base de données ne répond pas
```bash
# Vérifier les logs de la base de données
docker compose logs vikunja-db

# Redémarrer la base de données
docker compose restart vikunja-db
```

### Problème : Vikunja ne se connecte pas à la base de données
```bash
# Attendre que la base de données soit prête
docker exec vikunja-db pg_isready -U vikunja -d vikunja
```

## Intégration avec les Skills

Vikunja expose une API REST complète que tes skills pourront utiliser pour:
- Créer et gérer des tâches
- Organiser des projets
- Suivre le temps
- Gérer les priorités

Exemple d'utilisation dans une skill:
```typescript
// Connexion à Vikunja
const vikunjaApiUrl = 'http://localhost:3456/api/v1';
const vikunjaToken = 'votre-jwt-token';

// Créer une tâche
const createTask = async (title: string, description: string) => {
  const response = await fetch(`${vikunjaApiUrl}/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${vikunjaToken}`
    },
    body: JSON.stringify({
      title,
      description,
      project_id: 1 // ID du projet
    })
  });
  return response.json();
};
```
