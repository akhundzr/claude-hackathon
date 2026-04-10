import { readFileSync, existsSync } from 'node:fs';
import { join, sep } from 'node:path';

/**
 * Parse a .gitignore file and return a matcher function.
 * matcher(relPath, isDir) returns true if the path should be skipped.
 */
export function loadGitignore(rootDir) {
  const gitignorePath = join(rootDir, '.gitignore');
  if (!existsSync(gitignorePath)) return () => false;

  let content;
  try {
    content = readFileSync(gitignorePath, 'utf8');
  } catch {
    return () => false;
  }

  const matchers = content.split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#') && !l.startsWith('!'))
    .map(compilePattern)
    .filter(Boolean);

  if (!matchers.length) return () => false;

  return function shouldIgnore(relPath, isDir) {
    // Normalize to forward slashes regardless of OS
    const norm = relPath.split(sep).join('/');
    return matchers.some(m => m(norm, isDir));
  };
}

function compilePattern(raw) {
  let pattern = raw;

  const matchDirOnly = pattern.endsWith('/');
  if (matchDirOnly) pattern = pattern.slice(0, -1);

  const isRooted = pattern.startsWith('/');
  if (isRooted) pattern = pattern.slice(1);

  if (!pattern) return null;

  // Convert gitignore glob syntax to a regex string
  const reStr = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')   // escape regex metacharacters
    .replace(/\*\*/g,  '\x00')               // placeholder for **
    .replace(/\*/g,    '[^/]*')              // * = anything within one segment
    .replace(/\?/g,    '[^/]')              // ? = one char within a segment
    .replace(/\x00/g,  '.*');               // ** = anything across segments

  let regex;
  if (isRooted || pattern.includes('/')) {
    // Rooted or multi-segment pattern: match from the repo root
    regex = new RegExp('^' + reStr + '(/.*)?$');
  } else {
    // Simple name/glob: match at any depth
    regex = new RegExp('(^|/)' + reStr + '(/.*)?$');
  }

  return function matches(relPath, isDir) {
    if (matchDirOnly && !isDir) return false;
    return regex.test(relPath);
  };
}
