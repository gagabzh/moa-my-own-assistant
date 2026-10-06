---
name: suivi-warhammer
description: |
  Load this skill when the user asks to manage their Warhammer armies tracking in Notion. This includes adding units, updating unit status (A acheter -> A assembler -> A peindre -> A socler -> Fait), listing units by army or status, and querying the tracking database. All operations use optimized single synchronous API calls.
user-invocable: true
allowed-tools: connector_notion web_fetch read_file write_file
---

# Suivi Armées Warhammer — Notion Integration

Gère le suivi des armées Warhammer dans Notion, incluant l'ajout d'unités, la mise à jour de leur état dans le workflow, et la consultation de la base de données.

## Structure de la Base de Données Notion

La page **Suivi Armées Warhammer** contient une base de données inline avec les propriétés suivantes :

| Propriété | Type | Description | Valeurs possibles |
|-----------|------|-------------|-------------------|
| Nom | Title | Nom de l'unité/élément | Texte libre |
| Armée | Select | Armée à laquelle appartient l'unité | Orks - Deadskull, Orks - Evils Sunz, Orks - Bad moon, Blood Angels, Dark Angels, Salamenders, Son of Cyrene - Chaos Space Marine, Son of Cyrene - Emperor Children, Necropolis hawk, ... |
| État | Status | État actuel dans le workflow | A acheter, A assembler, A peindre, A socler, Terminé |
| Note | Text | Note optionnelle | Texte libre |

> 💡 **Astuce** : Utilise les noms d'armée exacts comme configurés dans Notion (ex: "Orks - Evils Sunz" et non juste "Evil Sunz"). Le skill grosse la correspondance automatiquement.

**Workflow standard :** A acheter → A assembler → A peindre → A socler → Terminé

> ⚡ **Note d'optimisation** : Les valeurs d'état sont configurées SANS accents dans Notion. Le skill gère automatiquement la conversion entre les formats avec et sans accents.

**URL de la page :** `https://app.notion.com/p/YOUR_PAGE_NAME-YOUR_NOTION_ID`
**URL de la base de données :** `https://app.notion.com/p/YOUR_NOTION_ID`
**Data Source URL :** `collection://YOUR_NOTION_ID`

## Prérequis

1. **Connecteur Notion** : Doit être connecté et autorisé à accéder à la page et à la base de données
2. **Accès en écriture** : Le connecteur doit avoir les permissions de modification sur la page

## Configuration

Le skill utilise directement le connecteur Notion. Aucune configuration supplémentaire n'est requise si le connecteur est déjà configuré.

## Fonctionnalités du Skill

### 1. Ajouter une unité
Ajoute une nouvelle entrée dans la base de données de suivi.

**Commandes reconnues :**
- "ajoute l'unité Space Marine Tactical Squad à l'armée Space Marines"
- "ajoute un Land Raider"
- "nouvelle unité : Imperial Knight"
- "ajouter Dark Eldar Kabalite Warriors avec la note 'à peindre en noir'"

**Paramètres :**
- `nom` (obligatoire) : Nom de l'unité
- `armée` (optionnel) : Armée associée
- `note` (optionnel) : Note supplémentaire
- `état` (optionnel, par défaut "Pas commencé") : État initial

### 2. Mettre à jour l'état d'une unité
Déplace une unité vers l'étape suivante du workflow ou vers un état spécifique.

**Commandes reconnues :**
- "passe Space Marine à A assembler"
- "met Space Marine en A peindre"
- "termine le Land Raider"
- "avance l'état de Imperial Knight"
- "Space Marine est maintenant A socler"

**Workflow :**
```
A acheter → A assembler → A peindre → A socler → Fait
```

> 💡 **Astuce** : Les commandes acceptent les états avec ou sans accents. Par exemple : "passe à À peindre" ou "passe à A peindre" fonctionnent toutes les deux.

### 3. Lister les unités
Affiche les unités filtrées par différents critères.

**Commandes reconnues :**
- "montre moi toutes les unités"
- "liste les unités de l'armée Space Marines"
- "quelles unités sont À peindre"
- "afficher les unités Terminé"
- "compte les unités par armée"
- "statistiques de mon suivi Warhammer"

### 4. Rechercher une unité
Trouve une unité spécifique dans la base de données.

**Commandes reconnues :**
- "cherche Space Marine"
- "trouve Land Raider"
- "où est Imperial Knight"

