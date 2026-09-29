---
name: |
  planning-semaine
description: |
  Load this skill when the user asks for a weekly planning review, a specific week plan, or to plan sport sessions, hobby project sessions (e.g. painting, building), meal prep shopping or the week's menu. Also use when they give weekly constraints (competitions, absences, remote/onsite work days, weather) to generate the concrete planning of the upcoming week.
---

# Planning hebdomadaire — génération de semaine (version Notion)

## Objectif

Générer le planning concret d'une semaine **à partir des données centralisées dans Notion** (au lieu des fichiers locaux).

## Sources de données
- **Planning Type** : Page Notion "Planning Type" (ID: `3eaeb7da-6051-81a5-8e5f-c7092116b872`)

## Flux de travail

1. **Récupérer le planning type depuis Notion** :
   ```typescript
   const planningPage = await tools.connector_notion.notion_fetch({
     url: "https://app.notion.com/p/3eaeb7da605181a58e5fc7092116b872"
   });
   // Extraire : objectifs, contraintes fixes, créneaux, planning par saison
   const planningData = parsePlanningData(planningPage.content);
   ```

2. **Période couverte : du SAMEDI au VENDREDI suivant**. La review du vendredi planifie le week-end immédiat.

3. **Déterminer la saison / trimestre** à partir de la date courante pour choisir la logique sportive et de loisirs (voir « Calendrier saisonnier » dans les données Notion).

4. **Collecter les contraintes de la semaine**. Si elles n'ont pas été données, les demander (une seule fois, de façon groupée) :
   - Semaine de compétition / événement ? (date et format)
   - Week-end absent ? (→ meal prep basculé au lundi midi)
   - Jour de présentiel déplacé ? Autre créneau modifié ?
   - Météo prévue ? (mauvaise météo → remplacer la séance extérieure par l'alternative indoor configurée)
   - Invités/repas spéciaux, contraintes alimentaires ?
   - Avancement des projets de loisir (demander si inconnu).
   - Suivi santé du moment (ex. dernière pesée et tendance).

5. **Générer le planning de la semaine** au format ci-dessous.

6. **Proposer d'enregistrer l'avancement** (santé, unités terminées, jalons de projets) dans Notion si l'utilisateur l'accepte.


## Format de sortie du planning de semaine

Un tableau jour par jour avec horaires, puis 3 sections :

### 1. Planning jour par jour
Tableau : jour | matin | midi | soir | week-end (horaires spécifiques). **Commencer par le samedi et finir par le vendredi**. Chaque case contient l'activité concrète avec horaires.

### 2. Meal prep & courses
**Déléguer au skill `menu-semaine`** : charger ses préférences depuis Notion et générer menu + liste de courses selon son format. Synchroniser : les soirées qui suivent une séance longue/intense = protéine animale autorisée si configuré dans les préférences Notion ; meal prep le week-end ou lundi midi selon la présence de l'utilisateur.

### 3. Points de vigilance de la semaine
- 2–4 points max spécifiques à la semaine (imprévus de compétition, bascule de créneaux, risque sur une unité longue, etc.)


## Règles de priorité (basées sur les données Notion)

- Les créneaux marqués **intouchables** dans le planning type Notion sont intouchables.
- Semaine de compétition : réduire les loisirs de moitié, garder le meal prep, alléger la séance longue 2–3 jours avant.
- Week-end absent : meal prep le lundi midi, planif de semaine le vendredi soir.
- Les créneaux extensibles listés dans le planning type Notion peuvent s'étendre pour récupérer du retard, dans la limite définie.
- Toujours conserver la review de fin de semaine.
- Ne jamais planifier plus de créneaux que le planning type n'en contient — pas de surcharge pour « rattraper ».


## Fonctions utilitaires (à intégrer dans les blocs run_typescript)

```typescript
// Parse les données du planning depuis le contenu Notion
function parsePlanningData(content: string) {
  const data: any = {
    objectifs: [],
    contraintes: [],
    creneaux: {},
    planningParSaison: {},
    budgets: {},
    saisonnier: {},
    sante: {}
  };
  
  // Extraire les objectifs
  const objectifsMatch = content.match(/## Objectifs de l[\s\S]*?\n-(.*?)(?=\n##|\n$)/);
  if (objectifsMatch) {
    data.objectifs = objectifsMatch[1].split('\n-').map(o => o.trim()).filter(o => o);
  }
  
  // Extraire les contraintes fixes
  const contraintesMatch = content.match(/## Contraintes fixes[\s\S]*?\n-(.*?)(?=\n##|\n$)/);
  if (contraintesMatch) {
    data.contraintes = contraintesMatch[1].split('\n-').map(c => c.trim()).filter(c => c);
  }
  
  // Extraire les créneaux disponibles
  const creneauxMatch = content.match(/## Creneaux disponibles[\s\S]*?\n(.*?)(?=\n##|\n$)/);
  if (creneauxMatch) {
    const creneauxText = creneauxMatch[1];
    // Parse each line to extract day/time info
    creneauxText.split('\n').forEach(line => {
      if (line.trim() && line.includes(':')) {
        const [key, value] = line.split(':').map(s => s.trim());
        data.creneaux[key] = value;
      }
    });
  }
  
  // Extraire le planning par saison (tableaux)
  const saisonMatch = content.match(/## Semaine type[\s\S]*?\n\|(.*?)(?=\n##|\n$)/);
  if (saisonMatch) {
    // Parse markdown table - simplified approach
    // This would need more sophisticated parsing for full table support
    data.planningParSaison = { default: "Voir tableau dans Notion" };
  }
  
  // Extraire les budgets
  const budgetsMatch = content.match(/## Budgets hebdo[\s\S]*?\n-(.*?)(?=\n##|\n$)/);
  if (budgetsMatch) {
    const budgetsText = budgetsMatch[1];
    budgetsText.split('·').forEach(b => {
      const [key, value] = b.split(':').map(s => s.trim());
      if (key && value) data.budgets[key] = value;
    });
  }
  
  // Extraire le calendrier saisonnier
  const saisonnierMatch = content.match(/## Calendrier & saisonnalite[\s\S]*?\n(.*?)(?=\n##|\n$)/);
  if (saisonnierMatch) {
    data.saisonnier = saisonnierMatch[1];
  }
  
  // Extraire la santé
  const santeMatch = content.match(/## Sante[\s\S]*?\n(.*?)(?=\n##|\n$)/);
  if (santeMatch) {
    data.sante = santeMatch[1];
  }
  
  return data;
}

// Déterminer la saison actuelle
function getCurrentSeason() {
  const month = new Date().getMonth(); // 0-11
  if (month >= 9 || month <= 1) return 'Hiver';
  if (month >= 2 && month <= 4) return 'Printemps';
  if (month >= 5 && month <= 7) return 'Ete';
  return 'Automne';
}

// Exemple d'utilisation complet
async function getPlanningData() {
  const planningPage = await tools.connector_notion.notion_fetch({
    url: "https://app.notion.com/p/3eaeb7da605181a58e5fc7092116b872"
  });
  
  const planningData = parsePlanningData(planningPage.content);
  const currentSeason = getCurrentSeason();
  
  return { planningData, currentSeason };
}
```
