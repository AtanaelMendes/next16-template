# Playwright Testing Infrastructure & Scenario Verification Report

**Author**: Survey Explorer 3 (Teamwork Explorer)  
**Date**: 2026-11-12  
**Mission**: Test Infrastructure Audit, Playwright Configuration Architecture, and Scenario Verification Blueprints (R5)  
**Target Repository**: `c:\www\next16-template`

---

## 1. Executive Summary

A comprehensive investigation of the project's testing infrastructure, Next.js 16 conventions, and requirements for the 10 mandatory test scenarios (R5) was performed.

### Key Discoveries:
1. **Testing Infrastructure Gap**: The project currently has **no test runner installed** (`@playwright/test` is absent from `package.json` and `node_modules`). There are no test scripts in `package.json`.
2. **Browser Binaries Already Cached**: Chromium (`chromium-1217`, `chromium-1234`), Firefox (`firefox-1511`), and WebKit (`webkit-2272`) are already cached locally on the host machine in `%LOCALAPPDATA%\ms-playwright`. This eliminates heavy browser download times during setup.
3. **Build & Dev Stability**: The Next.js 16.4.6 build (`npm run build`) runs with Turbopack and builds cleanly in ~6 seconds. Ports 3000 and 3001 are free.
4. **TypeScript / JavaScript Dual Capability**: The project is structured with `jsconfig.json` (JavaScript with path alias `@/* -> ./src/*`). Playwright has built-in TypeScript transpilation, allowing `playwright.config.ts` and `.spec.ts` files to execute seamlessly without requiring TypeScript dependencies in Next.js.
5. **Complete Test Blueprint Established**: All 10 mandatory test scenarios have been mapped with concrete DOM selectors, ARIA role contracts, and Playwright assertion logic.

---

## 2. Current Project Test Infrastructure Audit

### 2.1 Package Configuration (`package.json`)
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

- **Missing Test Dependencies**: No test runner exists (`@playwright/test`, `jest`, or `vitest`).
- **Missing Test Scripts**: No `npm test` or `npm run test:e2e` scripts exist.
- **Legacy Dependencies Status**: While `axios` and `@amcharts` are omitted from `dependencies` in `package.json`, they are still referenced in 18+ source files across `src/components/` and `src/plugins/axios.js`.

### 2.2 Next.js 16 Testing Documentation Reference
Directly from `node_modules/next/dist/docs/01-app/02-guides/testing/playwright.md`:
- Playwright is the officially recommended E2E testing framework for Next.js App Router.
- Recommended test directory: `tests/` (e.g. `tests/drawers.spec.ts`).
- Production code testing recommendation: running against `npm run start` or running against `npm run dev` via Playwright's `webServer` option.

---

## 3. Playwright Installation & Setup Proposal

### 3.1 Package Installation
To enable Playwright testing, add `@playwright/test` to `devDependencies`:
```bash
npm install -D @playwright/test
```
And verify browser connectivity:
```bash
npx playwright install chromium
```
*(Note: Because `%LOCALAPPDATA%\ms-playwright` already contains Chromium 1234, this step runs quickly or instantly links existing binaries).*

### 3.2 Proposed `package.json` Scripts
Add the following scripts to `package.json`:
```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "test": "playwright test",
  "test:e2e": "playwright test",
  "test:e2e:ui": "playwright test --ui",
  "test:e2e:debug": "playwright test --debug",
  "test:report": "playwright show-report"
}
```

---

## 4. Proposed `playwright.config.ts`

The configuration below provides fast local development feedback (using `next dev` with Turbopack) while also seamlessly reusing an already-running server, and supporting CI / production mode.

```typescript
import { defineConfig, devices } from '@playwright/test';

const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }]
  ],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: process.env.PLAYWRIGHT_PROD ? 'npm run start' : 'npm run dev',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
```

### Analysis of `webServer` Strategy:
1. **Local Developer Workflow (`npm run dev`)**:
   - `reuseExistingServer: !process.env.CI` detects if the developer already has `npm run dev` running on `http://localhost:3000`. If running, it immediately executes tests without restarting.
   - If no server is running, Playwright spawns `npm run dev` and waits until `http://localhost:3000` responds.
2. **Production Validation Workflow (`PLAYWRIGHT_PROD=1`)**:
   - For verifying production build integrity before release, `PLAYWRIGHT_PROD=1` runs against `npm run start`.
