import { resolve } from 'node:path';
import { writeFileSync } from 'node:fs';
import { parseArgs } from './cli.js';
import { runScan } from './scan.js';
import { runRefactor } from './refactor.js';
import { output as outputJson } from './reportJson.js';
import { generate as generateHtml } from './reportHtml.js';
import { generateFixes } from './fixer.js';
import { loadHistory, saveHistory } from './scanHistory.js';

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

  // Load history before saving so the chart shows previous runs
  const directory = report.scan_metadata.directory;
  const history   = loadHistory(directory);
  saveHistory(directory, report);

  const fixes        = generateFixes(report.security.findings);
  const feedbackLoops = [];  // populated by refactor sessions via shared state file

  const html = generateHtml(report, { fixes, history, feedbackLoops });
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
