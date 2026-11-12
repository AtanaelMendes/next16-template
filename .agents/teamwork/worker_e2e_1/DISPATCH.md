## 2026-11-12T15:57:51Z
You are the E2E Test Infrastructure Worker.
Your working directory is `c:\www\next16-template`.
Your state folder is `c:\www\next16-template\.agents\teamwork\worker_e2e_1\`.

Read these files FIRST before taking any action:
1. `c:\www\next16-template\.agents\teamwork\ORIGINAL_REQUEST.md` (mandatory read first)
2. `c:\www\next16-template\PROJECT.md`
3. `c:\www\next16-template\.agents\teamwork\sub_orch_e2e\SCOPE.md`
4. `c:\www\next16-template\.agents\teamwork\survey_explorer_3\report.md` (detailed blueprint and test specifications)

Write Ownership & Boundary Constraints:
You EXCLUSIVELY own:
- `package.json` (add `@playwright/test` devDependencies and test scripts)
- `package-lock.json`
- `playwright.config.ts`
- `tests/` directory (`tests/e2e/drawers.spec.ts`, `tests/verification/clean-repo.spec.ts`)
- `TEST_INFRA.md` (at project root)
- `TEST_READY.md` (at project root)
You MUST NOT edit any files under `src/` or any other agent's state files.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Detailed Tasks:
1. Install `@playwright/test` into devDependencies via `npm install -D @playwright/test`.
2. Add scripts to `package.json`:
   - `"test": "playwright test"`
   - `"test:e2e": "playwright test"`
3. Create `playwright.config.ts` at project root configured per `survey_explorer_3/report.md`:
   - `testDir: './tests'`
   - `fullyParallel: true`
   - `reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]]`
   - `use: { baseURL: process.env.BASE_URL || 'http://localhost:3000', trace: 'on-first-retry' }`
   - projects: `chromium` (Desktop Chrome) and `mobile-chrome` (`Pixel 5` or viewport 375x667)
   - `webServer`: command `npm run dev`, url `http://localhost:3000`, `reuseExistingServer: true`, `timeout: 120000`
4. Implement automated test suites under `tests/`:
   - `tests/e2e/drawers.spec.ts` covering Scenarios 1-9:
     - Scenario 1: Left Drawer opens and closes (`[data-testid="left-drawer"]`, `[data-testid="left-drawer-toggle"]`, `aria-expanded`, `data-state="open"`/`"closed"`/`"collapsed"`)
     - Scenario 2: Right Drawer opens and closes (`[data-testid="right-drawer"]`, `[data-testid="right-drawer-toggle"]`, `aria-expanded`, `data-state="open"`/`"closed"`)
     - Scenario 3: Independent drawer states (all permutations of Left/Right open/closed, both open simultaneously on desktop)
     - Scenario 4: Toggle button permanently accessible (desktop & mobile 375px, visible, actionable, within viewport in open and closed states)
     - Scenario 5: Closed drawer can be reopened reliably (multiple reopen cycles)
     - Scenario 6: Layout adapts to states without horizontal overflow (`document.documentElement.scrollWidth <= window.innerWidth`, main content adjusts width dynamically)
     - Scenario 7: Mobile behavior (375x667 viewport, overlay backdrop `[data-testid="drawer-backdrop"]` or `[data-testid="drawer-overlay"]`, backdrop click dismisses drawer, body scroll lock `overflow: hidden`)
     - Scenario 8: ESC key dismisses temporary drawer
     - Scenario 9: Keyboard navigation (trigger with Enter/Space, focus moves inside drawer, focus trap cycles inside, focus returns to trigger on close)
   - `tests/verification/clean-repo.spec.ts` covering Scenario 10:
     - Scan `package.json` and `package-lock.json` for zero occurrences of `axios`, `@amcharts/amcharts5`, `@amcharts/amcharts5-geodata`
     - Verify absence of `src/plugins/axios.js`
     - Recursively scan `src/` for banned patterns (`axios`, `amcharts`, `am5themes_`, `am5map`, etc.)
5. Create `TEST_INFRA.md` at project root documenting:
   - Test architecture, Playwright configuration, selector contracts, feature inventory mapping.
6. Create `TEST_READY.md` at project root documenting:
   - Test runner commands (`npx playwright test`, `npm test`), coverage summary table (Tiers 1-4, Scenarios 1-10).
7. Verification:
   - Run `npx playwright test --list` to ensure Playwright correctly parses all test files without errors.
   - Run `npx playwright test tests/verification/clean-repo.spec.ts` (note: clean-repo test runs directly via node runner in Playwright without needing webServer).
8. Report:
   - Maintain `progress.md` in `.agents/teamwork/worker_e2e_1/progress.md`.
   - Write full handoff report in `.agents/teamwork/worker_e2e_1/handoff.md` with Observation, Logic Chain, Caveats, Conclusion, and Verification Method.
   - Message the orchestrator upon completion.
