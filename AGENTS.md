# AGENTS Guide

This file is for coding agents working in this repository.
It documents practical conventions observed in the codebase.

## Repository Layout

- `ten.ts`: core implementation (tokenizer, parser, reducer, display helpers)
- `run.ts`: CLI entrypoint with `-i/--input` and stdin handling
- `test.ts`: full `node:test` test suite
- `package.json`: scripts and dependencies
- `tsconfig.json`: strict TS settings for NodeNext ESM
- `.github/workflows/test.yml`: CI flow (typecheck + tests on Node 24)
- `readme.md`: quick usage and command examples

Keep source files at repository root unless a new directory is clearly justified.

## Environment and Toolchain

- Package manager: `pnpm` (`packageManager` pinned in `package.json`)
- Runtime: Node.js (CI uses Node 24)
- Language: TypeScript in ESM mode (`module: NodeNext`)
- Test framework: built-in `node:test`
- Lint: no linter currently

## Build, Check, and Test Commands

- Install deps: `pnpm install`
- Type check: `pnpm run typecheck`
- Run all tests: `pnpm test`
- Run CLI once: `./run.ts -i 'true + false'`
- Run CLI from stdin: `printf 'true + false\n' | ./run.ts`

There is no build/emit step; `tsc` runs with `--noEmit`.

## Single-Test Execution

Use Node's test name filter because tests live in one file.

- Run one test by exact/partial name:
  `pnpm test --test-name-pattern='`x`'`
- Run one suite:
  `pnpm test --test-name-pattern='^tokenizer'`
- Run a parser-focused subset:
  `pnpm test --test-name-pattern='parser'`

## Import and Module Conventions

- Use ESM imports only.
- Prefer namespace imports for local modules:
  `import * as ten from './ten.ts'`
- Use explicit `.ts` extension in local imports
- Node builtins are imported as `node:*` modules
- Avoid default exports; project uses named exports

## Formatting and File Style

- Indentation: 4 spaces
- Keep files ASCII unless non-ASCII is clearly needed
- Prefer `let` for variables, use `const` only for static constants
- Single quotes, no semicolons
- No spacing around brackets and parens (`{a = b, c = d}`)
- Match quote style of the file being edited; do not mass-convert quotes
- Preserve existing section divider comments (`/*--------------------------------------------------------------*`)
- Avoid broad reformatting of untouched code
- Keep line wrapping and alignment consistent with surrounding code

## Naming Conventions

- Functions/variables: `snake_case` (for example `token_next`, `parse_src`)
- Types/classes: `Ada_Case` with underscores (for example `Token_Kind`, `Node_World`)
- Constants: `SCREAMING_SNAKE_CASE` (`TOKEN_EOF`, `MAX_ID`)
- Exported aliases may coexist for compatibility; do not remove them casually

## TypeScript Guidelines

- Keep strict typing; do not weaken `tsconfig` strictness
- Prefer explicit return types on exported functions
- Use discriminated unions and exhaustive `switch` checks (`value satisfies never`)
- Use branded number types where applicable (`Node_Id`, `Ident_Id`)
- Prefer small, deterministic helpers over implicit magic
- Avoid `any` unless there is no practical typed alternative

## Control Flow and Architecture

- Favor procedural, explicit logic over heavy abstraction
- Prefer hoisted helpers/tables over ad-hoc closures
- Keep reducers/parsers deterministic and side-effect aware
- Do not introduce unnecessary dependencies
- Keep performance-sensitive code straightforward and inspectable

## Error Handling and Assertions

- Use assertions for impossible/internal states
- Use explicit error messages that are terse and actionable
- In CLI flows, print user-facing errors to stderr and exit non-zero
- Parser APIs return `[result, errors]`; preserve this pattern
- Do not swallow errors silently

## Testing Conventions

- Add tests to `test.ts` near the relevant describe block
- Keep test names descriptive (often the input expression wrapped in backticks)
- Reuse helper functions (`test_tokenizer`, `test_parser`, `test_reducer`) when appropriate
- Keep tests deterministic and independent
- Prefer focused regression tests for bug fixes

## CLI Conventions (`run.ts`)

- Keep supported flags minimal and documented
- Validate input early
- Keep output stable and machine-readable where possible
- Avoid adding interactive prompts

## Change Management for Agents

- Make minimal diffs; avoid unrelated cleanup
- If touching complex logic, add or update tests in the same change
- Preserve backward-compatible exported APIs unless explicitly changing them
- When behavior changes, update `readme.md` examples if needed

## Quick Pre-Handoff Checklist

- `pnpm run typecheck` passes
- `pnpm test` passes
- no accidental dependency additions
- no unrelated file reformatting
- docs (also this file) updated if command or behavior changed
