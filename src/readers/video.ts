import { exec } from 'child_process';
import { promisify } from 'util';
import { stat } from 'fs/promises';
import { extname } from 'path';
import ffprobeInstaller from '@ffprobe-installer/ffprobe';
import { MediaInfo, VIDEO_EXTENSIONS } from '../types.js';

const execAsync = promisify(exec);

export function canHandle(filePath: string): boolean {
  const ext = extname(filePath).toLowerCase();
  return VIDEO_EXTENSIONS.includes(ext);
}

interface FFProbeStream {
  width?: number;
  height?: number;
  codec_name?: string;
  tags?: {
    rotate?: string;
  };
}

interface FFProbeOutput {
  streams?: FFProbeStream[];
}

export async function readVideo(filePath: string): Promise<MediaInfo | null> {
  try {
    // Get ffprobe binary path
    const ffprobePath = ffprobeInstaller.path;

    // Quote the file path to handle spaces
    const command = `"${ffprobePath}" -v error -select_streams v:0 -show_entries stream=width,height,codec_name:stream_tags=rotate -of json "${filePath}"`;

    // Execute ffprobe
    const { stdout } = await execAsync(command);
    const probeData: FFProbeOutput = JSON.parse(stdout);

    // Check if we got stream data
    if (!probeData.streams || probeData.streams.length === 0) {
      console.error(`Warning: No video streams found in ${filePath}`);
      return null;
    }

    const stream = probeData.streams[0];

    // Extract dimensions
    let width = stream.width;
    let height = stream.height;

    if (!width || !height) {
      console.error(`Warning: Missing width/height in ${filePath}`);
      return null;
    }

    // Handle rotation metadata - 90° and 270° swap dimensions
    const rotation = stream.tags?.rotate;
    if (rotation === '90' || rotation === '270') {
      [width, height] = [height, width];
    }

    // Get file size
    const stats = await stat(filePath);

    // Calculate aspect ratio
    const aspectRatio = width / height;

    // Check if 16:9 with tolerance
    const is16by9 = Math.abs(aspectRatio - 16/9) < 0.01;

    return {
      path: filePath,
      type: 'video',
      width,
      height,
      aspectRatio,
      is16by9,
      format: stream.codec_name || 'unknown',
      size: stats.size,
    };
  } catch (error) {
    // Log warning to stderr and return null for unreadable files
    console.error(`Warning: Failed to read video ${filePath}:`, error instanceof Error ? error.message : String(error));
    return null;
  }
}
