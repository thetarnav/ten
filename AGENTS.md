# Repository Guidelines

## Project Structure & Module Organization
- `ten.ts`: Core language implementation (tokenizer, parser, reducer, display helpers).
- `run.ts`: CLI entry point; parses `-i/--input` or stdin and prints evaluation results (Node shebang).
- `test.ts`: Test suite (node:test) executed via Node.
- Root configs: `package.json` (scripts), `tsconfig.json` (TypeScript), `readme.md` (quick usage). Keep sources in the root unless adding clear subfolders (e.g., `examples/`, `bench/`, `docs/`).

## Build, Test, and Development Commands
- `pnpm install`: Install dependencies (requires pnpm installed system-wide).
- `pnpm test`: Run tests.
- `pnpm run test:watch`: Re-run tests on file changes.
- `pnpm run typecheck`: Report type errors.
- `./run.ts -i 'true + false'`: Execute a Ten expression from the CLI (also accepts stdin).
- CLI help flag remains unimplemented; keep CLI flags minimal and document in `readme.md`.

## Coding Style & Naming Conventions
- TypeScript ESM; prefer namespaced imports with explicit file extensions (`import * as name from './ten.ts'`).
- Use 4-space indentation; stay ASCII and keep existing comment style (`/*-----*/` section dividers).
- Functions and variables follow `snake_case`, types `Ada_Case` and constants `SCREAMING_SNAKE_CASE`.
- Prefer `let` for variables, use `const` only for static constants.
- Single quotes, no semicolons.
- No spacing around brackets and parens (`{a = b, c = d}`).
- Keep procedural programming style where possible, avoid dynamically creating closures—prefer static, hoisted constants, functions, tables, etc.
- Avoid introducing new dependencies; keep the code small and deterministic.
- When adding CLI args, validate input and keep error messages terse and actionable.

## Testing Guidelines
- Find the CI plan in the .github/workflows folder.
- Framework: built-in `node:test`; see patterns in `test.ts`.
- Add focused tests alongside existing describe blocks; keep names descriptive of the input string.
- Run `npm test` before submitting; prefer deterministic, side-effect-free tests.

## Commit & Pull Request Guidelines
- Commits: concise, imperative subject lines (e.g., `Add reducer guard for invalid tokens`). Group related changes together.
- Pull requests: include a summary of behavior changes, linked issues (if any), and notes on testing commands executed. Add screenshots only if UX surfaces change (CLI output snippets are fine).
- Keep diffs minimal—avoid reformatting unrelated sections and retain existing naming patterns.

## Architecture Overview
- Pipeline: `tokenizer_make` -> `token_next` -> `parse_src` -> `node_from_expr` -> `reduce` -> `result_display`.
- Mutability is localized: parser builds AST-like expressions; reducer operates with `Map`-backed variable state. Favor small, pure helpers and short data structures for clarity.
