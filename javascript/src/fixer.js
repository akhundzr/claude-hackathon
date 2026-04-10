/**
 * Generate suggested fixes for security findings.
 * Returns autoFixes (can be applied programmatically),
 * reviewFixes (need human judgment), and a commit preview.
 */

const FIXERS = {
  tls_verify_disabled: {
    autoFixable: true,
    commitCategory: 'Fix TLS verification bypass',
    fix: s => s
      .replace(/verify\s*=\s*False/g, 'verify=True')
      .replace(/rejectUnauthorized\s*:\s*false/gi, 'rejectUnauthorized: true')
      .replace(/NODE_TLS_REJECT_UNAUTHORIZED\s*=\s*['"]?0['"]?/g, "NODE_TLS_REJECT_UNAUTHORIZED='1'"),
  },
  debug_mode_enabled: {
    autoFixable: true,
    commitCategory: 'Disable debug mode in production',
    fix: s => s
      .replace(/\bDEBUG\s*=\s*True\b/g, 'DEBUG = False')
      .replace(/app\.debug\s*=\s*True/g, 'app.debug = False')
      .replace(/\bdebug\s*:\s*true\b/gi, 'debug: false'),
  },
  insecure_http_url: {
    autoFixable: true,
    commitCategory: 'Upgrade HTTP URLs to HTTPS',
    fix: s => s.replace(/(['"])http:\/\/(?!localhost|127\.0\.0\.1)/g, '$1https://'),
  },

  // These need human judgment — we show the snippet but don't auto-fix
  cors_wildcard:       { autoFixable: false, commitCategory: 'Restrict CORS wildcard origins' },
  hardcoded_ip:        { autoFixable: false, commitCategory: 'Remove hardcoded IP addresses' },
  sensitive_log:       { autoFixable: false, commitCategory: 'Remove sensitive values from logs' },
  weak_hash_md5:       { autoFixable: false, commitCategory: 'Replace MD5 with SHA-256 or stronger' },
  weak_hash_sha1:      { autoFixable: false, commitCategory: 'Replace SHA-1 with SHA-256 or stronger' },
  insecure_random:     { autoFixable: false, commitCategory: 'Replace insecure RNG with cryptographic alternative' },

  // Secrets always need rotation — never auto-fix
  aws_key:             { autoFixable: false, commitCategory: 'Rotate and remove hardcoded credentials' },
  api_key_assignment:  { autoFixable: false, commitCategory: 'Rotate and remove hardcoded credentials' },
  password_assignment: { autoFixable: false, commitCategory: 'Rotate and remove hardcoded credentials' },
  private_key:         { autoFixable: false, commitCategory: 'Rotate and remove hardcoded credentials' },
  generic_token:       { autoFixable: false, commitCategory: 'Rotate and remove hardcoded credentials' },
  connection_string:   { autoFixable: false, commitCategory: 'Rotate and remove hardcoded credentials' },
  github_token:        { autoFixable: false, commitCategory: 'Rotate and remove hardcoded credentials' },
  slack_token:         { autoFixable: false, commitCategory: 'Rotate and remove hardcoded credentials' },
  stripe_key:          { autoFixable: false, commitCategory: 'Rotate and remove hardcoded credentials' },
  google_api_key:      { autoFixable: false, commitCategory: 'Rotate and remove hardcoded credentials' },
  jwt_token:           { autoFixable: false, commitCategory: 'Rotate and remove hardcoded credentials' },
  sendgrid_key:        { autoFixable: false, commitCategory: 'Rotate and remove hardcoded credentials' },
  twilio_sid:          { autoFixable: false, commitCategory: 'Rotate and remove hardcoded credentials' },
  npm_token:           { autoFixable: false, commitCategory: 'Rotate and remove hardcoded credentials' },
  gitlab_token:        { autoFixable: false, commitCategory: 'Rotate and remove hardcoded credentials' },
};

export function generateFixes(securityFindings) {
  const autoFixes   = [];
  const reviewFixes = [];
  const categoryMap = {};  // commitCategory → { count, files: Set }

  for (const finding of securityFindings) {
    const fixer = FIXERS[finding.pattern];
    if (!fixer) continue;

    const { commitCategory, autoFixable, fix } = fixer;

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
    };

    if (autoFixable && fix) {
      const fixedSnippet = fix((finding.snippet || '').trim());
      if (fixedSnippet !== entry.snippet) {
        autoFixes.push({ ...entry, fixedSnippet });
      } else {
        reviewFixes.push(entry);  // fix didn't change anything, needs manual look
      }
    } else {
      reviewFixes.push(entry);
    }
  }

  const totalAuto   = autoFixes.length;
  const totalReview = reviewFixes.length;
  const total       = totalAuto + totalReview;

  const categories = Object.entries(categoryMap)
    .sort((a, b) => b[1].count - a[1].count)
    .map(([name, { count, files }]) => ({ name, count, files: [...files] }));

  const commitMessage = total > 0
    ? `fix: address ${total} security vulnerabilit${total === 1 ? 'y' : 'ies'}`
    : 'No security issues to fix';

  return {
    autoFixes,
    reviewFixes,
    commitPreview: { message: commitMessage, categories },
  };
}
