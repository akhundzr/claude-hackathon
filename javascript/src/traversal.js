import { readdirSync, lstatSync } from 'node:fs';
import { join } from 'node:path';
import { IGNORE_DIRS } from './constants.js';

export function walk(root) {
  const files = [];
  let skipped = 0;

  function scan(dirPath) {
    let entries;
    try {
      entries = readdirSync(dirPath, { withFileTypes: true });
    } catch (err) {
      process.stderr.write(`Warning: cannot read ${dirPath}: ${err.message}\n`);
      skipped++;
      return;
    }

    for (const entry of entries) {
      if (IGNORE_DIRS.has(entry.name)) continue;
      if (entry.isSymbolicLink()) continue;

      const fullPath = join(dirPath, entry.name);

      if (entry.isDirectory()) {
        scan(fullPath);
      } else if (entry.isFile()) {
        files.push(fullPath);
      }
    }
  }

  scan(root);
  return { files, skipped };
}
