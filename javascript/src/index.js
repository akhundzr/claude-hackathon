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

async function main() {
  const { directory, output, noOpen } = parseArgs();

  const start = Date.now();
  const { files, skipped: initialSkipped } = walk(directory);

  const fileResults = [];
  const smellFindings = [];
  const securityFindings = [];
  let skipped = initialSkipped;

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

  const durationMs = Date.now() - start;

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
