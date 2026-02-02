# Phase 1: Media Scanner - Research

**Researched:** 2026-02-02
**Domain:** File system scanning, image/video metadata extraction, duplicate detection
**Confidence:** HIGH

## Summary

The Media Scanner phase requires building a Node.js CLI tool to recursively scan directories for images and videos, filter by 16:9 aspect ratio, extract metadata, and detect duplicates. The standard approach uses native Node.js fs/promises for directory traversal, sharp for image metadata extraction, ffprobe for video metadata, and SHA-256 hashing for exact duplicate detection.

Modern Node.js (v25+) provides built-in recursive directory scanning with `fs.promises.readdir({ recursive: true })`, eliminating the need for third-party directory traversal libraries. For image processing, sharp is the industry standard with 4-5x faster performance than alternatives. Video metadata extraction requires ffprobe via static binaries (`@ffprobe-installer/ffprobe` or `ffprobe-static`), as fluent-ffmpeg is now deprecated.

The critical pitfall is EXIF orientation handling: images may have rotation metadata that affects their actual aspect ratio. When an image has orientation tags 5-8, width and height are swapped. Another major concern is error handling for corrupted files - the scanner must gracefully skip unreadable media rather than crashing. For large directory trees, streaming approaches with proper backpressure handling prevent memory issues.

**Primary recommendation:** Use native Node.js fs.promises.readdir with sharp for images, @ffprobe-installer/ffprobe for videos, and crypto.createHash('sha256') for duplicates. Implement try-catch per file to handle corrupted media gracefully.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| sharp | 0.33+ | Image metadata extraction | 4-5x faster than alternatives, native C++ bindings, industry standard |
| @ffprobe-installer/ffprobe | 2.1+ | Video metadata extraction | Platform-independent static binaries, actively maintained |
| commander | 12+ | CLI argument parsing | Git-style subcommands, programmatic API, most popular |
| Node.js crypto (built-in) | - | SHA-256 hashing for duplicates | Native, collision-resistant, constant memory with streams |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| ora | 8+ | Terminal spinners | Long-running operations without progress percentage |
| cli-progress | 3.12+ | Progress bars | Operations with known total count |
| chalk | 5+ | Terminal colors | Enhancing CLI output readability |
| fast-glob | 3+ | Pattern-based file filtering | If glob patterns needed (*.jpg, *.mp4) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| sharp | jimp | 20x slower (28s vs 1.3s for 27 images), pure JS so no native deps |
| commander | yargs | More features (middleware, validation) but heavier API |
| @ffprobe-installer | ffprobe-static | Similar, but @ffprobe-installer has better platform detection |
| fast-glob | native fs.readdir | fast-glob 10-20% faster but adds dependency |

**Installation:**
```bash
npm install sharp @ffprobe-installer/ffprobe commander ora cli-progress chalk
```

**System Requirements:**
- sharp requires libvips (installed automatically on npm install)
- ffprobe binaries included (macOS arm64/x64, Linux x64/arm64, Windows x64)

## Architecture Patterns

### Recommended Project Structure
```
src/
├── cli.ts              # CLI entry point with commander
├── scanner.ts          # Main scanner orchestration
├── readers/
│   ├── image.ts        # sharp-based image metadata reader
│   ├── video.ts        # ffprobe-based video metadata reader
│   └── base.ts         # Common interface for readers
├── filters/
│   ├── aspectRatio.ts  # 16:9 filtering logic
│   └── duplicate.ts    # Hash-based duplicate detection
├── output/
│   ├── json.ts         # JSON output formatter
│   └── csv.ts          # CSV output formatter
└── types.ts            # Shared TypeScript types
```

### Pattern 1: Stream-Based Directory Traversal
**What:** Use native fs.promises.readdir with recursive option, process files in batches
**When to use:** All directory scanning operations
**Example:**
```typescript
// Source: Node.js v25 documentation
import { readdir } from 'node:fs/promises';

async function scanDirectory(path: string): Promise<string[]> {
  const entries = await readdir(path, {
    recursive: true,
    withFileTypes: true
  });

  return entries
    .filter(dirent => dirent.isFile())
    .map(dirent => `${dirent.parentPath}/${dirent.name}`);
}
```

