import { Command } from 'commander';
import { existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

export function parseArgs() {
  const program = new Command();

  program
    .name('scanner')
    .description('Code Scanner — instant codebase health assessment');

  program
    .command('scan <directory>')
    .description('Scan a directory for code quality metrics')
    .option('--output <path>', 'Output path for HTML report', './report.html')
    .option('--no-open', 'Suppress automatic browser opening')
    .action((directory, options, cmd) => {
      const absDir = resolve(directory);
      if (!existsSync(absDir) || !statSync(absDir).isDirectory()) {
        process.stderr.write(`Error: '${directory}' is not a valid directory\n`);
        process.exit(1);
      }
      // Store parsed result on program for retrieval
      program._scanArgs = { directory: absDir, output: options.output, noOpen: !options.open };
    });

  program.parse(process.argv);

  if (!program._scanArgs) {
    program.help();
    process.exit(1);
  }

  return program._scanArgs;
}
