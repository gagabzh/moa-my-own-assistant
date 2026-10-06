/**
 * Script pour générer le briefing quotidien à partir du planning sauvegardé
 * Ce script est appelé par la scheduled task de Vibe Work
 * 
 * Prérequis :
 * - Le planning de la semaine doit avoir été sauvegardé lors de la review du vendredi
 * - La base de données Notion "Plannings Hebdomadaires" doit exister
 * 
 * Utilisation dans Vibe Work :
 * 1. Créer une scheduled task avec la commande : /planning briefing aujourd'hui
 * 2. Ou appeller directement ce script via run_typescript
 */

// ============================================================================
// CONFIGURATION - À adapter selon votre environnement
// ============================================================================

const CONFIG = {
  // ID de la base de données Notion "Plannings Hebdomadaires"
  // Créée automatiquement via le connector - URL: https://app.notion.com/p/d17a978755fb470590605e3c71630aa7
  NOTION_DATABASE_ID: "2698c5ac-eb72-47ac-8943-39c377c54110", // ou "d17a978755fb470590605e3c71630aa7"
  
  // ID de la page Planning Type (pour fallback)
  PLANNING_TYPE_PAGE_ID: "3eaeb7da605181a58e5fc7092116b872",
  
  // Parent page ID pour fallback (Maison et Jardin)
  PARENT_PAGE_ID: "0f28e015f76949eeaf2985e10d4c64e3",
  
  // Utiliser le fallback vers le planning type si aucun planning spécifique trouvé
  USE_FALLBACK: true
};

// ============================================================================
// FONCTIONS PRINCIPALES
// ============================================================================

/**
 * Génère le briefing quotidien pour aujourd'hui
 * Appelé par la scheduled task de Vibe Work
 */
async function generateDailyBriefing(): Promise<string> {
  const today = new Date();
  const dayName = today.toLocaleDateString('fr-FR', { weekday: 'long' });
  const dateStr = today.toLocaleDateString('fr-FR');
  const timeStr = today.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  // 1. Essayer de récupérer le planning de la semaine depuis Notion
  const weeklyPlanning = await getCurrentWeekPlanning();
  
  if (weeklyPlanning) {
    // 2. Extraire le briefing pour aujourd'hui
    return generateBriefingFromPlanning(weeklyPlanning, dayName, dateStr, timeStr);
  }
  
  // 3. Fallback: utiliser le planning type si aucun planning spécifique trouvé
  if (CONFIG.USE_FALLBACK) {
    const fallbackBriefing = await generateFallbackBriefing(dayName, dateStr, timeStr);
    return fallbackBriefing + "\n\n⚠️ *Aucun planning spécifique trouvé pour cette semaine. Utilisez la review du vendredi pour en générer un.*";
  }
  
  return "❌ Impossible de générer le briefing : aucun planning trouvé et fallback désactivé.";
}

/**
 * Récupère le planning de la semaine en cours depuis Notion
 */
async function getCurrentWeekPlanning(): Promise<string | null> {
  const weekKey = getWeekKey();
  
  try {
    if (CONFIG.NOTION_DATABASE_ID) {
      // Rechercher dans la base de données
      const response = await tools.connector_notion.notion_query_multiple_data_sources({
        data_source_url: `collection://${CONFIG.NOTION_DATABASE_ID}`,
        mode: "view",
        filter: {
          and: [
            { property: "Date début", date: { on_or_before: weekKey.split('_')[0] } },
            { property: "Date fin", date: { on_or_after: weekKey.split('_')[1] } },
            { property: "Statut", select: { equals: "En cours" } }
          ]
        },
        limit: 1,
        sorts: [
          { property: "Date début", direction: "descending" }
        ]
      });
      
      if (response.results && response.results.length > 0) {
        const page = response.results[0];
        // Extraire le contenu
        let content = page.content || '';
        
        // Si le contenu est dans une propriété Rich Text
        if (page.properties?.Contenu?.rich_text) {
          content = page.properties.Contenu.rich_text
            .map((rt: any) => rt.text?.content || '')
            .join('\n');
        }
        
        return content || null;
      }
    }
    
    // Fallback: essayer de récupérer depuis une page dédiée
    // (à implémenter si vous utilisez une page unique au lieu d'une base)
    
  } catch (error) {
    console.error("Erreur lors de la récupération du planning:", error);
  }
  
  return null;
}