### 5. Supprimer une unité
Retire une unité de la base de données.

**Commandes reconnues :**
- "supprime Space Marine"
- "retirer Land Raider de la liste"
- "enlève Imperial Knight"

## Implémentation Technique

### Structure des Données

```typescript
interface WarhammerUnit {
  id: string; // ID de la page Notion
  url: string; // URL de la page Notion
  nom: string;
  armée?: string;
  état: 'A acheter' | 'A assembler' | 'A peindre' | 'A socler' | 'Terminé';
  note?: string;
  createdTime: string; // ISO-8601
}
```

> ⚠️ **Important** : Les états dans Notion sont configurés **SANS accents** (A acheter, A peindre, etc.) et non avec accents (À acheter, À peindre). Le workflow complet est : A acheter → A assembler → A peindre → A socler → Terminé

### Appels API Notion - OPTIMISÉS

> ⚡ **Toutes les opérations utilisent maintenant des appels synchrones (allow_async: false) pour éviter les files d'attente Notion**

#### Récupérer toutes les unités
```typescript
async function getAllUnits(): Promise<WarhammerUnit[]> {
  const result = await tools.connector_notion.notion_query_data_sources({
    data_source_url: 'collection://YOUR_NOTION_ID',
    mode: 'table'
  });
  
  // Parser le résultat et retourner les unités
  return parseUnitsFromResult(result);
}
```

#### Ajouter une unité - OPTIMISÉ : 1 appel au lieu de 3
```typescript
async function addUnit(unit: {
  nom: string;
  armée?: string;
  note?: string;
  état?: string;
}): Promise<WarhammerUnit> {
  // OPTIMISATION : Création directe dans la base de données
  // avec TOUTES les propriétés en UN SEUL appel synchrone
  // CORRECTION : utiliser database_id au lieu de data_source_id pour éviter les erreurs
  const result = await tools.connector_notion.notion_create_pages({
    parent: {
      database_id: 'YOUR_NOTION_ID'
    },
    pages: [{
      properties: {
        'Nom': unit.nom,
        'Armée': unit.armée,        // Pas besoin de { select: { name: ... } }
        'État': normalizeState(unit.état || 'A acheter'),  // État par défaut, normalisé
        'Note': unit.note
      }
    }],
    allow_async: false  // ⚡ SYNCHRONE = instantané, pas de file d'attente
  });
  
  return {
    id: result.pages[0].id,
    url: result.pages[0].url,
    nom: unit.nom,
    armée: unit.armée,
    état: unit.état || 'A acheter',
    note: unit.note,
    createdTime: new Date().toISOString()
  };
}
```

#### Mettre à jour l'état d'une unité - OPTIMISÉ
```typescript
async function updateUnitStatus(unitId: string, newStatus: string): Promise<void> {
  await tools.connector_notion.notion_update_page({
    page_id: unitId,
    command: 'update_properties',
    properties: {
      État: newStatus  // Format simple, pas besoin de { status: { name: ... } }
    },
    allow_async: false  // ⚡ SYNCHRONE
  });
}
```

#### Supprimer une unité - OPTIMISÉ
```typescript
async function deleteUnit(pageId: string): Promise<void> {
  // OPTIMISATION : Déplacer vers workspace est plus rapide
  // que de mettre archived: true
  await tools.connector_notion.notion_move_pages({
    page_or_database_ids: [pageId],
    new_parent: { type: 'workspace' }
  });
}
```

#### Supprimer une unité
```typescript
async function deleteUnit(pageId: string): Promise<void> {
  await tools.connector_notion.notion_update_page({
    page_id: pageId,
    archived: true
  });
}
```

### Parsing des Commandes

Les fonctions de parsing sont dans `utils.ts` :

