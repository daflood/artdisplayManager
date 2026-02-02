#!/usr/bin/env node

import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import { scanDirectories, ScanCallbacks } from './scanner.js';
import { formatJson, writeJson } from './output/json.js';
import { formatCsv, writeCsv } from './output/csv.js';
import { ScanOptions } from './types.js';

const program = new Command();

program
  .name('media-scanner')
  .description('Scan directories for 16:9 aspect ratio media files')
  .version('1.0.0')
  .argument('<directories...>', 'Directories to scan')
  .option('-o, --output <file>', 'Output file path (default: stdout)')
  .option('-f, --format <type>', 'Output format: json or csv', 'json')
  .option('--no-duplicates', 'Skip duplicate detection')
  .option('-c, --concurrency <number>', 'Concurrent file processing limit', '25')
  .action(async (directories: string[], opts) => {
    const options: ScanOptions = {
      output: opts.output,
      format: opts.format as 'json' | 'csv',
      duplicates: opts.duplicates !== false,
      concurrency: parseInt(opts.concurrency, 10),
    };

    // Validate directories exist
    // (scanner will warn for inaccessible ones)

    const spinner = ora();
    let totalFiles = 0;

    const callbacks: ScanCallbacks = {
      onFileFound: (count) => {
        totalFiles = count;
        spinner.text = `Finding files... ${count} found`;
      },
      onFileProcessed: (current, total, file) => {
        const pct = Math.round((current / total) * 100);
        spinner.text = `Processing files [${pct}%] ${current}/${total}`;
      },
      onHashProgress: (current, total) => {
        const pct = Math.round((current / total) * 100);
        spinner.text = `Detecting duplicates [${pct}%] ${current}/${total}`;
      },
    };

    console.log(chalk.blue('Media Scanner v1.0.0'));
    console.log(chalk.gray(`Scanning: ${directories.join(', ')}`));
    console.log();

    spinner.start('Finding files...');

    try {
      const result = await scanDirectories(directories, options, callbacks);
      spinner.succeed('Scan complete!');

      // Print summary
      console.log();
      console.log(chalk.green('Results:'));
      console.log(`  Total files scanned: ${result.stats.totalFiles}`);
      console.log(`  Images processed: ${result.stats.imagesProcessed}`);
      console.log(`  Videos processed: ${result.stats.videosProcessed}`);
      console.log(`  ${chalk.bold(`16:9 matches: ${result.stats.matchCount}`)}`);
      if (options.duplicates) {
        console.log(`  Duplicates found: ${result.stats.duplicateCount}`);
      }
      if (result.stats.skippedCount > 0) {
        console.log(chalk.yellow(`  Skipped (errors): ${result.stats.skippedCount}`));
      }
      console.log(`  Duration: ${(result.stats.scanDuration / 1000).toFixed(1)}s`);
      console.log();

      // Output results
      if (options.output) {
        if (options.format === 'csv') {
          await writeCsv(result, options.output);
        } else {
          await writeJson(result, options.output);
        }
        console.log(chalk.green(`Results written to: ${options.output}`));
      } else {
        // Output to stdout
        if (options.format === 'csv') {
          console.log(formatCsv(result));
        } else {
          console.log(formatJson(result));
        }
      }
    } catch (error) {
      spinner.fail('Scan failed');
      console.error(chalk.red((error as Error).message));
      process.exit(1);
    }
  });

program.parse();
