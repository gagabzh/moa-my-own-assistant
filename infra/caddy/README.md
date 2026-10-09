# Caddy Reverse Proxy - MOA Stack

## 📋 Présentation

Caddy est utilisé comme **reverse proxy** pour la stack MOA. Il fournit :
- ✅ **HTTPS automatique** (avec Let's Encrypt en production, certificats auto-signés en développement)
- ✅ **Routage par nom d'hôte** (vikunja.localhost, bookstack.localhost, etc.)
- ✅ **Terminaison SSL centralisée**
- ✅ **Un seul point d'entrée** (ports 80/443)

## 🎯 Configuration

### Fichiers
```
caddy/
├── docker-compose.yml    # Configuration Docker
├── Caddyfile            # Configuration Caddy (routage)
├── .env                 # Variables d'environnement
├── .env.example          # Exemple de configuration
└── README.md            # Ce fichier
```

## 🚀 Quick Start

### 1. Configuration pour développement local

**Aucune configuration requise !** Caddy générera automatiquement des certificats auto-signés.

### 2. Ajouter les noms d'hôte dans `/etc/hosts`

Sur ta machine hôte, exécute :
```bash
# Linux/Mac
sudo sh -c 'echo "127.0.0.1 vikunja.localhost bookstack.localhost directus.localhost forgejo.localhost" >> /etc/hosts'

# Windows (dans un terminal admin)
echo 127.0.0.1 vikunja.localhost bookstack.localhost directus.localhost forgejo.localhost >> C:\Windows\System32\drivers\etc\hosts
```

### 3. Démarrer Caddy

```bash
# Depuis le répertoire caddy/
docker compose up -d

# Ou via le fichier global
cd ..
docker compose --env-file .env.global -f docker-compose.global.yml up -d caddy
```

### 4. Accéder aux services

| Service | URL (Développement) | URL (Production) |
|---------|---------------------|------------------|
| Vikunja | https://vikunja.localhost | https://vikunja.moa.local |
| BookStack | https://bookstack.localhost | https://bookstack.moa.local |
| Directus | https://directus.localhost | https://directus.moa.local |
| Forgejo | https://forgejo.localhost | https://forgejo.moa.local |

> ⚠️ **Important** : Les certificats auto-signés génèrent une alerte de sécurité dans ton navigateur. Clique sur "Avancé" puis "Accepter le risque" (Firefox) ou "Continuer" (Chrome).

## 🔧 Configuration avancée

### Pour la production (avec Let's Encrypt)

1. **Modifier le Caddyfile** :
   - Décommentez la section de redirection HTTP→HTTPS
   - Utilisez vos vrais noms de domaine

2. **Configurer l'email** dans `.env` :
   ```bash
   CADDY_EMAIL=your-email@example.com
   ```

3. **Mettre à jour `/etc/hosts`** ou configurer votre DNS pour pointer vers votre serveur

4. **Ouvrir les ports** 80 et 443 sur votre firewall

### Exemple de Caddyfile pour production :
```caddy
vikunja.moa.yourdomain.com {
    reverse_proxy vikunja:3456
}

bookstack.moa.yourdomain.com {
    reverse_proxy bookstack:80
}

:80 {
    redir https://{host}{uri} permanent
}
```

## 📊 Ports

| Port | Protocole | Description |
|------|-----------|-------------|
| 80 | HTTP | Redirection vers HTTPS (en production) |
| 443 | HTTPS | Accès sécurisé à tous les services |

## 🔄 Gestion

### Démarrer
```bash
docker compose up -d
```

### Arrêter
```bash
docker compose down
```

### Voir les logs
```bash
docker compose logs -f
```

### Mettre à jour
```bash
docker compose pull && docker compose up -d
```

## 🛡️ Sécurité

### Certificats auto-signés (développement)
- Générés automatiquement par Caddy
- Valides pour `localhost` et `*.localhost`
- **Ne pas utiliser en production**

### Certificats Let's Encrypt (production)
- Générés automatiquement par Caddy
- Valides pour 90 jours (renouvellement automatique)
- Nécessite un nom de domaine public

### Bonnes pratiques
- Toujours utiliser HTTPS en production
- Limiter l'accès aux services sensibles
- Sauvegarder les volumes `caddy_data` et `caddy_config`

## 📦 Volumes

| Volume | Description | Persistance |
|--------|-------------|-------------|
| `caddy_data` | Certificats SSL et données | ✅ Oui |
| `caddy_config` | Configuration Caddy | ✅ Oui |

## 🔍 Dépannage

### Problème : Certificats auto-signés non acceptés
**Solution** : Dans ton navigateur, accepte manuellement le certificat auto-signé.

### Problème : Caddy ne démarre pas
**Solution** :
```bash
docker compose logs caddy
docker compose down && docker compose up -d
```

### Problème : Les noms d'hôte ne fonctionnent pas
**Solution** :
- Vérifie `/etc/hosts` : `cat /etc/hosts`
- Vérifie que le conteneur Caddy tourne : `docker ps`
- Vérifie que Caddy écoute sur le port 443 : `docker exec caddy netstat -tuln`

### Problème : Erreur de certificat Let's Encrypt
**Solution** :
- Assure-toi que ton domaine pointe vers ton serveur
- Vérifie que le port 80 est ouvert et accessible depuis Internet
- Vérifie que `CADDY_EMAIL` est configuré

## 📚 Ressources

- [Documentation Caddy](https://caddyserver.com/docs/)
- [Caddy Docker](https://hub.docker.com/_/caddy)
- [Let's Encrypt](https://letsencrypt.org/)
