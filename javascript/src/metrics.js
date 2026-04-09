import { readFileSync } from 'node:fs';

const C_STYLE_LANGS = new Set([
  'JavaScript', 'TypeScript', 'JSX', 'TSX', 'Java', 'C', 'C++',
  'C/C++ Header', 'C#', 'Go', 'Rust', 'Swift', 'Kotlin', 'PHP',
  'CSS', 'SCSS/Sass',
]);
const HASH_COMMENT_LANGS = new Set(['Python', 'Ruby', 'Shell', 'R']);
const HTML_LANGS = new Set(['HTML', 'XML']);
const SQL_LANGS = new Set(['SQL']);

export const FUNCTION_PATTERNS = {
  Python:     [/^\s*def\s+\w+\s*\(/],
  Ruby:       [/^\s*def\s+\w+/],
  Shell:      [/^\s*\w+\s*\(\)\s*\{?\s*$/],
  Go:         [/^\s*func\s+/],
  Rust:       [/^\s*fn\s+\w+\s*[(<]/],
  JavaScript: [/^\s*function\s+\w+\s*\(/, /^\s*const\s+\w+\s*=\s*(function\b|\([^)]*\)\s*=>|\w+\s*=>)/, /^\s*async\s+function\s+\w+\s*\(/],
  TypeScript: [/^\s*function\s+\w+\s*\(/, /^\s*const\s+\w+\s*=\s*(function\b|\([^)]*\)\s*=>|\w+\s*=>)/, /^\s*async\s+function\s+\w+\s*\(/],
  JSX:        [/^\s*function\s+\w+\s*\(/, /^\s*const\s+\w+\s*=\s*(function\b|\([^)]*\)\s*=>|\w+\s*=>)/],
  TSX:        [/^\s*function\s+\w+\s*\(/, /^\s*const\s+\w+\s*=\s*(function\b|\([^)]*\)\s*=>|\w+\s*=>)/],
  Java:       [/(public|private|protected)\s.*\w+\s*\(/],
  'C#':       [/(public|private|protected)\s.*\w+\s*\(/],
  Kotlin:     [/^\s*(fun|override\s+fun)\s+\w+\s*\(/],
  PHP:        [/^\s*(public|private|protected|static)?\s*function\s+\w+\s*\(/],
  Swift:      [/^\s*func\s+\w+\s*\(/],
  Scala:      [/^\s*def\s+\w+/],
};

export const CLASS_PATTERNS = {
  Python:     [/^\s*class\s+\w+/],
  JavaScript: [/^\s*class\s+\w+/],
  TypeScript: [/^\s*class\s+\w+/],
  JSX:        [/^\s*class\s+\w+/],
  TSX:        [/^\s*class\s+\w+/],
  Ruby:       [/^\s*class\s+\w+/],
  PHP:        [/^\s*class\s+\w+/],
  'C++':      [/^\s*class\s+\w+/],
  Java:       [/^\s*(public\s+|private\s+|protected\s+)?(abstract\s+|final\s+)?class\s+\w+/],
  'C#':       [/^\s*(public\s+|private\s+|protected\s+)?(abstract\s+|sealed\s+)?class\s+\w+/],
  Kotlin:     [/^\s*(data\s+|sealed\s+|abstract\s+|open\s+)?class\s+\w+/],
  Go:         [/^\s*type\s+\w+\s+struct\s*\{/],
  Rust:       [/^\s*struct\s+\w+/],
  Swift:      [/^\s*class\s+\w+/],
};

export function analyzeFile(filepath, language) {
  let content;
  try {
    content = readFileSync(filepath, 'utf8');
  } catch (err) {
    process.stderr.write(`Warning: cannot read ${filepath}: ${err.message}\n`);
    return null;
  }

  const lines = content.split(/\r?\n/);
  if (lines.length && lines[lines.length - 1] === '') lines.pop();
  const counts = countLines(lines, language);
  return {
    path: filepath,
    language,
    loc: counts.loc,
    comment_lines: counts.commentLines,
    blank_lines: counts.blankLines,
    functions: counts.functions,
    classes: counts.classes,
  };
}

export function countLines(lines, language) {
  let loc = 0, commentLines = 0, blankLines = 0, functions = 0, classes = 0;
  let inBlock = false;
  let blockEnd = null;

  const fnPats = FUNCTION_PATTERNS[language] || [];
  const clsPats = CLASS_PATTERNS[language] || [];

  for (const raw of lines) {
    const stripped = raw.trim();

    if (!stripped) {
      blankLines++;
      continue;
    }

    if (inBlock) {
      commentLines++;
      if (blockEnd && stripped.includes(blockEnd)) inBlock = false;
      continue;
    }

    let handled = false;

    if (language === 'Python') {
      for (const bc of ['"""', "'''"]) {
        const idx = stripped.indexOf(bc);
        if (idx >= 0) {
          const before = stripped.slice(0, idx).trim();
          const after = stripped.slice(idx + 3);
          const sameLineClose = after.includes(bc);
          if (!before) commentLines++; else loc++;
          if (!sameLineClose) { inBlock = true; blockEnd = bc; }
          handled = true;
          break;
        }
      }
      if (!handled && stripped.startsWith('#')) {
        commentLines++;
        handled = true;
      }
    } else if (C_STYLE_LANGS.has(language)) {
      const blk = stripped.indexOf('/*');
      if (blk >= 0) {
        const before = stripped.slice(0, blk).trim();
        const after = stripped.slice(blk + 2);
        const sameLineClose = after.includes('*/');
        if (!before) commentLines++; else loc++;
        if (!sameLineClose) { inBlock = true; blockEnd = '*/'; }
        handled = true;
      } else if (stripped.startsWith('//')) {
        commentLines++;
        handled = true;
      }
    } else if (HTML_LANGS.has(language)) {
      const blk = stripped.indexOf('<!--');
      if (blk >= 0) {
        const before = stripped.slice(0, blk).trim();
        const after = stripped.slice(blk + 4);
        const sameLineClose = after.includes('-->');
        if (!before) commentLines++; else loc++;
        if (!sameLineClose) { inBlock = true; blockEnd = '-->'; }
        handled = true;
      }
    } else if (HASH_COMMENT_LANGS.has(language)) {
      if (stripped.startsWith('#')) {
        commentLines++;
        handled = true;
      }
    } else if (SQL_LANGS.has(language)) {
      if (stripped.startsWith('--')) {
        commentLines++;
        handled = true;
      } else {
        const blk = stripped.indexOf('/*');
        if (blk >= 0) {
          const before = stripped.slice(0, blk).trim();
          const after = stripped.slice(blk + 2);
          const sameLineClose = after.includes('*/');
          if (!before) commentLines++; else loc++;
          if (!sameLineClose) { inBlock = true; blockEnd = '*/'; }
          handled = true;
        }
      }
    }

    if (!handled) {
      loc++;
      if (fnPats.some(p => p.test(raw))) functions++;
      if (clsPats.some(p => p.test(raw))) classes++;
    }
  }

  return { loc, commentLines, blankLines, functions, classes };
}
