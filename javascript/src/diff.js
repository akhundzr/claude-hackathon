import { execSync } from 'node:child_process';
import { writeFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const RED   = '\x1b[31m';
const GREEN = '\x1b[32m';
const CYAN  = '\x1b[36m';
const DIM   = '\x1b[2m';
const RESET = '\x1b[0m';

/**
 * Generate a colorized unified diff between two code strings.
 * Uses the system `diff` command for accurate LCS-based output.
 */
export function generateDiff(original, refactored, label = 'function') {
  const ts  = Date.now();
  const tmpA = join(tmpdir(), `scanner-diff-${ts}-a.tmp`);
  const tmpB = join(tmpdir(), `scanner-diff-${ts}-b.tmp`);

  try {
    writeFileSync(tmpA, original, 'utf8');
    writeFileSync(tmpB, refactored, 'utf8');

    let raw = '';
    try {
      raw = execSync(`diff -u "${tmpA}" "${tmpB}"`, { encoding: 'utf8' });
    } catch (e) {
      // diff exits 1 when files differ — that is the normal case
      raw = e.stdout || '';
    }

    return colorize(raw, label);
  } finally {
    try { unlinkSync(tmpA); } catch {}
    try { unlinkSync(tmpB); } catch {}
  }
}

function colorize(raw, label) {
  return raw.split('\n').map((line, i) => {
    if (i === 0) return `${CYAN}--- ${label} (original)${RESET}`;
    if (i === 1) return `${CYAN}+++ ${label} (refactored)${RESET}`;
    if (line.startsWith('@@'))                          return `${DIM}${line}${RESET}`;
    if (line.startsWith('---') || line.startsWith('+++')) return `${CYAN}${line}${RESET}`;
    if (line.startsWith('-'))                           return `${RED}${line}${RESET}`;
    if (line.startsWith('+'))                           return `${GREEN}${line}${RESET}`;
    return line;
  }).join('\n');
}
