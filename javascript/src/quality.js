import { GRADE_BOUNDARIES } from './constants.js';

export function compute({
  totalLoc, totalCommentLines, totalFunctions, totalFunctionLines,
  totalFiles, smellWarnings, smellErrors, secretCount, dangerousCallCount,
}) {
  const codeSmellScore    = computeCodeSmellScore(totalFunctions, smellWarnings, smellErrors);
  const securityScore     = computeSecurityScore(secretCount, dangerousCallCount);
  const commentScore      = computeCommentScore(totalLoc, totalCommentLines);
  const maintScore        = computeMaintainabilityScore(totalFunctions, totalFunctionLines, totalFiles, totalLoc);

  const composite = Math.round(
    codeSmellScore * 0.30 +
    securityScore  * 0.25 +
    commentScore   * 0.20 +
    maintScore     * 0.25
  );

  return {
    score: composite,
    grade: computeGrade(composite),
    components: {
      code_smell_score:      Math.round(codeSmellScore),
      security_score:        Math.round(securityScore),
      comment_score:         Math.round(commentScore),
      maintainability_score: Math.round(maintScore),
    },
  };
}

function computeCodeSmellScore(totalFunctions, warnings, errors) {
  const density = (warnings * 1 + errors * 2) / Math.max(totalFunctions, 1);
  return Math.max(0, 100 - density * 50);
}

function computeSecurityScore(secretCount, dangerousCallCount) {
  return Math.max(0, 100 - secretCount * 20 - dangerousCallCount * 10);
}

function computeCommentScore(totalLoc, totalCommentLines) {
  const ratio = totalCommentLines / Math.max(totalLoc, 1);
  if (ratio < 0.05) return ratio / 0.05 * 40;
  if (ratio <= 0.30) return 40 + (ratio - 0.05) / 0.25 * 60;
  return Math.max(60, 100 - (ratio - 0.30) * 200);
}

function computeMaintainabilityScore(totalFunctions, totalFunctionLines, totalFiles, totalLoc) {
  const avgFnLen = totalFunctionLines / Math.max(totalFunctions, 1);
  let lengthScore;
  if (avgFnLen <= 20) lengthScore = 100;
  else if (avgFnLen <= 50) lengthScore = Math.max(0, 100 - (avgFnLen - 20) / 30 * 50);
  else lengthScore = Math.max(0, 50 - (avgFnLen - 50) / 50 * 50);

  const avgFileLoc = totalLoc / Math.max(totalFiles, 1);
  let fileScore;
  if (avgFileLoc <= 200) fileScore = 100;
  else if (avgFileLoc <= 500) fileScore = Math.max(0, 100 - (avgFileLoc - 200) / 300 * 40);
  else fileScore = Math.max(0, 60 - (avgFileLoc - 500) / 500 * 60);

  return lengthScore * 0.6 + fileScore * 0.4;
}

export function computeGrade(score) {
  for (const [threshold, letter] of GRADE_BOUNDARIES) {
    if (score >= threshold) return letter;
  }
  return 'F';
}
