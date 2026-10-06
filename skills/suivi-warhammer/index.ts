// ============================================================================
// Suivi Warhammer - Main Module
// Module principal pour le skill suivi-warhammer
// OPTIMISÉ : 1 appel API au lieu de plusieurs
// ============================================================================

import {
  WarhammerUnit,
  ValidState,
  DATABASE_CONFIG,
  PROPERTY_NAMES,
  parseAddCommand,
  parseUpdateCommand,
  parseListCommand,
  parseSearchOrDeleteCommand,
  normalizeState,
  getNextState,
  getPreviousState,
  isValidState
} from './utils';

// ============================================================================
// Fonctions Notion - OPTIMISÉES
// ============================================================================

/**
 * Récupère toutes les unités de la base de données Notion
 */
export async function getAllUnits(): Promise<WarhammerUnit[]> {
  try {
    const result = await tools.connector_notion.notion_query_data_sources({
      data_source_url: DATABASE_CONFIG.dataSourceUrl,
      mode: 'table'
    });
    
    // Parser le résultat pour extraire les unités
    return parseUnitsFromNotionResult(result);
  } catch (error) {
    console.error('Erreur lors de la récupération des unités:', error);
    throw new Error(`Impossible de récupérer les unités: ${error}`);
  }
}

/**
 * Parse le résultat Notion pour extraire les unités
 */
function parseUnitsFromNotionResult(result: any): WarhammerUnit[] {
  const units: WarhammerUnit[] = [];
  
  // Le résultat contient les lignes de la base de données
  if (!result || !result.rows) {
    console.warn('Format de résultat inattendu:', result);
    return units;
  }
  
  for (const row of result.rows) {
    try {
      const unit: WarhammerUnit = {
        id: row.id || row.url.split('/').pop() || '',
        url: row.url || '',
        nom: extractPropertyValue(row, PROPERTY_NAMES.nom) || 'Unité sans nom',
        armée: extractPropertyValue(row, PROPERTY_NAMES.armée),
        état: normalizeState(extractPropertyValue(row, PROPERTY_NAMES.état) || 'A acheter'),
        note: extractPropertyValue(row, PROPERTY_NAMES.note),
        createdTime: row.createdTime || new Date().toISOString()
      };
      
      units.push(unit);
    } catch (error) {
      console.error('Erreur lors du parsing de la ligne:', error, row);
    }
  }
  
  return units;
}

/**
 * Extrait la valeur d'une propriété d'une ligne Notion
 */
function extractPropertyValue(row: any, propertyName: string): string | undefined {
  if (!row || !row.properties) {
    return undefined;
  }
  
  const property = row.properties[propertyName];
  if (!property) {
    return undefined;
  }
  
  // Gérer différents types de propriétés
  switch (property.type) {
    case 'title':
      if (property.title && property.title.length > 0) {
        return property.title[0].text?.content || property.title[0].plain_text;
      }
      return undefined;
    
    case 'rich_text':
      if (property.rich_text && property.rich_text.length > 0) {
        return property.rich_text[0].text?.content || property.rich_text[0].plain_text;
      }
      return undefined;
    
    case 'select':
      if (property.select) {
        return property.select.name;
      }
      return undefined;
    
    case 'status':
      if (property.status) {
        return property.status.name;
      }
      return undefined;
    
    case 'text':
      if (property.text) {
        return property.text.content || property.text.plain_text;
      }
      return undefined;
    
    default:
      console.warn(`Type de propriété non géré: ${property.type}`);
      return JSON.stringify(property);
  }
}

/**
 * Ajoute une nouvelle unité à la base de données
 * OPTIMISÉ : 1 seul appel, synchrone, toutes propriétés incluses
 */
