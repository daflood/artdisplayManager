#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';

// Load all results
const qnap = JSON.parse(readFileSync('/home/jamessink/qnap-16x9-results.json', 'utf8'));
const filtered = JSON.parse(readFileSync('/home/jamessink/filtered-16x9-results.json', 'utf8'));

// Combine matches
const allMatches = [
  ...qnap.matches,
  ...filtered.matches
];

console.log(`Total 16:9 files: ${allMatches.length}`);
console.log(`  From QNAP: ${qnap.matches.length}`);
console.log(`  From local drives: ${filtered.matches.length}`);

// Save combined results
writeFileSync('/home/jamessink/final-16x9-collection.json', JSON.stringify({
  totalMatches: allMatches.length,
  sources: {
    qnap: qnap.matches.length,
    localDrives: filtered.matches.length
  },
  matches: allMatches
}, null, 2));

// Create a simple list of file paths
const pathList = allMatches.map(m => m.path).sort().join('\n');
writeFileSync('/home/jamessink/final-16x9-paths.txt', pathList);

console.log('\n✓ Saved final collection to ~/final-16x9-collection.json');
console.log('✓ Saved file paths to ~/final-16x9-paths.txt');
