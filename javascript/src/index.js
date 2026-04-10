import { resolve } from 'node:path';
import { writeFileSync } from 'node:fs';
import { parseArgs } from './cli.js';
import { runScan } from './scan.js';
import { runRefactor } from './refactor.js';
import { output as outputJson } from './reportJson.js';
import { generate as generateHtml } from './reportHtml.js';
import { generateFixes } from './fixer.js';
import { loadFeedbackLoops } from './scanHistory.js';
import { classifyUnknownFiles } from './classifier.js';

async function main() {
  const args = parseArgs();

  if (args.command === 'refactor') {
    await runRefactor(args.directory, {
      top:    args.top,
      auto:   args.auto,
      model:  args.model,
      dryRun: args.dryRun,
    });
    return;
  }

  // scan command
  const { directories, output, noOpen, noIgnore } = args;
  const report = runScan(directories, { noIgnore });

  outputJson(report);

  const directory     = report.scan_metadata.directory;
  const fixes         = generateFixes(report.security.findings);
  const feedbackLoops = loadFeedbackLoops(directory);

  // AI-classify any files the scanner couldn't identify
  const unknownFiles = report.files
    .filter(f => f.language === 'unknown')
    .map(f => ({ relPath: f.path, absPath: resolve(directory, f.path) }));

  if (unknownFiles.length) {
    process.stderr.write(`Classifying ${unknownFiles.length} unrecognized file(s) with AI...\n`);
  }
  const aiGuesses = await classifyUnknownFiles(unknownFiles, directory);

  const html = generateHtml(report, { fixes, feedbackLoops, aiGuesses });
  const outputPath = resolve(output);
  writeFileSync(outputPath, html, 'utf8');

  if (!noOpen) {
    const { serveReport } = await import('./serve.js');
    const { default: open } = await import('open');
    const { url, server } = await serveReport(outputPath);
    await open(url);
    process.stderr.write(`\nReport served at ${url}\nPress Ctrl+C to stop.\n`);
    process.on('SIGINT', () => { server.close(); process.exit(0); });
  }
}

main().catch(err => {
  process.stderr.write(`Fatal: ${err.message}\n`);
  process.exit(1);
});
