import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compute, computeGrade } from '../src/quality.js';

test('perfect score', () => {
  const result = compute({
    totalLoc: 100, totalCommentLines: 30, totalFunctions: 10,
    totalFunctionLines: 200, totalFiles: 5,
    smellWarnings: 0, smellErrors: 0, secretCount: 0, dangerousCallCount: 0,
  });
  assert.equal(result.score, 100);
  assert.equal(result.grade, 'A');
});

test('grade boundaries', () => {
  assert.equal(computeGrade(100), 'A');
  assert.equal(computeGrade(90), 'A');
  assert.equal(computeGrade(89), 'B');
  assert.equal(computeGrade(80), 'B');
  assert.equal(computeGrade(79), 'C');
  assert.equal(computeGrade(70), 'C');
  assert.equal(computeGrade(69), 'D');
  assert.equal(computeGrade(60), 'D');
  assert.equal(computeGrade(59), 'F');
  assert.equal(computeGrade(0), 'F');
});

test('score decreases with smells', () => {
  const clean = compute({ totalLoc: 100, totalCommentLines: 20, totalFunctions: 10, totalFunctionLines: 200, totalFiles: 5, smellWarnings: 0, smellErrors: 0, secretCount: 0, dangerousCallCount: 0 });
  const smelly = compute({ totalLoc: 100, totalCommentLines: 20, totalFunctions: 10, totalFunctionLines: 200, totalFiles: 5, smellWarnings: 10, smellErrors: 5, secretCount: 0, dangerousCallCount: 0 });
  assert.ok(clean.score > smelly.score);
});

test('score decreases with secrets', () => {
  const clean = compute({ totalLoc: 100, totalCommentLines: 20, totalFunctions: 10, totalFunctionLines: 200, totalFiles: 5, smellWarnings: 0, smellErrors: 0, secretCount: 0, dangerousCallCount: 0 });
  const insecure = compute({ totalLoc: 100, totalCommentLines: 20, totalFunctions: 10, totalFunctionLines: 200, totalFiles: 5, smellWarnings: 0, smellErrors: 0, secretCount: 3, dangerousCallCount: 0 });
  assert.ok(clean.score > insecure.score);
});

test('components present', () => {
  const result = compute({ totalLoc: 100, totalCommentLines: 20, totalFunctions: 10, totalFunctionLines: 200, totalFiles: 5, smellWarnings: 0, smellErrors: 0, secretCount: 0, dangerousCallCount: 0 });
  assert.ok('code_smell_score' in result.components);
  assert.ok('security_score' in result.components);
  assert.ok('comment_score' in result.components);
  assert.ok('maintainability_score' in result.components);
});

test('score in range 0-100', () => {
  const result = compute({ totalLoc: 100, totalCommentLines: 20, totalFunctions: 10, totalFunctionLines: 200, totalFiles: 5, smellWarnings: 5, smellErrors: 2, secretCount: 1, dangerousCallCount: 3 });
  assert.ok(result.score >= 0 && result.score <= 100);
});

test('zero loc no crash', () => {
  const result = compute({ totalLoc: 0, totalCommentLines: 0, totalFunctions: 0, totalFunctionLines: 0, totalFiles: 0, smellWarnings: 0, smellErrors: 0, secretCount: 0, dangerousCallCount: 0 });
  assert.ok(result.score >= 0 && result.score <= 100);
});