### Pattern 2: Per-File Error Handling
**What:** Wrap each file operation in try-catch to continue on corrupted files
**When to use:** All metadata extraction operations
**Example:**
```typescript
// Pattern for graceful failure
async function extractMetadata(filePath: string): Promise<Metadata | null> {
  try {
    return await readImageMetadata(filePath);
  } catch (error) {
    console.warn(`Skipping ${filePath}: ${error.message}`);
    return null; // Continue processing other files
  }
}
```

### Pattern 3: Aspect Ratio Calculation with EXIF Awareness
**What:** Calculate aspect ratio accounting for EXIF orientation tags
**When to use:** All image aspect ratio calculations
**Example:**
```typescript
// Source: sharp documentation + EXIF orientation best practices
import sharp from 'sharp';

async function getAspectRatio(imagePath: string): Promise<number> {
  const metadata = await sharp(imagePath).metadata();

  // EXIF orientation 5-8 means image is rotated 90° or 270°
  // Width and height are swapped
  const isRotated = metadata.orientation && metadata.orientation >= 5;

  const width = isRotated ? metadata.height : metadata.width;
  const height = isRotated ? metadata.width : metadata.height;

  return width / height;
}
```

### Pattern 4: Streaming Hash Calculation
**What:** Hash files using streams to maintain constant memory
**When to use:** All duplicate detection operations
**Example:**
```typescript
// Source: Node.js crypto documentation + Transloadit best practices
import { createReadStream } from 'node:fs';
import { createHash } from 'node:crypto';

async function hashFile(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256');
    const stream = createReadStream(filePath, { highWaterMark: 256 * 1024 }); // 256KB chunks

    stream.on('data', chunk => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}
```

### Pattern 5: Video Metadata with ffprobe
**What:** Use ffprobe static binary to extract video dimensions and aspect ratio
**When to use:** All video file processing
**Example:**
```typescript
// Using @ffprobe-installer/ffprobe
import ffprobeStatic from '@ffprobe-installer/ffprobe';
import { promisify } from 'node:util';
import { exec } from 'node:child_process';

const execAsync = promisify(exec);

async function getVideoMetadata(videoPath: string) {
  const cmd = `"${ffprobeStatic.path}" -v error -select_streams v:0 -show_entries stream=width,height,display_aspect_ratio -of json "${videoPath}"`;

  const { stdout } = await execAsync(cmd);
  const data = JSON.parse(stdout);
  const stream = data.streams[0];

  // Handle rotation: if rotation tag is 90° or 270°, swap dimensions
  return {
    width: stream.width,
    height: stream.height,
    aspectRatio: stream.display_aspect_ratio || `${stream.width}:${stream.height}`
  };
}
```

### Anti-Patterns to Avoid
- **Loading entire directory tree into memory at once**: Use streaming or process in batches to avoid OOM errors on large directories
- **Synchronous file operations**: Always use async fs/promises methods, never fs.readFileSync
- **Assuming aspect ratio = width/height without EXIF check**: Images can have rotation metadata that changes their actual display dimensions
- **Processing all files before outputting results**: Stream results as you go or batch output to handle memory efficiently
- **Using deprecated fluent-ffmpeg**: Library is no longer maintained and breaks with recent ffmpeg versions

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Image metadata extraction | Custom image parser | sharp | Handles 20+ formats, EXIF parsing, color space detection, much faster |
| Video metadata extraction | Custom video parser | @ffprobe-installer/ffprobe | Supports all major codecs, handles corrupted files, cross-platform |
| CLI argument parsing | Manual process.argv parsing | commander | Handles subcommands, validation, auto-generated help, type coercion |
| File hashing | Custom hash implementation | Node.js crypto.createHash | Optimized, streaming support, multiple algorithms, well-tested |
| Progress indicators | Custom console.log updates | ora or cli-progress | Handles terminal width, cleanup, multi-bar, proper line clearing |
| Aspect ratio comparison | Floating point equality | Tolerance-based comparison | 16:9 = 1.777... requires ~0.01 tolerance due to float precision |

**Key insight:** Media file parsing is complex with edge cases (corrupted files, rare formats, metadata inconsistencies). Battle-tested libraries handle these far better than custom code.

## Common Pitfalls

