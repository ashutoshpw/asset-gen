# Development

## Prerequisites

- Node.js 22 or newer
- npm

The package has no runtime dependencies. `@openai/codex` is an external prerequisite for users, not a dependency of this package.

## Install the development environment

```bash
npm install
```

## Run the tests

```bash
npm test
```

## Verify the npm package

Inspect the files npm would publish:

```bash
npm run test:pack
```

The package should include `index.js`, `README.md`, `LICENSE`, and the files under `docs/`.

## Documentation changes

Keep `README.md` focused on onboarding and quick usage. Put detailed guides under `docs/`, add each guide to `docs/README.md`, and link it from the root `README.md`.

When moving or renaming a guide, update all relative Markdown links and run `npm test` plus `npm run test:pack` before publishing.
