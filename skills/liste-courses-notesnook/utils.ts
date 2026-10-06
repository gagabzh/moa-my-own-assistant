/**
 * Utilities for Notesnook Shopping List Integration
 */

// Types
export interface NotesnookConfig {
  api_key: string;
  note_id: string;
}

export interface ShoppingListResult {
  success: boolean;
  item?: string;
  error?: string;
  list?: string[];
}

/**
 * Parse add command from user input
 * Examples: "ajoute des carottes à ma liste de courses", "ajoute du lait", "2 kg de pommes"
 */
export function parseAddCommand(userInput: string): { item: string; quantity?: string } | null {
  const patterns = [
    // "ajoute des carottes à ma liste de courses"
    /ajoute(?:r)?\s+(?:des?|du|de la?|la|le|les?|un|une)\s*(.+?)(?:\s+à ma liste de courses|\s+à la liste|\s+dans ma liste|$)/i,
    // "mets des œufs dans ma liste"
    /mets?\s+(?:des?|du|de la?|la|le|les?|un|une)\s*(.+?)(?:\s+dans ma liste|\s+à ma liste|$)/i,
    // "je veux du pain"
    /je veux\s+(?:du|de la|des|le|la|les|un|une)?\s*(.+)/i,
    // "ajouter des pommes"
    /ajouter\s+(?:des?|du|de la?|la|le|les?|un|une)?\s*(.+?)(?:\s+à ma liste|\s+à la liste|$)/i,
    // "il me faut du café"
    /il me faut\s+(?:du|de la|des|le|la|les|un|une)?\s*(.+)/i,
    // "prends du beurre"
    /prends?\s+(?:du|de la|des|le|la|les|un|une)?\s*(.+?)(?:\s+pour?\s+ma liste|$)/i,
  ];

  for (const pattern of patterns) {
    const match = userInput.match(pattern);
    if (match) {
      let item = match[1].trim();
      
      // Clean remaining articles
      item = item.replace(/^(un|une|des|du|de la|la|le|les|d')\s+/i, '');
      
      // Extract quantity if present (e.g., "2 kg", "500 g", "3 pieces")
      const quantityMatch = item.match(/^(\d+\s*(?:kg|g|L|l|ml|cl|m|mL|pieces?|pièces?|boîtes?|boites?|paquets?|sachets?|bouteilles?|kilos?|grammes?|litres?|millilitres?))\s+)/i);
      const quantity = quantityMatch ? quantityMatch[1].trim() : undefined;
      
      if (quantity) {
        item = item.substring(quantity.length).trim();
      }
      
      // Clean up common typos and normalize
      item = item
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/^d$/i, '') // Remove lone "d'" from "d'"
        .replace(/^de$/i, '') // Remove lone "de"
        .trim();

      if (item) {
        return { item, quantity };
      }
    }
  }
  return null;
}

/**
 * Parse remove command from user input
 * Examples: "retirer les carottes", "enlève le lait", "supprime les œufs"
 */
