---
name: planning-semaine
description: |
  Load this skill when the user asks for a weekly planning review, a specific week plan, or to plan sport sessions, hobby project sessions (e.g. painting, building), meal prep shopping or the week's menu. Also use when they give weekly constraints (competitions, absences, remote/onsite work days, weather) to generate the concrete planning of the upcoming week.
---

# Planning hebdomadaire — génération de semaine (version Notion)

## Objectif

Générer le planning concret d'une semaine **à partir des données centralisées dans Notion** (au lieu des fichiers locaux).

## Sources de données
- **Planning Type** : Page Notion "Planning Type" (ID: `3eaeb7da-6051-81a5-8e5f-c7092116b872`)
- **Plannings Hebdomadaires** : Base de données Notion pour stocker les plannings concrets de chaque semaine (à créer)

## Configuration requise

Pour que les **scheduled tasks de Vibe Work** fonctionnent, vous devez :

1. **Créer une base de données Notion** "Plannings Hebdomadaires" avec ces propriétés :
   - `Nom` (Title) - Format: "Semaine YYYY-MM-DD - YYYY-MM-DD"
   - `Date début` (Date) - Samedi de la semaine
   - `Date fin` (Date) - Vendredi de la semaine
   - `Contenu` (Rich Text) - Le planning complet en markdown
   - `Statut` (Select) - "À venir", "En cours", "Terminé"

2. **Récupérer l'ID de la base** :
   - Ouvrir la base dans Notion
   - Copier l'URL : `https://www.notion.so/[workspace]/[database_id]?v=...`
   - L'ID est la partie après le workspace (32 caractères)

3. **Mettre à jour le skill** :
   - Remplacer `databaseId = null` par votre ID de base dans les fonctions

## Installation rapide pour les scheduled tasks

### Étape 1 : Créer la base de données Notion
```
Nom : Plannings Hebdomadaires
Type : Base de données (Table)
Propriétés :
  - Nom (Title)
  - Date début (Date)
  - Date fin (Date) 
  - Contenu (Rich Text)
  - Statut (Select: À venir, En cours, Terminé)
```

### Étape 2 : Récupérer l'ID et le configurer
Dans le code, remplacer :
```typescript
const databaseId = null;
```
par :
```typescript
const databaseId = "votre_id_de_base_ici";
```

### Étape 3 : Tester la sauvegarde
Lors de la prochaine review du vendredi :
```
/planning review cette semaine
```
Le skill devrait sauvegarder automatiquement le planning dans Notion.

### Étape 4 : Configurer la scheduled task dans Vibe Work
- **Nom** : Briefing quotidien - Planning
- **Fréquence** : Tous les jours à 21h00
- **Timezone** : Europe/Paris
- **Commande** : `/planning briefing aujourd'hui`

