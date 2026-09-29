---
name: |
  menu-semaine
description: |
  Load this skill when the user asks for a weekly menu, meal plan, meal prep plan, food shopping list, or recipes matching their preferences. Also load it from planning-semaine when generating the meal prep & courses section of the weekly plan. Also load it when the user reports food stock usage or purchases to update their pantry database (via Notion API).
---

# Menu semaine — planificateur de repas (version Notion)

Génère le menu de la semaine (déjeuners meal prepés + dîners) et la liste de courses, **à partir des données centralisées dans Notion** (au lieu des fichiers locaux).

## Sources de données
- **Préférences** : Page Notion "Menu Semaine - Préférences" (ID: `3eaeb7da-6051-8119-85cd-ddfc3fa843b0`)
- **Stock Sec** : Base Notion "Stock nourriture sec" (à récupérer depuis la section "Stock sec" des préférences)
- **Légumes de saison** : Fichier local `references/legumes-saisons.md` (données statiques)

## Flux de travail

1. **Récupérer les préférences depuis Notion** :
   ```typescript
   const prefsPage = await tools.connector_notion.notion_fetch({
     url: "https://app.notion.com/p/3eaeb7da6051811985cdddfc3fa843b0"
   });
   // Extraire : portions, interdits, régime, temps de cuisine, saisonnalité, ID base Stock Sec
   const prefs = parsePreferences(prefsPage.content);
   ```

2. **Lire l'inventaire du stock sec depuis Notion** :
   ```typescript
   const stockDBId = prefs.stockSecBaseId; // Récupéré depuis les préférences
   const stockItems = await tools.connector_notion.notion_query_database({
     database_id: stockDBId,
     filter: {
       or: [
         { property: "DLC", date: { before: { relative: { days: 30 } } } },
         { property: "Quantité", number: { less_than: { property: "Seuil de rachat" } } }
       ]
     }
   });
   ```

3. **Lire les légumes de saison** (fichier local) :
   ```typescript
   const legumes = await tools.read_file({ path: "references/legumes-saisons.md" });
   ```

4. **Période couverte** : du SAMEDI au VENDREDI suivant (cycle de review hebdo).

5. **Déterminer le mois courant** pour choisir les légumes de saison et la logique dîner (soupes en hiver, salades composées en été).

6. **Collecter les contraintes de la semaine** si non fournies :
   - Meal prep le week-end (batch cooking) ou lundi midi (pas de batch → plats rapides) ?
   - Séances longues/intenses planifiées ? → protéine animale autorisée le soir de ces séances (si configuré dans les préférences Notion)
   - Invités/repas spéciaux, contraintes ponctuelles

7. **Générer le menu**, puis la **liste de courses** agrégée par rayon.


## Règles de génération (basées sur les préférences Notion)

- **Répétition** : chaque plat couvre 2–4 repas dans la semaine.
- **Structure d'assiette** : ¼ protéines, ¼ féculents, ½ légumes (valeurs lues dans Notion).
- **Régime par défaut** : défini dans les préférences Notion (ex. végétarien). Protéines végétales : légumineuses, tofu, tempeh, œufs, fromage, soja.
- **Protéine animale** : seulement selon la règle configurée dans Notion (ex. repas suivant une séance longue ou intense). Jamais par défaut.
- **Légumes de saison uniquement** — utiliser `references/legumes-saisons.md` selon le mois.
- **Interdits absolus** : liste définie dans les préférences Notion. Vérifier chaque recette.
- **Plats complets récurrents** : quiche de légumes, curry de lentilles, gratins, salades composées, chili, soupes-repas. 2–3 plats distincts par semaine maximum.
- **Temps de cuisine** : valeurs lues dans Notion (ex. batch 1–2 h le week-end ; 15–30 min max par dîner en semaine).
- **Dîners selon saison** : hiver → soupes-repas ; été → salades composées ; intersaisons → libre.
- **Objectif santé** : défini dans Notion (ex. déficit léger, cible de poids). Ne jamais proposer de régime crash.


