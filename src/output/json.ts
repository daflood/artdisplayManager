import { writeFile } from 'node:fs/promises';
import { ScanResult, MediaInfo } from '../types.js';

/**
 * Format scan results as JSON string
 */
export function formatJson(result: ScanResult): string {
  return JSON.stringify(result, null, 2);
}

/**
 * Write scan results to JSON file
 */
export async function writeJson(
  result: ScanResult,
  filePath: string
): Promise<void> {
  await writeFile(filePath, formatJson(result), 'utf-8');
}

/**
 * Format just the matches (for piping to other tools)
 */
export function formatMatchesJson(matches: MediaInfo[]): string {
  return JSON.stringify(matches, null, 2);
}