3. **Timeout Allowance**:
   - `timeout: 120 * 1000` guarantees sufficient time for initial Next.js compilation even on resource-constrained Windows hosts.

---

## 5. Standard Test Selectors & ARIA Attributes Contract

To guarantee seamless integration between component development (`Drawer`, `LeftDrawer`, `RightDrawer`) and automated test suites, the following contract is defined:

| Element | Recommended Selector / ARIA | Purpose |
|---|---|---|
| **Left Drawer** | `[data-testid="left-drawer"]`, `role="navigation"`, `data-state="open|closed|collapsed"` | Left navigation drawer container |
| **Right Drawer** | `[data-testid="right-drawer"]`, `role="complementary"`, `data-state="open|closed"` | Right contextual drawer container |
| **Left Toggle Button** | `[data-testid="left-drawer-toggle"]`, `aria-label="Alternar navegação"`, `aria-expanded="true|false"`, `aria-controls="left-drawer"` | Toggle Left Drawer |
| **Right Toggle Button** | `[data-testid="right-drawer-toggle"]`, `aria-label="Alternar painel contextual"`, `aria-expanded="true|false"`, `aria-controls="right-drawer"` | Toggle Right Drawer |
| **Drawer Overlay (Backdrop)** | `[data-testid="drawer-overlay"]`, `role="presentation"` | Temporary drawer mobile/overlay backdrop |
| **Drawer Header** | `[data-testid="left-drawer-header"]`, `[data-testid="right-drawer-header"]` | Header container |
| **Drawer Close Button** | `[data-testid="left-drawer-close"]`, `[data-testid="right-drawer-close"]`, `aria-label="Fechar gaveta"` | Close button inside drawer |
| **Main Content Area** | `[data-testid="layout-main"]` or `<main>` | Fluid center dashboard container |
| **Interactive Demo Page** | `/components` | Page hosting all drawer states and documentation |

---

## 6. Implementation Strategies for the 10 Mandatory Scenarios (R5)

### Scenario 1: Left Drawer abre e fecha (Left Drawer opens and closes)
- **Objective**: Verify that interacting with the Left Drawer toggle opens and closes the drawer with proper state transitions and ARIA attributes.
- **Verification Strategy**:
  1. Load page (`/` or `/components`).
  2. Locate `leftToggle = page.getByTestId('left-drawer-toggle')` and `leftDrawer = page.getByTestId('left-drawer')`.
  3. Verify toggle has `aria-controls="left-drawer"`.
  4. Click `leftToggle`:
     - Assert `leftToggle` transitions `aria-expanded` to `"false"`.
     - Assert `leftDrawer` transitions to `data-state="closed"` (or `data-state="collapsed"` in compact desktop mode).
     - Assert text labels collapse or drawer slides out.
  5. Click `leftToggle` again:
     - Assert `leftToggle` has `aria-expanded="true"`.
     - Assert `leftDrawer` has `data-state="open"`.
     - Assert navigation items are fully visible.
- **Playwright Snippet**:
  ```typescript
  test('Scenario 1: Left Drawer opens and closes', async ({ page }) => {
    await page.goto('/');
    const toggle = page.getByTestId('left-drawer-toggle');
    const drawer = page.getByTestId('left-drawer');

    // Initial state: open
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(drawer).toHaveAttribute('data-state', 'open');

    // Close
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(drawer).toHaveAttribute('data-state', /closed|collapsed/);

    // Open
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(drawer).toHaveAttribute('data-state', 'open');
  });
  ```

---

### Scenario 2: Right Drawer abre e fecha (Right Drawer opens and closes)
- **Objective**: Verify that the contextual Right Drawer opens and closes cleanly.
- **Verification Strategy**:
  1. Load page (`/` or `/components`).
  2. Locate `rightToggle = page.getByTestId('right-drawer-toggle')` and `rightDrawer = page.getByTestId('right-drawer')`.
  3. Verify initial state: closed on desktop (`aria-expanded="false"`, `data-state="closed"`).
  4. Click `rightToggle`:
     - Assert `rightDrawer` becomes visible (`toBeVisible()`).
     - Assert `rightToggle` has `aria-expanded="true"`.
     - Assert `rightDrawer` has `data-state="open"`.
     - Contextual content (notifications, settings, details) is mounted.
  5. Click `rightToggle` (or close button `getByTestId('right-drawer-close')`):
     - Assert `rightDrawer` transitions to `data-state="closed"`.
     - Assert `rightToggle` has `aria-expanded="false"`.