La scheduled task récupérera le planning de la semaine depuis Notion et générera le briefing du jour.

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
   - **Jours de présentiel** ? (par défaut : mercredi. Peut être déplacé ou multiple. Ex: "mon jour de présentiel est jeudi", "je suis en présentiel mardi et jeudi")
   - Autre créneau modifié ? (ex: "le renfort coach est mercredi cette semaine")
   - Météo prévue ? (mauvaise météo → remplacer la séance extérieure par l'alternative indoor configurée)
   - Invités/repas spéciaux, contraintes alimentaires ?
   - Avancement des projets de loisir (demander si inconnu).
   - Suivi santé du moment (ex. dernière pesée et tendance).

5. **Générer le planning de la semaine** au format ci-dessous.

6. **Sauvegarder le planning généré** dans Notion (ou localement en fallback) pour que les scheduled tasks de Vibe Work puissent y accéder. **Cette étape est CRITIQUE pour que le briefing quotidien fonctionne avec les événements spécifiques de la semaine.**

7. **Proposer d'enregistrer l'avancement** (santé, unités terminées, jalons de projets) dans Notion si l'utilisateur l'accepte.

8. **Mettre à jour le statut du planning** : "À venir" → "En cours" au début de la semaine, "En cours" → "Terminé" à la fin.


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
- **Présentiel** : par défaut le mercredi, mais peut être déplacé ou multiple. Un jour de présentiel = pas de créneaux matin/midi, soir limité à 1h.
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
    sante: {},
    joursPresentiel: ['mercredi'], // Par défaut
    renfortCoach: { jour: 'vendredi', heure: '12h-13h10', peutChanger: true }
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
    
    // Extraire les jours de présentiel (peut être multiple)
    const presentielMatch = contraintesMatch[0].match(/Présentiel[\s\S]*?:(.*?)(?=\n|\.)/i);
    if (presentielMatch) {
      const presentielText = presentielMatch[1].trim();
      // Extraire les jours mentionnés
      const jours = presentielText.match(/(\blundi\b|\bmardi\b|\bmercredi\b|\bjeudi\b|\bvendredi\b|\bsamedi\b|\bdimanche\b)/gi);
      if (jours) {
        data.joursPresentiel = jours.map(j => j.toLowerCase());
      }
    }
    
    // Extraire renfort coach
    const renfortMatch = contraintesMatch[0].match(/Renfort coach[\s\S]*?:(.*?)(?=\n|\.)/i);
    if (renfortMatch) {
      const renfortText = renfortMatch[1].trim();
      const heureMatch = renfortText.match(/(\d{1,2}h[\d{0,2}]-?\d{1,2}h[\d{0,2}])/);
      const jourMatch = renfortText.match(/(\blundi\b|\bmardi\b|\bmercredi\b|\bjeudi\b|\bvendredi\b)/i);
      if (heureMatch) data.renfortCoach.heure = heureMatch[1];
      if (jourMatch) data.renfortCoach.jour = jourMatch[1].toLowerCase();
    }
  }
  
  // Extraire les créneaux disponibles
  const creneauxMatch = content.match(/## Creneaux disponibles[\s\S]*?\n(.*?)(?=\n##|\n$)/);
  if (creneauxMatch) {
    const creneauxText = creneauxMatch[1];
    // Parse each line to extract day/time info
    creneauxText.split('\n').forEach(line => {
      if (line.trim()) {
        // Matins lun/mar/jeu/ven : 7h45-8h15
        const matinMatch = line.match(/Matins (.*?):\s*(.*?)(?=\s|$)/);
        if (matinMatch) {
          const jours = matinMatch[1].split('/').map(j => j.trim().toLowerCase());
          const heure = matinMatch[2].trim();
          jours.forEach(j => {
            if (!data.creneaux[j]) data.creneaux[j] = {};
            data.creneaux[j].matin = heure;
          });
        }
        // Midis lun/mar/jeu : 12h30-13h30
        const midiMatch = line.match(/Midis (.*?):\s*(.*?)(?=\s|$)/);
        if (midiMatch) {
          const jours = midiMatch[1].split('/').map(j => j.trim().toLowerCase());
          const heure = midiMatch[2].trim();
          jours.forEach(j => {
            if (!data.creneaux[j]) data.creneaux[j] = {};
            data.creneaux[j].midi = heure;
          });
        }
        // Soirs
        const soirMatch = line.match(/Soirs?\s*:\s*(.*?)(?=\n|$)/);
        if (soirMatch) {
          const soirText = soirMatch[1].trim();
          // lun 3 h, mar 3 h, mer 1 h, jeu 3 h, ven 3 h
          const joursHeures = soirText.split(',').map(s => s.trim());
          joursHeures.forEach(jh => {
            const [jour, heure] = jh.split(' ').filter(s => s.trim());
            if (jour && heure) {
              if (!data.creneaux[jour]) data.creneaux[jour] = {};
              data.creneaux[jour].soir = heure;
            }
          });
        }
        // Samedi et Dimanche spécifiques
        if (line.includes('Samedi')) {
          const samediMatch = line.match(/Samedi\s*(.*?):\s*(.*?)(?=\n|$)/);
          if (samediMatch) {
            data.creneaux.samedi = { details: samediMatch[2].trim() };
          }
        }
        if (line.includes('Dimanche')) {
          const dimancheMatch = line.match(/Dimanche\s*(.*?):\s*(.*?)(?=\n|$)/);
          if (dimancheMatch) {
            data.creneaux.dimanche = { details: dimancheMatch[2].trim() };
          }
        }
      }
    });
  }
  
  // Extraire le planning par saison (tableaux)
  const saisonMatch = content.match(/## Semaine type[\s\S]*?\n\|(.*?)(?=\n##|\n$)/);
  if (saisonMatch) {
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
    id: "https://app.notion.com/p/3eaeb7da605181a58e5fc7092116b872"
  });
  
  const planningData = parsePlanningData(planningPage.text);
  const currentSeason = getCurrentSeason();
  
  // Exemple d'utilisation des jours de présentiel
  // Si l'utilisateur dit "mon jour de présentiel est jeudi la semaine prochaine"
  // planningData.joursPresentiel = ['jeudi'];
  
  return { planningData, currentSeason };
}


## Sauvegarde du planning hebdomadaire dans Notion

### Structure de la base de données Notion
Pour que les scheduled tasks de Vibe Work puissent accéder au planning spécifique de la semaine,
il faut sauvegarder le planning généré lors de la review du vendredi.

**Base de données Notion cible** : "Plannings Hebdomadaires"
- **Propriétés** :
  - `Nom` (Title) : "Semaine [date début] - [date fin]"
  - `Date début` (Date) : Samedi de la semaine
  - `Date fin` (Date) : Vendredi de la semaine
  - `Contenu` (Rich Text) : Le planning complet au format markdown
  - `Statut` (Select) : "À venir", "En cours", "Terminé"

