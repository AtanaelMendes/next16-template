# Handoff Report — Challenger 2 (E2E Testing Track)

## Verdict: REQUEST_CHANGES

---

## 1. Observation

Direct observations from empirical execution, code inspection, and adversarial test harnesses:

### Obs 1: Playwright Test Discovery & Execution
- **Command**: `npx playwright test --list`
  - Output: 26 tests discovered across 2 projects (`chromium` and `mobile-chrome`), matching `TEST_READY.md`.
- **Command**: `npx playwright test tests/verification/clean-repo.spec.ts`
  - Output: 4 failed, 4 passed.
  - Failures caught verbatim:
    ```
    1) [chromium] › tests\verification\clean-repo.spec.ts:71:3 › legacy files src/plugins/axios.js and orphaned chart files do not exist
       Error: src/plugins/axios.js must be deleted
       Expected: false, Received: true

    2) [chromium] › tests\verification\clean-repo.spec.ts:85:3 › src/ directory contains zero references to axios or amcharts
       Error: Found 123 banned legacy reference(s) in src/:
         src\components\features\chatbot\WhatsappChat.jsx:6 -> import axiosInstance from "@/plugins/axios"; (matched /\baxios\b/i)
         src\components\ui\charts\AnswersChart.jsx:4 -> import * as am5 from "@amcharts/amcharts5"; (matched /\bamcharts\b/i)
    ```
  - Result: Confirms the test runner is functional and accurately detects current repo state.

### Obs 2: Word-Boundary and Pattern Holes in `tests/verification/clean-repo.spec.ts`
- **File**: `tests/verification/clean-repo.spec.ts:12-20`
  ```typescript
  const BANNED_PATTERNS = [
    /\baxios\b/i,
    /\bamcharts\b/i,
    /\bamcharts5\b/i,
    /\bam5themes_/i,
    /\bam5map\b/i,
    /\bam5percent\b/i,
    /\bam5xy\b/i,
  ];
  ```
- **Empirical Execution of Adversarial Test Matrix**:
  Executed a test harness feeding 14 real-world legacy code variants into `BANNED_PATTERNS`:
  ```
  --- Adversarial Input Matrix Test ---
  [PASS] axios direct import -> caught=true, expected=true
  [FAIL (VULNERABILITY)] axiosInstance standalone call -> caught=false, expected=true
  [FAIL (VULNERABILITY)] AxiosError throw -> caught=false, expected=true
  [FAIL (VULNERABILITY)] axiosClient export -> caught=false, expected=true
  [FAIL (VULNERABILITY)] AXIOS_BASE_URL constant -> caught=false, expected=true
  [PASS] amcharts import -> caught=true, expected=true
  [FAIL (VULNERABILITY)] am5.Root.new call -> caught=false, expected=true
  [FAIL (VULNERABILITY)] am5.color call -> caught=false, expected=true
  [FAIL (VULNERABILITY)] am5geodata import bare -> caught=false, expected=true
  [FAIL (VULNERABILITY)] am5locales_ptBR reference -> caught=false, expected=true
  [PASS] am5xy XYChart -> caught=true, expected=true
  [PASS] am5themes_Animated -> caught=true, expected=true
  [PASS] fetch call clean -> caught=false, expected=false
  [PASS] custom SVG chart clean -> caught=false, expected=false
  Summary: 6 passed, 8 vulnerabilities found.
  ```
- **Observation Detail**: Because `\baxios\b` enforces a word boundary (`\b`), any identifier continuing with letters or numbers (such as `axiosInstance`, `AxiosError`, `axiosClient`, or `AXIOS_CONFIG`) evaluates to `false` unless the bare word `axios` also appears on the same line. Furthermore, amCharts patterns omit standalone `am5` (e.g. `am5.Root`, `am5.color`), `am5geodata`, and `am5locales`.

### Obs 3: Package-Lock Scanner Bypasses Transitive & Root Dependencies
- **File**: `tests/verification/clean-repo.spec.ts:49-57`
  ```typescript
  if (lock.packages) {
    for (const pkgName of BANNED_PACKAGES) {
      const directKey = `node_modules/${pkgName}`;
      expect(
        lock.packages[directKey],
        `package-lock.json packages should not contain "${directKey}"`
      ).toBeUndefined();
    }
  }
  ```
- **Empirical Evaluation**:
  A nested dependency `lock.packages['node_modules/some-lib/node_modules/axios']` or a root entry `lock.packages[''].dependencies.axios` is NOT caught by `directKey = 'node_modules/' + pkgName`.
  Execution output: `Detected by current check: false`.

