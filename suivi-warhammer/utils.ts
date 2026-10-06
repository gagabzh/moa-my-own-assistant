// ============================================================================
// Suivi Warhammer - Utilities
// Fonctions de parsing et d'aide pour le skill suivi-warhammer
// ============================================================================

// ============================================================================
// Types
// ============================================================================

export interface WarhammerUnit {
  id: string;
  url: string;
  nom: string;
  armée?: string;
  état: 'A acheter' | 'A assembler' | 'A peindre' | 'A socler' | 'Fait' | string;
  note?: string;
  createdTime: string;
}

// États possibles dans le workflow (sans accents comme configuré dans Notion)
export const VALID_STATES = [
  'A acheter',
  'A assembler', 
  'A peindre',
  'A socler',
  'Terminé'
] as const;

export type ValidState = typeof VALID_STATES[number];

// Ordre du workflow
export const WORKFLOW_ORDER: ValidState[] = [
  'A acheter',
  'A assembler', 
  'A peindre',
  'A socler',
  'Terminé'
];

// ============================================================================
// Fonctions de Parsing
// ============================================================================

/**
 * Extrait les informations d'ajout d'une commande
 * Exemples :
 * - "ajoute Space Marine à Space Marines"
 * - "nouvelle unité : Land Raider"
 * - "ajouter Imperial Knight avec note 'urgent'"
 */
