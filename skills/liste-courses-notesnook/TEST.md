# Test du Skill Liste de Courses Notesnook

## Test manuel avec curl

Avant de tester avec Vibe, vérifiez que votre configuration fonctionne avec curl.

### 1. Tester l'ajout d'un élément

Remplacez les valeurs entre guillemets :

```bash
curl -X POST https://inbox.notesnook.com/ \
  -H "Authorization: Bearer VOTRE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "content": {
      "data": "<p>- [ ] test carottes</p>",
      "type": "html"
    },
    "note_id": "VOTRE_NOTE_ID"
  }'
```

**Résultat attendu** : HTTP 200 ou 201, et la note doit contenir "- [ ] test carottes"

---

### 2. Tester la lecture de la note

```bash
curl -X GET https://api.notesnook.com/api/v1/notes/VOTRE_NOTE_ID \
  -H "Authorization: Bearer VOTRE_API_KEY"
```

**Résultat attendu** : Le contenu HTML de votre note

---

### 3. Tester la mise à jour de la note

```bash
curl -X PUT https://api.notesnook.com/api/v1/notes/VOTRE_NOTE_ID/content \
  -H "Authorization: Bearer VOTRE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "content": {
      "data": "<p><strong>Liste de courses</strong></p><p>- [ ] lait</p><p>- [ ] pain</p>",
      "type": "html"
    }
  }'
```

**Résultat attendu** : HTTP 200, et la note doit être mise à jour

---

## Test avec Vibe

Une fois que les tests curl fonctionnent :

1. **Rechargez le skill** :
   ```
   /reload
   ```

2. **Essayez les commandes** :
   - "ajoute des carottes à ma liste de courses"
   - "montre moi ma liste de courses"
   - "j'ai acheté le lait"
   - "retirer les œufs de ma liste"
   - "vide ma liste de courses"

---

## Dépannage

### Erreur 401 Unauthorized
- **Cause** : API Key invalide
- **Solution** : Vérifiez que votre API key est correcte et n'a pas expiré
- **Où la trouver** : Notesnook → Settings → Inbox → View API Keys

### Erreur 404 Not Found
- **Cause** : Note ID invalide
- **Solution** : Vérifiez que l'ID de la note est correct
- **Où le trouver** : Dans l'URL de la note : `https://app.notesnook.com/note/ID_ICI`

### Erreur 400 Bad Request
- **Cause** : Format du payload incorrect
- **Solution** : Le content doit être du HTML valide avec `type: "html"`

### Le skill ne charge pas
- **Solution** : Vérifiez que le dossier `liste-courses-notesnook` existe dans `~/.vibe/skills/`
- Exécutez `/reload` dans Vibe
- Vérifiez que `web_fetch` a la permission `"always"` ou `"ask"` dans `~/.vibe/config.toml`

### L'API demande une confirmation à chaque appel
- **Solution** : Dans `~/.vibe/config.toml`, changez :
  ```toml
  [tools.web_fetch]
  permission = "always"  # au lieu de "ask"
  ```
  Ou ajoutez l'URL à l'allowlist :
  ```toml
  [tools.web_fetch]
  allowlist = ["https://inbox.notesnook.com/", "https://api.notesnook.com"]
  ```
