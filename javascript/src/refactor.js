import { resolve } from 'node:path';
import { readFileSync, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { runScan } from './scan.js';
import { extractFunction, applyRefactoring } from './extractor.js';
import { suggestRefactoring } from './claude.js';
import { generateDiff } from './diff.js';
import { detectLanguage } from './language.js';
import { generate as generateHtml } from './reportHtml.js';
import { generateFixes } from './fixer.js';
import { loadHistory, saveHistory } from './scanHistory.js';

const RESET  = '\x1b[0m';
const BOLD   = '\x1b[1m';
const DIM    = '\x1b[2m';
const RED    = '\x1b[31m';
const GREEN  = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN   = '\x1b[36m';

async function ask(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(res => rl.question(question, ans => { rl.close(); res(ans.trim().toLowerCase()); }));
}

function rankFindings(findings) {
  return [...findings].sort((a, b) => {
    if (a.severity !== b.severity) return a.severity === 'error' ? -1 : 1;
    return b.value - a.value;
  });
}

export async function runRefactor(directory, {
  top    = 3,
  auto   = false,
  model  = 'claude-sonnet-4-6',
  dryRun = false,
} = {}) {
  if (!process.env.ANTHROPIC_API_KEY) {
    process.stderr.write('Error: ANTHROPIC_API_KEY environment variable is not set\n');
    process.exit(1);
  }

  process.stdout.write(`\n${BOLD}${CYAN}Scanning ${directory}...${RESET}\n`);
  const baseReport     = runScan([directory]);
  const baselineScore  = baseReport.quality.score;
  const baselineGrade  = baseReport.quality.grade;

  process.stdout.write(`Baseline quality: ${BOLD}${baselineScore} (${baselineGrade})${RESET}\n`);
  process.stdout.write(`Smell findings:   ${baseReport.code_smells.findings.length}\n\n`);

  if (baseReport.code_smells.findings.length === 0) {
    process.stdout.write(`${GREEN}No code smells found — nothing to refactor!${RESET}\n`);
    return;
  }

  const targets      = rankFindings(baseReport.code_smells.findings).slice(0, top);
  const results      = [];
  const loopEvents   = [];   // feedback loop audit trail
  let   skipAll      = false;
  let   currentScore = baselineScore;

  // Track every file we touch so we can restore all of them at the end.
  // Keys are absolute paths; values are the content before any modification.
  const modifiedFiles = new Map();

  const restoreAll = () => {
    for (const [path, content] of modifiedFiles) {
      try { writeFileSync(path, content, 'utf8'); } catch {}
    }
  };

  // Restore on Ctrl-C so interrupted sessions never leave dirty files
  process.once('SIGINT', () => { restoreAll(); process.exit(130); });

  for (const finding of targets) {
    if (skipAll) break;

    const absPath         = resolve(directory, finding.file);
    const language        = detectLanguage(absPath);
    const functionBaseline = currentScore;

    process.stdout.write(`\n${BOLD}━━━ ${finding.function_name} (${finding.type}) ━━━${RESET}\n`);
    process.stdout.write(`File:  ${finding.file}\n`);
    process.stdout.write(`Issue: ${finding.detail}\n`);

    let originalContent;
    try {
      originalContent = readFileSync(absPath, 'utf8');
    } catch {
      process.stdout.write(`${RED}Cannot read file — skipping${RESET}\n`);
      continue;
    }

    // Register original content before any writes for this file
    if (!modifiedFiles.has(absPath)) modifiedFiles.set(absPath, originalContent);

    let succeeded = false;
    const loopAttempts = [];

    for (let attempt = 1; attempt <= 3; attempt++) {
      if (attempt > 1) {
        process.stdout.write(`\n${YELLOW}Attempt ${attempt}/3 — trying a different approach...${RESET}\n`);
        writeFileSync(absPath, originalContent, 'utf8');  // restore before retry
      }

      const extracted = extractFunction(absPath, finding);
      if (!extracted) {
        process.stdout.write(`${RED}Could not locate function body — skipping${RESET}\n`);
        break;
      }

      process.stdout.write(`Asking ${model}...`);
      let refactoredCode;
      try {
        refactoredCode = await suggestRefactoring({
          language,
          filePath: finding.file,
          smellType: finding.type,
          smellDetail: finding.detail,
          context: extracted.context,
          functionBody: extracted.body,
          model,
          attempt,
        });
      } catch (err) {
        process.stdout.write(`\n${RED}API error: ${err.message} — skipping${RESET}\n`);
        break;
      }
      process.stdout.write(` done\n\n`);

      process.stdout.write(generateDiff(extracted.body, refactoredCode, finding.function_name) + '\n\n');

      let answer = 'y';
      if (!auto) {
        answer = await ask(`Apply this refactoring? [y/n/s(kip all)] `);
      }

      if (answer === 's') { skipAll = true; break; }
      if (answer !== 'y') { process.stdout.write(`${YELLOW}Skipped${RESET}\n`); break; }
      if (dryRun)         { process.stdout.write(`${YELLOW}Dry run — not writing${RESET}\n`); break; }

      applyRefactoring(extracted, refactoredCode);

      const newReport  = runScan([directory]);
      const newScore   = newReport.quality.score;

      const improved = newScore > functionBaseline;
      loopAttempts.push({ attempt, scoreBefore: functionBaseline, scoreAfter: newScore, applied: true, improved });

      if (improved) {
        process.stdout.write(`${GREEN}✓ Quality: ${functionBaseline} → ${newScore} (+${newScore - functionBaseline})${RESET}\n`);
        currentScore = newScore;
        succeeded = true;
        results.push({ finding, before: functionBaseline, after: newScore, applied: true });
        break;
      }

      if (attempt < 3) {
        process.stdout.write(`${YELLOW}Score unchanged (${functionBaseline} → ${newScore}) — retrying...${RESET}\n`);
      } else {
        process.stdout.write(`${RED}Could not improve ${finding.function_name} after 3 attempts — restoring original${RESET}\n`);
        writeFileSync(absPath, originalContent, 'utf8');
      }
    }

    loopEvents.push({
      timestamp:    new Date().toISOString(),
      functionName: finding.function_name,
      file:         finding.file,
      smellType:    finding.type,
      attempts:     loopAttempts,
      finalOutcome: dryRun ? 'dry_run' : skipAll ? 'skipped' : succeeded ? 'improved' : 'failed',
    });

    if (!succeeded) {
      results.push({ finding, before: functionBaseline, after: functionBaseline, applied: false });
    }
  }

  // Final scan for overall delta
  const finalReport = runScan([directory]);
  const finalScore  = finalReport.quality.score;
  const totalDelta  = finalScore - baselineScore;

  // Summary table
  const W = [24, 22, 22, 8];
  process.stdout.write(`\n${BOLD}=== Refactoring Summary ===${RESET}\n\n`);
  process.stdout.write(`  ${'Function'.padEnd(W[0])} ${'File'.padEnd(W[1])} ${'Issue'.padEnd(W[2])} ${'Before'.padEnd(W[3])} After\n`);
  process.stdout.write(`  ${'─'.repeat(W[0])} ${'─'.repeat(W[1])} ${'─'.repeat(W[2])} ${'─'.repeat(W[3])} ${'─'.repeat(8)}\n`);

  for (const r of results) {
    const fn    = r.finding.function_name.slice(0, W[0] - 1).padEnd(W[0]);
    const file  = r.finding.file.slice(0, W[1] - 1).padEnd(W[1]);
    const issue = r.finding.type.slice(0, W[2] - 1).padEnd(W[2]);
    const before = String(r.finding.value).padEnd(W[3]);
    const after  = r.applied ? `${GREEN}✓ ${r.after}${RESET}` : `${RED}✗${RESET}`;
    process.stdout.write(`  ${fn} ${file} ${issue} ${before} ${after}\n`);
  }

  const deltaColor = totalDelta > 0 ? GREEN : totalDelta < 0 ? RED : DIM;
  const deltaStr   = totalDelta > 0 ? `+${totalDelta}` : String(totalDelta);
  process.stdout.write(
    `\n  Overall Quality Score: ${BOLD}${baselineScore} → ${finalScore}${RESET} ` +
    `(${deltaColor}${deltaStr}${RESET})  ` +
    `Grade: ${baselineGrade} → ${finalReport.quality.grade}\n\n`
  );

  // Always restore every file we touched — changes are for analysis only, never committed
  if (modifiedFiles.size > 0) {
    restoreAll();
    process.stdout.write(`${DIM}All ${modifiedFiles.size} modified file(s) restored to original.${RESET}\n\n`);
  }

  // Generate HTML report including feedback loop data
  try {
    const history   = loadHistory(directory);
    saveHistory(directory, finalReport);
    const fixes     = generateFixes(finalReport.security.findings);
    const html      = generateHtml(finalReport, { fixes, history, feedbackLoops: loopEvents });
    const outPath   = resolve('./report.html');
    writeFileSync(outPath, html, 'utf8');
    process.stdout.write(`${DIM}Report written to ${outPath}${RESET}\n`);
  } catch {}
}