### Obs 4: Permissive Conditional Assertions in `tests/e2e/drawers.spec.ts`
- **File**: `tests/e2e/drawers.spec.ts:90-93` & `132-135`
  ```typescript
  // Verify initial aria-controls contract
  const ariaControls = await leftToggle.getAttribute('aria-controls');
  if (ariaControls) {
    expect(ariaControls).toBe('left-drawer');
  }
  ```
  ```typescript
  const ariaControls = await rightToggle.getAttribute('aria-controls');
  if (ariaControls) {
    expect(ariaControls).toBe('right-drawer');
  }
  ```
- **Observation Detail**: Using `if (ariaControls)` makes the test completely pass if a developer omits `aria-controls` entirely (`ariaControls === null`), directly violating the contract in `PROJECT.md` line 128 and `TEST_INFRA.md` line 80.

### Obs 5: Missing Space Key Navigation
- **File**: `tests/e2e/drawers.spec.ts:406-445` (Scenario 9)
  ```typescript
  await leftToggle.focus();
  await expect(leftToggle).toBeFocused();
  await page.keyboard.press('Enter');
  ```
- **Documented Claim in `TEST_READY.md:37`**: "Keyboard navigation (Enter/Space, focus inside, trap, focus return)".
- **Observation Detail**: `Space` key activation is NEVER tested anywhere in `drawers.spec.ts`, despite WAI-ARIA button specifications and documentation claims.

### Obs 6: Incomplete Focus Trap Assertion (False Positive Prone)
- **File**: `tests/e2e/drawers.spec.ts:429-437`
  ```typescript
  // Step 3: Focus Trap - Tab multiple times and ensure focus stays within drawer
  for (let i = 0; i < 4; i++) {
    await page.keyboard.press('Tab');
    const isStillTrapped = await page.evaluate(() => {
      const drawerEl = document.querySelector('[data-testid="left-drawer"]');
      return drawerEl ? drawerEl.contains(document.activeElement) : false;
    });
    expect(isStillTrapped, `Focus escaped drawer at Tab press #${i + 1}`).toBe(true);
  }
  ```
- **Observation Detail**: In any navigation drawer containing >= 4 focusable items, pressing `Tab` 4 times merely steps through the first 4 elements using default browser tab indexing. It NEVER tests cycling (tabbing off the last element wrapping to the first) or `Shift+Tab` backward wrapping. A dummy implementation with zero focus trap logic will pass this assertion.

### Obs 7: Asymmetric Right Drawer & Mobile Coverage
- **File**: `tests/e2e/drawers.spec.ts:336-403` (Scenarios 7 & 8)
  - Scenario 7 tests backdrop click, scroll lock, and dismissal ONLY for `leftToggle` / `leftDrawer`.
  - Scenario 8 tests ESC key dismissal ONLY for `leftToggle` / `leftDrawer`.
  - Scenario 4 tests permanent toggle accessibility when open ONLY for `leftToggle`.
- **Observation Detail**: Right Drawer mobile temporary overlay behavior (backdrop click, scroll lock, ESC dismissal) and Right Toggle permanent accessibility when `rightDrawer` is open have ZERO test coverage.
- Furthermore, in Scenario 7 (line 362):
  `await backdrop.click({ position: { x: Math.min(350, backdropBox!.width - 10), y: 150 } });`
  This click coordinate is hardcoded for the right-hand exposed area of a left-sided drawer. If applied to Right Drawer (which slides in from the right), clicking x=350 hits the drawer panel itself rather than the backdrop.

### Obs 8: Desktop Viewport Missing in Scenario 3 Permutation 2
- **File**: `tests/e2e/drawers.spec.ts:171`
  `// Permutation 2: Both Open Simultaneously (Desktop)`
  Scenario 3 runs in both `chromium` and `mobile-chrome` projects without resetting or locking the viewport to desktop width. On mobile viewports, simultaneous open drawers violate the mobile temporary overlay contract (`PROJECT.md` line 51: "No desktop, ambos podem ficar abertos simultaneamente").

---

## 2. Logic Chain

1. **Premise 1**: Tests must act as rigorous, uncompromising barriers against defects and dummy implementations. If an adversarial code variant bypasses the test suite, the suite is vulnerable.
2. **From Obs 2 & Obs 3**:
   - The regex patterns in `clean-repo.spec.ts` missed 8 of 14 adversarial variants because of overly restrictive word boundaries (`\baxios\b`) and missing amCharts 5 tokens (`am5`, `am5geodata`, `am5locales`).
   - The `package-lock.json` checker only looks for direct root keys, missing transitive or root packages.
   - *Inference*: A developer could introduce `axiosInstance` or `am5.Root` or transitive packages, and `clean-repo.spec.ts` would falsely report CLEAN.
3. **From Obs 4**:
   - The condition `if (ariaControls)` in Scenarios 1 and 2 skips assertion when the attribute is absent.
   - *Inference*: A regression dropping `aria-controls` from toggles will silently pass the test suite.
