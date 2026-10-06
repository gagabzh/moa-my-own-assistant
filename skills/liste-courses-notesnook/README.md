# Liste de Courses — Notesnook

Un skill pour Vibe qui permet de gérer votre liste de courses stockée dans Notesnook.

## Fonctionnalités

- ✅ Ajouter des éléments : "ajoute des carottes à ma liste de courses"
- ✅ Retirer des éléments : "retirer le lait de ma liste"
- ✅ Marquer comme acheté : "j'ai acheté les œufs"
- ✅ Consulter la liste : "montre moi ma liste de courses"
- ✅ Vider la liste : "vide ma liste de courses"

## Prérequis

1. **Compte Notesnook** avec l'API Inbox activée
2. **Token d'API** Notesnook
3. **ID de la note** qui contiendra votre liste de courses

## Configuration

### Étape 1 : Obtenir votre Token API Notesnook

1. Allez dans [Notesnook](https://app.notesnook.com/) → Paramètres → API
2. Activez l'Inbox API
3. Générez un token d'API et copiez-le

### Étape 2 : Créer une note pour la liste de courses

1. Créez une nouvelle note dans Notesnook
2. Donnez-lui un titre comme "Liste de courses"
3. Notez l'ID de la note dans l'URL :
   ```
   https://app.notesnook.com/note/ID_DE_LA_NOTE
   ```
   (L'ID est la partie après `/note/`)

### Étape 3 : Configurer le Skill

Vous avez **trois options** pour configurer vos identifiants :

#### Option A : Variables d'environnement (recommandé)

Ajoutez à votre `~/.bashrc`, `~/.zshrc`, ou `~/.profile` :

```bash
export NOTESNOOK_API_KEY="votre_token_api"
export NOTESNOOK_NOTE_ID="votre_note_id"
```

Puis rechargez :
```bash
source ~/.bashrc  # ou ~/.zshrc
```

#### Option B : Fichier de configuration utilisateur

Créez le fichier `~/.notesnook-config.json` :

```bash
cat > ~/.notesnook-config.json << EOF
{
  "api_key": "votre_token_api",
  "note_id": "votre_note_id"
}
EOF
chmod 600 ~/.notesnook-config.json
```

#### Option C : Fichier de configuration local

Modifiez le fichier `config.json` dans ce dossier :

```json
{
  "api_key": "votre_token_api",
  "note_id": "votre_note_id"
}
```

### Étape 4 : Vérifier la configuration

Testez manuellement l'API avec curl :

```bash
# Ajouter un test
curl -X POST https://api.notesnook.com/api/v1/inbox \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "- [ ] test", "note_id": "VOTRE_NOTE_ID"}'

# Vérifier que ça a marché
curl -X GET https://api.notesnook.com/api/v1/notes/VOTRE_NOTE_ID \
  -H "Authorization: Bearer VOTRE_TOKEN"
```

### Étape 5 : Activer le skill

1. Rechargez Vibe avec `/reload` ou redémarrez-le
2. Le skill sera automatiquement chargé

## Utilisation

### Ajouter des éléments

| Commande | Résultat |
|----------|----------|
| "ajoute des carottes à ma liste" | Ajoute "- [ ] carottes" |
| "ajoute 2 kg de pommes" | Ajoute "- [ ] 2 kg pommes" |
| "mets du lait dans ma liste" | Ajoute "- [ ] lait" |
| "je veux du pain" | Ajoute "- [ ] pain" |
| "ajouter 500g de farine" | Ajoute "- [ ] 500g farine" |

### Retirer des éléments

| Commande | Résultat |
|----------|----------|
| "retirer les carottes de ma liste" | Supprime "carottes" |
| "enlève le lait" | Supprime "lait" |
| "supprime les œufs" | Supprime "œufs" |

### Marquer comme acheté

| Commande | Résultat |
|----------|----------|
| "marque les carottes comme achetées" | Coche "- [x] carottes" |
| "j'ai acheté le lait" | Coche "- [x] lait" |
| "coche les œufs" | Coche "- [x] œufs" |

### Consulter la liste

| Commande | Résultat |
|----------|----------|
| "montre moi ma liste de courses" | Affiche tous les éléments |
| "afficher la liste" | Affiche tous les éléments |
| "quelle est ma liste de courses" | Affiche tous les éléments |

### Vider la liste

| Commande | Résultat |
|----------|----------|
| "vide ma liste de courses" | Supprime tous les éléments |
| "efface tout de la liste" | Supprime tous les éléments |
| "remettre à zéro la liste" | Supprime tous les éléments |

## Dépannage

### L'API retourne une erreur 401
**Problème** : Token d'API invalide ou expiré.
**Solution** : 
1. Vérifiez que votre token est correct
2. Régénérez un nouveau token dans Notesnook
3. Vérifiez que l'Inbox API est bien activée

### L'API retourne une erreur 404
**Problème** : Note non trouvée.
**Solution** : Vérifiez que l'ID de la note est correct.

### La liste ne se met pas à jour
**Problème** : Problème de synchronisation.
**Solution** : 
1. Vérifiez que la note existe dans Notesnook
2. Essayez de rafraîchir manuellement dans Notesnook
3. Vérifiez que vous utilisez bien la même note

### Le skill ne répond pas
**Problème** : Le skill n'est pas chargé ou erreur de configuration.
**Solution** : 
1. Vérifiez que le dossier `liste-courses-notesnook` existe dans `~/.vibe/skills/`
2. Vérifiez que le fichier `SKILL.md` est valide
3. Exécutez `/reload` dans Vibe
4. Vérifiez que `web_fetch` est autorisé dans votre configuration

## Personnalisation

### Changer le format des éléments

Modifiez la fonction `addToShoppingList` dans `utils.ts` pour changer le format des lignes ajoutées.

Par défaut : `- [ ] nom_de_l_element`

### Ajouter des catégories

Vous pouvez modifier le skill pour organiser les éléments par catégorie (fruits/légumes, épicerie, etc.) en ajoutant des tags ou en utilisant plusieurs notes.

## Contribuer

Les suggestions et améliorations sont les bienvenues ! Ouvrez une issue ou une pull request.

## Licence

Ce skill est fourni tel quel, sans garantie.
