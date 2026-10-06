// ============================================================================
// Suivi Warhammer - Tests
// Script de test pour le skill suivi-warhammer
// ============================================================================

import {
  getAllUnits,
  addUnit,
  updateUnitStatus,
  deleteUnit,
  findUnitByName,
  findUnitsByCriteria,
  formatUnitList,
  formatUnitDetails,
  formatStatistics,
  parseAddCommand,
  parseUpdateCommand,
  parseListCommand,
  parseSearchOrDeleteCommand,
  normalizeState,
  getNextState,
  getPreviousState,
  cleanName
} from './utils';

// ============================================================================
// Tests Unitaires
// ============================================================================

function runUnitTests() {
  console.log('🧪 Exécution des tests unitaires...\n');
  
  let passed = 0;
  let failed = 0;
  
  // Test 1: cleanName
  console.log('Test 1: cleanName');
  const test1a = cleanName('le Space Marine') === 'Space Marine';
  const test1b = cleanName('la Tactical Squad') === 'Tactical Squad';
  const test1c = cleanName('un Land Raider') === 'Land Raider';
  const test1d = cleanName('des Imperial Knights') === 'Imperial Knights';
  
  if (test1a && test1b && test1c && test1d) {
    console.log('  ✓ cleanName fonctionne correctement');
    passed += 4;
  } else {
    console.log('  ✗ cleanName a échoué');
    failed += 4;
  }
  
  // Test 2: normalizeState
  console.log('\nTest 2: normalizeState');
  const test2a = normalizeState('à peindre') === 'À peindre';
  const test2b = normalizeState('a acheter') === 'À acheter';
  const test2c = normalizeState('termine') === 'Terminé';
  const test2d = normalizeState('fini') === 'Terminé';
  
  if (test2a && test2b && test2c && test2d) {
    console.log('  ✓ normalizeState fonctionne correctement');
    passed += 4;
  } else {
    console.log('  ✗ normalizeState a échoué');
    failed += 4;
  }
  
  // Test 3: getNextState
  console.log('\nTest 3: getNextState');
  const test3a = getNextState('Pas commencé') === 'À acheter';
  const test3b = getNextState('À acheter') === 'À assembler';
  const test3c = getNextState('À assembler') === 'À peindre';
  const test3d = getNextState('À peindre') === 'À socler';
  const test3e = getNextState('À socler') === 'Terminé';
  const test3f = getNextState('Terminé') === 'Terminé';
  
  if (test3a && test3b && test3c && test3d && test3e && test3f) {
    console.log('  ✓ getNextState fonctionne correctement');
    passed += 6;
  } else {
    console.log('  ✗ getNextState a échoué');
    failed += 6;
  }
  
  // Test 4: getPreviousState
  console.log('\nTest 4: getPreviousState');
  const test4a = getPreviousState('À acheter') === 'Pas commencé';
  const test4b = getPreviousState('À assembler') === 'À acheter';
  const test4c = getPreviousState('À peindre') === 'À assembler';
  const test4d = getPreviousState('À socler') === 'À peindre';
  const test4e = getPreviousState('Terminé') === 'À socler';
  const test4f = getPreviousState('Pas commencé') === 'Pas commencé';
  
  if (test4a && test4b && test4c && test4d && test4e && test4f) {
    console.log('  ✓ getPreviousState fonctionne correctement');
    passed += 6;
  } else {
    console.log('  ✗ getPreviousState a échoué');
    failed += 6;
  }
  
  // Test 5: parseAddCommand
  console.log('\nTest 5: parseAddCommand');
  const test5a = parseAddCommand('ajoute Space Marine à Space Marines');
  const test5b = parseAddCommand('nouvelle unité : Land Raider');
  const test5c = parseAddCommand("ajoute Imperial Knight avec note 'urgent'");
  
  const test5aOk = test5a && test5a.nom === 'Space Marine' && test5a.armée === 'Space Marines';
  const test5bOk = test5b && test5b.nom === 'Land Raider';
  const test5cOk = test5c && test5c.nom === 'Imperial Knight' && test5c.note === 'urgent';
  
  if (test5aOk && test5bOk && test5cOk) {
    console.log('  ✓ parseAddCommand fonctionne correctement');
    passed += 3;
  } else {
    console.log('  ✗ parseAddCommand a échoué');
    console.log('    test5a:', test5a);
    console.log('    test5b:', test5b);
    console.log('    test5c:', test5c);
    failed += 3;
  }
  
  // Test 6: parseUpdateCommand
  console.log('\nTest 6: parseUpdateCommand');
  const test6a = parseUpdateCommand('passe Space Marine à À assembler');
  const test6b = parseUpdateCommand('termine Land Raider');
  const test6c = parseUpdateCommand('avance Imperial Knight');
  
  const test6aOk = test6a && test6a.nom === 'Space Marine' && test6a.état === 'À assembler';
  const test6bOk = test6b && test6b.nom === 'Land Raider' && test6b.état === 'Terminé';
  const test6cOk = test6c && test6c.nom === 'Imperial Knight' && test6c.action === 'next';
  
  if (test6aOk && test6bOk && test6cOk) {
    console.log('  ✓ parseUpdateCommand fonctionne correctement');
    passed += 3;
  } else {
    console.log('  ✗ parseUpdateCommand a échoué');
    failed += 3;
  }
  
  // Test 7: parseListCommand
  console.log('\nTest 7: parseListCommand');
  const test7a = parseListCommand('montre toutes les unités');
  const test7b = parseListCommand('liste les unités de Space Marines');
  const test7c = parseListCommand('quelles unités sont À peindre');
  const test7d = parseListCommand('statistiques');
  
  const test7aOk = test7a && test7a.all === true;
  const test7bOk = test7b && test7b.armée === 'Space Marines';
  const test7cOk = test7c && test7c.état === 'À peindre';
  const test7dOk = test7d && test7d.stats === true;
  
  if (test7aOk && test7bOk && test7cOk && test7dOk) {
    console.log('  ✓ parseListCommand fonctionne correctement');
    passed += 4;
  } else {
    console.log('  ✗ parseListCommand a échoué');
    failed += 4;
  }
  
  // Test 8: parseSearchOrDeleteCommand
  console.log('\nTest 8: parseSearchOrDeleteCommand');
  const test8a = parseSearchOrDeleteCommand('cherche Space Marine');
  const test8b = parseSearchOrDeleteCommand('supprime Land Raider');
  const test8c = parseSearchOrDeleteCommand('où est Imperial Knight');
  
  const test8aOk = test8a && test8a.nom === 'Space Marine' && test8a.action === 'search';
  const test8bOk = test8b && test8b.nom === 'Land Raider' && test8b.action === 'delete';
  const test8cOk = test8c && test8c.nom === 'Imperial Knight' && test8c.action === 'search';
  
  if (test8aOk && test8bOk && test8cOk) {
    console.log('  ✓ parseSearchOrDeleteCommand fonctionne correctement');
    passed += 3;
  } else {
    console.log('  ✗ parseSearchOrDeleteCommand a échoué');
    failed += 3;
  }
  
  // Résumé
  console.log('\n' + '='.repeat(50));
  console.log(`Tests unitaires : ${passed} ✓, ${failed} ✗`);
  console.log('='.repeat(50));
  
  return { passed, failed };
}

