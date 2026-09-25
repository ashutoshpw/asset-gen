# Usage

`asset-gen` accepts an image description, asks Codex to generate the image, and prints the generated file path to standard output.

## Command syntax

```text
asset-gen --prompt <text> [--model <model>]
```

See the project [README](../README.md) for installation and authentication steps.

## Options

| Option | Description |
| --- | --- |
| `-p`, `--prompt <text>` | Description of the image to generate. Required unless showing help or version. |
| `-m`, `--model <model>` | Codex model to use. Defaults to `gpt-6-luna`. |
| `-h`, `--help` | Show help and exit successfully. |
| `-V`, `--version` | Show the installed `asset-gen` version. |

The default model must be available to your Codex setup. If it is not, choose a model available to your account with `--model`.

## Examples

Generate an image with the default model:

```bash
asset-gen --prompt "A lighthouse during a storm"
```

Use the short options and override the model:

```bash
asset-gen -p "A watercolor fox in an autumn forest" -m gpt-6-luna
```

Capture the returned path in a shell variable:

```bash
asset_path=$(asset-gen -p "A minimal desk setup")
printf '%s\n' "$asset_path"
```

## How it works

For each generation, `asset-gen`:

1. Parses and validates the CLI options.
2. Builds a prompt requesting the generated image path.
3. Invokes `codex exec` directly, without passing the prompt through a shell.
4. Reads Codex output and finds the last supported image path (`.png`, `.jpg`, `.jpeg`, or `.webp`).
5. Prints that path to standard output.

## Output and errors

Successful generations print only the selected image path to standard output. Errors are written to standard error and return a non-zero exit code.

Help and version requests return successfully without invoking Codex. If more than one supported image path appears in Codex output, `asset-gen` returns the last one.

## Privacy and usage

This package does not read or store OpenAI credentials. Authentication and provider requests are handled by the Codex CLI. Your prompt is sent through the model and tools configured in Codex and may consume your Codex or API usage allowance. Review prompts before running them, especially when using an automated workflow.