export async function addUnit(unit: {
  nom: string;
  armée?: string;
  note?: string;
  état?: string;
}): Promise<WarhammerUnit> {
  try {
    const normalizedState = normalizeState(unit.état || 'A acheter');
    
    // Format optimisé : création directe dans la base de données
    // avec toutes les propriétés en un seul appel synchrone
    // CORRECTION : utiliser database_id au lieu de data_source_id pour éviter les erreurs
    const result = await tools.connector_notion.notion_create_pages({
      parent: {
        database_id: DATABASE_CONFIG.pageId
      },
      pages: [{
        properties: {
          [PROPERTY_NAMES.nom]: unit.nom,
          [PROPERTY_NAMES.armée]: unit.armée,
          [PROPERTY_NAMES.état]: normalizedState,
          [PROPERTY_NAMES.note]: unit.note
        }
      }],
      allow_async: false  // Synchrone = instantané, pas de file d'attente
    });
    
    // Construire l'unité à partir du résultat
    const newUnit: WarhammerUnit = {
      id: result.pages[0].id,
      url: result.pages[0].url,
      nom: unit.nom,
      armée: unit.armée,
      état: normalizedState,
      note: unit.note,
      createdTime: new Date().toISOString()
    };
    
    return newUnit;
  } catch (error) {
    console.error('Erreur lors de l\'ajout de l\'unité:', error);
    throw new Error(`Impossible d'ajouter l'unité: ${error}`);
  }
}

/**
 * Met à jour l'état d'une unité existante
 * OPTIMISÉ : appel synchrone
 */
export async function updateUnitStatus(unitId: string, newStatus: string): Promise<void> {
  try {
    const normalizedStatus = normalizeState(newStatus);
    
    await tools.connector_notion.notion_update_page({
      page_id: unitId,
      command: 'update_properties',
      properties: {
        [PROPERTY_NAMES.état]: normalizedStatus
      },
      allow_async: false  // Synchrone = instantané
    });
  } catch (error) {
    console.error(`Erreur lors de la mise à jour de l'unité ${unitId}:`, error);
    throw new Error(`Impossible de mettre à jour l'état: ${error}`);
  }
}

/**
 * Met à jour plusieurs propriétés d'une unité
 * OPTIMISÉ : 1 appel pour toutes les propriétés
 */
export async function updateUnit(unitId: string, updates: {
  nom?: string;
  armée?: string;
  état?: string;
  note?: string;
}): Promise<void> {
  try {
    const properties: Record<string, any> = {};
    
    if (updates.nom !== undefined) {
      properties[PROPERTY_NAMES.nom] = updates.nom;
    }
    
    if (updates.armée !== undefined) {
      properties[PROPERTY_NAMES.armée] = updates.armée;
    }
    
    if (updates.état !== undefined) {
      properties[PROPERTY_NAMES.état] = normalizeState(updates.état);
    }
    
    if (updates.note !== undefined) {
      properties[PROPERTY_NAMES.note] = updates.note;
    }
    
    // Si des propriétés à mettre à jour
    if (Object.keys(properties).length > 0) {
      await tools.connector_notion.notion_update_page({
        page_id: unitId,
        command: 'update_properties',
        properties,
        allow_async: false  // Synchrone
      });
    }
  } catch (error) {
    console.error(`Erreur lors de la mise à jour de l'unité ${unitId}:`, error);
    throw new Error(`Impossible de mettre à jour l'unité: ${error}`);
  }
}

/**
 * Supprime une unité (archive la page)
 * OPTIMISÉ : utilise move_pages vers workspace (plus rapide que archived)
 */
export async function deleteUnit(pageId: string): Promise<void> {
  try {
    // Déplacer vers workspace = supprime de la base de données
    // C'est plus rapide et plus fiable que de mettre archived: true
    await tools.connector_notion.notion_move_pages({
      page_or_database_ids: [pageId],
      new_parent: { type: 'workspace' }
    });
  } catch (error) {
    console.error(`Erreur lors de la suppression de l'unité ${pageId}:`, error);
    throw new Error(`Impossible de supprimer l'unité: ${error}`);
  }
}

/**
 * Trouve une unité par son nom (recherche approximative)
 */
