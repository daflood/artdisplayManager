import { readdir } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { readImage } from './readers/image.js';
import { readVideo } from './readers/video.js';
import { findDuplicates, hashFile, markDuplicates } from './filters/duplicate.js';
import {
  MediaInfo,
  ScanResult,
  SkippedFile,
  ScanStats,
  ScanOptions,
  DuplicateGroup,
  IMAGE_EXTENSIONS,
  VIDEO_EXTENSIONS,
  SUPPORTED_EXTENSIONS,
} from './types.js';

export interface ScanCallbacks {
  onFileFound?: (count: number) => void;
  onFileProcessed?: (current: number, total: number, file: string) => void;
  onHashProgress?: (current: number, total: number) => void;
}

/**
 * Scan directories for 16:9 media files
 */
export async function scanDirectories(
  directories: string[],
  options: ScanOptions,
  callbacks?: ScanCallbacks
): Promise<ScanResult> {
  const startTime = Date.now();
  const matches: MediaInfo[] = [];
  const skipped: SkippedFile[] = [];
  let imagesProcessed = 0;
  let videosProcessed = 0;

  // Phase 1: Collect all supported files
  const allFiles: string[] = [];
  for (const dir of directories) {
    const files = await collectFiles(dir);
    allFiles.push(...files);
    callbacks?.onFileFound?.(allFiles.length);
  }

  // Phase 2: Process files (with concurrency limit)
  const concurrency = options.concurrency || 25;
  for (let i = 0; i < allFiles.length; i += concurrency) {
    const batch = allFiles.slice(i, i + concurrency);
    const results = await Promise.all(
      batch.map(async (file) => {
        const ext = extname(file).toLowerCase();
        let result: MediaInfo | null = null;

        try {
          if (IMAGE_EXTENSIONS.includes(ext)) {
            result = await readImage(file);
            if (result) imagesProcessed++;
          } else if (VIDEO_EXTENSIONS.includes(ext)) {
            result = await readVideo(file);
            if (result) videosProcessed++;
          }
        } catch (error) {
          skipped.push({ path: file, reason: (error as Error).message });
        }

        return result;
      })
    );

    // Collect 16:9 matches
    for (const result of results) {
      if (result?.is16by9) {
        matches.push(result);
      }
    }

    callbacks?.onFileProcessed?.(
      Math.min(i + concurrency, allFiles.length),
      allFiles.length,
      batch[0]
    );
  }

  // Phase 3: Duplicate detection (if enabled)
  let duplicates: DuplicateGroup[] = [];
  if (options.duplicates !== false && matches.length > 0) {
    // Hash all matches
    for (let i = 0; i < matches.length; i++) {
      try {
        matches[i].hash = await hashFile(matches[i].path);
      } catch (error) {
        // If can't hash, continue without it
      }
      callbacks?.onHashProgress?.(i + 1, matches.length);
    }

    // Find duplicate groups
    const matchPaths = matches.map((m) => m.path);
    duplicates = await findDuplicates(matchPaths);
    markDuplicates(matches, duplicates);
  }

  const stats: ScanStats = {
    totalFiles: allFiles.length,
    imagesProcessed,
    videosProcessed,
    matchCount: matches.length,
    duplicateCount: duplicates.reduce((sum, g) => sum + g.count - 1, 0), // -1 because original isn't a dup
    skippedCount: skipped.length,
    scanDuration: Date.now() - startTime,
  };

  return { matches, skipped, duplicates, stats };
}

/**
 * Recursively collect all supported files from a directory
 */
async function collectFiles(directory: string): Promise<string[]> {
  const files: string[] = [];

  try {
    const entries = await readdir(directory, {
      withFileTypes: true,
      recursive: true,
    });

    for (const entry of entries) {
      if (entry.isFile()) {
        const ext = extname(entry.name).toLowerCase();
        if (SUPPORTED_EXTENSIONS.includes(ext)) {
          // Node 20+: entry.parentPath contains full path
          const fullPath = (entry as any).parentPath
            ? join((entry as any).parentPath, entry.name)
            : join(directory, entry.name);
          files.push(fullPath);
        }
      }
    }
  } catch (error) {
    console.warn(
      `Could not read directory ${directory}: ${(error as Error).message}`
    );
  }

  return files;
}
