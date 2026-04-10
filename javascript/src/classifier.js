import { readFileSync } from 'node:fs';
import Anthropic from '@anthropic-ai/sdk';

const MAX_LINES   = 20;   // lines of content to send per file
const BATCH_SIZE  = 15;   // files per API call

/**
 * Use Claude (Haiku) to make educated guesses about unrecognized file types.
 * Returns a map of { relPath → { guess, confidence } }
 * Silently returns {} if no API key or on any error.
 */
export async function classifyUnknownFiles(unknownFiles, directory) {
  if (!process.env.ANTHROPIC_API_KEY || !unknownFiles.length) return {};

  const client  = new Anthropic();
  const results = {};

  // Process in batches
  for (let i = 0; i < unknownFiles.length; i += BATCH_SIZE) {
    const batch = unknownFiles.slice(i, i + BATCH_SIZE);
    const snippets = batch.map(({ relPath, absPath }) => {
      let preview = '';
      try {
        preview = readFileSync(absPath, 'utf8')
          .split('\n').slice(0, MAX_LINES).join('\n');
      } catch {
        preview = '(unreadable)';
      }
      return `### ${relPath}\n\`\`\`\n${preview}\n\`\`\``;
    }).join('\n\n');

    const prompt = `You are identifying file types for a code scanner.

For each file below, respond with EXACTLY one line per file in this format:
FILENAME: TYPE

Rules:
- TYPE must be short (1-4 words): e.g. "AWS Glue Script", "Bash Script", "SQL Migration", "Terraform", "CloudFormation", "Config File", "Lock File", "Binary"
- Use the filename AND content to decide
- If content is empty or binary, say "Binary"
- Do not add explanation, just the lines

${snippets}`;

    try {
      const msg = await client.messages.create({
        model:      'claude-haiku-4-5-20251001',
        max_tokens: 512,
        messages:   [{ role: 'user', content: prompt }],
      });

      const text = msg.content[0]?.text || '';
      for (const line of text.split('\n')) {
        const m = line.match(/^(.+?):\s*(.+)$/);
        if (!m) continue;
        const name = m[1].trim();
        const type = m[2].trim();
        // Match back to the batch entry by relPath or basename
        const entry = batch.find(f =>
          f.relPath === name ||
          f.relPath.endsWith('/' + name) ||
          f.relPath.endsWith(name)
        );
        if (entry) results[entry.relPath] = type;
      }
    } catch {
      // Silently skip — AI classification is best-effort
    }
  }

  return results;
}
