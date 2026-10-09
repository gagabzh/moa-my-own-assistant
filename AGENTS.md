# Consignes Spécifiques - MOA My Own Assistant

## 📦 Architecture

### Règles Strictes
- **`infra/`** : Contient **UNIQUEMENT** les fichiers d'infrastructure (Docker, docker-compose, configurations serveurs, scripts d'installation/test)
- **Dossiers racine** : Tout code d'interaction, skills, logique métier ou outils DOIT être placé **à la racine du projet**
- **Intégration Vibe** : Les dossiers racine peuvent être ajoutés à `~/.vibe/skills/` via le script `update-vibe-skills.sh`

### Exemples
| Emplacement | Contenu Autorisé | Contenu Interdit |
|-------------|------------------|------------------|
| `infra/vikunja/` | docker-compose.yml, .env, configs Docker, scripts d'installation | Code d'interaction, skills, logique métier |
| `task-manager/` | SKILL.md, code TypeScript, utilitaires | Fichiers Docker, configurations serveurs |
| `infra/bookstack/` | docker-compose.yml, configs | Code d'interaction |

## ❌ Interdictions Absolues
- ❌ **Ne PAS** mettre de code d'interaction dans `infra/`
- ❌ **Ne PAS** mélanger infrastructure et logique métier
- ❌ **Ne PAS** committer de tokens/secrets dans Git

## ✅ Bonnes Pratiques
- ✅ Separation claire entre infrastructure et application
- ✅ Chaque outil a son propre dossier racine pour le code d'interaction
- ✅ Les configurations sensibles (tokens) vont dans des fichiers .example ou des variables d'environnement
- ✅ Utiliser `update-vibe-skills.sh` pour déployer les skills vers `~/.vibe/skills/`

## 📝 Contexte
Ce projet évolue d'une collection de skills vers une infrastructure complète avec plusieurs outils (Vikunja, BookStack, Directus, Forgejo). Pour maintenir la clarté et la maintenabilité, la séparation infrastructure/code doit être respectée.
