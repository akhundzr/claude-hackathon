import { readFileSync } from 'node:fs';

// ─── Hardcoded Secrets ────────────────────────────────────────────────────────

const SECRET_PATTERNS = [
  // Existing
  ['aws_key',             /(?:aws_access_key_id|aws_secret_access_key)\s*[=:]\s*['"]?[A-Za-z0-9/+=]{20,}/i],
  ['api_key_assignment',  /(?:api[_-]?key|apikey|api[_-]?secret)\s*[=:]\s*['"]?[A-Za-z0-9_\-]{16,}/i],
  ['password_assignment', /(?:password|passwd|pwd)\s*[=:]\s*['"][^'"]{4,}['"]/i],
  ['private_key',         /-----BEGIN (?:RSA|DSA|EC|OPENSSH)? ?PRIVATE KEY-----/],
  ['generic_token',       /(?:token|secret|auth[_-]?key)\s*[=:]\s*['"]?[A-Za-z0-9_\-]{16,}/i],
  ['connection_string',   /(?:mongodb\+srv|postgres|mysql|redis):\/\/[^\s'"]+/i],

  // Provider-specific tokens (CWE-798 / OWASP A07)
  ['github_token',        /ghp_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{82}/],
  ['slack_token',         /xox[baprs]-[A-Za-z0-9\-]{10,}/],
  ['stripe_key',          /(?:sk|rk)_live_[A-Za-z0-9]{24,}/],
  ['google_api_key',      /AIza[0-9A-Za-z\-_]{35}/],
  ['jwt_token',           /eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+/],
  ['sendgrid_key',        /SG\.[A-Za-z0-9_\-]{22,}\.[A-Za-z0-9_\-]{43,}/],
  ['twilio_sid',          /AC[a-f0-9]{32}/],
  ['npm_token',           /npm_[A-Za-z0-9]{36}/],
  ['gitlab_token',        /glpat-[A-Za-z0-9\-_]{20}/],

  // Hardcoded IP addresses (CWE-200 / OWASP A05)
  // Only matches IPs in string literals; excludes loopback and any-address
  ['hardcoded_ip',        /['"](?!(?:127\.0\.0\.1|0\.0\.0\.0)['"])(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)['"]/],
];

// ─── Dangerous Calls & Insecure Config ───────────────────────────────────────

const DANGEROUS_PATTERNS = [
  // Existing — command injection & code execution (CWE-78, CWE-95)
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

  // Weak cryptography (CWE-327, CWE-328 / OWASP A02)
  ['weak_hash_md5',           /hashlib\.md5\s*\(|crypto\.createHash\s*\(\s*['"]md5['"]\s*\)|\bMD5\s*\(/i],
  ['weak_hash_sha1',          /hashlib\.sha1\s*\(|crypto\.createHash\s*\(\s*['"]sha1['"]\s*\)|\bSHA1\s*\(/i],
  ['insecure_random',         /\bMath\.random\s*\(\s*\)|\brandom\.random\s*\(\s*\)|\brandom\.randint\s*\(/],

  // Insecure TLS / HTTP (CWE-295, CWE-319 / OWASP A02)
  ['tls_verify_disabled',     /verify\s*=\s*False|rejectUnauthorized\s*:\s*false|NODE_TLS_REJECT_UNAUTHORIZED\s*=\s*['"]?0['"]?/i],
  ['insecure_http_url',       /['"]http:\/\/(?!localhost|127\.0\.0\.1)[A-Za-z0-9]/],

  // CORS misconfiguration (CWE-942 / OWASP A05)
  ['cors_wildcard',           /Access-Control-Allow-Origin['"]*\s*[:,]\s*['"]*\*|origin\s*:\s*(?:true|['"]\*['"])/i],

  // Debug mode & sensitive logging (CWE-215, CWE-532 / OWASP A09)
  ['debug_mode_enabled',      /\bDEBUG\s*=\s*True\b|app\.(?:debug|testing)\s*=\s*True\b|\bdebug\s*:\s*true\b/i],
  ['sensitive_log',           /console\.(?:log|warn|error)\s*\([^)]*(?:password|passwd|secret|token|api_key|apikey)\b|print\s*\([^)]*(?:password|passwd|secret|token)\b/i],
];

// ─── Descriptions ─────────────────────────────────────────────────────────────

const SECRET_DETAILS = {
  aws_key:             'Possible hardcoded AWS key',
  api_key_assignment:  'Possible hardcoded API key',
  password_assignment: 'Possible hardcoded password',
  private_key:         'Private key header detected',
  generic_token:       'Possible hardcoded token or secret',
  connection_string:   'Possible hardcoded connection string with credentials',
  github_token:        'Hardcoded GitHub personal access token',
  slack_token:         'Hardcoded Slack token',
  stripe_key:          'Hardcoded Stripe live secret key',
  google_api_key:      'Hardcoded Google API key',
  jwt_token:           'Hardcoded JWT token',
  sendgrid_key:        'Hardcoded SendGrid API key',
  twilio_sid:          'Hardcoded Twilio Account SID',
  npm_token:           'Hardcoded npm access token',
  gitlab_token:        'Hardcoded GitLab personal access token',
  hardcoded_ip:        'Hardcoded IP address — leaks infrastructure topology',
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
  weak_hash_md5:           'MD5 is cryptographically broken — use SHA-256 or stronger',
  weak_hash_sha1:          'SHA-1 is cryptographically broken — use SHA-256 or stronger',
  insecure_random:         'Insecure random number generator — use a cryptographically secure alternative',
  tls_verify_disabled:     'TLS certificate verification disabled — vulnerable to MITM attacks',
  insecure_http_url:       'Non-HTTPS URL — data transmitted in cleartext',
  cors_wildcard:           'CORS wildcard origin allows any domain to make cross-origin requests',
  debug_mode_enabled:      'Debug mode enabled in production — may expose stack traces and internals',
  sensitive_log:           'Sensitive value (password/token/secret) passed to log output',
};

// ─── Scanner ──────────────────────────────────────────────────────────────────

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