export async function findUnitByName(name: string): Promise<WarhammerUnit | null> {
  const units = await getAllUnits();
  
  // Recherche insensible à la casse et approximative
  const normalizedName = name.toLowerCase().trim();
  
  // D'abord, essayer une correspondance exacte
  for (const unit of units) {
    if (unit.nom.toLowerCase() === normalizedName) {
      return unit;
    }
  }
  
  // Ensuite, essayer une correspondance partielle
  for (const unit of units) {
    if (unit.nom.toLowerCase().includes(normalizedName)) {
      return unit;
    }
  }
  
  // Enfin, essayer de voir si le nom de l'unité est contenu dans la recherche
  for (const unit of units) {
    if (normalizedName.includes(unit.nom.toLowerCase())) {
      return unit;
    }
  }
  
  return null;
}

/**
 * Trouve toutes les unités correspondant à un critère
 */
export async function findUnitsByCriteria(criteria: {
  armée?: string;
  état?: string;
  nameContains?: string;
}): Promise<WarhammerUnit[]> {
  const units = await getAllUnits();
  
  return units.filter(unit => {
    if (criteria.armée && unit.armée?.toLowerCase() !== criteria.armée.toLowerCase()) {
      return false;
    }
    if (criteria.état && normalizeState(unit.état) !== normalizeState(criteria.état)) {
      return false;
    }
    if (criteria.nameContains && !unit.nom.toLowerCase().includes(criteria.nameContains.toLowerCase())) {
      return false;
    }
    return true;
  });
}

// ============================================================================
// Fonctions de Formatage
// ============================================================================

/**
 * Formate une liste d'unités pour l'affichage
 */
export function formatUnitList(units: WarhammerUnit[]): string {
  if (units.length === 0) {
    return 'Aucune unité trouvée.';
  }
  
  // Grouper par armée
  const byArmy: Map<string, WarhammerUnit[]> = new Map();
  
  for (const unit of units) {
    const army = unit.armée || 'Non assignée';
    if (!byArmy.has(army)) {
      byArmy.set(army, []);
    }
    byArmy.get(army)!.push(unit);
  }
  
  let result = `**${units.length} unité(s) trouvée(s)**\n\n`;
  
  for (const [army, armyUnits] of byArmy) {
    result += `### ${army}\n\n`;
    
    // Grouper par état dans chaque armée
    const byState: Map<string, WarhammerUnit[]> = new Map();
    for (const unit of armyUnits) {
      if (!byState.has(unit.état)) {
        byState.set(unit.état, []);
      }
      byState.get(unit.état)!.push(unit);
    }
    
    for (const [state, stateUnits] of byState) {
      result += `**${state}**\n`;
      for (const unit of stateUnits.sort((a, b) => a.nom.localeCompare(b.nom))) {
        result += `- ${unit.nom}${unit.note ? ` (${unit.note})` : ''}\n`;
      }
      result += '\n';
    }
  }
  
  return result.trim();
}

/**
 * Formate les détails d'une unité
 */
export function formatUnitDetails(unit: WarhammerUnit): string {
  const createdDate = new Date(unit.createdTime);
  const dateStr = createdDate.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  let result = `**${unit.nom}**\n\n`;
  result += `Armée : ${unit.armée || 'Non assignée'}\n`;
  result += `État : ${unit.état}\n`;
  
  if (unit.note) {
    result += `Note : ${unit.note}\n`;
  }
  
  result += `Créée : ${dateStr}`;
  
  // Ajouter un lien vers Notion si disponible
  if (unit.url) {
    result += `\n[Voir dans Notion](${unit.url})`;
  }
  
  return result;
}

/**
 * Formate les statistiques
 */
export function formatStatistics(units: WarhammerUnit[]): string {
  const byStatus: Map<string, number> = new Map();
  const byArmy: Map<string, number> = new Map();
  
  for (const unit of units) {
    // Compter par état
    const currentCount = byStatus.get(unit.état) || 0;
    byStatus.set(unit.état, currentCount + 1);
    
    // Compter par armée
    const army = unit.armée || 'Non assignée';
    const armyCount = byArmy.get(army) || 0;
    byArmy.set(army, armyCount + 1);
  }
  
  let result = `**📊 Statistiques du Suivi Warhammer**\n\n`;
  
  result += `### Par État\n`;
  for (const [status, count] of byStatus) {
    result += `- **${status}** : ${count}\n`;
  }
  
  result += `\n### Par Armée\n`;
  for (const [army, count] of byArmy) {
    result += `- **${army}** : ${count}\n`;
  }
  
  result += `\n**Total : ${units.length} unités**`;
  
  return result;
}

