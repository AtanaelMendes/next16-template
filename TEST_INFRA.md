# Test Infrastructure Architecture & Specifications

## 1. Overview & Principles

The test infrastructure for `next16-template` is built on **Playwright Test** (`@playwright/test`), tailored for Next.js 16 (App Router, Turbopack, React 19).

### Core Testing Principles:
- **Genuine Opaque-Box Validation**: Tests execute against real browser environments (DOM rendering, layout metrics, pointer event dispatching, keyboard focus traversal) with zero dummy mocks or fabricated results.
- **Dual Viewport Execution**: Every drawer feature is tested across Desktop Chrome (`1280x800` / Desktop Chrome) and Mobile Chrome (`Pixel 5` / `375x667` viewport emulation).
- **Zero SSR Hydration Discrepancy**: Asserts that client-side hydration completes without DOM desynchronization or layout shifting.
- **Strict Selector Contract Compliance**: Locators are bound to standardized `data-testid` attributes and WAI-ARIA roles, insulating tests from styling refactors.
- **Static & Runtime Repository Auditing**: Node-based verification scans manifests and source code to ensure complete elimination of legacy dependencies (`axios`, `amcharts`).

---

## 2. Playwright Configuration (`playwright.config.ts`)

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
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
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
    reuseExistingServer: true,
    timeout: 120 * 1000,
  },
});
```

### Key Configuration Mechanisms:
1. **Dynamic WebServer Lifecycle**:
   - In local development, `reuseExistingServer: true` automatically detects if a local dev server is already running on `http://localhost:3000`. If running, tests execute immediately.
   - If no server is running, Playwright spawns `npm run dev` with Turbopack and waits for HTTP readiness with a generous 120s timeout.
   - Production testing can be toggled via `PLAYWRIGHT_PROD=1` to run against `npm run start`.
2. **Reporters**:
   - `list`: Clear, real-time command-line progress and failure details.
   - `html`: Detailed interactive report outputted to `playwright-report/` (non-blocking, `open: 'never'`).
3. **Artifact Retention**:
   - Traces, screenshots, and videos are captured exclusively upon test retry or failure, preventing disk bloat during clean runs.

---

## 3. DOM Selectors & WAI-ARIA Contract

The test suites enforce the following interface contract across all components:

| Element | Selector | Required Attributes / Roles | Purpose |
|---|---|---|---|
| **Left Drawer Root** | `[data-testid="left-drawer"]` | `data-state="open" \| "closed" \| "collapsed"`, `role="navigation"` | Left navigation drawer container |
| **Right Drawer Root** | `[data-testid="right-drawer"]` | `data-state="open" \| "closed"`, `role="complementary"` | Right contextual drawer container |
| **Left Toggle Button** | `[data-testid="left-drawer-toggle"]` | `aria-expanded="true" \| "false"`, `aria-controls="left-drawer"`, `aria-label` | Toggle button for Left Drawer |
| **Right Toggle Button** | `[data-testid="right-drawer-toggle"]` | `aria-expanded="true" \| "false"`, `aria-controls="right-drawer"`, `aria-label` | Toggle button for Right Drawer |
| **Overlay / Backdrop** | `[data-testid="drawer-backdrop"]`, `[data-testid="drawer-overlay"]` | `role="presentation"` | Mobile overlay backdrop dismissing temporary drawers |
| **Main Content Container** | `[data-testid="dashboard-main"]`, `main` | `min-w-0`, `overflow-x-hidden` | Fluid dashboard main area dynamically adjusting to drawer state |

---

## 4. Feature Inventory & Test Mapping

The test infrastructure maps directly to the features defined in `PROJECT.md` and user requirements:

| Feature # | Feature Name | Test Specification | Covered Scenario |
|---|---|---|---|
| **F1** | Remoção de dependências legadas | `tests/verification/clean-repo.spec.ts` | Scenario 10 (Hardened: unbounded regexes, deep package-lock scan) |
| **F5** | Componentes base de Drawer | `tests/e2e/drawers.spec.ts` | Scenarios 1, 2, 5 (Strict unconditional ARIA contract) |
| **F6** | Variantes LeftDrawer e RightDrawer | `tests/e2e/drawers.spec.ts` | Scenarios 1, 2, 3 (Desktop viewport lock for simultaneous open) |
| **F7** | Controle de estado dual | `tests/e2e/drawers.spec.ts` | Scenarios 1, 2, 3, 5 |
| **F9** | Acessibilidade e navegação por teclado | `tests/e2e/drawers.spec.ts` | Scenarios 8, 9 (Space/Enter activation, true focus trap cycling & wrap) |
| **F10** | Botão de Toggle permanentemente acessível | `tests/e2e/drawers.spec.ts` | Scenario 4 & Resilience (Left + Right drawers, rapid click stress) |
| **F11** | Comportamento Mobile (Overlay e Scroll Lock)| `tests/e2e/drawers.spec.ts` | Scenarios 7, 8 (Symmetrical Left & Right mobile backdrop & ESC) |
| **F12** | Modo compacto & ambos abertos simultaneamente | `tests/e2e/drawers.spec.ts` | Scenario 3 (Desktop viewport locked) |
| **F13** | Integração ao Dashboard e layout fluido | `tests/e2e/drawers.spec.ts` | Scenario 6 (Zero horizontal overflow) |
| **F15** | Infraestrutura Playwright | `playwright.config.ts`, `package.json` | All |
| **F16** | 10 Cenários de Testes Automatizados | All suites in `tests/` | Scenarios 1-10 + Resilience (28 executable tests across 2 projects) |

---

## 5. Test Suite File Structure

```
c:\www\next16-template\
├── playwright.config.ts                     # Playwright configuration
├── package.json                             # Scripts: test, test:e2e, test:report
├── tests/
│   ├── e2e/
│   │   └── drawers.spec.ts                  # Scenarios 1-9 + Resilience (10 tests per project)
│   └── verification/
│       └── clean-repo.spec.ts               # Scenario 10 (4 repository integrity checks per project)
├── TEST_INFRA.md                            # Test infrastructure architecture document
└── TEST_READY.md                            # Test execution readiness summary
```
