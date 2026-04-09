import { resolve } from 'node:path';
import { writeFileSync } from 'node:fs';
import { parseArgs } from './cli.js';
import { walk } from './traversal.js';
import { detectLanguage } from './language.js';
import { analyzeFile } from './metrics.js';
import { detect as detectSmells } from './smells.js';
import { scan as scanSecurity } from './security.js';
import { aggregate } from './aggregator.js';
import { output as outputJson } from './reportJson.js';
import { generate as generateHtml } from './reportHtml.js';

function commonPath(dirs) {
  if (dirs.length === 1) return dirs[0];
  const parts = dirs.map(d => d.split('/'));
  const min = Math.min(...parts.map(p => p.length));
  let i = 0;
  while (i < min && parts.every(p => p[i] === parts[0][i])) i++;
  return parts[0].slice(0, i).join('/') || '/';
}

async function main() {
  const { directories, output, noOpen, noIgnore } = parseArgs();

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

      fileResults.push({
        ...metrics,
        smells: smells.length,
        security_issues: security.length,
      });
    }
  }

  const durationMs = Date.now() - start;
  const directory = commonPath(directories);

  const report = aggregate({
    directory,
    fileResults,
    smellFindings,
    securityFindings,
    skipped,
    durationMs,
  });

  outputJson(report);

  const html = generateHtml(report);
  const outputPath = resolve(output);
  writeFileSync(outputPath, html, 'utf8');

  if (!noOpen) {
    const { default: open } = await import('open');
    await open(`file://${outputPath}`);
  }
}

main().catch(err => {
  process.stderr.write(`Fatal: ${err.message}\n`);
  process.exit(1);
});