export function parseRemoveCommand(userInput: string): string | null {
  const patterns = [
    // "retirer les carottes de ma liste"
    /(?:retirer|enlève|enlever|supprime|supprimer|ôte|ôter)\s+(?:les?|la|le|des?|du|de la?|d')\s*(.+?)(?:\s+(?:de|à) ma liste de courses|\s+(?:de|à) la liste|\s+de ma liste|$)/i,
    // "vire le pain"
    /vire\s+(?:le|la|les|du|de la|des?)\s*(.+?)(?:\s+de ma liste|$)/i,
    // "plus besoin de lait"
    /plus besoin\s+(?:de|du|de la|d')\s*(.+?)(?:\s+dans ma liste|$)/i,
  ];

  for (const pattern of patterns) {
    const match = userInput.match(pattern);
    if (match) {
      let item = match[1].trim();
      item = item.replace(/^(les?|la|le|des?|du|de la|d')\s+/i, '');
      return item.replace(/\s+/g, ' ').trim();
    }
  }
  return null;
}

/**
 * Parse mark as bought command from user input
 * Examples: "marque les carottes comme achetées", "j'ai acheté le lait"
 */
export function parseMarkCommand(userInput: string): string | null {
  const patterns = [
    // "marque les carottes comme achetées"
    /(?:marque|marquer|coche|cocher|valide|valider)\s+(?:les?|la|le|des?|du|de la|d')\s*(.+?)\s+comme\s+(?:achetés?|achetées?|fait|fini|OK|acheté|achetée)/i,
    // "j'ai acheté le lait"
    /j'ai\s+(?:acheté|achetée|achetés|achetées|pris|prise|acheter)\s+(?:les?|la|le|des?|du|de la|d')\s*(.+)/i,
    // "j'ai le lait" (context: just bought it)
    /j'ai\s+(?:le|la|les|du|de la|des?|d')\s*(.+?)(?:\s+acheté|\s+achetée|$)/i,
    // "c'est bon pour les œufs"
    /c'est bon\s+(?:pour|avec)\s+(?:les?|la|le|des?)\s*(.+)/i,
    // "j'ai pris du beurre"
    /j'ai\s+pris\s+(?:du|de la|des|le|la|les|d')\s*(.+)/i,
  ];

  for (const pattern of patterns) {
    const match = userInput.match(pattern);
    if (match) {
      let item = match[1].trim();
      item = item.replace(/^(les?|la|le|des?|du|de la|d')\s+/i, '');
      return item.replace(/\s+/g, ' ').trim();
    }
  }
  return null;
}

/**
 * Parse show list command from user input
 */
export function parseShowCommand(userInput: string): boolean {
  const lowerInput = userInput.toLowerCase();
  const patterns = [
    /(?:montre|montrez|affiche|afficher|affiches|qu'est-ce qu'il y a|quoi dans|liste)\s+(?:moi\s+)?(?:ma|la)?\s*liste\s+(?:de courses|de course)/i,
    /(?:quelle|quelles?|quels?)\s+(?:est|sont)\s+(?:ma|la)?\s*liste\s+(?:de courses|de course)/i,
    /je veux voir\s+(?:ma|la)?\s*liste\s+(?:de courses|de course)/i,
    /ma liste\s+(?:de courses|de course)/i,
    /liste\s+(?:de courses|de course)/i,
  ];

  return patterns.some(pattern => pattern.test(userInput));
}

/**
 * Parse clear list command from user input
 */
export function parseClearCommand(userInput: string): boolean {
  const lowerInput = userInput.toLowerCase();
  const patterns = [
    /(?:vide|vider|efface|effacer|supprime|supprimer|remets?|remettre)\s+(?:à zéro\s+)?(?:ma|la)?\s*liste\s+(?:de courses|de course)/i,
    /(?:réinitialise|réinitialiser|reset|remet)\s+(?:ma|la)?\s*liste\s+(?:de courses|de course)/i,
    /(?:tout|toute)\s+(?:effacer|supprimer|vider)\s+(?:de|dans)\s+(?:ma|la)?\s*liste/i,
    /plus rien\s+(?:dans|sur)\s+(?:ma|la)?\s*liste\s+(?:de courses|de course)/i,
  ];

  return patterns.some(pattern => pattern.test(userInput));
}

/**
 * Get Notesnook configuration from environment or config file
 */
export async function getNotesnookConfig(): Promise<NotesnookConfig> {
  // 1. Try environment variables
  const apiKey = process.env.NOTESNOOK_API_KEY || process.env.NOTESNOOK_TOKEN;
  const noteId = process.env.NOTESNOOK_NOTE_ID || process.env.NOTESNOOK_SHOPPING_LIST_ID;
  
  if (apiKey && noteId) {
    return { api_key: apiKey, note_id: noteId };
  }
  
  // 2. Try reading from config file
  try {
    // Try home directory config
    const homeConfigPath = '/home/gaga/.notesnook-config.json';
    const config = await (globalThis as any).tools.read_file({ path: homeConfigPath });
    const configData = JSON.parse(config.content) as NotesnookConfig;
    
    if (configData.api_key && configData.note_id) {
      return configData;
    }
  } catch (e) {
    // Config file doesn't exist or is invalid, continue
    console.log('No Notesnook config file found at ~/.notesnook-config.json');
  }
  
  // 3. Try project-local config
  try {
    const localConfigPath = '/home/gaga/.vibe/skills/liste-courses-notesnook/config.json';
    const config = await (globalThis as any).tools.read_file({ path: localConfigPath });
    const configData = JSON.parse(config.content) as NotesnookConfig;
    
    if (configData.api_key && configData.note_id) {
      return configData;
    }
  } catch (e) {
    // Config file doesn't exist or is invalid, continue
  }
  
  throw new Error(
    'Configuration Notesnook manquante. ' +
    'Veuillez configurer NOTESNOOK_API_KEY et NOTESNOOK_NOTE_ID dans vos variables d\'environnement, ' +
    'ou créer un fichier ~/.notesnook-config.json avec {"api_key": "...", "note_id": "..."}'
  );
}

/**
 * Add item to shopping list in Notesnook via Inbox API
 * Uses the correct API format according to Notesnook Inbox API documentation
 */
export async function addToShoppingList(item: string, quantity?: string): Promise<ShoppingListResult> {
  try {
    const config = await getNotesnookConfig();
    const fullItem = quantity ? `${quantity} ${item}` : item;
    const htmlContent = `<p>- [ ] ${fullItem}</p>`;
    
    const response = await (globalThis as any).tools.web_fetch({
      url: 'https://inbox.notesnook.com/',
      method: 'POST',
      headers: {
        'Authorization': config.api_key,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: "Liste de courses",
        type: "note",
        source: "vibe",
        version: 1,
        note_id: config.note_id,
        content: {
          type: "html",
          data: htmlContent
        }
      })
    });
    
    if (response.status !== 200 && response.status !== 201) {
      throw new Error(`Erreur API Notesnook: ${response.status} - ${JSON.stringify(response.body || response.error || '')}`);
    }
    
    return { success: true, item: fullItem };
  } catch (error) {
    console.error('Error adding to shopping list:', error);
    return { 
      success: false, 
      item, 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    };
  }
}

/**
 * Get shopping list items from Notesnook
 * Note: The Inbox API doesn't provide a direct way to read notes.
 * We need to use the main API to fetch the note content.
 */
export async function getShoppingList(): Promise<ShoppingListResult> {
  try {
    const config = await getNotesnookConfig();
    
    // Use the main Notesnook API to get note content
    const response = await (globalThis as any).tools.web_fetch({
      url: `https://api.notesnook.com/api/v1/notes/${config.note_id}`,
      headers: {
        'Authorization': config.api_key
      }
    });
    
    if (response.status !== 200) {
      throw new Error(`Erreur API Notesnook: ${response.status} - ${JSON.stringify(response.body || response.error || '')}`);
    }
    
    // Parse the content to extract list items
    // The response contains HTML content
    const content = typeof response.body === 'string' ? response.body : 
                   (response.body?.content || response.body?.data?.content || '');
    
    // Convert HTML to text for parsing (simple approach)
    const textContent = content.replace(/<[^>]*>/g, '\n');
    const lines = textContent.split('\n');
    const shoppingItems: string[] = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('- [ ]') || trimmed.startsWith('- [x]')) {
        const match = trimmed.match(/^- \[( |x)\]\s*(.+)/);
        if (match) {
          shoppingItems.push(match[2].trim());
        }
      }
    }
    
    return { success: true, list: shoppingItems };
  } catch (error) {
    console.error('Error getting shopping list:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    };
  }
}

/**
 * Mark item as bought in the shopping list
 * Uses the main API to update the note content
 */
export async function markAsBought(item: string): Promise<ShoppingListResult> {
  try {
    const config = await getNotesnookConfig();
    
    // Get current note content
    let content = await getFullNoteContent(config);
    
    // Replace unchecked items with checked ones
    const pattern = new RegExp(`(<p>)- \[ \]\s*(${escapeRegExp(item)})(<\/p>)`, 'i');
    const updatedContent = content.replace(pattern, `<p>- [x] $2</p>`);
    
    if (updatedContent === content) {
      throw new Error(`Élément "${item}" non trouvé dans la liste`);
    }
    
    // Update the note using main API
    const response = await (globalThis as any).tools.web_fetch({
      url: `https://api.notesnook.com/api/v1/notes/${config.note_id}/content`,
      method: 'PUT',
      headers: {
        'Authorization': config.api_key,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: {
          data: updatedContent,
          type: 'html'
        }
      })
    });
    
    if (response.status !== 200) {
      throw new Error(`Erreur API Notesnook: ${response.status} - ${JSON.stringify(response.body || response.error || '')}`);
    }
    
    return { success: true, item };
  } catch (error) {
    console.error('Error marking item as bought:', error);
    return { 
      success: false, 
      item, 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    };
  }
}

/**
 * Escape special regex characters
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Remove item from shopping list
 */
export async function removeFromShoppingList(item: string): Promise<ShoppingListResult> {
  try {
    const config = await getNotesnookConfig();
    
    // Get current note content
    let content = await getFullNoteContent(config);
    
    // Remove lines containing the item (both checked and unchecked)
    const pattern = new RegExp(`(<p>)- \[( |x)\]\s*(${escapeRegExp(item)})(<\/p>)`, 'i');
    const updatedContent = content.replace(pattern, '');
    
    if (updatedContent === content) {
      throw new Error(`Élément "${item}" non trouvé dans la liste`);
    }
    
    // Update the note
    const response = await (globalThis as any).tools.web_fetch({
      url: `https://api.notesnook.com/api/v1/notes/${config.note_id}/content`,
      method: 'PUT',
      headers: {
        'Authorization': config.api_key,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: {
          data: updatedContent,
          type: 'html'
        }
      })
    });
    
    if (response.status !== 200) {
      throw new Error(`Erreur API Notesnook: ${response.status} - ${JSON.stringify(response.body || response.error || '')}`);
    }
    
    return { success: true, item };
  } catch (error) {
    console.error('Error removing from shopping list:', error);
    return { 
      success: false, 
      item, 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    };
  }
}

