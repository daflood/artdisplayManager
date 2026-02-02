// 16:9 = 1.777... (16 / 9)
export const ASPECT_RATIO_16_9 = 16 / 9;

// Tolerance for floating point comparison
// 0.01 allows for minor variations (e.g., 1920x1080 vs 1920x1079)
export const ASPECT_RATIO_TOLERANCE = 0.01;

/**
 * Check if an aspect ratio matches 16:9 within tolerance
 */
export function is16by9(aspectRatio: number): boolean {
  return Math.abs(aspectRatio - ASPECT_RATIO_16_9) < ASPECT_RATIO_TOLERANCE;
}

/**
 * Calculate aspect ratio from dimensions
 */
export function calculateAspectRatio(width: number, height: number): number {
  if (height === 0) return 0;
  return width / height;
}

/**
 * Check if dimensions match 16:9
 */
export function isDimensions16by9(width: number, height: number): boolean {
  return is16by9(calculateAspectRatio(width, height));
}