- **Playwright Snippet**:
  ```typescript
  test('Scenario 2: Right Drawer opens and closes', async ({ page }) => {
    await page.goto('/');
    const toggle = page.getByTestId('right-drawer-toggle');
    const drawer = page.getByTestId('right-drawer');

    // Initial state: closed
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');

    // Open
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(drawer).toBeVisible();
    await expect(drawer).toHaveAttribute('data-state', 'open');

    // Close
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(drawer).toHaveAttribute('data-state', 'closed');
  });
  ```

---

### Scenario 3: Cada drawer mantém estado independente (Independent drawer states)
- **Objective**: Ensure state isolation between Left and Right drawers across all permutations, with support for simultaneous open states on desktop.
- **Verification Strategy**:
  1. Matrix of 4 states tested in sequence:
     - State A: [Left Closed, Right Closed]
     - State B: [Left Open, Right Closed]
     - State C: [Left Open, Right Open] (Both open simultaneously on desktop!)
     - State D: [Left Closed, Right Open]
  2. Verify that toggling Left Drawer has zero effect on Right Drawer's `data-state` or `aria-expanded`.
  3. Verify that toggling Right Drawer has zero effect on Left Drawer's `data-state` or `aria-expanded`.
- **Playwright Snippet**:
  ```typescript
  test('Scenario 3: Each drawer maintains independent state', async ({ page }) => {
    await page.goto('/');
    const leftToggle = page.getByTestId('left-drawer-toggle');
    const rightToggle = page.getByTestId('right-drawer-toggle');
    const leftDrawer = page.getByTestId('left-drawer');
    const rightDrawer = page.getByTestId('right-drawer');

    // Set Left = Open, Right = Closed
    if (await toggleIsExpanded(leftToggle) === false) await leftToggle.click();
    if (await toggleIsExpanded(rightToggle) === true) await rightToggle.click();
    await expect(leftDrawer).toHaveAttribute('data-state', 'open');
    await expect(rightDrawer).toHaveAttribute('data-state', 'closed');

    // Open Right Drawer -> Left Drawer MUST remain Open!
    await rightToggle.click();
    await expect(rightDrawer).toHaveAttribute('data-state', 'open');
    await expect(leftDrawer).toHaveAttribute('data-state', 'open');

    // Close Left Drawer -> Right Drawer MUST remain Open!
    await leftToggle.click();
    await expect(leftDrawer).toHaveAttribute('data-state', /closed|collapsed/);
    await expect(rightDrawer).toHaveAttribute('data-state', 'open');

    // Close Right Drawer -> Both closed
    await rightToggle.click();
    await expect(leftDrawer).toHaveAttribute('data-state', /closed|collapsed/);
    await expect(rightDrawer).toHaveAttribute('data-state', 'closed');
  });
  ```

---

### Scenario 4: O botão de toggle permanece acessível (Toggle button permanently accessible)
- **Objective**: Guarantee that `DrawerToggle` is permanently visible, reachable, and interactive in both open and closed states, across desktop and mobile viewports.
- **Verification Strategy**:
  1. Desktop Viewport (1280x800):
     - In all 4 states (both closed, left open, right open, both open), locate both toggle buttons.
     - Verify bounding boxes are within the viewport (`width > 0`, `height > 0`).
     - Verify `pointer-events` is not `none`.
     - Perform actionability check: `await toggle.click({ trial: true })` (verifies element is visible, stable, and ready to receive pointer events).
  2. Mobile Viewport (375x667):
     - In closed state: Toggle buttons are accessible in the mobile top navigation bar.
     - In open state (overlay active): The trigger toggle or dedicated close button inside the drawer header is accessible and not hidden behind backdrop or off-screen.
