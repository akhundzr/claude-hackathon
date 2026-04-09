import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aggregate } from '../src/aggregator.js';

function fr(path, lang, loc = 100, comments = 15, blanks = 20, fns = 5, classes = 1, smells = 0, sec = 0) {
  return { path, language: lang, loc, comment_lines: comments, blank_lines: blanks,
           functions: fns, classes, smells, security_issues: sec };
}

test('basic totals', () => {
  const files = [fr('/d/a.py', 'Python', 100), fr('/d/b.py', 'Python', 200), fr('/d/c.js', 'JavaScript', 50)];
  const r = aggregate({ directory: '/d', fileResults: files, smellFindings: [], securityFindings: [], skipped: 0, durationMs: 100 });
  assert.equal(r.summary.total_loc, 350);
  assert.equal(r.summary.total_files, 3);
});

test('per language breakdown', () => {
  const files = [fr('/d/a.py', 'Python', 100, 15, 20, 3, 1), fr('/d/b.py', 'Python', 200, 30, 40, 5, 2), fr('/d/c.js', 'JavaScript', 50)];
  const r = aggregate({ directory: '/d', fileResults: files, smellFindings: [], securityFindings: [], skipped: 0, durationMs: 50 });
  assert.equal(r.summary.languages.Python.files, 2);
  assert.equal(r.summary.languages.Python.loc, 300);
  assert.equal(r.summary.languages.Python.functions, 8);
  assert.ok('JavaScript' in r.summary.languages);
});

test('schema keys present', () => {
  const r = aggregate({ directory: '/d', fileResults: [], smellFindings: [], securityFindings: [], skipped: 0, durationMs: 10 });
  for (const key of ['scan_metadata', 'summary', 'quality', 'code_smells', 'security', 'files']) {
    assert.ok(key in r, `Missing key: ${key}`);
  }
});

test('smell counts', () => {
  const smells = [
    { severity: 'warning', file: '/d/a.py', type: 'long_function', line: 1, function_name: 'foo', detail: '', value: 35 },
    { severity: 'error',   file: '/d/b.py', type: 'deep_nesting',  line: 5, function_name: 'bar', detail: '', value: 7 },
  ];
  const r = aggregate({ directory: '/d', fileResults: [], smellFindings: smells, securityFindings: [], skipped: 0, durationMs: 10 });
  assert.equal(r.code_smells.total_warnings, 1);
  assert.equal(r.code_smells.total_errors, 1);
});

test('security counts', () => {
  const sec = [{ type: 'hardcoded_secret', severity: 'error', file: '/d/a.py', line: 3, pattern: 'api_key', detail: '', snippet: '' }];
  const r = aggregate({ directory: '/d', fileResults: [], smellFindings: [], securityFindings: sec, skipped: 0, durationMs: 10 });
  assert.equal(r.security.total_findings, 1);
});

test('file paths are relative', () => {
  const files = [fr('/mydir/src/app.py', 'Python')];
  const r = aggregate({ directory: '/mydir', fileResults: files, smellFindings: [], securityFindings: [], skipped: 0, durationMs: 10 });
  assert.equal(r.files[0].path, 'src/app.py');
});

test('scan metadata fields', () => {
  const r = aggregate({ directory: '/d', fileResults: [], smellFindings: [], securityFindings: [], skipped: 2, durationMs: 123 });
  assert.equal(r.scan_metadata.skipped_files, 2);
  assert.equal(r.scan_metadata.scan_duration_ms, 123);
  assert.equal(r.scan_metadata.directory, '/d');
  assert.ok('timestamp' in r.scan_metadata);
});