// ============================================================================
// Tests d'Intégration
// ============================================================================

async function runIntegrationTests() {
  console.log('\n🔗 Exécution des tests d\'intégration...\n');
  
  let passed = 0;
  let failed = 0;
  
  try {
    // Test 1: Récupérer toutes les unités
    console.log('Test 1: Récupérer toutes les unités');
    const units = await getAllUnits();
    if (Array.isArray(units)) {
      console.log(`  ✓ Récupéré ${units.length} unités`);
      passed++;
    } else {
      console.log('  ✗ Échec de la récupération des unités');
      failed++;
    }
    
    // Test 2: Formater la liste
    console.log('\nTest 2: Formater la liste');
    if (units.length > 0) {
      const formatted = formatUnitList(units.slice(0, 2));
      if (formatted.includes('unité(s) trouvée(s)')) {
        console.log('  ✓ Formatage de la liste fonctionne');
        passed++;
      } else {
        console.log('  ✗ Formatage de la liste a échoué');
        failed++;
      }
    }
    
    // Test 3: Formater les statistiques
    console.log('\nTest 3: Formater les statistiques');
    if (units.length > 0) {
      const stats = formatStatistics(units);
      if (stats.includes('Statistiques') && stats.includes('Total')) {
        console.log('  ✓ Formatage des statistiques fonctionne');
        passed++;
      } else {
        console.log('  ✗ Formatage des statistiques a échoué');
        failed++;
      }
    }
    
    // Test 4: Trouver une unité
    console.log('\nTest 4: Trouver une unité');
    if (units.length > 0) {
      const searchName = units[0].nom;
      const found = await findUnitByName(searchName);
      if (found && found.nom === searchName) {
        console.log(`  ✓ Trouvé l'unité "${searchName}"`);
        passed++;
      } else {
        console.log(`  ✗ Échec de la recherche de l'unité "${searchName}"`);
        failed++;
      }
    }
    
    // Test 5: Filtrer par critères
    console.log('\nTest 5: Filtrer par critères');
    const filtered = await findUnitsByCriteria({ état: 'Terminé' });
    if (Array.isArray(filtered)) {
      console.log(`  ✓ Filtré ${filtered.length} unités avec état "Terminé"`);
      passed++;
    } else {
      console.log('  ✗ Échec du filtrage');
      failed++;
    }
    
    // Test 6: Formater les détails d'une unité
    console.log('\nTest 6: Formater les détails d\'une unité');
    if (units.length > 0) {
      const details = formatUnitDetails(units[0]);
      if (details.includes(units[0].nom) && details.includes('Armée')) {
        console.log('  ✓ Formatage des détails fonctionne');
        passed++;
      } else {
        console.log('  ✗ Formatage des détails a échoué');
        failed++;
      }
    }
    
  } catch (error) {
    console.error('  ✗ Erreur lors des tests d\'intégration:', error);
    failed += 6;
  }
  
  // Résumé
  console.log('\n' + '='.repeat(50));
  console.log(`Tests d'intégration : ${passed} ✓, ${failed} ✗`);
  console.log('='.repeat(50));
  
  return { passed, failed };
}

