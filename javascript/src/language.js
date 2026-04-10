import { extname, basename } from 'node:path';
import { openSync, readSync, closeSync } from 'node:fs';
import { EXTENSION_MAP } from './constants.js';

// Exact filename matches (case-insensitive) — catches dotfiles and extensionless build files
const FILENAME_MAP = {
  // VCS
  '.gitignore':      'Git Config',
  '.gitattributes':  'Git Config',
  '.gitmodules':     'Git Config',
  '.gitkeep':        'Git Config',
  // Docker / CI
  'dockerfile':      'Dockerfile',
  '.dockerignore':   'Docker Config',
  'jenkinsfile':     'Groovy',
  // Build tools
  'makefile':        'Makefile',
  'gnumakefile':     'Makefile',
  'cmakelists.txt':  'CMake',
  'rakefile':        'Ruby',
  'gemfile':         'Ruby',
  'vagrantfile':     'Ruby',
  'podfile':         'Ruby',
  'brewfile':        'Ruby',
  // Node / JS tooling
  '.eslintrc':       'Config',
  '.eslintignore':   'Config',
  '.prettierrc':     'Config',
  '.prettierignore': 'Config',
  '.babelrc':        'Config',
  '.npmrc':          'Config',
  '.nvmrc':          'Config',
  '.node-version':   'Config',
  // Python tooling
  'pipfile':         'Config',
  'requirements.txt':'Config',
  'setup.cfg':       'Config',
  'tox.ini':         'Config',
  'pyproject.toml':  'Config',
  // General dotfiles / env
  '.env':            'Config',
  '.env.example':    'Config',
  '.editorconfig':   'Config',
  '.htaccess':       'Config',
  'procfile':        'Config',
  'license':         'Text',
  'licence':         'Text',
  'readme':          'Markdown',
  'changelog':       'Text',
  'authors':         'Text',
  'contributors':    'Text',
};

export function detectLanguage(filePath) {
  const base      = basename(filePath);
  const baseLower = base.toLowerCase();

  // 1. Exact filename match
  if (FILENAME_MAP[baseLower]) return FILENAME_MAP[baseLower];

  // 2. Extension match
  const ext = extname(base);
  const byExt = EXTENSION_MAP[ext] ?? EXTENSION_MAP[ext.toLowerCase()];
  if (byExt) return byExt;

  // 3. Content-based detection — read first 600 bytes for pattern matching
  return detectByContent(filePath);
}

function detectByContent(filePath) {
  let head = '';
  try {
    // Read only the first 600 bytes — enough for patterns, avoids loading big binaries
    const buf = Buffer.alloc(600);
    const fd  = openSync(filePath, 'r');
    const n   = readSync(fd, buf, 0, 600, 0);
    closeSync(fd);
    head = buf.slice(0, n).toString('utf8');
  } catch {
    return 'unknown';
  }

  // Binary check — if many non-printable chars it's probably a binary artifact
  const nonPrint = (head.match(/[\x00-\x08\x0e-\x1f\x7f]/g) || []).length;
  if (nonPrint > 10) return 'Binary';

  const trimmed   = head.trimStart();
  const firstLine = head.split('\n')[0].trim();
  const upper     = head.toUpperCase();

  // ── Shebang ─────────────────────────────────────────────────────────────
  if (firstLine.startsWith('#!')) {
    if (/python/.test(firstLine))           return 'Python';
    if (/node|nodejs/.test(firstLine))      return 'JavaScript';
    if (/ruby/.test(firstLine))             return 'Ruby';
    if (/perl/.test(firstLine))             return 'Perl';
    if (/php/.test(firstLine))              return 'PHP';
    if (/env\s+bash|\/bash|\/sh\b/.test(firstLine)) return 'Shell';
    return 'Shell';  // unknown shebang — still a script
  }

  // ── Markup / web ────────────────────────────────────────────────────────
  if (/^<\?xml/i.test(trimmed))                            return 'XML';
  if (/^<!DOCTYPE\s+html|^<html/i.test(trimmed))           return 'HTML';
  if (/^<\?php/i.test(trimmed))                            return 'PHP';

  // ── AWS / IaC ────────────────────────────────────────────────────────────
  if (/AWSTemplateFormatVersion/i.test(head))              return 'CloudFormation';
  if (/^(resource|provider|variable|output|terraform|data|module)\s+"/m.test(head)) return 'Terraform';

  // ── Dockerfile instructions ──────────────────────────────────────────────
  if (/^(FROM|RUN|ENV|COPY|ADD|CMD|ENTRYPOINT|EXPOSE|WORKDIR|ARG|LABEL)\s/m.test(head)) return 'Dockerfile';

  // ── SQL ──────────────────────────────────────────────────────────────────
  if (/^\s*(SELECT|INSERT\s+INTO|UPDATE\s+\w|DELETE\s+FROM|CREATE\s+(TABLE|INDEX|VIEW|DATABASE)|ALTER\s+TABLE|DROP\s+TABLE|GRANT|REVOKE)\b/im.test(head)) return 'SQL';

  // ── YAML (common indicators) ──────────────────────────────────────────────
  if (/^---/.test(trimmed) || /^\w[\w-]*:\s*\S/m.test(head)) return 'YAML';

  // ── JSON ──────────────────────────────────────────────────────────────────
  if (/^\s*[{\[]/.test(head)) return 'JSON';

  // ── INI / key=value config (e.g. tfvars, .env-like) ──────────────────────
  if (/^[a-z_][\w-]*\s*=\s*.+/im.test(head) && !/^\s*def |^\s*class |^\s*import /m.test(head)) return 'Config';

  // ── Groovy / Jenkinsfile-like pipeline DSL ────────────────────────────────
  if (/^pipeline\s*\{|^node\s*\{|^stage\s*\(/m.test(head))  return 'Groovy';

  return 'unknown';
}
