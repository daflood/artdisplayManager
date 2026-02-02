#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { dirname } from 'path';

// Load unique matches
const data = JSON.parse(readFileSync('/home/jamessink/unique-16x9-results.json', 'utf8'));
const allMatches = data.matches;

console.log(`Starting with ${allMatches.length} unique matches`);

// Directories and patterns to exclude
const excludePatterns = [
  // Specific directories to exclude
  '/media/jamessink/Blaze2/bigwindow download sort for backup/E/Simone',
  '/media/jamessink/Blaze2/bigwindow download sort for backup/E/Users/Jim/Documents/Daily Pattern/12-5/Clouds',
  '/media/jamessink/Blaze2/Temp/upsize',
  '/media/jamessink/FATSSD/panorama - need to check if this already got downloaded',
  'Avatar Reality',
  '/photo archive/dams',
  'jamessink/images',

  // System/application directories
  'Program Files',
  'Program Files (x86)',
  '/Windows/',
  '/ProgramData/',
  '/AppData/',
  'WinSxS',
  'WindowsApps',
  '$RECYCLE.BIN',

  // Development/temp folders
  'ComfyUI',
  'SD Card Recovery',
  'pytorch-src',
  'third_party',
  '/AI/wan/',
  '/AI/vace/',
  '/AI/ai-toolkit',
  '/AI/SwarmUI',

  // Application-specific
  'CD Projekt Red',
  'Steam',
  'NVIDIA',
  'Plex',
  'Visual Studio',
  'Skylum',
  '4KDownload',
  'Epic',
  'SillyTavern',

  // Other
  'recup_dir',
  'waifu-diffusion',
  'themeforest',
  '__MACOSX',

  // Additional filters
  'forge_flux',
  'stable-diffusion',
  'Stable Diffusion',
  'comfyui',
  'Website Assets',
  'website assets',
  'site_images',
  'New folder MOVE THIS',
  'gradio',
  'Gradio',
  'Daily Pattern',
  'AI/Training',
  'AI/omnigen',
  '/Downloads/',
  '/downloads/'
];

// Filter matches
const filteredMatches = allMatches.filter(match => {
  const path = match.path;

  // Exceptions: Keep art collections
  if (path.includes('European Paintings') ||
      path.includes('Museum of Modern Art') ||
      path.match(/\/Art\s+-\s+/i) ||
      path.match(/Paintings\s+-\s+/i)) {
    return true;
  }

  // Check if path contains any exclude pattern
  for (const pattern of excludePatterns) {
    if (path.includes(pattern)) {
      return false;
    }
  }

  return true;
});

console.log(`After filtering: ${filteredMatches.length} matches`);
console.log(`Removed: ${allMatches.length - filteredMatches.length} matches`);

// Group by directory to show what's left
const dirCounts = {};
filteredMatches.forEach(match => {
  const dir = dirname(match.path);
  if (!dirCounts[dir]) {
    dirCounts[dir] = {
      count: 0,
      images: 0,
      videos: 0
    };
  }
  dirCounts[dir].count++;
  if (match.type === 'image') dirCounts[dir].images++;
  if (match.type === 'video') dirCounts[dir].videos++;
});

// Sort directories by count
const sortedDirs = Object.entries(dirCounts)
  .sort((a, b) => b[1].count - a[1].count);

console.log('\n=== Remaining Directories ===\n');
sortedDirs.forEach(([dir, data]) => {
  console.log(`${data.count.toString().padStart(4)} files | ${data.images} img, ${data.videos} vid | ${dir}`);
});

// Save filtered results
writeFileSync('/home/jamessink/filtered-16x9-results.json', JSON.stringify({
  totalMatches: filteredMatches.length,
  matches: filteredMatches
}, null, 2));

console.log('\n✓ Saved filtered results to ~/filtered-16x9-results.json');

// Create a simple list of file paths
const pathList = filteredMatches.map(m => m.path).join('\n');
writeFileSync('/home/jamessink/filtered-16x9-paths.txt', pathList);
console.log('✓ Saved file paths to ~/filtered-16x9-paths.txt');
