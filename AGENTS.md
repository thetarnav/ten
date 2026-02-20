# AGENTS Guide

This file is for coding agents working in this repository.
It documents practical conventions observed in the codebase.

## Repository Layout

- `ten.ts`: core implementation (tokenizer, parser, reducer, display helpers)
- `run.ts`: CLI entrypoint with `-i/--input` and stdin handling
- `test/setup.ts`: shared test helpers (`fail`, `expect`)
- `test/lexer.test.ts`, `test/parser.test.ts`, `test/reducer.test.ts`: test suites
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

Use Node's test name filter to run targeted tests/suites.

- Run one suite:
  `pnpm test --test-name-pattern='lexer operators'`
- Run a parser-focused subset:
  `pnpm test --test-name-pattern='parser'`
- Run only one test file:
  `pnpm test test/parser.test.ts`

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
- Avoid trailing whitespace
- Use blank lines to separate logical sections of code

## Comments and Documentation

- Keep comments concise and focused
- Use inline comments to explain non-obvious logic
- Add comments to if/else branches to clarify the condition or the intent of the branch
- Include small examples/code snippets to graphically illustrate concepts

## Naming Conventions

- Functions/variables: `snake_case` (for example `token_next`, `parse_src`)
- Types/classes: `Ada_Case` with underscores (for example `Token_Kind`, `Node_World`)
- Constants: `SCREAMING_SNAKE_CASE` (`TOKEN_EOF`, `MAX_ID`)
- Exported aliases may coexist for compatibility; do not remove them casually

## TypeScript Guidelines

- Keep strict typing; do not weaken `tsconfig` strictness
- Prefer explicit return types on exported functions
- Use discriminated unions and exhaustive `switch` checks (`value satisfies never`)
- Use branded number/string types where applicable (`type Node_Id = number & {node_id: void}`)
- Prefer small, deterministic helpers over implicit magic
- Avoid `any` unless there is no practical typed alternative

## Control Flow and Architecture

- Favor procedural, explicit logic over heavy abstraction
- Prefer hoisted helpers/tables over ad-hoc closures
- Keep reducers/parsers deterministic and side-effect aware
- Do not introduce unnecessary dependencies
- Keep code straightforward and inspectable

## Error Handling and Assertions

- Use assertions for impossible/internal states
- Use explicit error messages that are terse and actionable
- In CLI flows, print user-facing errors to stderr and exit non-zero
- Parser APIs return `[result, errors]`; preserve this pattern
- Do not swallow errors silently

## Testing Conventions

- Add tests to the appropriate file in `test/` (`lexer`, `parser`, or `reducer`)
- Keep test names descriptive (often the input expression wrapped in backticks)
- Import `./setup.ts` at the top of each test file
- Reuse helper functions (`test_tokenizer`, `test_parser`, `test_reducer`) when appropriate
- Group related tests with `test.suite` categories
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
