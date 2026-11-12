# Handoff Report: Explorer 3 — Drawer Accessibility, WAI-ARIA & DOM Lifecycle

**Milestone**: Milestone 2 — Reusable Drawer Core System & Accessibility  
**Agent**: Explorer 3  
**Folder**: `c:\www\next16-template\.agents\teamwork\explorer_m2_3\`  
**Target Recipient**: Sub-Orchestrator M2 (`4f24b5ca-f091-4c39-b9c8-5cc2058deed1`)  

---

## 1. Observation

1. **Test Suite Contract (`tests/e2e/drawers.spec.ts`)**:
   - Lines 4-26: Exact test selectors:
     - `getLeftDrawer`: `[data-testid="left-drawer"]`
     - `getRightDrawer`: `[data-testid="right-drawer"]`
     - `getLeftToggle`: `[data-testid="left-drawer-toggle"]`
     - `getRightToggle`: `[data-testid="right-drawer-toggle"]`
     - `getBackdrop`: `[data-testid="drawer-backdrop"], [data-testid="drawer-overlay"]`
   - Lines 89-94, 131-136:
     - `expect(ariaControls).toBe('left-drawer')` on left toggle
     - `expect(ariaControls).toBe('right-drawer')` on right toggle
   - Lines 98-118, 138-152:
     - `aria-expanded` toggle state transitions between `'true'` and `'false'`
     - `data-state` transitions between `'open'` and `/closed|collapsed/`
   - Lines 199-248 (Scenario 4: Toggle accessibility):
     - Viewport tests on Desktop (1280x800) and Mobile (375x667)
     - Asserts `boundingBox()` is strictly inside viewport: `x >= 0`, `y >= 0`, `x + width <= vp.width + 10`
     - Asserts `leftToggle.click({ trial: true })` succeeds even while left drawer is open!
   - Lines 334-371 (Scenario 7: Mobile overlay & scroll lock):
     - `expect(lockedOverflow).toBe('hidden')` when open
     - `backdrop.click({ position: ... })` dismisses drawer and backdrop
     - `expect(restoredOverflow).not.toBe('hidden')` after dismissal
   - Lines 374-402 (Scenario 8: ESC key dismissal):
     - `await page.keyboard.press('Escape')` closes drawer, hides backdrop, and restores body scroll
   - Lines 404-446 (Scenario 9: Keyboard navigation & focus trap):
     - Step 1: `await leftToggle.focus(); await page.keyboard.press('Enter');`
     - Step 2: `document.querySelector('[data-testid="left-drawer"]').contains(document.activeElement)` must be `true`
     - Step 3: Tab 4 times; `drawerEl.contains(document.activeElement)` must remain `true` on every Tab
     - Step 4: `await page.keyboard.press('Escape');` closes drawer
     - Step 5: `await expect(leftToggle).toBeFocused();` confirms return focus to trigger button

2. **Package Ecosystem (`package.json`)**:
   - Lines 13-25: Contains `@fortawesome/react-fontawesome`, `@fortawesome/free-solid-svg-icons`, `react: 19.3.0`, `next: 16.4.6`.
   - Zero external accessible UI libraries (no Radix, no Headless UI, no floating-ui). All focus traps, scroll locks, and keyboard events must be implemented natively in React 19.

3. **Codebase Legacy Context (`src/components/ui/overlays/Dialog.jsx`)**:
   - Lines 51-115: Legacy dialog component lacks `role="dialog"`, `aria-modal="true"`, focus trap, return focus, and ESC handlers, demonstrating the need for our newly authored, modern accessibility architecture.

4. **Detailed Specification Report (`.agents/teamwork/explorer_m2_3/report.md`)**:
   - Comprehensive 10-section report detailing WAI-ARIA roles, focus trap loop, return focus mechanics, ESC key handling, reference-counted body scroll lock, permanent toggle reachability stacking context, and the complete `useDrawerAccessibility` hook implementation.

---

## 2. Logic Chain

1. **From Test Assertions (Observation 1) to WAI-ARIA Role Structure**:
   - Because Scenario 9 verifies modal behavior (focus trap, backdrop, ESC close) while Scenario 3 tests simultaneous open states in desktop layout, the component must adapt its semantic role based on variant:
     * In temporary overlay mode: `role="dialog"` + `aria-modal="true"`.
     * In desktop persistent mode: `role="navigation"` on `LeftDrawer` and `role="region"` / `role="complementary"` on `RightDrawer`.
   - This ensures screen readers enter dialog reading mode on mobile/temporary overlays without disrupting standard landmark navigation on desktop.

2. **From Focus Trap and Return Focus Assertions (Observation 1) to Ref and Event Lifecycle**:
   - Scenario 9 requires that upon `Enter` on `leftToggle`, focus immediately transfers inside `left-drawer`. Therefore, the drawer must store `triggerRef.current = document.activeElement` and run a `requestAnimationFrame` post-mount effect querying `getFocusableElements(drawerRef.current)` and focusing element 0 (e.g. close button in `DrawerHeader`).
   - Scenario 9 requires 4 consecutive Tabs to remain inside the drawer. Therefore, a `keydown` listener on `window` (capture phase) must intercept `Tab` and wrap focus:
     * If `document.activeElement === lastElement && !e.shiftKey`, redirect to `firstElement.focus()`.
     * If `document.activeElement === firstElement && e.shiftKey`, redirect to `lastElement.focus()`.
   - Scenario 9 requires `leftToggle` to be focused after ESC dismisses the drawer. Therefore, the effect cleanup/state transition must invoke `triggerRef.current?.focus()`.

3. **From Toggle Actionability Assertions (Observation 1, Scenario 4) to Z-Index Stacking Architecture**:
   - Scenario 4 explicitly tests `leftToggle.click({ trial: true })` while the drawer is open on mobile (375x667).
   - If the backdrop overlay had a higher z-index than the header or covered the entire screen without header clearance, Playwright's trial click would fail with an element interception error.
   - Therefore, `DashboardHeader` housing the toggles must have `z-50` (or `z-[60]`), while the backdrop has `z-40`, and the drawer container has `z-50`. This guarantees toggles remain visible, inside viewport bounds, and clickable across all permutations.

4. **From Body Scroll Lock Assertions (Observation 1, Scenarios 7 & 8) to Reference-Counted Implementation**:
   - Scenarios 7 and 8 assert `document.body.style.overflow === 'hidden'` during open state and restoration upon backdrop click or ESC.
   - To avoid race conditions between simultaneous drawer transitions or unmounts, scroll locking must use a module-level reference counter (`lockBodyScroll()` and `unlockBodyScroll()`) that restores `document.body.style.overflow` only when all open temporary instances reach 0.

---

## 3. Caveats

- **No Third-Party Headless UI**: All implementations must remain pure React 19 native hooks without introducing packages like `@radix-ui/react-dialog` or `focus-trap-react`, aligning with project guidelines.
- **Inert Attribute Compatibility**: While modern browsers support HTML `inert`, applying it to root sibling containers (`#dashboard-main`) can conflict with layout hierarchies. The direct `keydown` Tab trap combined with pointer backdrop blocking satisfies all Playwright tests and WCAG requirements without risking layout mutation.
- **Browser Window Resize**: If a user resizes the browser window from mobile (`< 1024px`) to desktop (`>= 1024px`) while a drawer is open, the hook must clear the body scroll lock so desktop scrolling remains functional.