- **Playwright Snippet**:
  ```typescript
  test('Scenario 4: Toggle buttons are permanently accessible', async ({ page }) => {
    for (const viewport of [{ width: 1280, height: 800 }, { width: 375, height: 667 }]) {
      await page.setViewportSize(viewport);
      await page.goto('/');

      const leftToggle = page.getByTestId('left-drawer-toggle');
      const rightToggle = page.getByTestId('right-drawer-toggle');

      // Check closed accessibility
      await expect(leftToggle).toBeVisible();
      await expect(leftToggle).toBeEnabled();
      await leftToggle.click({ trial: true });

      // Open left drawer
      await leftToggle.click();
      // Check open accessibility
      await expect(leftToggle).toBeVisible();
      await expect(leftToggle).toBeEnabled();
      await leftToggle.click({ trial: true });

      // Reset
      await page.keyboard.press('Escape');
    }
  });
  ```

---

### Scenario 5: Drawer fechado pode ser reaberto (Closed drawer can be reopened)
- **Objective**: Confirm the full lifecycle stability of closing and reopening drawers multiple times without memory leaks, stale event listeners, or animation locks.
- **Verification Strategy**:
  1. Perform a loop of 3 consecutive Open -> Close -> Reopen cycles for Left Drawer.
  2. Verify that on each reopen:
     - The drawer responds immediately.
     - Interactive children (links, buttons) are clickable.
  3. Repeat 3 consecutive cycles for Right Drawer.
- **Playwright Snippet**:
  ```typescript
  test('Scenario 5: Closed drawer can be reopened reliably', async ({ page }) => {
    await page.goto('/');
    const leftToggle = page.getByTestId('left-drawer-toggle');
    const leftDrawer = page.getByTestId('left-drawer');

    for (let cycle = 1; cycle <= 3; cycle++) {
      // Close
      await leftToggle.click();
      await expect(leftDrawer).toHaveAttribute('data-state', /closed|collapsed/);

      // Reopen
      await leftToggle.click();
      await expect(leftDrawer).toHaveAttribute('data-state', 'open');
      await expect(leftDrawer.locator('nav')).toBeVisible();
    }
  });
  ```

---

### Scenario 6: Layout se adapta aos estados (Layout adapts to states)
- **Objective**: Validate that the central dashboard area (`layout-main`) dynamically adjusts its width to accommodate Left and Right Drawers without horizontal scrollbars or element overlap.
- **Verification Strategy**:
  1. Desktop Viewport (1440x900).
  2. Measure central content width `W_closed` when both drawers are closed.
  3. Assert no horizontal overflow:
     `await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth) === true`
  4. Open Left Drawer:
     - Measure `W_left`. Assert `W_left < W_closed`.
     - Check boundary alignment: `leftDrawer.right <= main.left + 1px`.
     - Assert no horizontal scrollbar.
  5. Open Right Drawer (Both Open):
     - Measure `W_both`. Assert `W_both < W_left`.
     - Check boundary alignment: `main.right <= rightDrawer.left + 1px`.
     - Assert no horizontal scrollbar.
  6. Close Left Drawer (Right Open):
     - Measure `W_right`. Assert `W_right > W_both`.
     - Assert no horizontal scrollbar.
- **Playwright Snippet**:
  ```typescript
  test('Scenario 6: Dashboard layout fluidly adapts to drawer states without overflow', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    const main = page.locator('main');
    const leftToggle = page.getByTestId('left-drawer-toggle');
    const rightToggle = page.getByTestId('right-drawer-toggle');

    // Both closed
    if (await isExpanded(leftToggle)) await leftToggle.click();
    if (await isExpanded(rightToggle)) await rightToggle.click();
    const wClosed = (await main.boundingBox())!.width;

    // Left Open
    await leftToggle.click();
    const wLeft = (await main.boundingBox())!.width;
    expect(wLeft).toBeLessThan(wClosed);

    // Both Open
    await rightToggle.click();
    const wBoth = (await main.boundingBox())!.width;
    expect(wBoth).toBeLessThan(wLeft);

    // Verify no horizontal overflow in any state
    const hasHorizontalScroll = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth
    );
    expect(hasHorizontalScroll).toBe(false);
  });
  ```

---

