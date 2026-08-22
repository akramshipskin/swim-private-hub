# Testing

100% test coverage is the key to great vibe coding. Tests let you move fast, trust
your instincts, and ship with confidence — without them, vibe coding is just yolo
coding. With tests, it's a superpower.

## Framework

[Vitest](https://vitest.dev) 4 + [Testing Library](https://testing-library.com)
(`@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`),
jsdom environment.

## Running tests

```bash
npm test
```

Runs `vitest run` (single pass, no watch mode — CI-friendly). Use `npx vitest`
directly for watch mode during development.

## Test layers

- **Unit tests** — pure functions and business-logic helpers in `src/lib/`
  (e.g. `cn.test.ts`, `whatsapp.test.ts`, `active-package.test.ts`). Colocated
  next to the file they test, `*.test.ts`.
- **Component tests** — not yet in use; would use
  `@testing-library/react` + jsdom for components with real interactive
  behavior (dropdowns, conditional rendering) rather than pure display.
- **Smoke / E2E** — none yet. `/qa` covers this via live browser testing
  against a running dev server instead.

## Conventions

- Colocate `*.test.ts` next to the source file it tests.
- `describe` blocks group by exported function; `it` blocks describe one
  behavior each, in plain English ("does X when Y").
- Assert real behavior (`expect(x).toBe(y)`), never `toBeDefined()`.
- When a test is a regression test for a bug found via `/qa` or manual
  testing, add a one-line comment above the `it()` naming what broke and why
  — helps future readers understand the test isn't arbitrary.
- No secrets or credentials in test files.