/**
 * Clear the entire shopping list
 */
export async function clearShoppingList(): Promise<ShoppingListResult> {
  try {
    const config = await getNotesnookConfig();
    
    const response = await (globalThis as any).tools.web_fetch({
      url: `https://api.notesnook.com/api/v1/notes/${config.note_id}/content`,
      method: 'PUT',
      headers: {
        'Authorization': config.api_key,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: {
          data: '<p><strong>Liste de courses</strong></p>',
          type: 'html'
        }
      })
    });
    
    if (response.status !== 200) {
      throw new Error(`Erreur API Notesnook: ${response.status} - ${JSON.stringify(response.body || response.error || '')}`);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error clearing shopping list:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    };
  }
}

/**
 * Get full note content from Notesnook
 */
async function getFullNoteContent(config: NotesnookConfig): Promise<string> {
  const response = await (globalThis as any).tools.web_fetch({
    url: `https://api.notesnook.com/api/v1/notes/${config.note_id}`,
    headers: {
      'Authorization': config.api_key
    }
  });
  
  if (response.status !== 200) {
    throw new Error(`Erreur API Notesnook: ${response.status} - ${JSON.stringify(response.body || response.error || '')}`);
  }
  
  // The response contains HTML content
  const content = typeof response.body === 'string' ? response.body : 
                 (response.body?.content || response.body?.data?.content || '');
  return content;
}