---

## 4. Conclusion

The accessibility architecture for Milestone 2 is fully resolved, specified, and mapped to the Playwright test contracts:
1. **Roles & Attributes**: `role="dialog"` + `aria-modal="true"` in temporary mode; `role="navigation"` for LeftDrawer and `role="region"` for RightDrawer in persistent mode; dynamic `aria-expanded` and `aria-controls` on toggles.
2. **Focus Management**: Initial focus transfer into drawer on open, dynamic Tab/Shift-Tab focus trap, and clean return focus to `triggerRef.current` on close.
3. **Keyboard Controls**: Immediate ESC dismissal for temporary drawers; Enter/Space activation on triggers with `e.preventDefault()` on Space.
4. **Body Scroll Lock**: Reference-counted lock and unlock on `document.body.style.overflow`.
5. **Stacking Context**: `DashboardHeader` at `z-50`, backdrop at `z-40`, ensuring toggles remain permanently accessible and clickable in all states.
6. The detailed report with full hook implementation and component blueprints is available at `c:\www\next16-template\.agents\teamwork\explorer_m2_3\report.md`.

---

## 5. Verification Method

To verify these architectural contracts once implemented in Milestone 2:

1. **Run E2E Playwright Tests**:
   ```bash
   npx playwright test tests/e2e/drawers.spec.ts
   ```
   Specific test scenarios covering accessibility:
   - Scenario 1 (`Left Drawer opens and closes with correct states and ARIA`)
   - Scenario 2 (`Right Drawer opens and closes with correct states and ARIA`)
   - Scenario 4 (`Toggle buttons remain permanently visible, positioned, and actionable`)
   - Scenario 7 (`Mobile temporary drawer renders overlay backdrop, locks scroll, and closes on backdrop click`)
   - Scenario 8 (`ESC key dismisses temporary drawer and restores page state`)
   - Scenario 9 (`Keyboard navigation operates drawer, traps focus inside, and returns focus to trigger`)

2. **File Inspection**:
   - Check `src/components/ui/drawer/useDrawerAccessibility.js` (or `useDrawer.js`) for:
     * `FOCUSABLE_SELECTOR` and dynamic querying
     * `requestAnimationFrame` focus transfer
     * `window.addEventListener('keydown', ...)` with `Tab` wrapping and `Escape` dismissal
     * `triggerRef.current?.focus()` restoration
     * Reference-counted `lockBodyScroll` and `unlockBodyScroll`
