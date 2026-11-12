# Handoff Report: Testing Infrastructure & Playwright Setup

**Agent**: Survey Explorer 3  
**Role**: Test Infrastructure Explorer, Playwright Architect  
**State Folder**: `c:\www\next16-template\.agents\teamwork\survey_explorer_3\`  
**Date**: 2026-11-12  

---

## 1. Observation

1. **`package.json` Inspection** (`c:\www\next16-template\package.json`, lines 1–28):
   ```json
   {
     "name": "next16-template",
     "version": "0.1.0",
     "private": true,
     "scripts": {
       "dev": "next dev",
       "build": "next build",
       "start": "next start"
     },
     "dependencies": {
       "@fortawesome/free-regular-svg-icons": "^7.3.1",
       "@fortawesome/free-solid-svg-icons": "^7.3.1",
       "@fortawesome/react-fontawesome": "^3.5.0",
       "flag-icons": "^7.6.0",
       "moment": "^2.31.0",
       "next": "16.4.6",
       "react": "19.3.0",
       "react-dom": "19.3.0",
       "react-toastify": "^11.2.0",
       "suneditor": "^2.47.12",
       "suneditor-react": "^3.6.1"
     },
     "devDependencies": {
       "@tailwindcss/turbopack": "4.3.3",
       "babel-plugin-react-compiler": "1.0.0",
       "tailwindcss": "4.3.3"
     }
   }
   ```
   Direct observation: `@playwright/test` is neither in `dependencies` nor `devDependencies`. No `"test"` script is defined.

2. **Package & Executable Verification**:
   Running `npx playwright --version` resulted in:
   `npm warn exec The following package was not found and will be installed: playwright@1.65.0`
   Confirming Playwright is not installed in the workspace.

3. **Host Browser Cache Detection**:
   Running `Get-ChildItem "$env:LOCALAPPDATA\ms-playwright"` returned:
   ```
   Mode                 LastWriteTime         Length Name
   ----                 -------------         ------ ----
   d-----        08/04/2026     15:03                chromium-1217
   d-----        04/09/2026     16:11                chromium-1234
   d-----        08/04/2026     15:03                chromium_headless_shell-1217
   d-----        04/09/2026     16:11                chromium_headless_shell-1234
   d-----        08/04/2026     15:03                firefox-1511
   d-----        08/04/2026     15:03                webkit-2272
   ```
   Direct observation: Host environment already contains cached Chromium, Firefox, and WebKit binaries.

4. **Next.js 16 Testing Documentation Reference** (`node_modules/next/dist/docs/01-app/02-guides/testing/playwright.md`, lines 121–153):
   Recommends directory `tests/`, file convention `*.spec.ts`, and running tests against production code (`npm run build` + `npm run start`) or using the `webServer` option to start the server.

5. **Build Pipeline & Port Status**:
   - `npm run build` executed successfully in ~6s (Turbopack, Next.js 16.4.6, React 19.3.0, 4 static pages prerendered).
   - `netstat -ano | findstr :3000` returned exit code 1 (port 3000 is open and unoccupied).

6. **Legacy Code Search**:
   PowerShell search across `src/` revealed 40+ lines referencing `axios` or `amcharts` in files such as `src/components/features/chatbot/WhatsappChat.jsx`, `src/components/ui/charts/MapChart.jsx`, `src/components/ui/inputs/DebouncedSearch/DebouncedSearchSelect.jsx`, and `src/plugins/axios.js`.

---

## 2. Logic Chain

1. **Test Infrastructure Readiness**:
   - From Observation 1 & 2: `@playwright/test` must be added as a devDependency via `npm install -D @playwright/test`.
   - From Observation 3: Browser download overhead will be minimal because Chromium 1234 already exists in `%LOCALAPPDATA%\ms-playwright`.
2. **Configuration & WebServer Choice**:
   - From Observation 4 & 5: Using `webServer` with `command: 'npm run dev'`, `url: 'http://localhost:3000'`, and `reuseExistingServer: !process.env.CI` offers the optimal balance: instant feedback during development, fast refresh, and zero unnecessary server restarts if already running. For CI or pre-release verification, `npm run build && npm run start` can be triggered via `PLAYWRIGHT_PROD=1`.
3. **Language Compatibility**:
   - The project uses JavaScript with `jsconfig.json` (`@/* -> ./src/*`).
   - Playwright's test runner internally transpiles TypeScript on the fly; therefore, `playwright.config.ts` and test files in `tests/*.spec.ts` work out of the box without modifying `jsconfig.json` or requiring TypeScript packages in Next.js.
4. **Scenario Coverage (R5 Scenarios 1–10)**:
   - Scenarios 1–5 test drawer open/close states, toggle accessibility, and independent operations. A standardized DOM contract (`data-testid`, `aria-expanded`, `aria-controls`, `data-state`) ensures decoupling between UI changes and test reliability.
   - Scenario 6 tests layout adaptation and absence of horizontal overflow (`document.documentElement.scrollWidth <= window.innerWidth`).
   - Scenario 7 tests mobile viewport emulation (`375x667`), overlay backdrop presence, click-to-dismiss, and `document.body.style.overflow === 'hidden'`.
   - Scenario 8 tests Escape key dismissal of temporary drawers.
   - Scenario 9 tests keyboard navigation: trigger activation via `Enter`, focus containment inside drawer (Focus Trap), and return of focus to the trigger button upon closing.
   - Scenario 10 tests repository cleanup: Playwright Node test directly scans `package.json`, `package-lock.json`, and `src/` to assert zero remaining references to `axios` and `amcharts`.

---

## 3. Caveats

- **Network-free Browser Execution**: While Chromium binaries exist in `%LOCALAPPDATA%\ms-playwright`, installing `@playwright/test` may link or require matching versions. If run in an environment with restricted network access, Playwright should be pointed to existing Chromium binaries or installed with `--with-deps`.
- **Desktop LeftDrawer Compact Mode vs Full Hidden**: The user request specifies that on desktop LeftDrawer may collapse into compact icon mode rather than hiding completely. Test assertions for Scenario 1 should accommodate both `data-state="closed"` and `data-state="collapsed"` or verify compact width (`w-16` vs `w-64`).
- **Focus Trap Implementation**: Scenario 9 requires the Drawer component to trap focus when opened as a temporary overlay (mobile or modal mode). The component implementation must include a focus management hook or container.

---

## 4. Conclusion

1. **Install Target**: Install `@playwright/test` into `devDependencies` and configure scripts `"test": "playwright test"`, `"test:e2e": "playwright test"`, `"test:e2e:ui": "playwright test --ui"`.
2. **Config File**: Deploy `playwright.config.ts` with `webServer` configured to `npm run dev` (with fallback to `npm run start` in production mode) and port 3000.
3. **Directory Structure**: Create test specs under `tests/e2e/` (Scenarios 1–9) and `tests/verification/` (Scenario 10).
4. **All 10 Scenarios Mapped**: Complete test implementation blueprints, Playwright code snippets, and DOM contracts are documented in detail in `report.md`.

---

## 5. Verification Method

To independently verify the test infrastructure and strategy:

1. **Inspect Report Artifact**:
   Read `.agents/teamwork/survey_explorer_3/report.md` for full test code snippets and configuration options.
2. **Check Browser Availability**:
   Run in PowerShell:
   `Test-Path "$env:LOCALAPPDATA\ms-playwright\chromium-1234"` (returns `True`).
3. **Verify Next.js Build**:
   Run in PowerShell:
   `npm run build` (returns exit code 0).
4. **Future Test Execution Verification (once implemented)**:
   Run:
   `npx playwright test`
   Confirm 10 passing tests matching Scenarios 1–10.
