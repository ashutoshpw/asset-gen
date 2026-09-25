# image-gen

Generate images with the [OpenAI Codex CLI](https://developers.openai.com/codex/cli) and print the generated image path.

`image-gen` is a small command-line wrapper around `codex exec`. It sends your image description to Codex, asks it to return the generated file path, and writes that path to standard output so the command can be used in scripts.

## Requirements

- Node.js 22 or newer
- The `codex` executable available on your `PATH`
- An authenticated Codex account or API key

Install the Codex CLI separately:

```bash
npm install -g @openai/codex
codex login
```

Codex is supported on macOS and Linux. On Windows, use WSL2 or a native Codex installation that exposes a directly executable `codex` binary on `PATH`.

## Install image-gen

```bash
npm install -g image-gen
```

Verify the installation:

```bash
image-gen --help
image-gen --version
```

## Usage

```text
image-gen --prompt <text> [--model <model>]
```

### Options

| Option | Description |
| --- | --- |
| `-p`, `--prompt <text>` | Description of the image to generate. Required unless showing help or version. |
| `-m`, `--model <model>` | Codex model to use. Defaults to `gpt-6-luna`. |
| `-h`, `--help` | Show help and exit successfully. |
| `-V`, `--version` | Show the installed `image-gen` version. |

The default model must be available to your Codex setup. If it is not, choose a model available to your account with `--model`.

## Examples

Generate an image with the default model:

```bash
image-gen --prompt "A lighthouse during a storm"
```

Use the short options and override the model:

```bash
image-gen -p "A watercolor fox in an autumn forest" -m gpt-6-luna
```

Capture the returned path in a shell variable:

```bash
image_path=$(image-gen -p "A minimal desk setup")
printf '%s\n' "$image_path"
```

## How it works

For each generation, `image-gen`:

1. Parses and validates the CLI options.
2. Builds a prompt requesting the generated image path.
3. Invokes `codex exec` directly, without passing the prompt through a shell.
4. Reads Codex output and finds the last supported image path (`.png`, `.jpg`, `.jpeg`, or `.webp`).
5. Prints that path to standard output.

Errors are written to standard error and return a non-zero exit code. Help and version requests do not invoke Codex.

## Privacy and usage

This package does not read or store OpenAI credentials. Authentication and provider requests are handled by the Codex CLI. Your prompt is sent through the model and tools configured in Codex and may consume your Codex or API usage allowance. Review prompts before running them, especially when using an automated workflow.

## Troubleshooting

### `Codex CLI was not found`

Confirm that Codex is installed and visible on `PATH`:

```bash
codex --version
```

If needed, reinstall it:

```bash
npm install -g @openai/codex
```

### Authentication errors

Sign in with Codex:

```bash
codex login
```

### Model unavailable

The configured model may not be available to your Codex account. Select another model:

```bash
image-gen -p "A mountain lake" --model <available-model>
```

### No image path found

Codex completed without reporting a supported image path. Run the command again with a more specific image description and confirm that your Codex setup has the required image-generation tools available.

## Development

Run the automated tests:

```bash
npm test
```

Inspect the package that npm would publish:

```bash
npm run test:pack
```

The package has no runtime dependencies. `@openai/codex` is an external prerequisite.

## License

[MIT](LICENSE)
