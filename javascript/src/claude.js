import Anthropic from '@anthropic-ai/sdk';
import { SYSTEM_PROMPT, buildUserPrompt, parseRefactoredCode } from './prompt.js';

let _client;

function getClient() {
  if (!_client) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY environment variable is not set');
    }
    _client = new Anthropic();
  }
  return _client;
}

/**
 * Ask Claude to suggest a refactoring for a flagged function.
 * Retries once on transient API errors (rate limits, network).
 */
export async function suggestRefactoring({
  language,
  filePath,
  smellType,
  smellDetail,
  context,
  functionBody,
  model = 'claude-sonnet-4-6',
  attempt = 1,
}) {
  const client = getClient();
  const userPrompt = buildUserPrompt({ language, filePath, smellType, smellDetail, context, functionBody, attempt });

  let lastErr;
  for (let retry = 0; retry < 2; retry++) {
    try {
      const message = await client.messages.create({
        model,
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
      });
      return parseRefactoredCode(message.content[0]?.text || '');
    } catch (err) {
      lastErr = err;
      if (retry === 0) await new Promise(r => setTimeout(r, 2000));
    }
  }
  throw lastErr;
}