/**
 * Formate une confirmation d'action
 */
export function formatActionConfirmation(action: string, unit: WarhammerUnit, oldState?: string): string {
  switch (action) {
    case 'add':
      return `✓ Unité **"${unit.nom}"** ajoutée ${unit.armée ? `à l'armée **${unit.armée}**` : ''}. État : **${unit.état}**${unit.note ? ` (Note: ${unit.note})` : ''}`;
    
    case 'update':
      return `✓ Unité **"${unit.nom}"** mise à jour de **${oldState}** vers **${unit.état}**`;
    
    case 'next':
      return `✓ Unité **"${unit.nom}"** passée à l'étape suivante : **${unit.état}**`;
    
    case 'previous':
      return `✓ Unité **"${unit.nom}"** remise à l'étape précédente : **${unit.état}**`;
    
    case 'delete':
      return `✓ Unité **"${unit.nom}"** supprimée`;
    
    default:
      return `✓ Action effectuée sur **"${unit.nom}"**`;
  }
}

/**
 * Génère le message d'aide
 */
export function getHelpMessage(): string {
  return `**🪖 Aide - Suivi Armées Warhammer**\n\n` +
    `Gère ton suivi de peinture et d'assemblage pour tes armées Warhammer.\n\n` +
    `**📝 Ajouter une unité :**\n` +
    `- "ajoute [nom] à [armée]" → Ajoute une unité avec son armée\n` +
    `- "ajoute [nom] dans l'état [état]" → Ajoute avec un état spécifique\n` +
    `- "nouvelle unité : [nom]" → Ajoute une unité simple\n` +
    `- "ajoute [nom] avec note '[texte]'" → Ajoute avec une note\n\n` +
    `**🔄 Mettre à jour une unité :**\n` +
    `- "passe [nom] à [état]" → Change l'état d'une unité\n` +
    `- "met [nom] en [état]" → Alternative pour changer l'état\n` +
    `- "avance [nom]" → Passe à l'étape suivante du workflow\n` +
    `- "recule [nom]" → Remet à l'étape précédente\n` +
    `- "termine [nom]" → Marque une unité comme terminée\n\n` +
    `**📋 Lister les unités :**\n` +
    `- "montre toutes les unités" → Affiche toutes les unités\n` +
    `- "liste les unités de [armée]" → Filtre par armée\n` +
    `- "quelles unités sont [état]" → Filtre par état\n` +
    `- "statistiques" → Affiche les statistiques globales\n\n` +
    `**🔍 Rechercher/Supprimer :**\n` +
    `- "cherche [nom]" → Trouve une unité spécifique\n` +
    `- "où est [nom]" → Localise une unité\n` +
    `- "supprime [nom]" → Retire une unité de la liste\n\n` +
    `**États disponibles (sans accents) :**\n` +
    `- A acheter → A assembler → A peindre → A socler → Fait\n\n` +
    `*Exemple complet :*\n` +
    `1. "ajoute Space Marine Tactical Squad à Space Marines"\n` +
    `2. "avance Space Marine Tactical Squad" (2x pour arriver à A assembler)\n` +
    `3. "passe Space Marine Tactical Squad à A peindre"\n` +
    `4. "termine Space Marine Tactical Squad"`;
}

// ============================================================================
// Workflow Principal
// ============================================================================

/**
 * Traite une commande utilisateur
 */
