import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { detect } from '../src/smells.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES = join(__dirname, 'fixtures');

test('long function error in fixture', () => {
  const findings = detect(join(FIXTURES, 'sample.py'), 'Python');
  const errors = findings.filter(f => f.type === 'long_function' && f.severity === 'error');
  assert.ok(errors.length >= 1, `Expected long_function error, got: ${JSON.stringify(findings)}`);
});

test('long parameter list warning in fixture', () => {
  const findings = detect(join(FIXTURES, 'sample.py'), 'Python');
  const lp = findings.filter(f => f.type === 'long_parameter_list');
  assert.ok(lp.length >= 1, `Expected long_parameter_list, got: ${JSON.stringify(findings)}`);
});

test('deep nesting in js fixture', () => {
  const findings = detect(join(FIXTURES, 'sample.js'), 'JavaScript');
  const dn = findings.filter(f => f.type === 'deep_nesting');
  assert.ok(dn.length >= 1, `Expected deep_nesting, got: ${JSON.stringify(findings)}`);
});

test('findings have required fields', () => {
  const findings = detect(join(FIXTURES, 'sample.py'), 'Python');
  assert.ok(findings.length > 0);
  for (const f of findings) {
    assert.ok('type' in f);
    assert.ok('severity' in f);
    assert.ok('file' in f);
    assert.ok('line' in f);
    assert.ok('function_name' in f);
    assert.ok('detail' in f);
    assert.ok('value' in f);
  }
});

test('severity values are valid', () => {
  const findings = detect(join(FIXTURES, 'sample.py'), 'Python');
  for (const f of findings) {
    assert.ok(['warning', 'error'].includes(f.severity));
  }
});

test('no smells for empty file', () => {
  const dir = mkdtempSync(join(tmpdir(), 'scanner-test-'));
  const path = join(dir, 'empty.py');
  writeFileSync(path, '');
  const findings = detect(path, 'Python');
  assert.deepEqual(findings, []);
});

test('warning threshold for long function', () => {
  const dir = mkdtempSync(join(tmpdir(), 'scanner-test-'));
  const path = join(dir, 'test.py');
  const lines = ['def foo():\n', ...Array(35).fill('    x = 1\n')];
  writeFileSync(path, lines.join(''));
  const findings = detect(path, 'Python');
  const warns = findings.filter(f => f.type === 'long_function' && f.severity === 'warning');
  assert.ok(warns.length >= 1);
});
