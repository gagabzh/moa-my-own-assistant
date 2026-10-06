---
name: liste-courses-notesnook
description: |
  Load this skill when the user asks to add, remove, or update items in their shopping list stored in Notesnook via the official Inbox API. This includes commands like "ajoute des carottes à ma liste de courses", "retirer le lait de ma liste", "marque les œufs comme achetés", etc.
user-invocable: true
allowed-tools: web_fetch read_file
---

# Liste de courses — Notesnook Integration

Gère la liste de courses stockée dans Notesnook via l'Inbox API. Permet d'ajouter, retirer, marquer comme acheté, et consulter les éléments de la liste.

## Prérequis

1. **API Key Notesnook** : Générée dans Notesnook → Settings → Inbox → View API Keys → + (Create new key)
2. **Configuration** : Stockez la clé API dans `config.json` de ce skill

## Configuration

### 1. Obtenir votre API Key

Dans Notesnook :
1. Allez dans **Settings** → **Inbox**
2. Cliquez sur **View API Keys**
3. Cliquez sur **+** (Create new key)
4. Donnez un nom (ex: "Vibe Skill")
5. Copiez la clé générée

### 2. Configurer le skill

Éditez le fichier `config.json` dans ce dossier :
```json
{
  "api_key": "votre_api_key_générée"
}
```

## API Notesnook Inbox (Option 1 - Cloud)

- **Endpoint** : `https://inbox.notesnook.com/`
- **Authentification** : Header `Authorization: {API_KEY}`
- **Fonctionnalité** : Crée de **nouvelles notes** dans l'inbox (ne modifie pas les notes existantes)
- **Format** : Le content **doit être en HTML** (pas de markdown)

### Exemple d'appel API pour ajouter un élément :
```typescript
POST https://inbox.notesnook.com/
Headers:
  Authorization: votre_api_key
  Content-Type: application/json
Body:
  {
    "type": "note",
    "title": "Liste de courses",
    "content": {
      "data": "<p>- [ ] des carottes</p>",
      "type": "html"
    },
    "source": "inbox",
    "version": 1
  }
```

### Exemple pour ajouter un élément avec quantité :
```typescript
POST https://inbox.notesnook.com/
Headers:
  Authorization: votre_api_key
  Content-Type: application/json
Body:
  {
    "type": "note",
    "title": "Liste de courses",
    "content": {
      "data": "<p>- [ ] 2 kg de pommes</p>",
      "type": "html"
    },
    "source": "inbox",
    "version": 1
  }
```

### Exemple pour ajouter plusieurs éléments :
```typescript
POST https://inbox.notesnook.com/
Headers:
  Authorization: votre_api_key
  Content-Type: application/json
Body:
  {
    "type": "note",
    "title": "Liste de courses",
    "content": {
      "data": "<p>- [ ] carottes</p><p>- [ ] lait</p>",
      "type": "html"
    },
    "source": "inbox",
    "version": 1
  }
```

## Fonctionnalités du Skill

### 1. Ajouter un élément
**Commandes reconnues** :
- "ajoute des carottes à ma liste de courses"
- "ajoute du lait à la liste"
- "ajouter 2 kg de pommes"
- "mets des œufs dans ma liste"
- "je veux du pain"

**Format interne** :
- Extraire le nom de l'élément (ex: "des carottes" → "carottes")
- Nettoyer les articles (le, la, les, des, du, de la)
- Gérer les quantités si spécifiées

**Action** : Crée une **nouvelle note** dans l'inbox avec l'élément. Chaque appel crée une note distincte.

### Limites de l'API Inbox

L'API Inbox ne permet **que la création de nouvelles notes**. Les fonctionnalités suivantes **ne sont pas supportées** :
- ❌ Retirer un élément d'une note existante
- ❌ Marquer un élément comme acheté
- ❌ Consulter une liste existante
- ❌ Vider une liste

Chaque appel à l'API crée une **nouvelle note distincte** dans votre inbox Notesnook.

## Implémentation Technique

### Parsing des commandes

Les fonctions de parsing sont dans `utils.ts` :
- `parseAddCommand()` - Extrait l'élément et la quantité
- `parseRemoveCommand()` - Extrait l'élément à supprimer
- `parseMarkCommand()` - Extrait l'élément à marquer comme acheté
- `parseShowCommand()` - Détecte la demande d'affichage
- `parseClearCommand()` - Détecte la demande de vidage

### Appels API (Inbox API - Option 1)

#### Ajouter un élément
```typescript
// POST à l'Inbox API - crée une NOUVELLE note à chaque appel
const response = await tools.web_fetch({
  url: 'https://inbox.notesnook.com/',
  method: 'POST',
  headers: {
    'Authorization': `${api_key}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    type: "note",
    title: "Liste de courses",
    content: {
      data: `<p>- [ ] ${item}</p>`,
      type: 'html'
    },
    source: "inbox",
    version: 1
  })
});
```

#### Important : L'Inbox API ne permet pas ces opérations

L'API Inbox est **uniquement en écriture** (création de notes). Elle ne permet pas de :
- Lire le contenu des notes existantes
- Mettre à jour ou modifier une note existante
- Supprimer une note

Chaque appel à l'API crée une **nouvelle note** dans l'inbox.
```

### Appel à l'API Notesnook