### Scenario 7: Comportamento mobile funciona (Mobile behavior works)
- **Objective**: Verify temporary drawer overlay, backdrop dismissal, and body scroll lock on mobile viewports.
- **Verification Strategy**:
  1. Emulate mobile viewport (`375x667`).
  2. Open Left Drawer via mobile toggle button.
  3. Assert:
     - Drawer renders with overlay backdrop (`[data-testid="drawer-overlay"]`).
     - Body scroll lock is activated:
       `expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden');`
  4. Dismiss by clicking backdrop:
     - Click outside drawer container:
       `await page.getByTestId('drawer-overlay').click({ position: { x: 350, y: 100 } });`
  5. Assert:
     - Drawer is dismissed (`toBeHidden()` or `data-state="closed"`).
     - Overlay disappears.
     - Body scroll lock is removed (`overflow !== 'hidden'`).
- **Playwright Snippet**:
  ```typescript
  test('Scenario 7: Mobile temporary drawer with backdrop dismissal and body scroll lock', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    const toggle = page.getByTestId('left-drawer-toggle');
    const drawer = page.getByTestId('left-drawer');
    const overlay = page.getByTestId('drawer-overlay');

    await toggle.click();
    await expect(drawer).toBeVisible();
    await expect(overlay).toBeVisible();

    // Check scroll lock
    const bodyOverflow = await page.evaluate(() => document.body.style.overflow);
    expect(bodyOverflow).toBe('hidden');

    // Dismiss via backdrop click
    await overlay.click({ position: { x: 350, y: 150 } });
    await expect(drawer).toBeHidden();
    await expect(overlay).toBeHidden();

    // Check scroll unlocked
    const restoredOverflow = await page.evaluate(() => document.body.style.overflow);
    expect(restoredOverflow).not.toBe('hidden');
  });
  ```

---

### Scenario 8: ESC fecha drawer temporário (ESC closes temporary drawer)
- **Objective**: Confirm pressing the `Escape` key closes the temporary drawer and restores page state.
- **Verification Strategy**:
  1. Emulate mobile viewport or open temporary drawer variant.
  2. Open drawer -> overlay becomes active.
  3. Press `Escape`:
     `await page.keyboard.press('Escape');`
  4. Assert drawer is closed and overlay is dismissed.
  5. Assert body scroll lock is restored.
- **Playwright Snippet**:
  ```typescript
  test('Scenario 8: ESC key dismisses temporary drawer', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    await page.getByTestId('left-drawer-toggle').click();
    await expect(page.getByTestId('left-drawer')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByTestId('left-drawer')).toBeHidden();
    await expect(page.getByTestId('drawer-overlay')).toBeHidden();
  });
  ```

---

### Scenario 9: Navegação por teclado funciona (Keyboard navigation & focus management)
- **Objective**: Validate complete keyboard accessibility: trigger activation via `Enter`/`Space`, focus trapping inside open temporary drawers, and focus return to trigger button upon closing.
- **Verification Strategy**:
  1. Focus the toggle button:
     `await toggle.focus(); await expect(toggle).toBeFocused();`
  2. Trigger open with keyboard:
     `await page.keyboard.press('Enter');`
  3. Verify focus management:
     - Focus shifts to the first interactive element inside the drawer (e.g. close button or first link).
  4. Focus Trap verification:
     - Press `Tab` repeatedly (5 times).
     - Assert that activeElement is ALWAYS contained within `[data-testid="left-drawer"]`.
     - Press `Shift+Tab` and verify focus remains contained within the drawer.
  5. Close drawer via keyboard (`Escape`).
  6. Return focus verification:
     - Assert the original toggle button receives focus:
       `await expect(toggle).toBeFocused();`
- **Playwright Snippet**:
  ```typescript
  test('Scenario 9: Keyboard navigation, focus trap, and return of focus', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    const toggle = page.getByTestId('left-drawer-toggle');
    const drawer = page.getByTestId('left-drawer');

    // 1. Focus toggle button & activate with Enter
    await toggle.focus();
    await expect(toggle).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(drawer).toBeVisible();

    // 2. Focus moved inside drawer
    const focusInside = await page.evaluate(() => {
      const d = document.querySelector('[data-testid="left-drawer"]');
      return d ? d.contains(document.activeElement) : false;
    });
    expect(focusInside).toBe(true);

    // 3. Tab cycling remains inside drawer (Focus Trap)
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press('Tab');
      const trapped = await page.evaluate(() => {
        const d = document.querySelector('[data-testid="left-drawer"]');
        return d ? d.contains(document.activeElement) : false;
      });
      expect(trapped).toBe(true);
    }

    // 4. Close via Escape
    await page.keyboard.press('Escape');
    await expect(drawer).toBeHidden();

    // 5. Focus returns to the trigger button
    await expect(toggle).toBeFocused();
  });
  ```

