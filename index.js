#!/usr/bin/env node

'use strict';

const { spawnSync } = require('node:child_process');
const packageJson = require('./package.json');

const DEFAULT_MODEL = 'gpt-6-luna';
const IMAGE_EXTENSION_PATTERN = /\.(?:png|jpe?g|webp)$/i;
const VALUE_OPTIONS = new Set([
  '--prompt',
  '-p',
  '--model',
  '-m',
  '--help',
  '-h',
  '--version',
  '-V',
]);

const HELP_TEXT = `image-gen - Generate images with Codex CLI

Usage:
  image-gen --prompt <text> [--model <model>]

Options:
  -p, --prompt <text>  Description of the image to generate (required)
  -m, --model <model>  Codex model to use (default: ${DEFAULT_MODEL})
  -h, --help           Show this help
  -V, --version        Show the installed version

Examples:
  image-gen -p "A lighthouse during a storm"
  image-gen --prompt "A watercolor fox" --model ${DEFAULT_MODEL}`;

class UsageError extends Error {
  constructor(message) {
    super(message);
    this.name = 'UsageError';
  }
}

class CliError extends Error {
  constructor(message) {
    super(message);
    this.name = 'CliError';
  }
}

function parseArgs(args) {
  let prompt;
  let model = DEFAULT_MODEL;
  let help = false;
  let version = false;

  for (let index = 0; index < args.length; index += 1) {
    const option = args[index];

    if (option === '--help' || option === '-h') {
      help = true;
    } else if (option === '--version' || option === '-V') {
      version = true;
    } else if (option === '--prompt' || option === '-p') {
      prompt = readOptionValue(args, index, option);
      index += 1;
    } else if (option === '--model' || option === '-m') {
      model = readOptionValue(args, index, option).trim();
      index += 1;
    } else if (option.startsWith('-')) {
      throw new UsageError(`Unknown option: ${option}`);
    } else {
      throw new UsageError(`Unexpected argument: ${option}`);
    }
  }

  return { help, model, prompt, version };
}

function readOptionValue(args, index, option) {
  const value = args[index + 1];

  if (value === undefined || VALUE_OPTIONS.has(value)) {
    throw new UsageError(`Option ${option} requires a value.`);
  }

  if (value.trim() === '') {
    throw new UsageError(`Option ${option} requires a non-empty value.`);
  }

  return value;
}

function buildCodexPrompt(prompt) {
  return `${prompt}\n\nRespond only with the full path of the generated image.`;
}

function buildCodexArgs(prompt, model) {
  return [
    'exec',
    '--model',
    model,
    '--skip-git-repo-check',
    buildCodexPrompt(prompt),
  ];
}

function runCodex(prompt, model, spawn = spawnSync) {
  return spawn('codex', buildCodexArgs(prompt, model), {
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
    shell: false,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });
}

function extractImagePath(output) {
  const lines = String(output || '').split(/\r?\n/);

  for (let index = lines.length - 1; index >= 0; index -= 1) {
    const candidate = lines[index]
      .trim()
      .replace(/^["'`]+|["'`]+$/g, '')
      .trim();

    if (IMAGE_EXTENSION_PATTERN.test(candidate)) {
      return candidate;
    }
  }

  return undefined;
}

function resultOutput(result) {
  return {
    stdout: result.stdout || '',
    stderr: result.stderr || '',
  };
}

function failureDetails(result) {
  const { stdout, stderr } = resultOutput(result);
  return stderr.trim() || stdout.trim();
}

function main(args = process.argv.slice(2), dependencies = {}) {
  const stdout = dependencies.stdout || process.stdout;
  const stderr = dependencies.stderr || process.stderr;
  const execute = dependencies.runCodex || runCodex;

  try {
    const options = parseArgs(args);

    if (options.help) {
      stdout.write(`${HELP_TEXT}\n`);
      return 0;
    }

    if (options.version) {
      stdout.write(`${packageJson.version}\n`);
      return 0;
    }

    if (!options.prompt) {
      throw new UsageError('--prompt (-p) is required.');
    }

    const result = execute(options.prompt, options.model);
    const { stdout: codexStdout, stderr: codexStderr } = resultOutput(result);

    if (result.error) {
      if (result.error.code === 'ENOENT') {
        throw new CliError(
          'Codex CLI was not found. Install it with "npm install -g @openai/codex".',
        );
      }

      throw new CliError(`Could not start Codex CLI: ${result.error.message}`);
    }

    if (result.status !== 0) {
      const reason = result.signal
        ? `terminated by signal ${result.signal}`
        : `exited with code ${result.status ?? 'unknown'}`;
      const details = failureDetails(result);

      throw new CliError(
        `Codex CLI ${reason}${details ? `:\n${details}` : '.'}`,
      );
    }

    const imagePath = extractImagePath(`${codexStdout}\n${codexStderr}`);

    if (!imagePath) {
      const details = codexStderr.trim() || codexStdout.trim();
      throw new CliError(
        `No image path found in Codex output.${details ? `\n${details}` : ''}`,
      );
    }

    stdout.write(`${imagePath}\n`);
    return 0;
  } catch (error) {
    stderr.write(`Error: ${error.message}\n`);

    if (error instanceof UsageError) {
      stderr.write("Run 'image-gen --help' for usage.\n");
    }

    return 1;
  }
}

if (require.main === module) {
  process.exitCode = main();
}

module.exports = {
  CliError,
  DEFAULT_MODEL,
  HELP_TEXT,
  UsageError,
  buildCodexArgs,
  buildCodexPrompt,
  extractImagePath,
  main,
  parseArgs,
  runCodex,
};