/**
 * Génère un briefing à partir du planning de la semaine
 */
function generateBriefingFromPlanning(
  weeklyPlanning: string,
  dayName: string,
  dateStr: string,
  timeStr: string
): string {
  // Analyser le planning pour extraire les informations du jour
  // Ce parseur doit être adapté au format réel généré par le skill
  
  const lines = weeklyPlanning.split('\n');
  const daySection: string[] = [];
  let inDaySection = false;
  let foundDayHeader = false;
  
  // Normaliser le nom du jour (gérer les variantes)
  const dayVariants = [
    dayName,
    dayName.charAt(0).toUpperCase() + dayName.slice(1),
    dayName.toUpperCase(),
    `## ${dayName}`,
    `### ${dayName}`
  ];
  
  for (const line of lines) {
    // Vérifier si on a trouvé le header du jour
    if (dayVariants.some(v => line.includes(v)) && line.trim().startsWith('#')) {
      inDaySection = true;
      foundDayHeader = true;
      daySection.push(line);
      continue;
    }
    
    // Si on est dans la section et qu'on trouve un autre header, on arrête
    if (inDaySection && line.trim().startsWith('#')) {
      break;
    }
    
    if (inDaySection) {
      daySection.push(line);
    }
    
    // Si on n'a pas encore trouvé le header, vérifier les tableaux
    if (!foundDayHeader && line.includes('|') && line.includes(dayName)) {
      inDaySection = true;
      foundDayHeader = true;
      daySection.push(line);
    }
  }
  
  if (!foundDayHeader) {
    // Fallback: retourner le planning complet avec un message
    return `# 📋 Briefing du ${dayName} ${dateStr} - ${timeStr}\n\n${weeklyPlanning}`;
  }
  
  // Formater le briefing
  const briefing = `# 📋 Briefing du ${dayName} ${dateStr} - ${timeStr}\n\n` +
    daySection.join('\n') + \n\n---\n` +
    `*Généré à partir du planning de la semaine*`;
  
  return briefing;
}

/**
 * Génère un briefing de fallback à partir du planning type
 */
async function generateFallbackBriefing(
  dayName: string,
  dateStr: string,
  timeStr: string
): Promise<string> {
  // Récupérer le planning type
  const planningPage = await tools.connector_notion.notion_fetch({
    id: CONFIG.PLANNING_TYPE_PAGE_ID
  });
  
  const planningData = parsePlanningData(planningPage.text);
  const currentSeason = getCurrentSeason();
  
  // Générer un briefing générique pour le jour
  return `# 📋 Briefing du ${dayName} ${dateStr} - ${timeStr}\n\n` +
    `## 🎯 Planning Type - ${currentSeason}\n\n` +
    `### Activités prévues pour ${dayName}:\n\n` +
    
    // Extraire les créneaux pour ce jour
    getDaySchedule(planningData, dayName) +
    `\n\n` +
    `## ⚠️ Mode Fallback\n\n` +
    `Ce briefing est basé sur le planning type générique.\n` +
    `Pour un briefing personnalisé avec les événements spécifiques de la semaine,\n` +
    `effectuez une **review du vendredi** pour générer et sauvegarder le planning concret.\n\n` +
    `---\n` +
    `*Planning Type 2026/2027*`;
}

// ============================================================================
// FONCTIONS UTILITAIRES (copiées depuis SKILL.md)
// ============================================================================

function getWeekKey(): string {
  const today = new Date();
  const saturday = new Date(today);
  saturday.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
  const friday = new Date(saturday);
  friday.setDate(saturday.getDate() + 6);
  
  const formatDate = (d: Date) => d.toISOString().split('T')[0];
  return `${formatDate(saturday)}_${formatDate(friday)}`;
}