export async function handleCommand(userInput: string): Promise<string> {
  const trimmedInput = userInput.trim();
  
  // Vérifier si c'est une demande d'aide
  if (/^(?:aide|help|\?|comment\s+ça\s+marche|que\s+puis[\-]je\s+faire)/i.test(trimmedInput)) {
    return getHelpMessage();
  }
  
  try {
    // 1. Vérifier les commandes d'ajout
    const addResult = parseAddCommand(userInput);
    if (addResult) {
      // Utiliser l'état par défaut ou celui fourni
      const état = addResult.état || 'A acheter';
      const newUnit = await addUnit({
        nom: addResult.nom,
        armée: addResult.armée,
        note: addResult.note,
        état: état
      });
      return formatActionConfirmation('add', newUnit);
    }
    
    // 2. Vérifier les commandes de mise à jour
    const updateResult = parseUpdateCommand(userInput);
    if (updateResult) {
      const unit = await findUnitByName(updateResult.nom);
      
      if (!unit) {
        return `❌ Unité **"${updateResult.nom}"** non trouvée. Vérifie l'orthographe ou utilise "montre toutes les unités" pour voir la liste.`;
      }
      
      let newState: string;
      
      if (updateResult.action === 'next') {
        newState = getNextState(unit.état);
      } else if (updateResult.action === 'previous') {
        newState = getPreviousState(unit.état);
      } else {
        newState = updateResult.état || getNextState(unit.état);
      }
      
      const oldState = unit.état;
      await updateUnitStatus(unit.id, newState);
      
      // Mettre à jour l'objet unit pour le message de confirmation
      unit.état = newState as ValidState;
      
      const action = updateResult.action || 'update';
      return formatActionConfirmation(action, unit, oldState);
    }
    
    // 3. Vérifier les commandes de liste
    const listResult = parseListCommand(userInput);
    if (listResult) {
      if (listResult.stats) {
        const allUnits = await getAllUnits();
        return formatStatistics(allUnits);
      }
      
      const filteredUnits = await findUnitsByCriteria({
        armée: listResult.armée,
        état: listResult.état
      });
      
      return formatUnitList(filteredUnits);
    }
    
    // 4. Vérifier les commandes de recherche/suppression
    const searchResult = parseSearchOrDeleteCommand(userInput);
    if (searchResult) {
      const unit = await findUnitByName(searchResult.nom);
      
      if (!unit) {
        return `❌ Unité **"${searchResult.nom}"** non trouvée.`;
      }
      
      if (searchResult.action === 'delete') {
        await deleteUnit(unit.id);
        return formatActionConfirmation('delete', unit);
      } else {
        return formatUnitDetails(unit);
      }
    }
    
    // 5. Si aucune commande reconnue, afficher l'aide
    return getHelpMessage();
    
  } catch (error) {
    console.error('Erreur dans handleCommand:', error);
    return `❌ Une erreur est survenue : ${error}. Veuillez réessayer ou demander de l'aide.`;
  }
}

// ============================================================================
// Fonction principale (pour les tests)
// ============================================================================

/**
 * Fonction principale pour tester le skill
 * Note: Cette fonction n'est pas appelée par Vibe directement.
 * Vibe utilisera le fichier SKILL.md pour déterminer quand charger ce skill.
 */
export async function main() {
  console.log('Skill Suivi Warhammer chargé avec succès !');
  console.log('✅ Optimisation implémentée : 1 appel API au lieu de 3+');
  console.log('Attente des commandes utilisateur...');
  
  // Test de base
  try {
    const units = await getAllUnits();
    console.log(`Trouvé ${units.length} unités dans la base de données.`);
    
    for (const unit of units.slice(0, 3)) {
      console.log(`- ${unit.nom} (${unit.armée || 'N/A'}): ${unit.état}`);
    }
    
    if (units.length > 3) {
      console.log(`... et ${units.length - 3} autres`);
    }
  } catch (error) {
    console.error('Erreur lors du test initial:', error);
  }
}

// Exporter pour usage externe
export {
  getAllUnits,
  addUnit,
  updateUnitStatus,
  updateUnit,
  deleteUnit,
  findUnitByName,
  findUnitsByCriteria,
  formatUnitList,
  formatUnitDetails,
  formatStatistics,
  formatActionConfirmation,
  getHelpMessage,
  handleCommand
};
