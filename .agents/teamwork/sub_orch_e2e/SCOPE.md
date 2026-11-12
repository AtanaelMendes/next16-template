# Scope: E2E Testing Track Orchestrator

## Architecture & Boundaries
This sub-orchestrator is responsible for designing and deploying the opaque-box test infrastructure and implementing automated Playwright test suites covering all 10 mandatory test scenarios (R5) derived from user requirements.

### Exclusively Owned Files
- `package.json` (adding `@playwright/test` to devDependencies and test scripts)
- `package-lock.json`
- `playwright.config.ts`
- `tests/` (`tests/e2e/drawers.spec.ts`, `tests/verification/clean-repo.spec.ts`)
- `TEST_INFRA.md` (at project root)
- `TEST_READY.md` (at project root)

## Detailed Requirements
1. **Playwright Installation & Configuration**:
   - Install `@playwright/test` in `devDependencies` via npm.
   - Configure `playwright.config.ts` with:
     - `testDir: './tests'`
     - `webServer`: command `npm run dev`, url `http://localhost:3000`, `reuseExistingServer: true`
     - Browser projects: Chromium desktop and Mobile Safari or Mobile Chrome viewport (375x667).
2. **10 Mandatory Test Scenarios (R5)**:
   - Scenario 1: Left Drawer abre e fecha (open/close transitions, data-state="open"/"closed", unconditional aria-controls/aria-label).
   - Scenario 2: Right Drawer abre e fecha (open/close transitions, unconditional aria-controls/aria-label).
   - Scenario 3: Cada drawer mantém estado independente (opening left does not close right, both open simultaneously on locked desktop viewport 1280x800).
   - Scenario 4: O botão de toggle permanece acessível (permanently visible and clickable when open or closed for both left and right drawers on desktop and mobile).
   - Scenario 5: Drawer fechado pode ser reaberto (3 consecutive cycles per drawer).
   - Scenario 6: Layout se adapta aos estados (central width changes dynamically, no horizontal scrollbar: scrollWidth <= innerWidth).
   - Scenario 7: Comportamento mobile funciona (viewport 375px, overlay backdrop visible, click backdrop closes drawer, body scroll lock, tested symmetrically for Left and Right drawers).
   - Scenario 8: ESC fecha drawer temporário (tested symmetrically for Left and Right drawers).
   - Scenario 9: Navegação por teclado funciona (Enter/Space on toggle, focus inside drawer, true bidirectional focus trap wrapping Shift+Tab to last and Tab to first, return focus to trigger on close).
   - Scenario 10: Não existem referências remanescentes a Axios ou amCharts (scan package.json, package-lock.json deep packages, and recursive scan across src/ using unbounded regexes).
   - Scenario 10 (Bonus / Hardening): Rapid toggle clicks resilience test asserting state machine synchronization and zero unhandled page errors.
3. **Artifacts Publication**:
   - Create `TEST_INFRA.md` at project root documenting test architecture and feature inventory coverage.
   - Create `TEST_READY.md` at project root summarizing the runner command and test case coverage.

## Acceptance Criteria
- [x] `@playwright/test` installed and configured in `playwright.config.ts`.
- [x] All 10 scenarios implemented in `tests/` (28 tests across Desktop Chromium and Mobile Chrome).
- [x] `TEST_INFRA.md` and `TEST_READY.md` published at project root.
- [x] Forensic Auditor reports CLEAN integrity (Iteration 1 & Iteration 2).
- [x] Gate Result: PASS.
