import { readFileSync, writeFileSync } from 'node:fs';
import { detectLanguage } from './language.js';
import { findFunctions } from './smells.js';

/**
 * Extract a function body from a file given a smell finding.
 * Returns null if the function cannot be located.
 */
export function extractFunction(filepath, finding) {
  let content;
  try {
    content = readFileSync(filepath, 'utf8');
  } catch {
    return null;
  }

  const language = detectLanguage(filepath);
  const lines = content.split('\n');
  const functions = findFunctions(lines, language);

  // Find by startLine first (finding.line is 1-indexed)
  let fn = functions.find(f => f.startLine === finding.line);

  // Fallback: find by name if line doesn't match
  if (!fn && finding.function_name && finding.function_name !== '<anonymous>') {
    fn = functions.find(f => f.name === finding.function_name);
  }

  if (!fn) return null;

  const startIdx = fn.startLine - 1;               // 0-indexed start of signature
  const endIdx   = startIdx + fn.bodyLines + 1;    // 0-indexed exclusive end

  const contextStart = Math.max(0, startIdx - 5);
  const context = lines.slice(contextStart, startIdx).join('\n');
  const body    = lines.slice(startIdx, endIdx).join('\n');

  return {
    filePath:      filepath,
    language,
    functionName:  fn.name,
    startLine:     fn.startLine,  // 1-indexed
    startIdx,                     // 0-indexed
    endIdx,                       // 0-indexed exclusive
    body,
    context,
    originalLines: lines,         // full file lines, for restoring
  };
}

/**
 * Replace the original function in the file with refactored code.
 */
export function applyRefactoring(extracted, refactoredCode) {
  const { originalLines, startIdx, endIdx, filePath } = extracted;
  const newLines = [
    ...originalLines.slice(0, startIdx),
    refactoredCode,
    ...originalLines.slice(endIdx),
  ];
  writeFileSync(filePath, newLines.join('\n'), 'utf8');
}

/**
 * Restore the file to its original content.
 */
export function restoreFile(extracted) {
  writeFileSync(extracted.filePath, extracted.originalLines.join('\n'), 'utf8');
}
