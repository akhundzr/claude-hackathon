import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { scan } from '../src/security.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES = join(__dirname, 'fixtures');

test('hardcoded api key in fixture', () => {
  const findings = scan(join(FIXTURES, 'sample.py'), 'Python');
  const secrets = findings.filter(f => f.type === 'hardcoded_secret');
  assert.ok(secrets.length >= 1, `Expected hardcoded_secret, got: ${JSON.stringify(findings)}`);
});

test('eval in js fixture', () => {
  const findings = scan(join(FIXTURES, 'sample.js'), 'JavaScript');
  const evals = findings.filter(f => f.pattern === 'eval_call');
  assert.ok(evals.length >= 1, `Expected eval_call, got: ${JSON.stringify(findings)}`);
});

test('secret severity is error', () => {
  const findings = scan(join(FIXTURES, 'sample.py'), 'Python');
  const secrets = findings.filter(f => f.type === 'hardcoded_secret');
  assert.ok(secrets.every(f => f.severity === 'error'));
});

test('dangerous call severity is warning', () => {
  const findings = scan(join(FIXTURES, 'sample.js'), 'JavaScript');
  const dangerous = findings.filter(f => f.type === 'dangerous_call');
  assert.ok(dangerous.every(f => f.severity === 'warning'));
});

test('findings have required fields', () => {
  const findings = scan(join(FIXTURES, 'sample.py'), 'Python');
  assert.ok(findings.length > 0);
  for (const f of findings) {
    assert.ok('type' in f);
    assert.ok('severity' in f);
    assert.ok('file' in f);
    assert.ok('line' in f);
    assert.ok('pattern' in f);
    assert.ok('detail' in f);
    assert.ok('snippet' in f);
  }
});

test('aws key pattern', () => {
  const dir = mkdtempSync(join(tmpdir(), 'scanner-test-'));
  const path = join(dir, 'config.py');
  writeFileSync(path, 'aws_access_key_id = "AKIAIOSFODNN7EXAMPLE123"\n');
  const findings = scan(path, 'Python');
  const aws = findings.filter(f => f.pattern === 'aws_key');
  assert.ok(aws.length >= 1);
});

test('password pattern', () => {
  const dir = mkdtempSync(join(tmpdir(), 'scanner-test-'));
  const path = join(dir, 'config.py');
  writeFileSync(path, 'password = "mysecretpassword"\n');
  const findings = scan(path, 'Python');
  const pw = findings.filter(f => f.pattern === 'password_assignment');
  assert.ok(pw.length >= 1);
});
