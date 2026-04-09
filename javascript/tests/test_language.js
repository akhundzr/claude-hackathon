import { test } from 'node:test';
import assert from 'node:assert/strict';
import { detectLanguage } from '../src/language.js';

test('known extensions', () => {
  assert.equal(detectLanguage('file.py'), 'Python');
  assert.equal(detectLanguage('file.js'), 'JavaScript');
  assert.equal(detectLanguage('file.ts'), 'TypeScript');
  assert.equal(detectLanguage('file.go'), 'Go');
  assert.equal(detectLanguage('file.rs'), 'Rust');
  assert.equal(detectLanguage('file.java'), 'Java');
  assert.equal(detectLanguage('file.css'), 'CSS');
  assert.equal(detectLanguage('file.md'), 'Markdown');
});

test('unknown extension', () => {
  assert.equal(detectLanguage('file.xyz'), 'unknown');
  assert.equal(detectLanguage('file.foobar'), 'unknown');
  assert.equal(detectLanguage('Makefile'), 'unknown');
});

test('case insensitive', () => {
  assert.equal(detectLanguage('file.PY'), 'Python');
  assert.equal(detectLanguage('file.JS'), 'JavaScript');
  assert.equal(detectLanguage('file.TS'), 'TypeScript');
});

test('Dockerfile detection', () => {
  assert.equal(detectLanguage('Dockerfile'), 'Dockerfile');
  assert.equal(detectLanguage('dockerfile'), 'Dockerfile');
});

test('path with directories', () => {
  assert.equal(detectLanguage('/some/path/file.py'), 'Python');
  assert.equal(detectLanguage('src/App.tsx'), 'TSX');
});

test('multiple dots — last extension wins', () => {
  assert.equal(detectLanguage('file.test.py'), 'Python');
  assert.equal(detectLanguage('app.min.js'), 'JavaScript');
});
