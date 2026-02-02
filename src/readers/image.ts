import sharp from 'sharp';
import { stat } from 'fs/promises';
import { extname } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { MediaInfo, IMAGE_EXTENSIONS } from '../types.js';

const execAsync = promisify(exec);

export function canHandle(filePath: string): boolean {
  const ext = extname(filePath).toLowerCase();
  return IMAGE_EXTENSIONS.includes(ext);
}

async function readImageWithImageMagick(filePath: string): Promise<MediaInfo | null> {
  try {
    // Use ImageMagick identify to get dimensions and format
    const { stdout } = await execAsync(`identify -format "%w %h %m" "${filePath.replace(/"/g, '\\"')}"`);
    const [widthStr, heightStr, format] = stdout.trim().split(' ');

    const width = parseInt(widthStr, 10);
    const height = parseInt(heightStr, 10);

    if (isNaN(width) || isNaN(height)) {
      return null;
    }

    // Get file size
    const stats = await stat(filePath);

    // Calculate aspect ratio
    const aspectRatio = width / height;

    // Check if 16:9 with tolerance
    const is16by9 = Math.abs(aspectRatio - 16/9) < 0.01;

    return {
      path: filePath,
      type: 'image',
      width,
      height,
      aspectRatio,
      is16by9,
      format: format.toLowerCase(),
      size: stats.size,
    };
  } catch (error) {
    console.error(`Warning: ImageMagick fallback failed for ${filePath}:`, error instanceof Error ? error.message : String(error));
    return null;
  }
}

export async function readImage(filePath: string): Promise<MediaInfo | null> {
  try {
    // Extract metadata using sharp
    const image = sharp(filePath);
    const metadata = await image.metadata();

    // Get file size
    const stats = await stat(filePath);

    // Extract dimensions
    let width = metadata.width!;
    let height = metadata.height!;

    // Handle EXIF orientation - tags 5-8 swap width/height
    // Orientation 5: rotate 90° CW and flip horizontal
    // Orientation 6: rotate 90° CW
    // Orientation 7: rotate 90° CCW and flip horizontal
    // Orientation 8: rotate 90° CCW
    if (metadata.orientation && metadata.orientation >= 5 && metadata.orientation <= 8) {
      // Swap dimensions for rotated images
      [width, height] = [height, width];
    }

    // Calculate aspect ratio
    const aspectRatio = width / height;

    // Check if 16:9 with tolerance
    const is16by9 = Math.abs(aspectRatio - 16/9) < 0.01;

    return {
      path: filePath,
      type: 'image',
      width,
      height,
      aspectRatio,
      is16by9,
      format: metadata.format || 'unknown',
      size: stats.size,
    };
  } catch (error) {
    // Try ImageMagick fallback for files sharp can't handle
    try {
      return await readImageWithImageMagick(filePath);
    } catch (fallbackError) {
      // Log warning to stderr and return null for unreadable files
      console.error(`Warning: Failed to read image ${filePath}:`, error instanceof Error ? error.message : String(error));
      return null;
    }
  }
}
