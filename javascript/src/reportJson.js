import { writeFileSync } from 'node:fs';

export function output(report, filepath = null) {
  const text = JSON.stringify(report, null, 2);
  process.stdout.write(text + '\n');
  if (filepath) {
    writeFileSync(filepath, text, 'utf8');
  }
}
