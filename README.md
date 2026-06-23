# Playwright CI Demo

A task manager app built to showcase Playwright E2E testing in a CI pipeline.

---

## The App

- 3-page Express + SQLite app: Dashboard, Task List, Task Detail
- Full CRUD — create, read, update, delete tasks
- No build step, runs with `npm start`

---

## The Tests

- 23 tests across two files: `crud.spec.ts` and `navigation.spec.ts`
- 6 tests tagged `@smoke` — one per critical path
- Tests are fully isolated — each one clears the DB before running
- Traces, screenshots, and video recorded on failure

---

## Running Locally

```bash
npm install
npx playwright install chromium

npm test              # all 23 tests
npm run test:smoke    # 6 smoke tests only (~2s)
npm run test:ui       # Playwright UI mode
npm run test:headed   # watch the browser
npm run codegen       # open the test generator
npm run report        # open the last HTML report
npm run trace         # open a trace.zip in the viewer
```

---

## CI Pipeline

Two workflows in `.github/workflows/`:

**`smoke.yml` — runs on every push to a feature branch**
- Only runs the 6 `@smoke` tests
- Fast feedback while developing
- Browser binaries cached to speed up repeat runs

**`playwright.yml` — runs on every PR to main**
- Runs all 23 tests
- Uploads the HTML report and traces as artifacts
- Traces are downloadable from the Actions run for 7 days
- In production you'd ship traces to blob storage (Azure, S3, etc.) and post a PR comment with the link

---

## Key Playwright Features Shown

- `@smoke` tags to filter test subsets
- `webServer` config — Playwright starts the server automatically
- `trace: 'on-first-retry'` — traces captured when a test flakes
- `retries: 3` and `timeout: 30s` configured for flaky test tolerance
- `page.request` for API calls inside tests (DB cleanup in `beforeEach`)
- `--trace on` flag to record traces for every test
- `npx playwright show-trace` — replay any test step by step
- `npx playwright codegen` — record a test by clicking through the app
