import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

function dirHash(directory) {
  return createHash('md5').update(directory).digest('hex').slice(0, 8);
}

const MAX_HISTORY = 10;

function stateFile(directory) {
  return join(tmpdir(), `.scanner-history-${dirHash(directory)}.json`);
}

function loopsFile(directory) {
  return join(tmpdir(), `.scanner-loops-${dirHash(directory)}.json`);
}

export function loadFeedbackLoops(directory) {
  try {
    return JSON.parse(readFileSync(loopsFile(directory), 'utf8'));
  } catch {
    return [];
  }
}

export function saveFeedbackLoops(directory, loops) {
  try {
    writeFileSync(loopsFile(directory), JSON.stringify(loops), 'utf8');
  } catch {}
}

export function loadHistory(directory) {
  try {
    const raw = readFileSync(stateFile(directory), 'utf8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveHistory(directory, report) {
  const history = loadHistory(directory);
  history.push({
    timestamp:     report.scan_metadata.timestamp,
    score:         report.quality.score,
    grade:         report.quality.grade,
    totalFindings: report.code_smells.findings.length + report.security.findings.length,
    directory:     report.scan_metadata.directory,
    durationMs:    report.scan_metadata.scan_duration_ms,
  });
  const trimmed = history.slice(-MAX_HISTORY);
  try {
    writeFileSync(stateFile(directory), JSON.stringify(trimmed), 'utf8');
  } catch {}
  return trimmed;
}
