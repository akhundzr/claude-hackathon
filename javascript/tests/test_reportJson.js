import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aggregate } from '../src/aggregator.js';

const REQUIRED_KEYS = ['scan_metadata', 'summary', 'quality', 'code_smells', 'security', 'files'];

test('schema keys present in report', () => {
  const r = aggregate({ directory: '/d', fileResults: [], smellFindings: [], securityFindings: [], skipped: 0, durationMs: 10 });
  for (const key of REQUIRED_KEYS) {
    assert.ok(key in r, `Missing key: ${key}`);
  }
});

test('quality sub-keys', () => {
  const r = aggregate({ directory: '/d', fileResults: [], smellFindings: [], securityFindings: [], skipped: 0, durationMs: 10 });
  assert.ok('score' in r.quality);
  assert.ok('grade' in r.quality);
  assert.ok('components' in r.quality);
});

test('metadata fields', () => {
  const r = aggregate({ directory: '/mydir', fileResults: [], smellFindings: [], securityFindings: [], skipped: 3, durationMs: 456 });
  assert.equal(r.scan_metadata.directory, '/mydir');
  assert.equal(r.scan_metadata.skipped_files, 3);
  assert.equal(r.scan_metadata.scan_duration_ms, 456);
  assert.ok('timestamp' in r.scan_metadata);
  assert.ok('total_files_scanned' in r.scan_metadata);
});

test('JSON serializable', () => {
  const r = aggregate({ directory: '/d', fileResults: [], smellFindings: [], securityFindings: [], skipped: 0, durationMs: 10 });
  const json = JSON.stringify(r);
  const parsed = JSON.parse(json);
  assert.deepEqual(Object.keys(parsed).sort(), REQUIRED_KEYS.sort());
});