```typescript
interface NotesnookConfig {
  api_key: string;
}

async function getNotesnookConfig(): Promise<NotesnookConfig> {
  // 1. Essayer la variable d'environnement
  const apiKey = process.env.NOTESNOOK_API_KEY;
  if (apiKey) {
    return { api_key: apiKey };
  }
  
  // 2. Essayer le fichier de configuration
  try {
    const config = await tools.read_file({ path: '~/.notesnook-config.json' });
    return JSON.parse(config.content) as NotesnookConfig;
  } catch (e) {
    // 3. Demander à l'utilisateur
    throw new Error('Configuration Notesnook manquante. Veuillez configurer NOTESNOOK_API_KEY');
  }
}

async function addToShoppingList(item: string, quantity?: string) {
  const config = await getNotesnookConfig();
  const fullItem = quantity ? `${quantity} ${item}` : item;
  const line = `<p>- [ ] ${fullItem}</p>`;
  
  // Crée une NOUVELLE note dans l'inbox (ne modifie pas de note existante)
  const response = await tools.web_fetch({
    url: 'https://inbox.notesnook.com/',
    method: 'POST',
    headers: {
      'Authorization': `${config.api_key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      type: "note",
      title: "Liste de courses",
      content: {
        data: line,
        type: 'html'
      },
      source: "inbox",
      version: 1
    })
  });
  
  if (response.status !== 200 && response.status !== 201) {
    throw new Error(`Erreur API Notesnook: ${response.status} - ${JSON.stringify(response.body)}`);
  }
  
  return { success: true, item: fullItem };
}

// NOTE: Les fonctions suivantes ne sont PAS implémentées car l'API Inbox
// ne permet pas de lire, modifier ou supprimer des notes existantes.
// Chaque appel à addToShoppingList crée une NOUVELLE note dans l'inbox.

// ❌ Pas de lecture de liste existante
// ❌ Pas de modification de note existante  
// ❌ Pas de suppression de note existante
```

## Workflow principal

```typescript
async function handleShoppingListCommand(userInput: string) {
  // SEULEMENT l'ajout est supporté via l'API Inbox
  const addResult = parseAddCommand(userInput);
  if (addResult) {
    const result = await addToShoppingList(addResult.item, addResult.quantity);
    return `✓ Ajouté "${result.item}" à ta liste de courses (nouvelle note créée).`;
  }
  
  // Les autres actions (consulter, modifier, supprimer) ne sont PAS supportées
  // car l'API Inbox ne permet pas ces opérations
  return 'Seul l\'ajout d\'éléments est supporté. Chaque élément crée une nouvelle note.';
}
```

## Gestion des erreurs

- **API non disponible** : Afficher un message clair et suggérer de vérifier la connexion internet
- **Token invalide** : Demander à l'utilisateur de vérifier son token NOTESNOOK_API_KEY
- **Rate limiting** : Attendre et réessayer avec un délai exponentiel

## Exemples d'utilisation

### Ajout simple
User: "ajoute des carottes à ma liste de courses"
→ Appel API : POST https://inbox.notesnook.com/ avec `{type: "note", title: "Liste de courses", content: {data: "<p>- [ ] carottes</p>", type: "html"}, source: "inbox", version: 1}`
→ **Résultat** : Une NOUVELLE note "Liste de courses" est créée dans l'inbox avec l'élément "carottes"
→ Réponse : "✓ Ajouté "carottes" à ta liste de courses (nouvelle note créée)."

### Ajout avec quantité
User: "ajoute 2 kg de pommes"
→ Appel API : POST https://inbox.notesnook.com/ avec `{type: "note", title: "Liste de courses", content: {data: "<p>- [ ] 2 kg pommes</p>", type: "html"}, source: "inbox", version: 1}`
→ **Résultat** : Une NOUVELLE note "Liste de courses" est créée avec l'élément "2 kg pommes"
→ Réponse : "✓ Ajouté "2 kg pommes" à ta liste de courses (nouvelle note créée)."

### ⚠️ Actions non supportées
Les commandes suivantes **ne fonctionnent PAS** avec l'API Inbox :
- "marque les carottes comme achetées" → ❌ Non supporté
- "retirer le lait" → ❌ Non supporté  
- "montre moi ma liste" → ❌ Non supporté
- "vide ma liste" → ❌ Non supporté

## Notes de mise en œuvre

1. **Variables d'environnement** : Le skill utilise `process.env.NOTESNOOK_API_KEY`. Configurez cette variable dans `~/.vibe/env` ou via le système.

2. **Permissions** : Le skill nécessite l'accès à `web_fetch` pour appeler l'API Notesnook. Vérifiez que `web_fetch` est dans les `allowed-tools`.

3. **Fichier de configuration** : Le fichier `~/.notesnook-config.json` doit contenir uniquement la clé API. Vérifiez les permissions.

4. **Test de l'API** : Testez manuellement avec curl :
```bash
curl -X POST https://inbox.notesnook.com/ \
  -H "Authorization: VOTRE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type": "note", "title": "Liste de courses", "content": {"data": "<p>- [ ] test</p>", "type": "html"}, "source": "inbox", "version": 1}'
```

5. **Journalisation** : Pour le débogage, activer les logs détaillés dans la configuration Vibe.

## Limites et améliorations possibles

### Limites actuelles (due à l'API Inbox) :
- Chaque élément crée une **nouvelle note** (pas de regroupement dans une seule note)
- Impossible de modifier/supprimer des notes existantes
- Impossible de consulter les notes existantes

### Solutions alternatives :
- Utiliser une **seule note dédiée** et mettre à jour son contenu manuellement via l'application Notesnook
- Utiliser l'**API principale** (si accessible) pour gérer une note unique
- Intégrer avec le skill menu-semaine pour générer des listes cohérentes
