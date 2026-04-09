import { readFileSync } from 'node:fs';
import { SMELL_THRESHOLDS } from './constants.js';
import { FUNCTION_PATTERNS } from './metrics.js';

export function detect(filepath, language) {
  let content;
  try {
    content = readFileSync(filepath, 'utf8');
  } catch (err) {
    process.stderr.write(`Warning: cannot read ${filepath}: ${err.message}\n`);
    return [];
  }

  const lines = content.split('\n');
  const functions = findFunctions(lines, language);
  const findings = [];
  const { long_function: lf, deep_nesting: dn, long_parameter_list: lp } = SMELL_THRESHOLDS;

  for (const fn of functions) {
    const { name, startLine, bodyLines, maxDepth, paramCount } = fn;

    if (bodyLines > lf.error) {
      findings.push({ type: 'long_function', severity: 'error', file: filepath, line: startLine, function_name: name, detail: `Function is ${bodyLines} lines (threshold: ${lf.error} for error)`, value: bodyLines });
    } else if (bodyLines > lf.warning) {
      findings.push({ type: 'long_function', severity: 'warning', file: filepath, line: startLine, function_name: name, detail: `Function is ${bodyLines} lines (threshold: ${lf.warning} for warning)`, value: bodyLines });
    }

    if (maxDepth > dn.error) {
      findings.push({ type: 'deep_nesting', severity: 'error', file: filepath, line: startLine, function_name: name, detail: `Nesting depth is ${maxDepth} (threshold: ${dn.error} for error)`, value: maxDepth });
    } else if (maxDepth > dn.warning) {
      findings.push({ type: 'deep_nesting', severity: 'warning', file: filepath, line: startLine, function_name: name, detail: `Nesting depth is ${maxDepth} (threshold: ${dn.warning} for warning)`, value: maxDepth });
    }

    if (paramCount > lp.error) {
      findings.push({ type: 'long_parameter_list', severity: 'error', file: filepath, line: startLine, function_name: name, detail: `Function has ${paramCount} parameters (threshold: ${lp.error} for error)`, value: paramCount });
    } else if (paramCount > lp.warning) {
      findings.push({ type: 'long_parameter_list', severity: 'warning', file: filepath, line: startLine, function_name: name, detail: `Function has ${paramCount} parameters (threshold: ${lp.warning} for warning)`, value: paramCount });
    }
  }

  return findings;
}

export function findFunctions(lines, language) {
  const fnPats = FUNCTION_PATTERNS[language] || [];
  if (!fnPats.length) return [];

  const found = [];
  const n = lines.length;

  for (let i = 0; i < n; i++) {
    const line = lines[i];
    if (!fnPats.some(p => p.test(line))) continue;

    const fnIndent = getIndent(line);
    const name = extractName(line);
    const paramCount = countParams(line, lines, i, language);

    let bodyLines = 0;
    let maxDepth = 0;
    let j = i + 1;

    while (j < n) {
      const bline = lines[j];
      const bstripped = bline.trimEnd();

      if (!bstripped) {
        bodyLines++;
        j++;
        continue;
      }

      const bIndent = getIndent(bline);
      if (bIndent <= fnIndent) break;

      bodyLines++;
      const depth = Math.floor(bIndent / 4);
      if (depth > maxDepth) maxDepth = depth;
      j++;
    }

    found.push({ name, startLine: i + 1, bodyLines, maxDepth, paramCount });
  }

  return found;
}

function getIndent(line) {
  const expanded = line.replace(/\t/g, '    ');
  return expanded.length - expanded.trimStart().length;
}

function extractName(line) {
  let m;
  if ((m = line.match(/\bdef\s+(\w+)\s*\(/))) return m[1];
  if ((m = line.match(/\bfunction\s+(\w+)\s*\(/))) return m[1];
  if ((m = line.match(/\bfunc\s+\(?(\w+)/))) return m[1];
  if ((m = line.match(/\bfn\s+(\w+)/))) return m[1];
  if ((m = line.match(/const\s+(\w+)\s*=/))) return m[1];
  if ((m = line.match(/\bfun\s+(\w+)\s*\(/))) return m[1];
  return '<anonymous>';
}

function countParams(line, lines, start, language) {
  const parenPos = line.indexOf('(');
  if (parenPos < 0) return 0;

  let paramStr = '';
  let depth = 0;
  let collecting = false;

  for (let i = start; i < Math.min(start + 10, lines.length); i++) {
    const text = i === start ? lines[i].slice(parenPos) : lines[i];
    for (const ch of text) {
      if (ch === '(') { depth++; collecting = true; }
      else if (ch === ')') {
        depth--;
        if (depth === 0 && collecting) return parseParams(paramStr, language);
      } else if (collecting && depth > 0) {
        paramStr += ch;
      }
    }
  }
  return 0;
}

function parseParams(paramStr, language) {
  paramStr = paramStr.trim();
  if (!paramStr) return 0;

  let depth = 0;
  const params = [];
  let current = '';

  for (const ch of paramStr) {
    if ('([{<'.includes(ch)) { depth++; current += ch; }
    else if (')]}>' .includes(ch)) { depth--; current += ch; }
    else if (ch === ',' && depth === 0) {
      if (current.trim()) params.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim()) params.push(current.trim());

  if (language === 'Python') {
    return params.filter(p => {
      const base = p.split(':')[0].split('=')[0].trim().replace(/^\*+/, '');
      return base !== 'self' && base !== 'cls';
    }).length;
  }

  return params.length;
}