// ============================================================================
// Fonction principale de test
// ============================================================================

async function main() {
  console.log('═'.repeat(50));
  console.log('🎯 Tests du Skill Suivi Warhammer');
  console.log('═'.repeat(50));
  
  // Exécuter les tests unitaires
  const unitResults = runUnitTests();
  
  // Exécuter les tests d'intégration
  const integrationResults = await runIntegrationTests();
  
  // Résumé final
  console.log('\n' + '═'.repeat(50));
  console.log('📊 RÉSULTATS FINAUX');
  console.log('═'.repeat(50));
  console.log(`Tests unitaires    : ${unitResults.passed} ✓, ${unitResults.failed} ✗`);
  console.log(`Tests intégration  : ${integrationResults.passed} ✓, ${integrationResults.failed} ✗`);
  console.log(`Total             : ${unitResults.passed + integrationResults.passed} ✓, ${unitResults.failed + integrationResults.failed} ✗`);
  console.log('═'.repeat(50));
  
  if (unitResults.failed === 0 && integrationResults.failed === 0) {
    console.log('\n🎉 Tous les tests ont réussi !');
  } else {
    console.log('\n⚠️  Certains tests ont échoué. Vérifiez les messages d\'erreur.');
  }
}

// Exécuter les tests si ce fichier est exécuté directement
main().catch(console.error);

export {
  runUnitTests,
  runIntegrationTests
};