**ID de la base** : À créer ou à fournir (ex: `collection://...`)

### Fonctions de sauvegarde et récupération

// Génère le nom de la page pour la semaine en cours
function getWeekPageName() {
  const today = new Date();
  // Trouver le samedi de la semaine en cours (début de semaine)
  const saturday = new Date(today);
  saturday.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
  // Vendredi de la semaine en cours (fin de semaine)
  const friday = new Date(saturday);
  friday.setDate(saturday.getDate() + 6);
  
  const formatDate = (d) => d.toISOString().split('T')[0];
  return `Semaine ${formatDate(saturday)} - ${formatDate(friday)}`;
}

// Génère la clé unique pour la semaine (YYYY-MM-DD_YYYY-MM-DD)
function getWeekKey() {
  const today = new Date();
  const saturday = new Date(today);
  saturday.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
  const friday = new Date(saturday);
  friday.setDate(saturday.getDate() + 6);
  
  const formatDate = (d) => d.toISOString().split('T')[0];
  return `${formatDate(saturday)}_${formatDate(friday)}`;
}

// Sauvegarde le planning généré dans Notion
// Utilise une page dédiée dans une base de données ou une page unique mise à jour
async function saveWeeklyPlanning(planningMarkdown, databaseId = null, pageId = null) {
  const weekKey = getWeekKey();
  const weekName = getWeekPageName();
  
  try {
    // Option 1: Sauvegarder dans une base de données (recommandé)
    if (databaseId) {
      const response = await tools.connector_notion.notion_create_pages({
        parent: databaseId,
        properties: {
          "Nom": { title: [{ text: { content: weekName } }] },
          "Date début": { date: { start: weekKey.split('_')[0] } },
          "Date fin": { date: { start: weekKey.split('_')[1] } },
          "Statut": { select: { name: "À venir" } }
        },
        children: [
          {
            object: "block",
            type: "paragraph",
            paragraph: {
              text: [{ text: { content: planningMarkdown } }]
            }
          }
        ]
      });
      
      console.log(`Planning sauvegardé dans Notion - ID: ${response.id}`);
      return response.id;
    }
    
    // Option 2: Mettre à jour une page existante (page unique "Planning Actuel")
    if (pageId) {
      const response = await tools.connector_notion.notion_update_page({
        page_id: pageId,
        properties: {
          "Nom": { title: [{ text: { content: weekName } }] },
          "Dernière mise à jour": { date: { start: new Date().toISOString().split('T')[0] } }
        },
        children: [
          {
            object: "block",
            type: "paragraph",
            paragraph: {
              text: [{ text: { content: planningMarkdown } }]
            }
          }
        ]
      });
      
      console.log(`Planning mis à jour dans Notion - Page: ${pageId}`);
      return pageId;
    }
    
    // Option 3: Créer une nouvelle page dans la racine (moins organisé)
    const response = await tools.connector_notion.notion_create_pages({
      parent: { type: "page_id", page_id: "0f28e015f76949eeaf2985e10d4c64e3" }, // Parent: Maison et Jardin
      properties: {
        "title": { title: [{ text: { content: weekName } }] }
      },
      children: [
        {
          object: "block",
          type: "paragraph",
          paragraph: {
            text: [{ text: { content: planningMarkdown } }]
          }
        }
      ]
    });
    
    console.log(`Planning sauvegardé dans une nouvelle page - ID: ${response.id}`);
    return response.id;
    
  } catch (error) {
    console.error("Erreur lors de la sauvegarde du planning:", error);
    // Retry avec un fallback vers un fichier local
    await saveWeeklyPlanningLocal(planningMarkdown, weekKey);
    return null;
  }
}

// Sauvegarde locale en fallback (si Notion échoue)
async function saveWeeklyPlanningLocal(planningMarkdown, weekKey) {
  try {
    const fs = require('fs');
    const path = require('path');
    const vibeHome = process.env.VIBE_HOME || path.join(process.env.HOME, '.vibe');
    const planningDir = path.join(vibeHome, 'plannings');
    
    // Créer le répertoire s'il n'existe pas
    if (!fs.existsSync(planningDir)) {
      fs.mkdirSync(planningDir, { recursive: true });
    }
    
    const filePath = path.join(planningDir, `${weekKey}.md`);
    fs.writeFileSync(filePath, planningMarkdown);
    
    console.log(`Planning sauvegardé localement: ${filePath}`);
    return filePath;
  } catch (error) {
    console.error("Erreur lors de la sauvegarde locale:", error);
    return null;
  }
}

