import { relative } from 'node:path';
import { compute as computeQuality } from './quality.js';

export function aggregate({ directory, fileResults, smellFindings, securityFindings, skipped, durationMs }) {
  const totalLoc       = fileResults.reduce((s, f) => s + f.loc, 0);
  const totalComment   = fileResults.reduce((s, f) => s + f.comment_lines, 0);
  const totalBlank     = fileResults.reduce((s, f) => s + f.blank_lines, 0);
  const totalFunctions = fileResults.reduce((s, f) => s + f.functions, 0);
  const totalClasses   = fileResults.reduce((s, f) => s + f.classes, 0);

  // Per-language breakdown
  const languages = {};
  for (const f of fileResults) {
    const lang = f.language;
    if (!languages[lang]) {
      languages[lang] = { files: 0, loc: 0, comment_lines: 0, blank_lines: 0, functions: 0, classes: 0 };
    }
    const lg = languages[lang];
    lg.files++;
    lg.loc += f.loc;
    lg.comment_lines += f.comment_lines;
    lg.blank_lines += f.blank_lines;
    lg.functions += f.functions;
    lg.classes += f.classes;
  }

  const smellWarnings = smellFindings.filter(s => s.severity === 'warning').length;
  const smellErrors   = smellFindings.filter(s => s.severity === 'error').length;
  const secretCount   = securityFindings.filter(s => s.type === 'hardcoded_secret').length;
  const dangerCount   = securityFindings.filter(s => s.type === 'dangerous_call').length;

  const quality = computeQuality({
    totalLoc,
    totalCommentLines: totalComment,
    totalFunctions,
    totalFunctionLines: totalLoc, // approximation
    totalFiles: fileResults.length,
    smellWarnings,
    smellErrors,
    secretCount,
    dangerousCallCount: dangerCount,
  });

  // Normalize paths to be relative to scanned directory
  const filesOut = fileResults.map(f => ({
    path: relative(directory, f.path),
    language: f.language,
    loc: f.loc,
    comment_lines: f.comment_lines,
    blank_lines: f.blank_lines,
    functions: f.functions,
    classes: f.classes,
    smells: f.smells || 0,
    security_issues: f.security_issues || 0,
  }));

  for (const finding of [...smellFindings, ...securityFindings]) {
    finding.file = relative(directory, finding.file);
  }

  return {
    scan_metadata: {
      directory,
      timestamp: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
      total_files_scanned: fileResults.length,
      skipped_files: skipped,
      scan_duration_ms: durationMs,
    },
    summary: {
      total_loc: totalLoc,
      total_comment_lines: totalComment,
      total_blank_lines: totalBlank,
      total_files: fileResults.length,
      total_functions: totalFunctions,
      total_classes: totalClasses,
      languages,
    },
    quality,
    code_smells: {
      total_warnings: smellWarnings,
      total_errors: smellErrors,
      findings: smellFindings,
    },
    security: {
      total_findings: securityFindings.length,
      findings: securityFindings,
    },
    files: filesOut,
  };
}
