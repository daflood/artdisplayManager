// Core media information returned by readers
export interface MediaInfo {
  path: string;
  type: 'image' | 'video';
  width: number;
  height: number;
  aspectRatio: number;
  is16by9: boolean;
  format: string;
  size: number;
  hash?: string;        // SHA-256 hash, populated during duplicate detection
  isDuplicate?: boolean; // True if this file has duplicates
  duplicateOf?: string;  // Path of the "original" (first encountered)
}

// Result of a complete scan operation
export interface ScanResult {
  matches: MediaInfo[];        // Files matching 16:9
  skipped: SkippedFile[];      // Files that couldn't be processed
  duplicates: DuplicateGroup[]; // Groups of duplicate files
  stats: ScanStats;
}

// Files that failed processing
export interface SkippedFile {
  path: string;
  reason: string;
}

// Group of files with identical content
export interface DuplicateGroup {
  hash: string;
  files: string[];
  count: number;
}

// Summary statistics
export interface ScanStats {
  totalFiles: number;
  imagesProcessed: number;
  videosProcessed: number;
  matchCount: number;
  duplicateCount: number;
  skippedCount: number;
  scanDuration: number; // milliseconds
}

// CLI options from commander
export interface ScanOptions {
  output?: string;
  format: 'json' | 'csv';
  duplicates: boolean;
  concurrency: number;
}

// Supported file extensions
export const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.tiff', '.tif', '.gif'];
export const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v'];
export const SUPPORTED_EXTENSIONS = [...IMAGE_EXTENSIONS, ...VIDEO_EXTENSIONS];