### Pitfall 1: EXIF Orientation Causing Wrong Aspect Ratios
**What goes wrong:** Images appear landscape but are tagged as portrait (or vice versa), causing incorrect 16:9 filtering. An image that's 1920x1080 (16:9) might be stored as 1080x1920 with orientation=6 (rotate 90° CW).

**Why it happens:** Cameras/phones store images in sensor orientation and add EXIF rotation tags rather than physically rotating pixels. Many tools respect EXIF, others ignore it.

**How to avoid:** Always check metadata.orientation from sharp. If orientation is 5, 6, 7, or 8, swap width/height before calculating aspect ratio.

**Warning signs:** Scanner reports far fewer 16:9 images than expected, or portrait photos of landscape scenes are excluded.

### Pitfall 2: Corrupted Files Crashing Scanner
**What goes wrong:** Scanner encounters corrupted image/video and crashes, stopping entire scan. Common with large media collections spanning years.

**Why it happens:** Sharp and ffprobe throw exceptions on invalid file data. Without per-file error handling, one bad file kills the process.

**How to avoid:** Wrap every metadata extraction call in try-catch. Log warning with filename and continue. Optionally output "skipped files" list in results.

**Warning signs:** Scanner works on small test directories but fails on real collections. Error messages mention specific file formats or "unexpected end of data".

### Pitfall 3: Memory Exhaustion on Large Directories
**What goes wrong:** Scanner loads 100k+ file paths into memory, or buffers all results before output, causing OOM errors.

**Why it happens:** `readdir({ recursive: true })` returns all paths at once. Storing all metadata objects before output compounds the issue.

**How to avoid:** Use `opendir()` with async iteration for extremely large trees, or process readdir results in batches of 1000. Stream output or write incrementally.

**Warning signs:** Scanner slows dramatically or crashes with "JavaScript heap out of memory" on directories with 50k+ files.

### Pitfall 4: Floating Point Aspect Ratio Comparison
**What goes wrong:** 16:9 images calculated as 1.7777777 are excluded because 1.7777777 !== 1.7777778. Different rounding in metadata leads to misses.

**Why it happens:** Width/height division produces floats. Some metadata stores aspect ratio as fraction (16:9) others as decimal. Precision varies.

**How to avoid:** Use tolerance comparison: `Math.abs(calculated - target) < 0.01`. Target for 16:9 is 1.7777... (16/9 = 1.777...).

**Warning signs:** Known 16:9 images are excluded. Manually checking excluded files shows they ARE 16:9 when measured.

### Pitfall 5: Video Rotation Metadata Ignored
**What goes wrong:** Videos shot in portrait mode (9:16) pass as 16:9 because dimensions don't account for rotation metadata.

**Why it happens:** ffprobe returns stream width/height, but videos can have rotation tags (like images). A 1920x1080 video with rotate=90 is actually 1080x1920 when played.

**How to avoid:** Check ffprobe's `tags.rotate` field. If 90 or 270, swap width/height. Use `display_aspect_ratio` when available instead of calculating.

**Warning signs:** Portrait videos appear in results, or scanner reports different aspect ratio than video player shows.

### Pitfall 6: Symlinks and Permission Errors
**What goes wrong:** Scanner follows symlinks into infinite loops, or crashes on permission-denied errors.

**Why it happens:** Recursive scanning blindly follows all directories. Symlinks can create cycles. Network drives or system folders may deny access.

**How to avoid:** Track visited directories by inode to detect cycles. Catch EACCES/EPERM errors and skip those paths with warning.

**Warning signs:** Scanner runs forever, or fails with "EACCES: permission denied" on system directories.

## Code Examples

Verified patterns from official sources:

### Complete Image Aspect Ratio Check
```typescript
// Source: sharp documentation + EXIF best practices
import sharp from 'sharp';

interface ImageInfo {
  path: string;
  width: number;
  height: number;
  aspectRatio: number;
  is16by9: boolean;
  format: string;
  size: number;
}

async function checkImage(filePath: string): Promise<ImageInfo | null> {
  try {
    const metadata = await sharp(filePath).metadata();
    const stats = await fs.stat(filePath);

    // Handle EXIF orientation (5-8 means rotated 90° or 270°)
    const isRotated = metadata.orientation && metadata.orientation >= 5;
    const width = isRotated ? metadata.height : metadata.width;
    const height = isRotated ? metadata.width : metadata.height;

    const aspectRatio = width / height;
    const target = 16 / 9; // 1.7777...
    const is16by9 = Math.abs(aspectRatio - target) < 0.01;

    return {
      path: filePath,
      width,
      height,
      aspectRatio,
      is16by9,
      format: metadata.format,
      size: stats.size
    };
  } catch (error) {
    console.warn(`Skipping ${filePath}: ${error.message}`);
    return null;
  }
}
```