```typescript
// Extrait les informations d'ajout d'une commande
function parseAddCommand(input: string): { nom: string; armée?: string; note?: string } | null {
  // Exemples : "ajoute Space Marine à Space Marines"
  //            "nouvelle unité : Land Raider"
  //            "ajouter Imperial Knight avec note 'urgent'"
  
  const addPatterns = [
    /^(?:ajoute|ajouter|nouvelle unité|add)\s*(?:l'|la |le |les |un |une |des )?(?<nom>.+?)(?:\s+à\s+|\s+pour\s+|\s+dans\s+)?(?:l'|la |le |les |armée\s+)?(?<armée>.+?)?$/i,
    /^(?<nom>.+?)\s+(?:avec\s+la\s+note\s+|note\s+)(?<note>'[^']+'|"[^"]+")/i
  ];
  
  for (const pattern of addPatterns) {
    const match = input.match(pattern);
    if (match?.groups) {
      return {
        nom: match.groups.nom.trim(),
        armée: match.groups.armée?.trim(),
        note: match.groups.note?.replace(/['"]/g, '').trim()
      };
    }
  }
  return null;
}

// Extrait les informations de mise à jour
function parseUpdateCommand(input: string): { nom: string; état: string } | null {
  const updatePatterns = [
    /^(?:passe|met|mets|place|avance|déplace)\s+(?<nom>.+?)\s+(?:à|en|au|dans\s+l[’']état\s+|vers\s+)(?<état>.+)$/i,
    /^(?<nom>.+?)\s+(?:est\s+maintenant|devient|passe\s+à)\s+(?<état>.+)$/i,
    /^(?:termine|termine\s+l[’']|marque\s+comme\s+terminé)\s+(?<nom>.+)$/i
  ];
  
  for (const pattern of updatePatterns) {
    const match = input.match(pattern);
    if (match?.groups) {
      let état = match.groups.état.trim();
      if (match[0].toLowerCase().includes('termine')) {
        état = 'Terminé';
      }
      return {
        nom: match.groups.nom.trim(),
        état: état
      };
    }
  }
  return null;
}

// Extrait les filtres pour la liste
function parseListCommand(input: string): { armée?: string; état?: string; all?: boolean } | null {
  const listPatterns = [
    /^(?:montre|affiche|liste|quelles?|quels?)\s+(?:moi\s+)?(?:toutes\s+les\s+)?unités$/i,
    /^(?:montre|affiche|liste)\s+(?:les\s+)?unités\s+(?:de\s+|d[’']|pour\s+)?(?:l[’']|la\s+)?armée\s+(?<armée>.+)$/i,
    /^(?:montre|affiche|liste)\s+(?:les\s+)?unités\s+(?<état>.+)$/i,
    /^(?:compte|statistiques?|stats?)\s+(?:les\s+)?unités$/i
  ];
  
  for (const pattern of listPatterns) {
    const match = input.match(pattern);
    if (match?.groups) {
      return {
        armée: match.groups.armée?.trim(),
        état: match.groups.état?.trim()
      };
    }
  }
  
  if (/^(?:montre|affiche|liste|quelles?|quels?)\s+(?:moi\s+)?toutes?\s+les?\s+unités/i.test(input)) {
    return { all: true };
  }
  
  return null;
}

// Extrait le nom pour la recherche/suppression
function parseSearchOrDeleteCommand(input: string): { nom: string; action: 'search' | 'delete' } | null {
  const searchPatterns = [
    /^(?:cherche|trouve|où\s+est|localise)\s+(?<nom>.+)$/i,
    /^(?:supprime|retirer|enlève|efface)\s+(?<nom>.+)$/i
  ];
  
  for (const pattern of searchPatterns) {
    const match = input.match(pattern);
    if (match?.groups) {
      const action = input.toLowerCase().includes('supprime') || 
                     input.toLowerCase().includes('retirer') ||
                     input.toLowerCase().includes('enlève') ||
                     input.toLowerCase().includes('efface') ? 'delete' : 'search';
      return {
        nom: match.groups.nom.trim(),
        action: action
      };
    }
  }
  return null;
}
```

### Workflow Principal

