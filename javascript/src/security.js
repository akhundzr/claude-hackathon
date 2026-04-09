import { readFileSync } from 'node:fs';

const SECRET_PATTERNS = [
  ['aws_key',            /(?:aws_access_key_id|aws_secret_access_key)\s*[=:]\s*['"]?[A-Za-z0-9/+=]{20,}/i],
  ['api_key_assignment', /(?:api[_-]?key|apikey|api[_-]?secret)\s*[=:]\s*['"]?[A-Za-z0-9_\-]{16,}/i],
  ['password_assignment',/(?:password|passwd|pwd)\s*[=:]\s*['"][^'"]{4,}['"]/i],
  ['private_key',        /-----BEGIN (?:RSA|DSA|EC|OPENSSH)? ?PRIVATE KEY-----/],
  ['generic_token',      /(?:token|secret|auth[_-]?key)\s*[=:]\s*['"]?[A-Za-z0-9_\-]{16,}/i],
  ['connection_string',  /(?:mongodb\+srv|postgres|mysql|redis):\/\/[^\s'"]+/i],
];

const DANGEROUS_PATTERNS = [
  ['eval_call',               /\beval\s*\(/],
  ['exec_call',               /\bexec\s*\(/],
  ['os_system',               /\bos\.system\s*\(/],
  ['subprocess_shell',        /subprocess\.\w+\(.*shell\s*=\s*True/],
  ['innerHTML_assign',        /\.innerHTML\s*=/],
  ['dangerouslySetInnerHTML', /dangerouslySetInnerHTML/],
  ['document_write',          /\bdocument\.write\s*\(/],
  ['child_process_exec',      /\bchild_process\.exec\s*\(/],
  ['pickle_loads',            /\bpickle\.loads\s*\(/],
  ['yaml_unsafe_load',        /\byaml\.load\s*\([^,)]*\)/],
  ['unsafe_c_string',         /\b(?:strcpy|strcat|gets)\s*\(/],
];

const SECRET_DETAILS = {
  aws_key:            'Possible hardcoded AWS key',
  api_key_assignment: 'Possible hardcoded API key',
  password_assignment:'Possible hardcoded password',
  private_key:        'Private key header detected',
  generic_token:      'Possible hardcoded token or secret',
  connection_string:  'Possible hardcoded connection string with credentials',
};

const DANGER_DETAILS = {
  eval_call:               'eval() allows arbitrary code execution',
  exec_call:               'exec() allows arbitrary code execution',
  os_system:               'os.system() is vulnerable to shell injection',
  subprocess_shell:        'subprocess with shell=True is vulnerable to shell injection',
  innerHTML_assign:        '.innerHTML assignment is vulnerable to XSS',
  dangerouslySetInnerHTML: 'dangerouslySetInnerHTML is vulnerable to XSS',
  document_write:          'document.write() is vulnerable to XSS',
  child_process_exec:      'child_process.exec() is vulnerable to shell injection',
  pickle_loads:            'pickle.loads() is vulnerable to deserialization attacks',
  yaml_unsafe_load:        'yaml.load() without Loader is unsafe',
  unsafe_c_string:         'Unsafe C string function (buffer overflow risk)',
};

export function scan(filepath, language) {
  let content;
  try {
    content = readFileSync(filepath, 'utf8');
  } catch (err) {
    process.stderr.write(`Warning: cannot read ${filepath}: ${err.message}\n`);
    return [];
  }

  const lines = content.split('\n');
  const findings = [];

  for (let lineno = 1; lineno <= lines.length; lineno++) {
    const raw = lines[lineno - 1];

    for (const [patternName, pattern] of SECRET_PATTERNS) {
      if (pattern.test(raw)) {
        findings.push({
          type: 'hardcoded_secret',
          severity: 'error',
          file: filepath,
          line: lineno,
          pattern: patternName,
          detail: SECRET_DETAILS[patternName] || 'Possible hardcoded secret',
          snippet: raw.trim().slice(0, 120),
        });
        break;
      }
    }

    for (const [patternName, pattern] of DANGEROUS_PATTERNS) {
      if (pattern.test(raw)) {
        findings.push({
          type: 'dangerous_call',
          severity: 'warning',
          file: filepath,
          line: lineno,
          pattern: patternName,
          detail: DANGER_DETAILS[patternName] || 'Potentially dangerous function call',
          snippet: raw.trim().slice(0, 120),
        });
        break;
      }
    }
  }

  return findings;
}
