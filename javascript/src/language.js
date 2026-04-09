import { extname, basename } from 'node:path';
import { EXTENSION_MAP } from './constants.js';

export function detectLanguage(filePath) {
  const base = basename(filePath);
  if (base.toLowerCase() === 'dockerfile') return 'Dockerfile';
  const ext = extname(base);
  return EXTENSION_MAP[ext] ?? EXTENSION_MAP[ext.toLowerCase()] ?? 'unknown';
}
