<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Testing

Run `npm test` (Vitest). See [TESTING.md](./TESTING.md) for framework details and conventions.

- 100% test coverage is the goal — tests make vibe coding safe.
- When writing a new function in `src/lib/`, write a corresponding test.
- When fixing a bug, write a regression test.
- When adding error handling, write a test that triggers the error.
- When adding a conditional (if/else, switch), write tests for BOTH paths.
- Never commit code that makes existing tests fail.

## Working style

### Think before coding

Don't silently assume an interpretation when a request is ambiguous — state
the assumption or ask. If a request implies a design/scope decision (which
file, what data source, whether to touch prod), surface it and the tradeoff
instead of picking one and running. Stop and name what's unclear rather than
guessing past it.

### Goal-driven execution

For non-trivial tasks, define what "done" looks like before starting, and
verify against it before reporting success:

- Bug fix → reproduce it first (or state exactly how you confirmed it), fix,
  then re-verify the original repro is gone.
- New feature/logic change → `npx tsc --noEmit`, `npx vitest run`, and
  `npm run build` must all pass before it's considered shippable.
- UI change → verify in the browser (not just "should work").

Trivial changes (typo, one-liner, copy tweak) don't need the full ritual —
use judgment.