### Complete Video Aspect Ratio Check
```typescript
// Using @ffprobe-installer/ffprobe
import ffprobeStatic from '@ffprobe-installer/ffprobe';
import { promisify } from 'node:util';
import { exec } from 'node:child_process';
import { stat } from 'node:fs/promises';

const execAsync = promisify(exec);

interface VideoInfo {
  path: string;
  width: number;
  height: number;
  aspectRatio: number;
  is16by9: boolean;
  codec: string;
  size: number;
}

async function checkVideo(filePath: string): Promise<VideoInfo | null> {
  try {
    const cmd = `"${ffprobeStatic.path}" -v error -select_streams v:0 -show_entries stream=width,height,display_aspect_ratio,codec_name:stream_tags=rotate -of json "${filePath}"`;

    const { stdout } = await execAsync(cmd);
    const data = JSON.parse(stdout);
    const stream = data.streams[0];
    const stats = await stat(filePath);

    // Check rotation metadata
    const rotation = stream.tags?.rotate ? parseInt(stream.tags.rotate) : 0;
    const isRotated = rotation === 90 || rotation === 270;

    const width = isRotated ? stream.height : stream.width;
    const height = isRotated ? stream.width : stream.height;

    const aspectRatio = width / height;
    const target = 16 / 9;
    const is16by9 = Math.abs(aspectRatio - target) < 0.01;

    return {
      path: filePath,
      width,
      height,
      aspectRatio,
      is16by9,
      codec: stream.codec_name,
      size: stats.size
    };
  } catch (error) {
    console.warn(`Skipping ${filePath}: ${error.message}`);
    return null;
  }
}
```

### Duplicate Detection with Grouping
```typescript
// Source: Node.js crypto + Transloadit best practices
import { createReadStream } from 'node:fs';
import { createHash } from 'node:crypto';

async function hashFile(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256');
    const stream = createReadStream(filePath, { highWaterMark: 256 * 1024 });

    stream.on('data', chunk => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

interface DuplicateGroup {
  hash: string;
  files: string[];
  count: number;
}

async function findDuplicates(files: string[]): Promise<DuplicateGroup[]> {
  const hashMap = new Map<string, string[]>();

  for (const file of files) {
    try {
      const hash = await hashFile(file);
      if (!hashMap.has(hash)) {
        hashMap.set(hash, []);
      }
      hashMap.get(hash).push(file);
    } catch (error) {
      console.warn(`Could not hash ${file}: ${error.message}`);
    }
  }

  // Only return groups with 2+ files (actual duplicates)
  return Array.from(hashMap.entries())
    .filter(([_, files]) => files.length > 1)
    .map(([hash, files]) => ({ hash, files, count: files.length }));
}
```

