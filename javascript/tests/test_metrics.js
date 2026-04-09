import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { analyzeFile, countLines } from '../src/metrics.js';

function makeFile(content, ext = '.py') {
  const dir = mkdtempSync(join(tmpdir(), 'scanner-test-'));
  const path = join(dir, `file${ext}`);
  writeFileSync(path, content, 'utf8');
  return path;
}

test('python comment and code lines', () => {
  const path = makeFile('# comment\ndef foo():\n    pass\n\nx = 1\n');
  const r = analyzeFile(path, 'Python');
  assert.equal(r.comment_lines, 1);
  assert.equal(r.loc, 3);
  assert.equal(r.blank_lines, 1);
  assert.equal(r.functions, 1);
});

test('blank lines', () => {
  const path = makeFile('\n\nx = 1\n\n');
  const r = analyzeFile(path, 'Python');
  assert.ok(r.blank_lines >= 3);
  assert.equal(r.loc, 1);
});

test('js comment lines', () => {
  const path = makeFile('// comment\nfunction foo() {\n    return 1;\n}\n', '.js');
  const r = analyzeFile(path, 'JavaScript');
  assert.equal(r.comment_lines, 1);
  assert.ok(r.functions >= 1);
});

test('inline comment counts as loc', () => {
  const path = makeFile('x = 1  # inline comment\n');
  const r = analyzeFile(path, 'Python');
  assert.equal(r.loc, 1);
  assert.equal(r.comment_lines, 0);
});

test('class count', () => {
  const path = makeFile('class Foo:\n    pass\n\nclass Bar:\n    pass\n');
  const r = analyzeFile(path, 'Python');
  assert.equal(r.classes, 2);
});

test('unreadable file returns null', () => {
  const r = analyzeFile('/nonexistent/path/file.py', 'Python');
  assert.equal(r, null);
});

test('function and class together', () => {
  const path = makeFile('class Foo:\n    def bar(self):\n        pass\n');
  const r = analyzeFile(path, 'Python');
  assert.equal(r.functions, 1);
  assert.equal(r.classes, 1);
});

test('js block comment', () => {
  const path = makeFile('/* block\n   comment */\nconst x = 1;\n', '.js');
  const r = analyzeFile(path, 'JavaScript');
  assert.ok(r.comment_lines >= 1);
  assert.ok(r.loc >= 1);
});
