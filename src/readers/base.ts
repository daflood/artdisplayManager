import { MediaInfo } from '../types.js';

export interface MediaReader {
  canHandle(filePath: string): boolean;
  read(filePath: string): Promise<MediaInfo | null>;
}