---

### Scenario 10: Zero referências remanescentes a Axios ou amCharts (Zero remaining references)
- **Objective**: Ensure complete, verified elimination of `axios`, `@amcharts/amcharts5`, and `@amcharts/amcharts5-geodata` from `package.json`, `package-lock.json`, and all source files in `src/`.
- **Verification Strategy**:
  1. Read `package.json` and assert 0 dependencies or devDependencies referencing `axios` or `@amcharts`.
  2. Scan all text/source files in `src/` (recursively checking `.js`, `.jsx`, `.ts`, `.tsx`, `.mjs`, `.css`).
  3. Assert no occurrences of regex `\b(axios|amcharts|amcharts5|am5themes_|am5map|am5percent|am5xy)\b` (case-insensitive).
  4. Assert file `src/plugins/axios.js` does not exist.
  5. Assert `src/lib/http/` uses native `fetch` exclusively.
- **Playwright Snippet**:
  ```typescript
  import { test, expect } from '@playwright/test';
  import fs from 'node:fs';
  import path from 'node:path';

  test('Scenario 10: Zero remaining references to Axios and amCharts', () => {
    // 1. Check package.json
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
    expect(allDeps['axios']).toBeUndefined();
    expect(allDeps['@amcharts/amcharts5']).toBeUndefined();
    expect(allDeps['@amcharts/amcharts5-geodata']).toBeUndefined();

    // 2. Check src directory
    function walkDir(dir: string): string[] {
      let results: string[] = [];
      const list = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of list) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          results = results.concat(walkDir(fullPath));
        } else if (/\.(jsx?|tsx?|mjs|css)$/.test(entry.name)) {
          results.push(fullPath);
        }
      }
      return results;
    }

    const files = walkDir(path.resolve('src'));
    const bannedPattern = /\b(axios|amcharts|amcharts5|am5themes_|am5map|am5percent|am5xy)\b/i;
    const violations: string[] = [];

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        if (bannedPattern.test(line)) {
          violations.push(`${path.relative(process.cwd(), file)}:${idx + 1}: ${line.trim()}`);
        }
      });
    }

    expect(violations).toEqual([]);

    // 3. Ensure legacy plugin file is deleted
    expect(fs.existsSync(path.resolve('src/plugins/axios.js'))).toBe(false);
  });
  ```

---

## 7. Recommended Test File Layout

```
c:\www\next16-template\
├── playwright.config.ts
├── tests/
│   ├── e2e/
│   │   ├── 01-left-drawer.spec.ts
│   │   ├── 02-right-drawer.spec.ts
│   │   ├── 03-independent-states.spec.ts
│   │   ├── 04-toggle-accessibility.spec.ts
│   │   ├── 05-reopen-drawer.spec.ts
│   │   ├── 06-layout-adaptation.spec.ts
│   │   ├── 07-mobile-behavior.spec.ts
│   │   ├── 08-esc-close.spec.ts
│   │   ├── 09-keyboard-navigation.spec.ts
│   └── verification/
│       └── 10-zero-legacy-dependencies.spec.ts
```

*(Alternatively, all 10 scenarios can be structured in a single cohesive test suite `tests/e2e/scenarios.spec.ts` for simplified one-command execution and clear sequential reporting).*

---

## 8. Implementation Recommendations & Handoff Guidance

1. **Package Installation**:
   Execute `npm install -D @playwright/test` once code implementation begins.
2. **Configuration Placement**:
   Place `playwright.config.ts` in the project root with the `webServer` pointing to `npm run dev` and `reuseExistingServer: !process.env.CI`.
3. **Selector Alignment**:
   Ensure `Drawer`, `LeftDrawer`, `RightDrawer`, and `DrawerToggle` components include the standard `data-testid` and ARIA attributes specified in Section 5.
4. **Documentation Page (`/components`)**:
   Include test buttons for controlled state testing on `/components` to make interactive verification straightforward.
5. **CI / Pre-commit Safety**:
   Running `npx playwright test` will automatically validate all 10 scenarios simultaneously, completing the R5 acceptance criteria.