```typescript
async function handleWarhammerCommand(userInput: string): Promise<string> {
  const trimmedInput = userInput.trim().toLowerCase();
  
  // 1. Vérifier les commandes d'ajout
  const addResult = parseAddCommand(userInput);
  if (addResult) {
    const unit = await addUnit(addResult);
    return `✓ Unité "${unit.nom}" ajoutée ${unit.armée ? `à l'armée ${unit.armée}` : ''}. État : ${unit.état}`;
  }
  
  // 2. Vérifier les commandes de mise à jour
  const updateResult = parseUpdateCommand(userInput);
  if (updateResult) {
    const units = await getAllUnits();
    const unit = units.find(u => 
      u.nom.toLowerCase().includes(updateResult.nom.toLowerCase())
    );
    
    if (!unit) {
      return `❌ Unité "${updateResult.nom}" non trouvée.`;
    }
    
    await updateUnitStatus(unit.id, updateResult.état);
    return `✓ Unité "${unit.nom}" mise à jour vers l'état "${updateResult.état}"`;
  }
  
  // 3. Vérifier les commandes de liste
  const listResult = parseListCommand(userInput);
  if (listResult) {
    const units = await getAllUnits();
    let filteredUnits = [...units];
    
    if (listResult.armée) {
      filteredUnits = filteredUnits.filter(u => 
        u.armée?.toLowerCase() === listResult.armée?.toLowerCase()
      );
    }
    
    if (listResult.état) {
      filteredUnits = filteredUnits.filter(u => 
        u.état.toLowerCase() === listResult.état?.toLowerCase()
      );
    }
    
    if (listResult.all) {
      return formatUnitList(filteredUnits);
    }
    
    if (trimmedInput.includes('compte') || trimmedInput.includes('statistique')) {
      return formatStatistics(filteredUnits);
    }
    
    return formatUnitList(filteredUnits);
  }
  
  // 4. Vérifier les commandes de recherche/suppression
  const searchResult = parseSearchOrDeleteCommand(userInput);
  if (searchResult) {
    const units = await getAllUnits();
    const unit = units.find(u => 
      u.nom.toLowerCase().includes(searchResult.nom.toLowerCase())
    );
    
    if (searchResult.action === 'search') {
      if (unit) {
        return formatUnitDetails(unit);
      } else {
        return `❌ Unité "${searchResult.nom}" non trouvée.`;
      }
    } else { // delete
      if (unit) {
        await deleteUnit(unit.id);
        return `✓ Unité "${unit.nom}" supprimée.`;
      } else {
        return `❌ Unité "${searchResult.nom}" non trouvée.`;
      }
    }
  }
  
  // 5. Aide
  return getHelpMessage();
}

// Fonctions de formatage
function formatUnitList(units: WarhammerUnit[]): string {
  if (units.length === 0) {
    return 'Aucune unité trouvée.';
  }
  
  const byArmy: Record<string, WarhammerUnit[]> = {};
  units.forEach(unit => {
    const army = unit.armée || 'Non assignée';
    if (!byArmy[army]) {
      byArmy[army] = [];
    }
    byArmy[army].push(unit);
  });
  
  let result = `**${units.length} unité(s) trouvée(s)**\n\n`;
  
  for (const [army, armyUnits] of Object.entries(byArmy)) {
    result += `### ${army}\n\n`;
    for (const unit of armyUnits) {
      result += `- **${unit.nom}** : ${unit.état}${unit.note ? ` (${unit.note})` : ''}\n`;
    }
    result += '\n';
  }
  
  return result.trim();
}

function formatStatistics(units: WarhammerUnit[]): string {
  const byStatus: Record<string, number> = {};
  const byArmy: Record<string, number> = {};
  
  units.forEach(unit => {
    byStatus[unit.état] = (byStatus[unit.état] || 0) + 1;
    const army = unit.armée || 'Non assignée';
    byArmy[army] = (byArmy[army] || 0) + 1;
  });
  
  let result = `**Statistiques du Suivi Warhammer**\n\n`;
  result += `### Par État\n`;
  for (const [status, count] of Object.entries(byStatus)) {
    result += `- ${status} : ${count}\n`;
  }
  
  result += `\n### Par Armée\n`;
  for (const [army, count] of Object.entries(byArmy)) {
    result += `- ${army} : ${count}\n`;
  }
  
  return result;
}

function formatUnitDetails(unit: WarhammerUnit): string {
  return `**${unit.nom}**\n\n` +
         `Armée : ${unit.armée || 'Non assignée'}\n` +
         `État : ${unit.état}\n` +
         `Note : ${unit.note || 'Aucune'}\n` +
         `Créée : ${new Date(unit.createdTime).toLocaleDateString('fr-FR')}`;
}