// Récupère le planning de la semaine en cours
async function getWeeklyPlanning(databaseId = null, pageId = null) {
  const weekKey = getWeekKey();
  
  try {
    // Option 1: Chercher dans la base de données
    if (databaseId) {
      const response = await tools.connector_notion.notion_query_multiple_data_sources({
        data_source_url: databaseId,
        mode: "view",
        filter: {
          and: [
            { property: "Date début", date: { equals: weekKey.split('_')[0] } },
            { property: "Statut", select: { equals: "En cours" } }
          ]
        },
        limit: 1
      });
      
      if (response.results && response.results.length > 0) {
        const page = response.results[0];
        // Extraire le contenu markdown de la page
        const content = page.content || page.properties?.Contenu?.rich_text?.[0]?.text?.content || '';
        return content;
      }
    }
    
    // Option 2: Récupérer depuis une page dédiée
    if (pageId) {
      const page = await tools.connector_notion.notion_fetch({ id: pageId });
      return page.text || page.content || '';
    }
    
    // Option 3: Fallback vers le fichier local
    const fs = require('fs');
    const path = require('path');
    const vibeHome = process.env.VIBE_HOME || path.join(process.env.HOME, '.vibe');
    const filePath = path.join(vibeHome, 'plannings', `${weekKey}.md`);
    
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf8');
    }
    
    return null;
    
  } catch (error) {
    console.error("Erreur lors de la récupération du planning:", error);
    return null;
  }
}

// Met à jour le statut du planning (À venir -> En cours -> Terminé)
async function updatePlanningStatus(databaseId, pageId, status) {
  try {
    await tools.connector_notion.notion_update_data_source({
      data_source_url: databaseId,
      updates: [
        {
          id: pageId,
          properties: {
            "Statut": { select: { name: status } }
          }
        }
      ]
    });
    console.log(`Statut du planning mis à jour: ${status}`);
  } catch (error) {
    console.error("Erreur lors de la mise à jour du statut:", error);
  }
}


## Workflow complet avec sauvegarde

// Exemple d'utilisation complet avec sauvegarde automatique
async function generateAndSaveWeeklyPlanning(constraintesUtilisateur = {}) {
  // 1. Récupérer les données de base
  const { planningData, currentSeason } = await getPlanningData();
  
  // 2. Appliquer les contraintes spécifiques de la semaine
  const planningConcret = await genererPlanningSemaine(planningData, currentSeason, contraintesUtilisateur);
  
  // 3. Formater en markdown
  const planningMarkdown = formaterPlanningSemaine(planningConcret);
  
  // 4. **SAUVEGARDER le planning** (CRITIQUE pour les scheduled tasks)
  //    Utiliser soit une base de données Notion, soit une page dédiée
  const databaseId = "2698c5ac-eb72-47ac-8943-39c377c54110"; // ID de la base "Plannings Hebdomadaires"
  const savedPageId = await saveWeeklyPlanning(planningMarkdown, databaseId);
  
  // 5. Mettre à jour le statut
  if (savedPageId && databaseId) {
    await updatePlanningStatus(databaseId, savedPageId, "À venir");
  }
  
  // 6. Retourner le planning généré
  return { 
    planning: planningConcret, 
    markdown: planningMarkdown,
    savedToNotion: savedPageId ? true : false,
    pageId: savedPageId
  };
}

// Fonction pour générer le briefing quotidien (appelée par la scheduled task)
async function generateDailyBriefing() {
  // 1. Récupérer le planning de la semaine en cours
  const databaseId = "2698c5ac-eb72-47ac-8943-39c377c54110"; // ID de la base "Plannings Hebdomadaires"
  const planningMarkdown = await getWeeklyPlanning(databaseId);
  
  if (!planningMarkdown) {
    // Fallback: régénérer depuis le planning type
    const { planningData, currentSeason } = await getPlanningData();
    return "Aucun planning spécifique trouvé pour cette semaine. Utilisez la review du vendredi pour en générer un.";
  }
  
  // 2. Extraire les informations du jour
  const today = new Date();
  const dayName = today.toLocaleDateString('fr-FR', { weekday: 'long' });
  
  // 3. Formater le briefing du jour
  const briefing = extraireBriefingDuJour(planningMarkdown, dayName);
  
  return briefing;
}

// Helper: Extraire le briefing pour un jour spécifique
function extraireBriefingDuJour(planningMarkdown, dayName) {
  // Parse le markdown pour extraire la section du jour
  // Cette fonction doit être adaptée au format réel généré
  const lines = planningMarkdown.split('\n');
  const daySection = [];
  let inDaySection = false;
  
  for (const line of lines) {
    if (line.includes(`## ${dayName}`) || line.includes(`### ${dayName}`)) {
      inDaySection = true;
      continue;
    }
    if (inDaySection && (line.startsWith('##') || line.startsWith('###'))) {
      break;
    }
    if (inDaySection) {
      daySection.push(line);
    }
  }
  
  return daySection.join('\n') || planningMarkdown;
}
```
