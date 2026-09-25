'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const test = require('node:test');

const packageJson = require('../package.json');
const {
  DEFAULT_MODEL,
  HELP_TEXT,
  buildCodexArgs,
  buildCodexPrompt,
  extractImagePath,
  main,
  parseArgs,
  runCodex,
} = require('../index');

const cliPath = path.join(__dirname, '..', 'index.js');

function createStream() {
  let content = '';

  return {
    get content() {
      return content;
    },
    write(chunk) {
      content += String(chunk);
      return true;
    },
  };
}

for (const option of ['--help', '-h']) {
  test(`${option} prints help without invoking Codex`, () => {
    const stdout = createStream();
    const stderr = createStream();
    let invoked = false;

    const exitCode = main([option], {
      runCodex() {
        invoked = true;
        return { status: 0, stdout: '', stderr: '' };
      },
      stderr,
      stdout,
    });

    assert.equal(exitCode, 0);
    assert.equal(invoked, false);
    assert.equal(stdout.content, `${HELP_TEXT}\n`);
    assert.equal(stderr.content, '');
  });
}

test('the executable returns help with exit code 0', () => {
  const result = spawnSync(process.execPath, [cliPath, '--help'], {
    encoding: 'utf8',
  });

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Usage:\n  asset-gen --prompt/);
  assert.equal(result.stderr, '');
});

test('version is printed without requiring a prompt', () => {
  const stdout = createStream();
  const stderr = createStream();

  const exitCode = main(['--version'], { stderr, stdout });

  assert.equal(exitCode, 0);
  assert.equal(stdout.content, `${packageJson.version}\n`);
  assert.equal(stderr.content, '');
});

test('parseArgs reads prompt and model aliases', () => {
  assert.deepEqual(parseArgs(['-p', 'a red fox', '-m', 'custom-model']), {
    help: false,
    model: 'custom-model',
    prompt: 'a red fox',
    version: false,
  });
});

test('parseArgs preserves the selected default model', () => {
  assert.deepEqual(parseArgs(['--prompt', 'a lighthouse']), {
    help: false,
    model: DEFAULT_MODEL,
    prompt: 'a lighthouse',
    version: false,
  });
});

test('parseArgs accepts help and version without a prompt', () => {
  assert.deepEqual(parseArgs(['--help']), {
    help: true,
    model: DEFAULT_MODEL,
    prompt: undefined,
    version: false,
  });
  assert.deepEqual(parseArgs(['-V']), {
    help: false,
    model: DEFAULT_MODEL,
    prompt: undefined,
    version: true,
  });
});

test('main reports a missing prompt', () => {
  const stdout = createStream();
  const stderr = createStream();

  const exitCode = main([], { stderr, stdout });

  assert.equal(exitCode, 1);
  assert.equal(stdout.content, '');
  assert.match(stderr.content, /--prompt \(-p\) is required/);
  assert.match(stderr.content, /asset-gen --help/);
});

test('parseArgs rejects unknown and positional arguments', () => {
  assert.throws(() => parseArgs(['--unknown']), /Unknown option: --unknown/);
  assert.throws(() => parseArgs(['surprise']), /Unexpected argument: surprise/);
});

test('parseArgs rejects missing and empty values', () => {
  assert.throws(() => parseArgs(['--prompt']), /requires a value/);
  assert.throws(() => parseArgs(['-m']), /requires a value/);
  assert.throws(() => parseArgs(['--prompt', '']), /non-empty value/);
  assert.throws(() => parseArgs(['--model', '--help']), /requires a value/);
});

test('Codex arguments are passed separately without a shell', () => {
  const calls = [];
  const fakeSpawn = (command, args, options) => {
    calls.push({ args, command, options });
    return { status: 0, stdout: '/tmp/image.png', stderr: '' };
  };
  const prompt = 'a "quoted" fox; $(do-not-run) & echo unsafe';
  const model = 'custom-model';

  const result = runCodex(prompt, model, fakeSpawn);

  assert.equal(result.status, 0);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].command, 'codex');
  assert.deepEqual(calls[0].args, buildCodexArgs(prompt, model));
  assert.equal(calls[0].args.at(-1), buildCodexPrompt(prompt));
  assert.equal(calls[0].options.shell, false);
  assert.notEqual(calls[0].options.shell, true);
});

test('main prints the image path and uses the default model', () => {
  const stdout = createStream();
  const stderr = createStream();
  let receivedPrompt;
  let receivedModel;

  const exitCode = main(['--prompt', 'a red fox'], {
    runCodex(prompt, model) {
      receivedPrompt = prompt;
      receivedModel = model;
      return {
        status: 0,
        stdout: 'Codex log\n/tmp/generated fox.webp\n',
        stderr: '',
      };
    },
    stderr,
    stdout,
  });

  assert.equal(exitCode, 0);
  assert.equal(receivedPrompt, 'a red fox');
  assert.equal(receivedModel, DEFAULT_MODEL);
  assert.equal(stdout.content, '/tmp/generated fox.webp\n');
  assert.equal(stderr.content, '');
});

test('main passes a model override to Codex', () => {
  let receivedModel;
  const stdout = createStream();

  const exitCode = main(['-p', 'a fox', '-m', 'another-model'], {
    runCodex(_prompt, model) {
      receivedModel = model;
      return { status: 0, stdout: '/tmp/fox.jpg', stderr: '' };
    },
    stderr: createStream(),
    stdout,
  });

  assert.equal(exitCode, 0);
  assert.equal(receivedModel, 'another-model');
});

test('extractImagePath returns the final supported image path', () => {
  assert.equal(
    extractImagePath('/tmp/first.png\nprogress\n"/tmp/final image.jpeg"'),
    '/tmp/final image.jpeg',
  );
  assert.equal(extractImagePath('no image here'), undefined);
});

test('main explains when Codex is not installed', () => {
  const stderr = createStream();
  const error = Object.assign(new Error('spawn codex ENOENT'), {
    code: 'ENOENT',
  });

  const exitCode = main(['-p', 'a fox'], {
    runCodex() {
      return { error, status: null, stdout: '', stderr: '' };
    },
    stderr,
    stdout: createStream(),
  });

  assert.equal(exitCode, 1);
  assert.match(stderr.content, /Codex CLI was not found/);
  assert.match(stderr.content, /npm install -g @openai\/codex/);
});

test('main preserves Codex failure diagnostics', () => {
  const stderr = createStream();

  const exitCode = main(['-p', 'a fox'], {
    runCodex() {
      return {
        status: 1,
        stdout: '',
        stderr: 'Codex authentication required. Run codex login.',
      };
    },
    stderr,
    stdout: createStream(),
  });

  assert.equal(exitCode, 1);
  assert.match(stderr.content, /Codex CLI exited with code 1/);
  assert.match(stderr.content, /codex login/);
});

test('main reports Codex output without an image path', () => {
  const stderr = createStream();

  const exitCode = main(['-p', 'a fox'], {
    runCodex() {
      return {
        status: 0,
        stdout: 'Codex could not generate the requested image.',
        stderr: '',
      };
    },
    stderr,
    stdout: createStream(),
  });

  assert.equal(exitCode, 1);
  assert.match(stderr.content, /No image path found in Codex output/);
  assert.match(stderr.content, /could not generate/);
});
