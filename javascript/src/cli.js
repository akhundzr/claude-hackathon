import { Command } from 'commander';
import { existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

export function parseArgs() {
  const program = new Command();

  program
    .name('scanner')
    .description('Code Scanner — instant codebase health assessment');

  program
    .command('scan <directories...>')
    .description('Scan one or more directories for code quality metrics')
    .option('--output <path>', 'Output path for HTML report', './report.html')
    .option('--no-open', 'Suppress automatic browser opening')
    .option('--no-ignore', 'Do not skip any directories (node_modules, .git, etc.)')
    .action((directories, options) => {
      const absDirs = directories.map(d => resolve(d));
      for (const absDir of absDirs) {
        if (!existsSync(absDir) || !statSync(absDir).isDirectory()) {
          process.stderr.write(`Error: '${absDir}' is not a valid directory\n`);
          process.exit(1);
        }
      }
      program._scanArgs = { directories: absDirs, output: options.output, noOpen: !options.open, noIgnore: !options.ignore };
    });

  program.parse(process.argv);

  if (!program._scanArgs) {
    program.help();
    process.exit(1);
  }

  return program._scanArgs;
}
