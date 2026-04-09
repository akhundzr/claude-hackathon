import { walk } from './traversal.js';
import { detectLanguage } from './language.js';
import { analyzeFile } from './metrics.js';
import { detect as detectSmells } from './smells.js';
import { scan as scanSecurity } from './security.js';
import { aggregate } from './aggregator.js';

export function commonPath(dirs) {
  if (dirs.length === 1) return dirs[0];
  const parts = dirs.map(d => d.split('/'));
  const min = Math.min(...parts.map(p => p.length));
  let i = 0;
  while (i < min && parts.every(p => p[i] === parts[0][i])) i++;
  return parts[0].slice(0, i).join('/') || '/';
}

export function runScan(directories, { noIgnore = false } = {}) {
  const start = Date.now();
  const fileResults = [];
  const smellFindings = [];
  const securityFindings = [];
  let skipped = 0;

  for (const directory of directories) {
    const { files, skipped: dirSkipped } = walk(directory, { noIgnore });
    skipped += dirSkipped;

    for (const filepath of files) {
      const language = detectLanguage(filepath);
      const metrics = analyzeFile(filepath, language);
      if (!metrics) { skipped++; continue; }

      const smells = detectSmells(filepath, language);
      const security = scanSecurity(filepath, language);

      smellFindings.push(...smells);
      securityFindings.push(...security);

      fileResults.push({ ...metrics, smells: smells.length, security_issues: security.length });
    }
  }

  const durationMs = Date.now() - start;
  const directory = commonPath(directories);

  return aggregate({ directory, fileResults, smellFindings, securityFindings, skipped, durationMs });
}
