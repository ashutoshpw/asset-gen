# asset-gen

Generate images with the [OpenAI Codex CLI](https://developers.openai.com/codex/cli) and print the generated image path.

`asset-gen` is a small command-line wrapper around `codex exec`. It sends your image description to Codex, asks it to return the generated file path, and writes that path to standard output so the command can be used in scripts.

## Requirements

- Node.js 22 or newer
- The `codex` executable available on your `PATH`
- An authenticated Codex account or API key

Install and authenticate the Codex CLI separately:

```bash
npm install -g @openai/codex
codex login
```

Codex is supported on macOS and Linux. For Windows support, see the [troubleshooting guide](docs/troubleshooting.md#windows).

## Install asset-gen

```bash
npm install -g asset-gen
```

Verify the installation:

```bash
asset-gen --help
asset-gen --version
```

## Quick start

Generate an image with the default model:

```bash
asset-gen --prompt "A lighthouse during a storm"
```

The command writes the generated image path to standard output. See the [usage guide](docs/usage.md) for all options, examples, and output behavior.

## Documentation

- [Documentation overview](docs/README.md)
- [Usage](docs/usage.md)
- [Troubleshooting](docs/troubleshooting.md)
- [Development](docs/development.md)

## License

[MIT](LICENSE)
