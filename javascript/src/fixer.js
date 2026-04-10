/**
 * Generate suggested fixes for security findings.
 * Each pattern includes: issue, risk, resolution, and (if autoFixable) a fix function.
 */

const FIXERS = {
  tls_verify_disabled: {
    autoFixable: true,
    commitCategory: 'Fix TLS verification bypass',
    issue: 'TLS certificate verification is disabled.',
    risk: 'Without certificate verification the application is vulnerable to man-in-the-middle (MITM) attacks. An attacker on the network can intercept encrypted traffic by presenting a forged certificate — the application will accept it without question.',
    resolution: 'Enable certificate verification (verify=True / rejectUnauthorized: true). The TLS library will then validate the server\'s certificate against trusted CAs before establishing the connection.',
    fix: s => s
      .replace(/verify\s*=\s*False/g, 'verify=True')
      .replace(/rejectUnauthorized\s*:\s*false/gi, 'rejectUnauthorized: true')
      .replace(/NODE_TLS_REJECT_UNAUTHORIZED\s*=\s*['"]?0['"]?/g, "NODE_TLS_REJECT_UNAUTHORIZED='1'"),
  },

  debug_mode_enabled: {
    autoFixable: true,
    commitCategory: 'Disable debug mode in production',
    issue: 'Debug mode is enabled in a production-facing configuration.',
    risk: 'Debug mode exposes detailed stack traces, internal configuration, environment variables, and sometimes interactive debuggers to anyone who triggers an error. This gives attackers a roadmap to the application internals.',
    resolution: 'Set DEBUG = False (Django) or app.debug = False (Flask) for all production deployments. Use environment variables to control this so it can never accidentally be committed as True.',
    fix: s => s
      .replace(/\bDEBUG\s*=\s*True\b/g, 'DEBUG = False')
      .replace(/app\.debug\s*=\s*True/g, 'app.debug = False')
      .replace(/\bdebug\s*:\s*true\b/gi, 'debug: false'),
  },

  insecure_http_url: {
    autoFixable: true,
    commitCategory: 'Upgrade HTTP URLs to HTTPS',
    issue: 'A hardcoded HTTP (non-TLS) URL is used for a non-localhost host.',
    risk: 'HTTP transmits all data in plaintext. Any network observer — including shared WiFi, proxies, or ISPs — can read or modify requests and responses, including authentication tokens, API keys, and sensitive data payloads.',
    resolution: 'Replace http:// with https:// so all traffic is encrypted in transit. Ensure the target server has a valid TLS certificate.',
    fix: s => s.replace(/(['"])http:\/\/(?!localhost|127\.0\.0\.1)/g, '$1https://'),
  },

  cors_wildcard: {
    autoFixable: false,
    commitCategory: 'Restrict CORS wildcard origins',
    issue: 'CORS is configured to allow requests from any origin (*).',
    risk: 'A wildcard CORS policy allows any website on the internet to make cross-origin requests to this API. If the API uses cookie-based authentication or returns sensitive data, malicious sites can read that data from their users\' browsers.',
    resolution: 'Replace the wildcard with an explicit allowlist of trusted origins (e.g. your frontend domain). Never use * on endpoints that handle authenticated requests or return user-specific data.',
  },

  hardcoded_ip: {
    autoFixable: false,
    commitCategory: 'Remove hardcoded IP addresses',
    issue: 'A hardcoded IP address is present in source code.',
    risk: 'Hardcoded IPs expose network topology to anyone who reads the source. If the code is in a public repo or the binary is reverse-engineered, attackers learn the exact addresses of internal services, making targeted attacks easier.',
    resolution: 'Move IP addresses to environment variables or a configuration file outside of source control. Use DNS names instead of raw IPs where possible so addresses can change without a code deployment.',
  },

  sensitive_log: {
    autoFixable: false,
    commitCategory: 'Remove sensitive values from logs',
    issue: 'A sensitive value (password, token, or secret) is passed to a log or print statement.',
    risk: 'Log output is often stored in centralised logging systems, forwarded to third-party services, or accessible to ops teams. A secret in logs means anyone with log access can impersonate the affected account or system.',
    resolution: 'Remove the sensitive value from the log call entirely, or replace it with a redacted indicator such as "[REDACTED]". Never log raw credentials, tokens, or private keys.',
  },

  weak_hash_md5: {
    autoFixable: false,
    commitCategory: 'Replace MD5 with a secure hash algorithm',
    issue: 'MD5 is used as a cryptographic hash function.',
    risk: 'MD5 is cryptographically broken. Collisions (two different inputs producing the same hash) can be computed in seconds with commodity hardware. Using MD5 for password hashing, integrity checking, or digital signatures provides no meaningful security.',
    resolution: 'Replace MD5 with SHA-256 or SHA-3 for integrity checks. For password hashing use bcrypt, argon2, or PBKDF2 with a salt — never a bare fast hash.',
  },

  weak_hash_sha1: {
    autoFixable: false,
    commitCategory: 'Replace SHA-1 with a secure hash algorithm',
    issue: 'SHA-1 is used as a cryptographic hash function.',
    risk: 'SHA-1 is theoretically broken (SHAttered collision attack demonstrated in 2017) and practically deprecated by all major standards bodies. Signatures and certificates using SHA-1 are no longer trusted by modern browsers and OS certificate stores.',
    resolution: 'Replace SHA-1 with SHA-256 or SHA-3 for all security-sensitive hashing. For password storage use bcrypt, argon2, or PBKDF2.',
  },

  insecure_random: {
    autoFixable: false,
    commitCategory: 'Replace insecure RNG with cryptographic alternative',
    issue: 'An insecure pseudo-random number generator is used (Math.random / random.random).',
    risk: 'Standard PRNGs are not cryptographically secure — their output is predictable given enough observations. Using them to generate tokens, session IDs, passwords, or nonces means an attacker who observes some outputs can predict future values.',
    resolution: 'Use a cryptographically secure RNG: crypto.getRandomValues() or crypto.randomBytes() in Node.js; secrets.token_bytes() or secrets.token_hex() in Python.',
  },

  // Secrets — always need rotation
  aws_key:             secretFixer('AWS access key or secret key', 'AWS credentials grant full programmatic access to your AWS account. A leaked key can be used to spin up infrastructure, exfiltrate data from S3, or run up charges. AWS keys found in public repos are harvested by bots within minutes.'),
  api_key_assignment:  secretFixer('Hardcoded API key', 'A hardcoded API key gives whoever possesses it the same access as the service account it belongs to. If the repo is public or the key appears in logs, any third party can abuse it until it is revoked.'),
  password_assignment: secretFixer('Hardcoded password', 'Hardcoded passwords are trivially extracted from source code or compiled binaries. They cannot be rotated without a code change and deployment, meaning a compromise is difficult to contain quickly.'),
  private_key:         secretFixer('Private key embedded in source', 'A private key in source code is permanently compromised. Anyone with read access to the repo can impersonate the key holder, decrypt traffic, or forge signatures. Keys cannot be "uncompromised" once exposed — they must be revoked and reissued.'),
  generic_token:       secretFixer('Hardcoded token or secret', 'Tokens embedded in source provide static access that cannot be scoped or revoked per session. A leaked token often provides long-lived access to APIs, internal services, or cloud resources.'),
  connection_string:   secretFixer('Hardcoded database/service connection string', 'Connection strings contain hostnames, ports, usernames, and passwords in a single string. Exposure gives direct database access to anyone who reads the code, potentially allowing full data exfiltration or destruction.'),
  github_token:        secretFixer('GitHub personal access token', 'GitHub tokens grant repo read/write access and can be used to steal code, inject malicious commits, or pivot to CI/CD secrets. GitHub scans public repos and notifies owners, but private repo exposure is silent until abused.'),
  slack_token:         secretFixer('Slack API token', 'Slack tokens can be used to read all messages in accessible channels, post as the token owner, and exfiltrate data from connected integrations.'),
  stripe_key:          secretFixer('Stripe live secret key', 'A Stripe live key allows full control of payment processing: creating charges, issuing refunds, accessing customer card data (within PCI scope), and exfiltrating transaction history.'),
  google_api_key:      secretFixer('Google API key', 'Google API keys can be used to make API calls billed to your account. Depending on the APIs enabled, this may allow reading Gmail, Drive, Maps data, or running up charges via expensive APIs.'),
  jwt_token:           secretFixer('Hardcoded JWT token', 'A hardcoded JWT is a static credential that grants whatever access the token encodes until it expires. If it has no expiry, access is permanent.'),
  sendgrid_key:        secretFixer('SendGrid API key', 'A SendGrid key can be used to send emails as your domain, bypass email sending limits, access contact lists, and damage your domain reputation through spam.'),
  twilio_sid:          secretFixer('Twilio Account SID', 'Twilio credentials allow sending SMS/voice calls billed to your account and reading call/message logs, which may contain sensitive communications.'),
  npm_token:           secretFixer('npm access token', 'An npm token can publish malicious packages under your account, potentially poisoning the supply chain of any project that depends on your packages.'),
  gitlab_token:        secretFixer('GitLab personal access token', 'GitLab tokens grant repo and CI/CD access. They can be used to steal code, read CI/CD secrets, or inject malicious pipeline jobs.'),
};

function secretFixer(issue, risk) {
  return {
    autoFixable: false,
    commitCategory: 'Rotate and remove hardcoded credentials',
    issue,
    risk,
    resolution: 'Remove the credential from source code immediately. Rotate/revoke the exposed credential — treat it as compromised. Store secrets in environment variables, a secrets manager (AWS Secrets Manager, HashiCorp Vault), or a CI/CD secrets store. Add the pattern to .gitignore or pre-commit hooks to prevent re-introduction.',
  };
}

export function generateFixes(securityFindings) {
  const autoFixes   = [];
  const reviewFixes = [];
  const categoryMap = {};

  for (const finding of securityFindings) {
    const fixer = FIXERS[finding.pattern];
    if (!fixer) continue;

    const { commitCategory, autoFixable, fix, issue, risk, resolution } = fixer;

    if (!categoryMap[commitCategory]) {
      categoryMap[commitCategory] = { count: 0, files: new Set() };
    }
    categoryMap[commitCategory].count++;
    categoryMap[commitCategory].files.add(finding.file);

    const entry = {
      file:           finding.file,
      line:           finding.line,
      pattern:        finding.pattern,
      snippet:        (finding.snippet || '').trim(),
      commitCategory,
      issue:          issue || '',
      risk:           risk  || '',
      resolution:     resolution || '',
    };

    if (autoFixable && fix) {
      const fixedSnippet = fix(entry.snippet);
      if (fixedSnippet !== entry.snippet) {
        autoFixes.push({ ...entry, fixedSnippet });
      } else {
        reviewFixes.push(entry);
      }
    } else {
      reviewFixes.push(entry);
    }
  }

  const total = autoFixes.length + reviewFixes.length;

  const categories = Object.entries(categoryMap)
    .sort((a, b) => b[1].count - a[1].count)
    .map(([name, { count, files }]) => ({ name, count, files: [...files] }));

  return {
    autoFixes,
    reviewFixes,
    commitPreview: {
      message: total > 0 ? `fix: address ${total} security vulnerabilit${total === 1 ? 'y' : 'ies'}` : 'No security issues to fix',
      categories,
    },
  };
}
