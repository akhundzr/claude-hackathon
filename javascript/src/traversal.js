import { readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { loadGitignore } from './gitignore.js';

// .git is always skipped — it's VCS metadata, never source code
const ALWAYS_SKIP = new Set(['.git']);

export function walk(root, { noIgnore = false } = {}) {
  const files = [];
  let skipped = 0;

  // By default respect the repo's .gitignore; --no-ignore scans everything
  const shouldIgnore = noIgnore ? () => false : loadGitignore(root);

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
      if (ALWAYS_SKIP.has(entry.name)) continue;
      if (entry.isSymbolicLink()) continue;

      const fullPath  = join(dirPath, entry.name);
      const relPath   = relative(root, fullPath);
      const isDir     = entry.isDirectory();

      if (shouldIgnore(relPath, isDir)) continue;

      if (isDir) {
        scan(fullPath);
      } else if (entry.isFile()) {
        files.push(fullPath);
      }
    }
  }

  scan(root);
  return { files, skipped };
}