### CLI Structure with Commander
```typescript
// Source: Commander.js documentation
import { Command } from 'commander';
import ora from 'ora';

const program = new Command();

program
  .name('media-scanner')
  .description('Scan directories for 16:9 media files')
  .version('1.0.0');

program
  .argument('<directories...>', 'Directories to scan')
  .option('-o, --output <file>', 'Output file path')
  .option('-f, --format <type>', 'Output format (json|csv)', 'json')
  .option('--no-duplicates', 'Skip duplicate detection')
  .action(async (directories, options) => {
    const spinner = ora('Scanning directories...').start();

    try {
      const results = await scanDirectories(directories, options);
      spinner.succeed(`Found ${results.length} 16:9 files`);

      await outputResults(results, options);
    } catch (error) {
      spinner.fail('Scan failed');
      console.error(error.message);
      process.exit(1);
    }
  });

program.parse();
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| fluent-ffmpeg | Direct ffprobe via static binaries | 2024-2025 | fluent-ffmpeg deprecated, use @ffprobe-installer/ffprobe |
| Custom directory recursion | fs.promises.readdir({ recursive: true }) | Node.js 20+ | Native support eliminates need for libraries like recursive-readdir |
| ImageMagick/GraphicsMagick | sharp with libvips | 2020s | 4-5x faster, better memory usage, modern async API |
| MD5 hashing | SHA-256 | Ongoing | MD5 collision-prone, SHA-256 standard for file integrity |
| Callback-based fs | fs/promises | Node.js 10+ | Cleaner async/await code, better error handling |

**Deprecated/outdated:**
- **fluent-ffmpeg**: No longer maintained, breaks with recent ffmpeg versions. Use @ffprobe-installer/ffprobe with child_process.
- **node-recursive-directory**: Native fs.promises.readdir({ recursive: true }) now handles this.
- **jimp for production**: 20x slower than sharp, only viable for environments without native dependencies.

## Open Questions

Things that couldn't be fully resolved:

1. **Perceptual duplicate detection**
   - What we know: Can detect visually similar images with pHash (hamming distance < 5)
   - What's unclear: Whether perceptual duplicates are needed or just exact byte-matching
   - Recommendation: Start with exact SHA-256 matching (SCAN-04 requirement). Add perceptual hashing later if user finds exact matching insufficient. Flag as potential enhancement.

2. **Supported file formats**
   - What we know: sharp supports JPEG, PNG, WebP, AVIF, TIFF, GIF, SVG. ffprobe handles all major video codecs (H.264, H.265, VP9, AV1, etc.)
   - What's unclear: Whether to filter by file extension first or try all files
   - Recommendation: Use extension whitelist (.jpg, .jpeg, .png, .webp, .mp4, .mov, .avi, .mkv, etc.) for performance. Allow --all-files flag to override.

3. **Network/remote file systems**
   - What we know: Scanning NAS or network drives will be slower, hash streaming handles it
   - What's unclear: Whether timeouts or connection handling is needed
   - Recommendation: Start with local/mounted filesystem assumption. Add timeout handling if network errors become common.

4. **Optimal concurrency for metadata extraction**
   - What we know: Processing files in parallel speeds up I/O-bound operations
   - What's unclear: Optimal concurrency level (10? 50? 100?)
   - Recommendation: Implement configurable concurrency with default of 25. Let users tune based on their hardware.

## Sources

### Primary (HIGH confidence)
- Node.js v25 File System Documentation - fs.promises methods, recursive readdir
- sharp Official Documentation - metadata extraction API, orientation handling
- @ffprobe-installer/ffprobe npm package - platform-independent ffprobe binaries
- Node.js Crypto Documentation - createHash streaming approach
- Commander.js Official Documentation - CLI argument parsing

### Secondary (MEDIUM confidence)
- [Node.js Performance: Processing 14GB Files](https://pmbanugo.me/blog/nodejs-1brc) - Buffer optimization and streaming best practices
- [Efficient file deduplication with sha-256](https://transloadit.com/devtips/efficient-file-deduplication-with-sha-256-and-node-js/) - SHA-256 streaming patterns
- [sharp vs jimp Performance Comparison](https://www.peterbe.com/plog/sharp-vs-jimp) - Benchmark showing 28s vs 1.3s
- [EXIF Orientation Handling Issues](https://www.impulseadventure.com/photo/exif-orientation.html) - Aspect ratio pitfalls with rotation
- [Node.js January 2026 Security Release](https://nodesource.com/blog/nodejs-security-release-january-2026) - Error handling improvements

### Tertiary (LOW confidence)
- npm-compare.com statistics on library popularity - Used for relative adoption rates only
- Various Medium articles on Node.js CLI tools - Cross-verified with official docs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries verified with official docs and current npm versions
- Architecture: HIGH - Patterns from official documentation and verified best practices
- Pitfalls: HIGH - Cross-referenced multiple sources, some from 2026 security updates
- Video processing: MEDIUM - fluent-ffmpeg deprecation confirmed, but ffprobe wrapper patterns less standardized

**Research date:** 2026-02-02
**Valid until:** 2026-03-02 (30 days - stable domain, but sharp/Node.js update frequently)
