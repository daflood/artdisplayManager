import { createReadStream } from 'node:fs';
import { createHash } from 'node:crypto';
import { DuplicateGroup } from '../types.js';

/**
 * Calculate SHA-256 hash of a file using streaming (constant memory)
 */
export async function hashFile(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256');
    // 256KB chunks for optimal performance
    const stream = createReadStream(filePath, { highWaterMark: 256 * 1024 });

    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

/**
 * Find duplicate files by hash
 * Returns groups where count >= 2 (actual duplicates)
 */
export async function findDuplicates(
  files: string[],
  onProgress?: (current: number, total: number) => void
): Promise<DuplicateGroup[]> {
  const hashMap = new Map<string, string[]>();

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    try {
      const hash = await hashFile(file);
      const existing = hashMap.get(hash) || [];
      existing.push(file);
      hashMap.set(hash, existing);
    } catch (error) {
      // Skip files that can't be hashed (permissions, deleted, etc.)
      console.warn(`Could not hash ${file}: ${(error as Error).message}`);
    }

    if (onProgress) {
      onProgress(i + 1, files.length);
    }
  }

  // Only return groups with 2+ files (actual duplicates)
  return Array.from(hashMap.entries())
    .filter(([_, files]) => files.length > 1)
    .map(([hash, files]) => ({
      hash,
      files,
      count: files.length
    }));
}

/**
 * Mark duplicates in a list of MediaInfo objects
 * First file in each group is considered the "original"
 */
export function markDuplicates(
  files: Array<{ path: string; hash?: string }>,
  duplicates: DuplicateGroup[]
): void {
  const duplicateMap = new Map<string, string>();

  for (const group of duplicates) {
    const original = group.files[0];
    for (let i = 1; i < group.files.length; i++) {
      duplicateMap.set(group.files[i], original);
    }
  }

  for (const file of files) {
    if (file.hash && duplicateMap.has(file.path)) {
      (file as any).isDuplicate = true;
      (file as any).duplicateOf = duplicateMap.get(file.path);
    }
  }
}