/**
 * Main handler function to process user commands
 */
export async function handleShoppingListCommand(userInput: string): Promise<string | null> {
  try {
    // 1. Add item
    const addResult = parseAddCommand(userInput);
    if (addResult) {
      const result = await addToShoppingList(addResult.item, addResult.quantity);
      if (result.success) {
        return `✓ Ajouté "${result.item}" à ta liste de courses.`;
      } else {
        return `❌ Erreur lors de l'ajout : ${result.error}`;
      }
    }
    
    // 2. Mark as bought
    const markResult = parseMarkCommand(userInput);
    if (markResult) {
      const result = await markAsBought(markResult);
      if (result.success) {
        return `✓ "${result.item}" marqué comme acheté.`;
      } else {
        return `❌ Erreur : ${result.error}`;
      }
    }
    
    // 3. Remove item
    const removeResult = parseRemoveCommand(userInput);
    if (removeResult) {
      const result = await removeFromShoppingList(removeResult);
      if (result.success) {
        return `✓ "${result.item}" retiré de ta liste de courses.`;
      } else {
        return `❌ Erreur : ${result.error}`;
      }
    }
    
    // 4. Show list
    if (parseShowCommand(userInput)) {
      const result = await getShoppingList();
      if (result.success && result.list) {
        if (result.list.length === 0) {
          return 'Ta liste de courses est vide.';
        }
        return `**Liste de courses** :\n${result.list.map(item => `- ${item}`).join('\n')}`;
      } else {
        return `❌ Erreur lors de la récupération de la liste : ${result.error}`;
      }
    }
    
    // 5. Clear list
    if (parseClearCommand(userInput)) {
      const result = await clearShoppingList();
      if (result.success) {
        return 'Ta liste de courses a été vidée.';
      } else {
        return `❌ Erreur : ${result.error}`;
      }
    }
    
    // Command not recognized by this skill
    return null;
  } catch (error) {
    console.error('Error in handleShoppingListCommand:', error);
    return `❌ Erreur inattendue : ${error instanceof Error ? error.message : 'Erreur inconnue'}`;
  }
}
