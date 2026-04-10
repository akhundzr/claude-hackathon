import { extname, basename } from 'node:path';
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
  const base     = basename(filePath);
  const baseLower = base.toLowerCase();

  if (FILENAME_MAP[baseLower]) return FILENAME_MAP[baseLower];

  const ext = extname(base);
  return EXTENSION_MAP[ext] ?? EXTENSION_MAP[ext.toLowerCase()] ?? 'unknown';
}