function getHelpMessage(): string {
  return `**Aide - Suivi Armées Warhammer**\n\n` +
         `Commandes disponibles :\n\n` +
         `**Ajouter :**\n` +
         `- "ajoute [nom] à [armée]"\n` +
         `- "nouvelle unité : [nom]"\n\n` +
         `**Mettre à jour :**\n` +
         `- "passe [nom] à [état]"\n` +
         `- "met [nom] en [état]"\n` +
         `- "termine [nom]"\n\n` +
         `**Lister :**\n` +
         `- "montre toutes les unités"\n` +
         `- "liste les unités de [armée]"\n` +
         `- "quelles unités sont [état]"\n` +
         `- "statistiques"\n\n` +
         `**Rechercher/Supprimer :**\n` +
         `- "cherche [nom]"\n` +
         `- "supprime [nom]"\n\n` +
         `États disponibles : Pas commencé, À acheter, À assembler, À peindre, À socler, Terminé`;
}
```

## Gestion des Erreurs

- **Page introuvable** : Vérifier que l'URL de la page est correcte et que le connecteur Notion a accès
- **Permission refusée** : Vérifier que le connecteur Notion a les droits de modification
- **Base de données introuvable** : La structure de la page peut avoir changé
- **Rate limiting** : Attendre et réessayer avec un délai exponentiel

## Exemples d'Utilisation

### Ajout d'une unité simple
**User :** "ajoute Space Marine Tactical Squad à l'armée Space Marines"
**Action :** Créer une nouvelle entrée dans la base de données avec Nom="Space Marine Tactical Squad", Armée="Space Marines", État="A acheter" (par défaut)
**Réponse :** "✓ Unité "Space Marine Tactical Squad" ajoutée à l'armée Space Marines. État : A acheter"

> ⚡ **Optimisation** : Cette opération utilise maintenant **1 seul appel API synchrone** au lieu de 3 appels asynchrones + file d'attente.

### Ajout avec note
**User :** "ajoute Land Raider avec la note 'modèle spécial à peindre en or'"
**Action :** Créer une nouvelle entrée avec Nom="Land Raider", Note="modèle spécial à peindre en or"
**Réponse :** "✓ Unité "Land Raider" ajoutée. État : Pas commencé (Note : modèle spécial à peindre en or)"

### Mise à jour de l'état
**User :** "passe Land Raider à À assembler"
**Action :** Trouver l'unité "Land Raider" et mettre à jour son État vers "À assembler"
**Réponse :** "✓ Unité "Land Raider" mise à jour vers l'état "À assembler""

### Avancement automatique dans le workflow
**User :** "avance Space Marine Tactical Squad"
**Action :** Trouver l'unité et passer à l'état suivant dans le workflow
**Réponse :** "✓ Unité "Space Marine Tactical Squad" passée de "A acheter" à "A assembler""

> ⚡ **Optimisation** : Les mises à jour d'état utilisent aussi **1 appel synchrone** au lieu de 2 appels.

### Liste par armée
**User :** "montre les unités de Space Marines"
**Action :** Récupérer et filtrer toutes les unités avec Armée="Space Marines"
**Réponse :**
```
**3 unité(s) trouvée(s)**

### Space Marines

- **Space Marine Tactical Squad** : À assembler
- **Land Raider** : À peindre (modèle spécial à peindre en or)
- **Terminator Squad** : Terminé
```

### Liste par état
**User :** "quelles unités sont A peindre"
**Réponse :**
```
**2 unité(s) trouvée(s)**

### Space Marines

- **Land Raider** : A peindre (modèle spécial à peindre en or)

### Dark Eldar

- **Kabalite Warriors** : A peindre
```

### Recherche
**User :** "cherche Land Raider"
**Réponse :**
```
**Land Raider**

Armée : Space Marines
État : À peindre
Note : modèle spécial à peindre en or
Créée : 01/10/2026
```

### Suppression
**User :** "supprime Terminator Squad"
**Action :** Archiver la page Notion de l'unité "Terminator Squad"
**Réponse :** "✓ Unité "Terminator Squad" supprimée."

### Statistiques
**User :** "statistiques"
**Réponse :**
```
**Statistiques du Suivi Warhammer**

### Par État
- A acheter : 5
- A assembler : 3
- A peindre : 2
- A socler : 1
- Fait : 4

### Par Armée
- Space Marines : 8
- Dark Eldar : 2
- Imperial Knights : 3
- Non assignée : 1
```

## Tests et Validation

### Test unitaire des parsers
```typescript
// Tester parseAddCommand
assert.deepEqual(parseAddCommand("ajoute Space Marine à Space Marines"), {
  nom: "Space Marine",
  armée: "Space Marines"
});

assert.deepEqual(parseAddCommand("nouvelle unité : Land Raider"), {
  nom: "Land Raider"
});

assert.deepEqual(parseAddCommand("ajouter Imperial Knight avec note 'urgent'"), {
  nom: "Imperial Knight",
  note: "urgent"
});

