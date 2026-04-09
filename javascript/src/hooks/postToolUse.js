import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, extname, resolve } from 'node:path';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { EXTENSION_MAP } from '../constants.js';
import { runScan } from '../scan.js';

const STATE_FILE = join(tmpdir(), '.scanner-hook-state.json');

const RESET = '\x1b[0m';
const DIM   = '\x1b[2m';
const GREEN = '\x1b[32m';
const RED   = '\x1b[31m';

// Non-code file types — skip scanning these
const NON_CODE_LANGS = new Set(['JSON', 'YAML', 'Markdown', 'Text', 'TOML', 'XML', 'HTML', 'CSS', 'SCSS/Sass', 'SQL']);

function readState() {
  try { return JSON.parse(readFileSync(STATE_FILE, 'utf8')); } catch { return null; }
}

function writeState(data) {
  try { writeFileSync(STATE_FILE, JSON.stringify(data), 'utf8'); } catch {}
}

async function readStdin() {
  return new Promise(res => {
    let data = '';
    const timeout = setTimeout(() => res(data), 500);
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', chunk => { data += chunk; });
    process.stdin.on('end', () => { clearTimeout(timeout); res(data); });
    process.stdin.resume();
  });
}

async function main() {
  const raw = await readStdin();

  let filePath;
  try {
    const data = JSON.parse(raw);
    filePath = data.tool_input?.file_path ?? data.tool_input?.path;
  } catch {}

  // Fallback: path from argv (useful for manual testing)
  if (!filePath) filePath = process.argv[2];
  if (!filePath) process.exit(0);

  filePath = resolve(filePath);

  // Only scan recognized source file extensions
  const ext  = extname(filePath).toLowerCase();
  const lang = EXTENSION_MAP[ext];
  if (!lang || NON_CODE_LANGS.has(lang)) process.exit(0);

  const dir = dirname(filePath);
  if (!existsSync(dir)) process.exit(0);

  let report;
  try {
    report = runScan([dir]);
  } catch {
    process.exit(0);
  }

  const newScore = report.quality.score;
  const newGrade = report.quality.grade;
  const state    = readState();

  writeState({ lastScore: newScore, lastGrade: newGrade, directory: dir, lastScanTime: new Date().toISOString() });

  if (!state || state.directory !== dir) {
    process.stderr.write(`${DIM}Quality: ${newScore} (${newGrade})${RESET}\n`);
    process.exit(0);
  }

  const delta = newScore - state.lastScore;

  if (delta > 0) {
    process.stderr.write(`${GREEN}✓ Quality: ${state.lastScore} → ${newScore} (+${delta}) [${newGrade}]${RESET}\n`);
  } else if (delta === 0) {
    process.stderr.write(`${DIM}= Quality: ${newScore} (unchanged) [${newGrade}]${RESET}\n`);
  } else {
    process.stderr.write(`${RED}⚠ Quality: ${state.lastScore} → ${newScore} (${delta}) [${newGrade}]${RESET}\n`);
  }
}

main().catch(() => process.exit(0));