## Stock sec (via Notion API)

- **DLC proches** : lister les articles dont la DLC expire dans les 30 jours. Proposer en priorité des recettes qui les utilisent, si compatibles avec les préférences. Ne jamais sacrifier une règle pour écouler une DLC.
- **Pas de rachat inutile** : pour chaque ingrédient sec du menu, si le stock couvre le besoin de la semaine, ne PAS l'ajouter à la liste de courses.
- **Rachat sous seuil** : ajouter automatiquement à la liste de courses tout article passé sous son seuil de rachat, avec la mention « sous le seuil ».
- **Quantités** : déduire approximativement les quantités consommées et les mentionner dans les notes.


## Mises à jour du stock (via Notion API)

Quand l'utilisateur signale une consommation ou un achat (ex. « j'ai utilisé 100 g de farine ») :
1. Chercher l'article dans la base Notion via `tools.connector_notion.notion_query_database`.
2. Mettre à jour la Quantité (déduction ou ajout, en respectant l'Unité).
3. Signaler si la nouvelle Quantité passe sous le Seuil de rachat (« ⚠️ sous le seuil, à racheter »).
4. Si l'article n'existe pas, le créer via `tools.connector_notion.notion_create_pages` et demander le seuil de rachat.
- N'alerter sur les DLC **que** lors de la génération d'un menu.


## Format de sortie

### 1. Menu de la semaine
Tableau : Jour | Déjeuner | Dîner — du samedi au vendredi suivant. Indiquer pour chaque plat : nom, portion, et le marquer « batch » ou « express ».

### 2. Plan de batch cooking
Si meal prep week-end : liste des recettes avec ordre de préparation et temps estimé total.

### 3. Liste de courses
Agrégée par rayon (fruits & légumes, épicerie, frais, surgelés), quantités selon le nombre de portions configuré dans Notion.

### 4. Notes
1–2 lignes : correspondance séances sportives ↔ protéines, astuces de conservation, congélation.

### 5. Stock & DLC
Section « ⚠️ Stock & DLC » : articles à DLC proche utilisés en priorité, articles sous le seuil, estimation des quantités de stock sec consommées.


## Fonctions utilitaires (à intégrer dans les blocs run_typescript)

```typescript
// Parse les préférences depuis le contenu Notion
function parsePreferences(content: string) {
  const lines = content.split('\n');
  const prefs: any = {};
  
  // Extraire les portions
  const portionsMatch = content.match(/Portions? par recette[ :]+(\d+)/i);
  prefs.portions = portionsMatch ? parseInt(portionsMatch[1]) : 4;
  
  // Extraire les interdits
  const interditsMatch = content.match(/## Interdits absolus[\s\S]*?-(.*?)(?=\n\n##|\n$)/);
  prefs.interdits = interditsMatch ? interditsMatch[1].split(', ').map(i => i.trim()) : [];
  
  // Extraire l'ID de la base Stock Sec
  const stockIdMatch = content.match(/Base Notion ID[ :]+([a-f0-9-]{32,})/i);
  prefs.stockSecBaseId = stockIdMatch ? stockIdMatch[1] : null;
  
  // Extraire le régime
  const regimeMatch = content.match(/Régime par défaut[ :]+(.*?)(?=\n)/i);
  prefs.regime = regimeMatch ? regimeMatch[1].trim() : 'végétarien';
  
  return prefs;
}

// Exemple d'utilisation complet
async function getMenuData() {
  const prefsPage = await tools.connector_notion.notion_fetch({
    url: "https://app.notion.com/p/3eaeb7da6051811985cdddfc3fa843b0"
  });
  
  const prefs = parsePreferences(prefsPage.content);
  const stockItems = prefs.stockSecBaseId ? await tools.connector_notion.notion_query_database({
    database_id: prefs.stockSecBaseId
  }) : { results: [] };
  
  return { prefs, stockItems };
}
```
