import { Command } from 'commander';
import { existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

export function parseArgs() {
  const program = new Command();
  let result;

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
      result = {
        command: 'scan',
        directories: absDirs,
        output: options.output,
        noOpen: !options.open,
        noIgnore: !options.ignore,
      };
    });

  program
    .command('refactor <directory>')
    .description('AI-powered refactoring assistant — scan, suggest, apply, re-scan')
    .option('--top <n>', 'Number of worst-scoring functions to refactor', '3')
    .option('--auto', 'Auto-accept all suggestions without prompting')
    .option('--model <model>', 'Claude model to use', 'claude-sonnet-4-6')
    .option('--dry-run', 'Show diffs but do not write changes')
    .action((directory, options) => {
      const absDir = resolve(directory);
      if (!existsSync(absDir) || !statSync(absDir).isDirectory()) {
        process.stderr.write(`Error: '${absDir}' is not a valid directory\n`);
        process.exit(1);
      }
      result = {
        command: 'refactor',
        directory: absDir,
        top:    parseInt(options.top, 10) || 3,
        auto:   !!options.auto,
        model:  options.model,
        dryRun: !!options.dryRun,
      };
    });

  program.parse(process.argv);

  if (!result) {
    program.help();
    process.exit(1);
  }

  return result;
}
