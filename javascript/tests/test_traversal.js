import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, chmodSync, symlinkSync, unlinkSync, rmdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { walk } from '../src/traversal.js';

function mktmp() {
  return mkdtempSync(join(tmpdir(), 'scanner-test-'));
}

test('returns files in directory', () => {
  const d = mktmp();
  writeFileSync(join(d, 'app.py'), '');
  writeFileSync(join(d, 'main.js'), '');
  const { files, skipped } = walk(d);
  assert.equal(files.length, 2);
  assert.equal(skipped, 0);
});

test('ignores node_modules', () => {
  const d = mktmp();
  mkdirSync(join(d, 'node_modules'));
  writeFileSync(join(d, 'node_modules', 'pkg.js'), '');
  writeFileSync(join(d, 'app.py'), '');
  const { files } = walk(d);
  assert.equal(files.length, 1);
  assert.ok(files[0].endsWith('app.py'));
});

test('ignores all configured dirs', () => {
  const ignoreDirs = ['.git', 'node_modules', '__pycache__', 'venv', '.env', 'dist', 'build'];
  const d = mktmp();
  for (const name of ignoreDirs) {
    mkdirSync(join(d, name));
    writeFileSync(join(d, name, 'file.js'), '');
  }
  writeFileSync(join(d, 'keep.py'), '');
  const { files } = walk(d);
  assert.equal(files.length, 1);
});

test('does not follow symlinks', () => {
  const d = mktmp();
  const real = join(d, 'real.py');
  writeFileSync(real, '');
  symlinkSync(real, join(d, 'link.py'));
  const { files } = walk(d);
  assert.equal(files.length, 1);
  assert.ok(files[0].endsWith('real.py'));
});

test('walks subdirectories', () => {
  const d = mktmp();
  mkdirSync(join(d, 'sub'));
  writeFileSync(join(d, 'a.py'), '');
  writeFileSync(join(d, 'sub', 'b.py'), '');
  const { files } = walk(d);
  assert.equal(files.length, 2);
});