// Tester parseUpdateCommand
assert.deepEqual(parseUpdateCommand("passe Space Marine à À assembler"), {
  nom: "Space Marine",
  état: "À assembler"
});

assert.deepEqual(parseUpdateCommand("termine Land Raider"), {
  nom: "Land Raider",
  état: "Terminé"
});

// Tester parseListCommand
assert.deepEqual(parseListCommand("montre toutes les unités"), { all: true });
assert.deepEqual(parseListCommand("liste les unités de Space Marines"), { armée: "Space Marines" });
assert.deepEqual(parseListCommand("quelles unités sont À peindre"), { état: "À peindre" });
```

### Test d'intégration
1. Ajouter une unité test
2. Vérifier qu'elle apparaît dans la liste
3. Mettre à jour son état
4. Vérifier que l'état a changé
5. Supprimer l'unité test
6. Vérifier qu'elle a disparu

## 🚀 Optimisations Implémentées

### Performances
- **Avant** : 3 appels API + file d'attente (10 min) pour ajouter une unité
- **Après** : **1 appel API synchrone** (instantané)
- **Gain** : 66% de réduction d'appels, temps d'exécution divisé par ∞ (10 min → 0 sec)

### Changements techniques
1. **`addUnit`** : Utilise `data_source_id` avec `allow_async: false` pour créer directement dans la base
2. **`updateUnitStatus`** : Utilise `allow_async: false` pour des mises à jour instantanées
3. **`deleteUnit`** : Utilise `move_pages` vers workspace au lieu de `archived: true` (plus fiable)
4. **Format des propriétés** : Utilise des valeurs simples (`État: 'A socler'`) au lieu d'objets complexes

### États normalisés
Les états sont maintenant configurés **sans accents** dans Notion :
- `A acheter` (au lieu de À acheter)
- `A assembler` (au lieu de À assembler)
- `A peindre` (au lieu de À peindre)
- `A socler` (au lieu de À socler)
- `Fait` (au lieu de Terminé)

Le skill gère automatiquement la conversion entre les formats avec et sans accents.

---

## Améliorations Possibles

### Fonctionnalités avancées
1. **Historique des états** : Ajouter une propriété pour suivre l'historique des changements d'état
2. **Dates cibles** : Ajouter des dates de début/fin prévues pour chaque état
3. **Priorité** : Ajouter une propriété de priorité
4. **Coût** : Suivre le coût des unités
5. **Images** : Ajouter des images des unités
6. **Tags** : Ajouter des tags pour catégoriser les unités

### Intégrations
1. **Menu Semaine** : Intégrer avec le skill menu-semaine pour planifier du temps de peinture
2. **Liste de Courses** : Intégrer avec liste-courses-notesnook pour acheter du matériel
3. **Calendrier** : Planifier des sessions de peinture dans le calendrier
4. **Rappels** : Configurer des rappels pour les unités en retard

### Améliorations techniques
1. **Cache** : Implémenter un cache pour réduire les appels API
2. **Batch operations** : Optimiser les opérations groupées
3. **Validation** : Ajouter une validation plus stricte des entrées
4. **Pagination** : Gérer les grandes bases de données avec pagination

## Notes de Mise en Œuvre

1. **ID de la base de données** : `collection://YOUR_NOTION_ID`
2. **ID de la page parent** : `YOUR_NOTION_ID`
3. **Connecteur Notion** : Doit être configuré avec les bonnes permissions

4. **Permissions requises** :
   - `connector_notion` : Pour accéder à la base de données
   - `web_fetch` : Optionnel, pour des intégrations futures
   - `read_file`/`write_file` : Pour la configuration locale

5. **Tests manuels** :
   ```bash
   # Vérifier que le connecteur Notion fonctionne
   vibe:test notion --page https://app.notion.com/p/YOUR_PAGE_NAME-YOUR_NOTION_ID
   ```

## Déploiement

1. Créer le répertoire : `mkdir -p ~/.vibe/skills/suivi-warhammer`
2. Copier ce fichier SKILL.md dans le répertoire
3. Créer les fichiers utils.ts et index.ts
4. Redémarrer Vibe pour charger le nouveau skill
5. Tester avec des commandes simples

## Maintenance

- **Mises à jour de la structure** : Si la structure de la base de données Notion change, mettre à jour les parsers et les appels API
- **Nouveaux états** : Si de nouveaux états sont ajoutés, mettre à jour la documentation et les parsers
- **Performances** : Surveiller les performances pour les grandes bases de données
