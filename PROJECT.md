# PROJECT — <project name>

> Stable facts about this project. Read at the start of every session.
> Update only when architecture, stack, or conventions change.

## What this is
<1–3 sentence elevator pitch. Who is it for, what does it do?>

## Stack
- Language: <e.g. Python 3.11 / Node 20 / Next.js 14>
- Framework: <e.g. FastAPI / React / Django>
- Database: <e.g. Postgres 16 / SQLite / none>
- Package manager: <e.g. uv / pnpm / pip>
- Test runner: <e.g. pytest / vitest / jest>
- Linter / formatter: <e.g. ruff / eslint+prettier>

## How to run
```bash
# Install
<command>

# Dev server
<command>

# Tests
<command>

# Lint
<command>

# Build
<command>
```

## Architecture
<Brief tree, key modules, what depends on what.>

```
src/
├── ...
```

## Conventions
- <Naming convention, e.g. snake_case for files, PascalCase for components>
- <Error handling pattern>
- <Where new features go>
- <How config/env vars are loaded>
- <Anything an outsider would do wrong on first try>

## Gotchas
- <Non-obvious things that broke before>
- <Quirks of the deployment / API / library>

## External services & secrets
- <Service> — env var: `<NAME>` — purpose: <…>
- <Service> — env var: `<NAME>` — purpose: <…>

## Out of scope
<Things this project explicitly does NOT do, so the agent doesn't drift.>
