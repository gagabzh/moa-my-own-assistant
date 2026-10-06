/**
 * Test script for Notesnook Shopping List Skill
 * Run this to verify your configuration works
 */

import {
  getNotesnookConfig,
  addToShoppingList,
  getShoppingList,
  markAsBought,
  removeFromShoppingList,
  clearShoppingList,
  parseAddCommand,
  parseRemoveCommand,
  parseMarkCommand,
  parseShowCommand,
  parseClearCommand
} from './utils';

async function runTests() {
  console.log('=== Test de configuration Notesnook ===\n');
  
  try {
    // Test 1: Configuration
    console.log('Test 1: Chargement de la configuration...');
    const config = await getNotesnookConfig();
    console.log('✓ Configuration chargée');
    console.log(`  API Key: ${config.api_key.substring(0, 8)}...`);
    console.log(`  Note ID: ${config.note_id}\n`);
    
    // Test 2: Parse commands
    console.log('Test 2: Parsing des commandes...');
    const addTests = [
      'ajoute des carottes à ma liste de courses',
      'ajoute du lait',
      '2 kg de pommes',
      'mets des œufs dans ma liste'
    ];
    
    for (const cmd of addTests) {
      const result = parseAddCommand(cmd);
      console.log(`  "${cmd}" → ${result ? `item: "${result.item}"${result.quantity ? `, quantity: "${result.quantity}"` : ''}` : 'null'}`);
    }
    
    const removeTests = [
      'retirer les carottes de ma liste',
      'enlève le lait',
      'supprime les œufs'
    ];
    
    for (const cmd of removeTests) {
      const result = parseRemoveCommand(cmd);
      console.log(`  "${cmd}" → ${result ? `"${result}"` : 'null'}`);
    }
    
    const markTests = [
      'marque les carottes comme achetées',
      'j\'ai acheté le lait',
      'coche les œufs'
    ];
    
    for (const cmd of markTests) {
      const result = parseMarkCommand(cmd);
      console.log(`  "${cmd}" → ${result ? `"${result}"` : 'null'}`);
    }
    
    console.log('\nTest 3: Communication avec l\'API Notesnook...');
    
    // Test 3a: Get shopping list
    console.log('  Récupération de la liste...');
    const listResult = await getShoppingList();
    if (listResult.success) {
      console.log(`  ✓ Liste récupérée: ${listResult.list?.length || 0} éléments`);
      if (listResult.list && listResult.list.length > 0) {
        console.log('  Éléments actuels:');
        for (const item of listResult.list) {
          console.log(`    - ${item}`);
        }
      }
    } else {
      console.log(`  ❌ Erreur: ${listResult.error}`);
    }
    
    // Test 3b: Add item
    console.log('\n  Ajout d\'un élément de test...');
    const testItem = `test-${Date.now()}`;
    const addResult = await addToShoppingList(testItem);
    if (addResult.success) {
      console.log(`  ✓ "${addResult.item}" ajouté`);
    } else {
      console.log(`  ❌ Erreur: ${addResult.error}`);
    }
    
    // Test 3c: Mark as bought
    console.log('\n  Marquage comme acheté...');
    const markResult = await markAsBought(testItem);
    if (markResult.success) {
      console.log(`  ✓ "${markResult.item}" marqué comme acheté`);
    } else {
      console.log(`  ❌ Erreur: ${markResult.error}`);
    }
    
    // Test 3d: Remove item
    console.log('\n  Retrait de l\'élément de test...');
    const removeResult = await removeFromShoppingList(testItem);
    if (removeResult.success) {
      console.log(`  ✓ "${removeResult.item}" retiré`);
    } else {
      console.log(`  ❌ Erreur: ${removeResult.error}`);
    }
    
    console.log('\n=== Tous les tests terminés ===');
    
  } catch (error) {
    console.error('\n❌ Erreur lors des tests:', error);
    process.exit(1);
  }
}

// Run if this is the main module
if (typeof window === 'undefined') {
  // Node.js environment
  runTests().catch(console.error);
} else {
  // Browser environment (Vibe sandbox)
  // Export for use in Vibe
  (globalThis as any).runShoppingListTests = runTests;
}