function getCurrentSeason(): string {
  const month = new Date().getMonth();
  if (month >= 9 || month <= 1) return 'Hiver';
  if (month >= 2 && month <= 4) return 'Printemps';
  if (month >= 5 && month <= 7) return 'Ete';
  return 'Automne';
}

function parsePlanningData(content: string): any {
  const data: any = {
    objectifs: [],
    contraintes: [],
    creneaux: {},
    planningParSaison: {},
    budgets: {},
    saisonnier: {},
    sante: {},
    joursPresentiel: ['mercredi'],
    renfortCoach: { jour: 'vendredi', heure: '12h-13h10', peutChanger: true }
  };
  
  // Extraire les objectifs
  const objectifsMatch = content.match(/## Objectifs[\s\S]*?\n-(.*?)(?=\n##|\n$)/i);
  if (objectifsMatch) {
    data.objectifs = objectifsMatch[1].split('\n-').map((o: string) => o.trim()).filter((o: string) => o);
  }
  
  // Extraire les contraintes fixes
  const contraintesMatch = content.match(/## Contraintes fixes[\s\S]*?\n-(.*?)(?=\n##|\n$)/i);
  if (contraintesMatch) {
    data.contraintes = contraintesMatch[1].split('\n-').map((c: string) => c.trim()).filter((c: string) => c);
  }
  
  // Extraire les créneaux
  const creneauxMatch = content.match(/## Creneaux disponibles[\s\S]*?\n(.*?)(?=\n##|\n$)/i);
  if (creneauxMatch) {
    const creneauxText = creneauxMatch[1];
    creneauxText.split('\n').forEach((line: string) => {
      if (line.trim()) {
        parseCreneauxLine(line, data.creneaux);
      }
    });
  }
  
  return data;
}

function parseCreneauxLine(line: string, creneaux: any): void {
  // Matins lun/mar/jeu/ven : 7h45-8h15
  const matinMatch = line.match(/Matins (.*?):\s*(.*?)(?=\s|$)/i);
  if (matinMatch) {
    const jours = matinMatch[1].split('/').map((j: string) => j.trim().toLowerCase());
    const heure = matinMatch[2].trim();
    jours.forEach(j => {
      if (!creneaux[j]) creneaux[j] = {};
      creneaux[j].matin = heure;
    });
  }
  
  // Midis
  const midiMatch = line.match(/Midis (.*?):\s*(.*?)(?=\s|$)/i);
  if (midiMatch) {
    const jours = midiMatch[1].split('/').map((j: string) => j.trim().toLowerCase());
    const heure = midiMatch[2].trim();
    jours.forEach(j => {
      if (!creneaux[j]) creneaux[j] = {};
      creneaux[j].midi = heure;
    });
  }
}

function getDaySchedule(planningData: any, dayName: string): string {
  const day = dayName.toLowerCase();
  const creneaux = planningData.creneaux[day] || {};
  
  const schedule: string[] = [];
  
  if (creneaux.matin) {
    schedule.push(`- **Matin** : ${creneaux.matin}`);
  }
  if (creneaux.midi) {
    schedule.push(`- **Midi** : ${creneaux.midi}`);
  }
  if (creneaux.soir) {
    schedule.push(`- **Soir** : ${creneaux.soir}`);
  }
  
  return schedule.length > 0 ? schedule.join('\n') : 'Aucun créneau spécifique pour ce jour.';
}

// ============================================================================
// EXPORT POUR UTILISATION DIRECTE
// ============================================================================

// Fonction principale appelée par la scheduled task
async function main() {
  try {
    const briefing = await generateDailyBriefing();
    return briefing;
  } catch (error) {
    console.error("Erreur lors de la génération du briefing:", error);
    return "❌ Erreur lors de la génération du briefing. Veuillez vérifier les logs.";
  }
}

// Exporter pour utilisation dans d'autres scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    generateDailyBriefing,
    getCurrentWeekPlanning,
    generateBriefingFromPlanning,
    generateFallbackBriefing
  };
}