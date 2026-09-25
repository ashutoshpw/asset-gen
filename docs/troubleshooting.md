# Troubleshooting

## `Codex CLI was not found`

Confirm that Codex is installed and visible on `PATH`:

```bash
codex --version
```

If needed, reinstall it:

```bash
npm install -g @openai/codex
```

Confirm that your shell can also run `codex` directly before retrying `asset-gen`.

## Authentication errors

Sign in with Codex:

```bash
codex login
```

Then retry the same `asset-gen` command.

## Model unavailable

The configured model may not be available to your Codex account. Select another model:

```bash
asset-gen -p "A mountain lake" --model <available-model>
```

Run `codex --help` or review your Codex configuration if you are unsure which models are available.

## No image path found

Codex completed without reporting a supported `.png`, `.jpg`, `.jpeg`, or `.webp` path. Try the command again with a more specific image description and confirm that your Codex setup has the required asset-generation tools available.

## Windows

Use WSL2 or a native Codex installation that exposes a directly executable `codex` binary on `PATH`. In `cmd.exe` or PowerShell, run `where.exe codex` to locate the executable before running `asset-gen`.