4. **From Obs 5 & Obs 6**:
   - `TEST_READY.md` claims Enter/Space navigation is verified, but Space is nowhere in the code.
   - The focus trap test only tabs 4 times forward without asserting cyclical wrap or Shift+Tab reverse wrap.
   - *Inference*: An implementation lacking focus-trapping or Space activation will pass undetected.
5. **From Obs 7**:
   - Scenarios 4, 7, and 8 exclusively test Left Drawer.
   - *Inference*: Any regression or bug in Right Drawer's mobile overlay, backdrop click, ESC dismissal, or toggle accessibility will go undetected.
6. **From Obs 8**:
   - Running Permutation 2 on `mobile-chrome` without setting desktop viewport causes an architectural mismatch between mobile overlay requirements and desktop dual-open requirements.
7. **Conclusion**:
   - Therefore, the test suite requires targeted hardening to ensure complete adversarial coverage before drawer implementation tracks can be validated with high confidence.

---

## 3. Caveats

- Full live DOM execution of `tests/e2e/drawers.spec.ts` against the final drawer components is currently blocked because drawer components are still under development by the Drawer track (`src/app/page.js` is currently the base starter template).
- The test runner configuration itself (`playwright.config.ts`), test discovery, and devServer integration are working properly.

---

## 4. Conclusion & Required Changes

The test suite architecture is well-structured and properly integrated into Playwright, but contains critical gaps and permissive checks that must be addressed.

### Specific Changes Requested:

1. **`tests/verification/clean-repo.spec.ts`**:
   - Replace restrictive `BANNED_PATTERNS` with:
     ```typescript
     const BANNED_PATTERNS = [
       /axios/i,
       /amcharts/i,
       /\bam5([a-zA-Z0-9_]*|\b)/i,
     ];
     ```
   - In `package-lock.json` test, scan all keys of `lock.packages` and `lock.packages['']?.dependencies`:
     ```typescript
     const packageKeys = Object.keys(lock.packages || {});
     for (const pkgName of BANNED_PACKAGES) {
       const hasMatch = packageKeys.some(key => key.endsWith(`node_modules/${pkgName}`));
       expect(hasMatch, `package-lock.json should not contain "${pkgName}"`).toBe(false);
       if (lock.packages?.['']?.dependencies) {
         expect(lock.packages[''].dependencies[pkgName]).toBeUndefined();
       }
     }
     ```

2. **`tests/e2e/drawers.spec.ts`**:
   - **Enforce strict `aria-controls`**:
     Replace `if (ariaControls) { ... }` with:
     `await expect(leftToggle).toHaveAttribute('aria-controls', 'left-drawer');`
     `await expect(rightToggle).toHaveAttribute('aria-controls', 'right-drawer');`
     `await expect(leftToggle).toHaveAttribute('aria-label', /.+/);`
     `await expect(rightToggle).toHaveAttribute('aria-label', /.+/);`
   - **Add `Space` key activation** in Scenario 9:
     Test activating toggle with `page.keyboard.press('Space')` as well as `Enter`.
   - **Test True Focus Trap Cycling**:
     In Scenario 9, query all focusable elements inside drawer; tab past the last focusable element and assert focus returns to the first element; press `Shift+Tab` on the first element and assert focus wraps to the last element.
   - **Add Right Drawer Mobile & Toggle Coverage**:
     In Scenario 4: open `rightDrawer` and assert `rightToggle` remains visible, positioned within viewport, and clickable.
     In Scenario 7 & 8: add tests verifying Right Drawer mobile overlay backdrop, clicking backdrop (at left coordinates e.g. x=20), body scroll lock, and ESC key dismissal.
   - **Enforce Desktop Viewport in Scenario 3 Permutation 2**:
     Add `await page.setViewportSize({ width: 1280, height: 800 });` at the start of Scenario 3 so both drawers open simultaneously within the desktop layout contract.
   - **Add Rapid Clicks Resilience**:
     Add a test checking that double-clicking or rapidly clicking toggle does not corrupt state or trigger runtime errors.

---

## 5. Verification Method

1. Run test discovery:
   `npx playwright test --list`
   Verify all test scenarios and projects are discovered without syntax errors.
2. Run clean-repo verification:
   `npx playwright test tests/verification/clean-repo.spec.ts`
   Verify it flags current legacy files in `src/` and passes once legacy files are removed.
3. Run the adversarial pattern matrix:
   ```powers
   $script = @"
   const IMPROVED_PATTERNS = [ /axios/i, /amcharts/i, /\bam5([a-zA-Z0-9_]*|\b)/i ];
   // Verify 14/14 pass rate on adversarial variants
   "@
   $script | node
   ```
4. Verify drawer specs against live app:
   `npx playwright test tests/e2e/drawers.spec.ts --project=chromium`
   `npx playwright test tests/e2e/drawers.spec.ts --project=mobile-chrome`
