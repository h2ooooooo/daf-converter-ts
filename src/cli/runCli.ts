import fs from 'node:fs';
import {parseArgs} from 'node:util';
import packageJson from '../../package.json';
import {formatBytes} from '@/util/formatBytes';

export interface CliCommand {
   /** Command name as typed by the user, for example `daf-to-zip`. */
   name: string;

   /** One line shown at the top of `--help`. */
   summary: string;

   /** Placeholder for the optional output argument, for example `output.zip`. */
   outputLabel: string;

   /** Explains the default output location in `--help`. */
   outputHelp: string;

   /** Computes the output path when the user did not pass one. */
   getDefaultOutput(dafPath: string): string;

   /** Does the conversion. Returns false when there was nothing to convert. */
   convert(dafPath: string, outputPath: string): Promise<boolean>;

   /** Error shown when `convert` returns false. */
   nothingToConvertMessage: string;
}

interface CliArguments {
   dafPath: string;
   outputPath: string;
   isQuiet: boolean;
}

export function runCli(command: CliCommand): void {
   runCommand(command).catch((error: unknown) => {
      const message = getErrorMessage(error);

      console.error(`${command.name}: ${message}`);
      process.exitCode = 1;
   });
}

async function runCommand(command: CliCommand): Promise<void> {
   const cliArguments = parseCliArguments(command);

   if (cliArguments === null) {
      return;
   }

   const startTime = Date.now();
   const wasConverted = await command.convert(cliArguments.dafPath, cliArguments.outputPath);

   if (!wasConverted) {
      throw new Error(command.nothingToConvertMessage);
   }

   if (cliArguments.isQuiet) {
      return;
   }

   const seconds = ((Date.now() - startTime) / 1000).toFixed(1);
   const sizeText = describeOutputSize(cliArguments.outputPath);

   console.error(`${cliArguments.dafPath}\n  -> ${cliArguments.outputPath}${sizeText} in ${seconds}s`);
}

/** Returns null when the command should stop without converting (help, version, bad usage). */
function parseCliArguments(command: CliCommand): CliArguments | null {
   const {values, positionals} = parseArgs({
      args: process.argv.slice(2),
      allowPositionals: true,
      options: {
         quiet: {type: 'boolean', short: 'q'},
         help: {type: 'boolean', short: 'h'},
         version: {type: 'boolean', short: 'v'},
      },
   });

   if (values.help) {
      process.stdout.write(buildHelp(command));

      return null;
   }

   if (values.version) {
      console.log(packageJson.version);

      return null;
   }

   if (positionals.length < 1 || positionals.length > 2) {
      process.stderr.write(buildHelp(command));
      process.exitCode = 1;

      return null;
   }

   const dafPath = positionals[0] as string;
   const outputPath = positionals[1] ?? command.getDefaultOutput(dafPath);

   return {
      dafPath: dafPath,
      outputPath: outputPath,
      isQuiet: values.quiet === true,
   };
}

function buildHelp(command: CliCommand): string {
   const lines = [
      `${command.name} ${packageJson.version}`,
      command.summary,
      '',
      'Usage:',
      `  ${command.name} <archive.daf> [${command.outputLabel}]`,
      '',
      `  ${command.outputLabel.padEnd(16)}${command.outputHelp}`,
      '',
      'Options:',
      '  -q, --quiet     Only print errors',
      '  -h, --help      Show this help',
      '  -v, --version   Show the version',
      '',
      `Docs: ${packageJson.homepage}`,
      '',
   ];

   return lines.join('\n');
}

/** " (50.9 MB)" for files, empty for folders */
function describeOutputSize(outputPath: string): string {
   const stats = fs.statSync(outputPath);

   if (!stats.isFile()) {
      return '';
   }

   return ` (${formatBytes(stats.size)})`;
}

function getErrorMessage(error: unknown): string {
   if (error instanceof Error) {
      return error.message;
   }

   return String(error);
}
