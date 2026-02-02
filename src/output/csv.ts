import { writeFile } from 'node:fs/promises';
import { ScanResult, MediaInfo } from '../types.js';

const CSV_HEADERS = [
  'path',
  'type',
  'width',
  'height',
  'aspectRatio',
  'format',
  'size',
  'isDuplicate',
  'duplicateOf',
];

/**
 * Escape a CSV field value
 */
function escapeField(value: string | number | boolean | undefined): string {
  if (value === undefined || value === null) return '';
  const str = String(value);
  // Escape quotes and wrap in quotes if contains comma, quote, or newline
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Convert MediaInfo to CSV row
 */
function mediaInfoToRow(info: MediaInfo): string {
  return [
    escapeField(info.path),
    escapeField(info.type),
    escapeField(info.width),
    escapeField(info.height),
    escapeField(info.aspectRatio.toFixed(4)),
    escapeField(info.format),
    escapeField(info.size),
    escapeField(info.isDuplicate ?? false),
    escapeField(info.duplicateOf ?? ''),
  ].join(',');
}

/**
 * Format scan results as CSV string
 */
export function formatCsv(result: ScanResult): string {
  const lines = [CSV_HEADERS.join(',')];
  for (const match of result.matches) {
    lines.push(mediaInfoToRow(match));
  }
  return lines.join('\n');
}

/**
 * Write scan results to CSV file
 */
export async function writeCsv(
  result: ScanResult,
  filePath: string
): Promise<void> {
  await writeFile(filePath, formatCsv(result), 'utf-8');
}