export function parseAddCommand(input: string): { nom: string; armée?: string; note?: string; état?: string } | null {
  const trimmed = input.trim();
  
  // Pattern 1: "ajoute [nom] à [armée]"
  const pattern1 = /^(?:ajoute|ajouter|ajoutons)\s+(?:l'|la |le |les |un |une |des |)\s*(?<nom>.+?)\s+(?:à|pour|dans\s+l['']|dans\s+la\s+)(?:armée\s+)?(?<armée>.+)$/i;
  
  // Pattern 2: "nouvelle unité : [nom]"
  const pattern2 = /^(?:nouvelle\s+unité|nouvel\s+élément|add)\s*[:\-–]?\s*(?<nom>.+)$/i;
  
  // Pattern 3: "ajoute [nom]"
  const pattern3 = /^(?:ajoute|ajouter|ajoutons)\s+(?:l'|la |le |les |un |une |des |)\s*(?<nom>.+)$/i;
  
  // Pattern 4: "ajoute [nom] avec (la )?note [note]"
  const pattern4 = /^(?:ajoute|ajouter)\s+(?:l'|la |le |les |un |une |)\s*(?<nom>.+?)\s+(?:avec\s+(?:la\s+)?note\s+)(?<note>"[^"]*"|'[^']*'|[^\s]+.*$)/i;
  
  // Pattern 5: "ajoute [nom] dans l'état [état]"
  const pattern5 = /^(?:ajoute|ajouter)\s+(?:l'|la |le |les |un |une |des |)\s*(?<nom>.+?)\s+(?:dans\s+l['']état\s+|à\s+l['']état\s+|avec\s+l['']état\s+)(?<état>.+)$/i;

  const patterns = [pattern1, pattern2, pattern4, pattern3, pattern5];
  
  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match?.groups) {
      let nom = match.groups.nom.trim();
      let armée = match.groups.armée?.trim();
      let note = match.groups.note?.trim();
      let état = match.groups.état?.trim();
      
      // Nettoyer les guillemets de la note
      if (note) {
        note = note.replace(/^['"]|['"]$/g, '');
      }
      
      // Nettoyer les articles du nom
      nom = cleanName(nom);
      
      if (armée) {
        armée = cleanName(armée);
      }
      
      // Normaliser l'état si fourni
      if (état) {
        état = normalizeState(état);
      }
      
      return { nom, armée, note, état };
    }
  }
  
  return null;
}

/**
 * Extrait les informations de mise à jour d'une commande
 * Exemples :
 * - "passe Space Marine à À assembler"
 * - "met Space Marine en À peindre"
 * - "termine Land Raider"
 * - "avance Imperial Knight"
 */
export function parseUpdateCommand(input: string): { nom: string; état?: string; action?: 'next' | 'previous' | 'set' } | null {
  const trimmed = input.trim();
  
  // Pattern 1: "passe [nom] à [état]"
  const pattern1 = /^(?:passe|met|mets|place|déplace|change)\s+(?<nom>.+?)\s+(?:à|en|au|dans\s+l['']état\s+|vers\s+|en\s+)(?<état>.+)$/i;
  
  // Pattern 2: "[nom] est maintenant [état]"
  const pattern2 = /^(?<nom>.+?)\s+(?:est\s+maintenant|devient|passe\s+à|est\s+en)\s+(?<état>.+)$/i;
  
  // Pattern 3: "termine [nom]"
  const pattern3 = /^(?:termine|termine\s+l['']|marque\s+comme\s+terminé|marque\s+terminé|marque\s+fini|finit)\s+(?<nom>.+)$/i;
  
  // Pattern 4: "avance [nom]"
  const pattern4 = /^(?:avance|fais\s+avancer|passe\s+à\s+l['']étape\s+suivante)\s+(?<nom>.+)$/i;
  
  // Pattern 5: "recule [nom]"
  const pattern5 = /^(?:recule|fais\s+reculer|remets\s+à\s+l['']étape\s+précédente)\s+(?<nom>.+)$/i;
  
  const patterns = [
    { pattern: pattern1, action: 'set' },
    { pattern: pattern2, action: 'set' },
    { pattern: pattern3, action: 'set', état: 'Fait' },
    { pattern: pattern4, action: 'next' },
    { pattern: pattern5, action: 'previous' }
  ];
  
  for (const { pattern, action, état: fixedÉtat } of patterns) {
    const match = trimmed.match(pattern);
    if (match?.groups) {
      const nom = cleanName(match.groups.nom);
      let état = fixedÉtat;
      
      if (!état && match.groups.état) {
        état = normalizeState(match.groups.état);
      }
      
      return { nom, état, action };
    }
  }
  
  return null;
}

/**
 * Extrait les filtres pour la liste
 */
export function parseListCommand(input: string): { armée?: string; état?: string; all?: boolean; stats?: boolean } | null {
  const trimmed = input.trim().toLowerCase();
  
  // Pattern 1: "montre/affiche/liste toutes les unités"
  if (/^(?:montre|affiche|liste|quelles?|quels?|afficher)\s+(?:moi\s+)?(?:toutes?\s+les?\s+)?unités?$/i.test(trimmed)) {
    return { all: true };
  }
  
  // Pattern 2: "liste les unités de [armée]"
  const pattern2 = /^(?:montre|affiche|liste|quelles?|quels?|afficher)\s+(?:les?\s+)?unités?\s+(?:de\s+|d['']|pour\s+|dans\s+l['']|dans\s+la\s+)?(?:armée\s+)?(?<armée>.+)$/i;
  
  // Pattern 3: "quelles unités sont [état]"
  const pattern3 = /^(?:montre|affiche|liste|quelles?|quels?|afficher)\s+(?:les?\s+)?unités?\s+(?:qui\s+sont|qui\s+étaient|etant|état\s+)?(?<état>.+)$/i;
  
  // Pattern 4: "statistiques" ou "compte"
  if (/^(?:compte|statistiques?|stats?|statistiques\s+du\s+suivi|résumé)\s*(?:les?\s+)?unités?$/i.test(trimmed)) {
    return { stats: true };
  }
  
  const patterns = [
    { pattern: pattern2, type: 'army' },
    { pattern: pattern3, type: 'state' }
  ];
  
  for (const { pattern, type } of patterns) {
    const match = trimmed.match(pattern);
    if (match?.groups) {
      const value = match.groups[type === 'army' ? 'armée' : 'état']?.trim();
      if (value) {
        if (type === 'army') {
          return { armée: value };
        } else {
          return { état: normalizeState(value) };
        }
      }
    }
  }
  
  return null;
}

/**
 * Extrait le nom pour la recherche/suppression
 */
export function parseSearchOrDeleteCommand(input: string): { nom: string; action: 'search' | 'delete' | 'find' } | null {
  const trimmed = input.trim();
  
  // Pattern pour recherche
  const searchPatterns = [
    /^(?:cherche|trouve|où\s+est|localise|où\s+se\s+trouve|recherche)\s+(?<nom>.+)$/i,
    /^qu['']est[\s-]ce\s+que\s+(?<nom>.+)$/i,
    /^où\s+(?:en\s+est|est)\s+(?<nom>.+)$/i
  ];
  
  // Pattern pour suppression
  const deletePatterns = [
    /^(?:supprime|retirer|enlève|efface|détruis|remove|delete)\s+(?<nom>.+)$/i,
    /^(?:supprime[\s-]de[\s-]la[\s-]liste)\s+(?<nom>.+)$/i
  ];
  
  for (const pattern of searchPatterns) {
    const match = trimmed.match(pattern);
    if (match?.groups) {
      return { nom: cleanName(match.groups.nom), action: 'search' };
    }
  }
  
  for (const pattern of deletePatterns) {
    const match = trimmed.match(pattern);
    if (match?.groups) {
      return { nom: cleanName(match.groups.nom), action: 'delete' };
    }
  }
  
  return null;
}

// ============================================================================
// Fonctions d'Utilitaires
// ============================================================================

/**
 * Nettoie un nom en supprimant les articles et en normalisant
 */
export function cleanName(name: string): string {
  return name
    .trim()
    .replace(/^(l'|la |le |les |un |une |des |du |de |d'|l)/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normalise un état pour correspondre aux états valides
 * Gère à la fois les versions avec et sans accents
 */
export function normalizeState(state: string): ValidState {
  const normalized = state
    .trim()
    .replace(/:/g, '')
    .trim();
  
  // Mapping des variantes (avec et sans accents)
  const stateMap: Record<string, ValidState> = {
    // Sans accents (format Notion)
    'a acheter': 'A acheter',
    'a assembler': 'A assembler',
    'a peindre': 'A peindre',
    'a socler': 'A socler',
    'terminé': 'Terminé',
    
    // Avec accents (pour compatibilité)
    'à acheter': 'A acheter',
    'à assembler': 'A assembler',
    'à peindre': 'A peindre',
    'à socler': 'A socler',
    'termine': 'Terminé',
    'fini': 'Terminé',
    'complet': 'Terminé',
    'complété': 'Terminé',
    'fait': 'Terminé',
    'pas commencé': 'A acheter',
    'en cours': 'A assembler'
  };
  
  const lowerNormalized = normalized.toLowerCase();
  for (const [key, value] of Object.entries(stateMap)) {
    if (lowerNormalized.includes(key.toLowerCase())) {
      return value;
    }
  }
  
  // Si pas de correspondance, vérifier si c'est un état valide
  if (VALID_STATES.includes(normalized as ValidState)) {
    return normalized as ValidState;
  }
  
  // Retourner le premier état par défaut
  console.warn(`État non reconnu: "${state}", normalisé: "${normalized}"`);
  return 'A acheter';
}

/**
 * Trouve l'index d'un état dans le workflow
 */
export function getStateIndex(état: string): number {
  const normalized = normalizeState(état);
  return WORKFLOW_ORDER.indexOf(normalized);
}

/**
 * Obtient l'état suivant dans le workflow
 */
export function getNextState(état: string): ValidState {
  const index = getStateIndex(état);
  if (index < WORKFLOW_ORDER.length - 1) {
    return WORKFLOW_ORDER[index + 1];
  }
  return WORKFLOW_ORDER[WORKFLOW_ORDER.length - 1]; // Reste sur Fait
}

/**
 * Obtient l'état précédent dans le workflow
 */
export function getPreviousState(état: string): ValidState {
  const index = getStateIndex(état);
  if (index > 0) {
    return WORKFLOW_ORDER[index - 1];
  }
  return WORKFLOW_ORDER[0]; // Reste sur A acheter
}

/**
 * Vérifie si un état est valide
 */
export function isValidState(état: string): état is ValidState {
  return VALID_STATES.includes(normalizeState(état) as ValidState);
}

// ============================================================================
// Constantes
// ============================================================================

export const DATABASE_CONFIG = {
  pageId: 'YOUR_NOTION_ID',
  pageUrl: 'https://app.notion.com/p/YOUR_PAGE_NAME-YOUR_NOTION_ID',
  databaseUrl: 'https://app.notion.com/p/YOUR_NOTION_ID',
  dataSourceUrl: 'collection://YOUR_NOTION_ID'
};

export const PROPERTY_NAMES = {
  nom: 'Nom',
  armée: 'Armée',
  état: 'État',
  note: 'Note'
} as const;
