#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { dirname } from 'path';

// Load all three JSON files
const blaze = JSON.parse(readFileSync('/home/jamessink/blaze-16x9-results.json', 'utf8'));
const blaze2 = JSON.parse(readFileSync('/home/jamessink/blaze2-16x9-results.json', 'utf8'));
const fatssd = JSON.parse(readFileSync('/home/jamessink/fatssd-16x9-results.json', 'utf8'));

// Combine all matches
const allMatches = [
  ...blaze.matches,
  ...blaze2.matches,
  ...fatssd.matches
];

console.log(`Total matches: ${allMatches.length}`);

// Filter out duplicates
const uniqueMatches = allMatches.filter(m => !m.isDuplicate);
console.log(`Unique matches (no duplicates): ${uniqueMatches.length}`);

// Group by directory
const dirCounts = {};
uniqueMatches.forEach(match => {
  const dir = dirname(match.path);
  if (!dirCounts[dir]) {
    dirCounts[dir] = {
      count: 0,
      images: 0,
      videos: 0,
      files: []
    };
  }
  dirCounts[dir].count++;
  if (match.type === 'image') dirCounts[dir].images++;
  if (match.type === 'video') dirCounts[dir].videos++;
  dirCounts[dir].files.push(match.path);
});

// Sort directories by count
const sortedDirs = Object.entries(dirCounts)
  .sort((a, b) => b[1].count - a[1].count);

console.log('\n=== Top Directories by File Count ===\n');
sortedDirs.slice(0, 50).forEach(([dir, data]) => {
  console.log(`${data.count.toString().padStart(4)} files | ${data.images} img, ${data.videos} vid | ${dir}`);
});

// Save directory summary to file
const dirSummary = sortedDirs.map(([dir, data]) => ({
  directory: dir,
  count: data.count,
  images: data.images,
  videos: data.videos
}));

writeFileSync('/home/jamessink/directory-summary.json', JSON.stringify(dirSummary, null, 2));
console.log('\n✓ Saved directory summary to ~/directory-summary.json');

// Save unique matches to file
writeFileSync('/home/jamessink/unique-16x9-results.json', JSON.stringify({
  totalMatches: uniqueMatches.length,
  matches: uniqueMatches
}, null, 2));
console.log('✓ Saved unique matches (no duplicates) to ~/unique-16x9-results.json');
