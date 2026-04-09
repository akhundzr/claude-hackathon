export const SYSTEM_PROMPT = `You are a senior software engineer performing code refactoring.
You receive a function that has been flagged by a code quality scanner.
Your job is to refactor it to address the specific issues identified.

Rules:
- Preserve the function's external behavior (same inputs, same outputs)
- Keep the same function name and parameter signature unless the issue IS the parameter list
- Return ONLY the refactored function code, no explanations before or after
- Use the same coding style (indentation, naming conventions) as the original
- If the function requires splitting into multiple functions, include all of them
- Do not add comments explaining the refactoring — the code should be self-explanatory`;

export function buildUserPrompt({ language, filePath, smellType, smellDetail, context, functionBody, attempt = 1 }) {
  const retryNote = attempt > 1
    ? `\n\nNote: Attempt ${attempt - 1} did not improve the quality score. The issue is: ${smellType} (${smellDetail}). Try a significantly different approach — extract helper functions, simplify control flow, or restructure the logic entirely.`
    : '';

  return `Language: ${language}
File: ${filePath}

## Issue identified
${smellType}: ${smellDetail}

## Context (preceding code)
\`\`\`${language.toLowerCase()}
${context}
\`\`\`

## Function to refactor
\`\`\`${language.toLowerCase()}
${functionBody}
\`\`\`

Return the refactored code inside a single fenced code block.${retryNote}`;
}

/**
 * Extract the code block from a Claude response.
 */
export function parseRefactoredCode(responseText) {
  const match = responseText.match(/```(?:\w+)?\n?([\s\S]*?)```/);
  if (match) return match[1].trimEnd();
  return responseText.trim();
}
