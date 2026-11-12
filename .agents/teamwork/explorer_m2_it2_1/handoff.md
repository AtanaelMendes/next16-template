# Handoff Report: Drawer Focus Trap & Accessibility Defects Investigation (Iteration 2)

**Milestone**: Milestone 2 — Reusable Drawer Core System & Accessibility  
**Agent**: Explorer 1 (`explorer_m2_it2_1`)  
**Target File**: `src/components/ui/drawer/useDrawer.js`  
**Working Directory**: `c:\www\next16-template`  
**State Folder**: `c:\www\next16-template\.agents\teamwork\explorer_m2_it2_1\`  
**Type**: Hard Handoff (Investigation Complete)  

---

## 1. Observation

### 1.1 Baseline Defect State in `src/components/ui/drawer/useDrawer.js`
In lines 16–47 of `src/components/ui/drawer/useDrawer.js`:
```javascript
export const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'button:not([disabled])',
  'iframe',
  'object',
  'embed',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(', ');

export function getFocusableElements(container) {
  if (!container || typeof window === 'undefined') return [];
  const elements = Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR));
  return elements.filter((el) => {
    return (
      el.offsetWidth > 0 ||
      el.offsetHeight > 0 ||
      el.getClientRects().length > 0 ||
      window.getComputedStyle(el).visibility !== 'hidden'
    );
  });
}
```

### 1.2 Verbatim Test Output from Challenger 2 (`node .agents/teamwork/challenger_m2_2/harness.mjs`)
```
Suite 2: Focus Trap Logic & getFocusableElements
  [PASS] Discovers all standard focusable elements (button, link with href, text input, select, textarea, tabindex="0", contenteditable)
  [PASS] Excludes elements with disabled attribute, type="hidden" inputs, and <a> tags without href
  [FAIL] Excludes elements with tabindex="-1" (<button>, <a>, <input>, <select>, <textarea>, <div>)
         Details: {"divMinus1Excluded":true,"buttonMinus1Excluded":false,"linkMinus1Excluded":false,"inputMinus1Excluded":false,"selectMinus1Excluded":false,"textareaMinus1Excluded":false,"allMatchedIds":["btn-standard","link-standard","input-standard","select-standard","textarea-standard","div-tabindex-0","editable-div","btn-tabindex-minus-1","link-tabindex-minus-1","input-tabindex-minus-1","select-tabindex-minus-1","textarea-tabindex-minus-1","btn-display-none","btn-visibility-hidden","btn-in-hidden-parent"]}
  [FAIL] Excludes invisible elements (display: none, visibility: hidden, elements in hidden parents)
         Details: {"displayNoneExcluded":false,"visibilityHiddenExcluded":false,"hiddenParentExcluded":false,"allMatchedIds":["btn-standard","link-standard","input-standard","select-standard","textarea-standard","div-tabindex-0","editable-div","btn-tabindex-minus-1","link-tabindex-minus-1","input-tabindex-minus-1","select-tabindex-minus-1","textarea-tabindex-minus-1","btn-display-none","btn-visibility-hidden","btn-in-hidden-parent"]}
```

### 1.3 Focus Trap Breakdown Reproduction (`.agents/teamwork/challenger_m2_2/test_trap_broken.mjs`)
When a drawer contains `<button id="btn-first">` followed by `<button id="btn-hidden-last" style="display: none;">`, Shift-Tab from `btn-first` invokes `btn-hidden-last.focus()`. Because the target has `display: none`, focus is rejected by the DOM and remains stuck on `btn-first` or drops to `document.body`.

---

## 2. Logic Chain

1. **Defect 1 — Native interactive tags lack `:not([tabindex="-1"])`**:
   - `FOCUSABLE_SELECTOR` includes `button:not([disabled])`, `a[href]`, `input:not([disabled]):not([type="hidden"])`, `select:not([disabled])`, `textarea:not([disabled])`. None of these have `:not([tabindex="-1"])`.
   - The selector `[tabindex]:not([tabindex="-1"])` only targets elements that rely on the `[tabindex]` attribute for focusability.
   - In `getFocusableElements`, the `filter` callback lacked any check for `el.getAttribute('tabindex') === '-1'`.
   - Thus, any native form or link element with `tabindex="-1"` is matched and returned.

2. **Defect 2 — Inverted Boolean Condition (`||`) in Visibility Filter**:
   - For an element with `display: none` (or inside a `display: none` container), `offsetWidth === 0`, `offsetHeight === 0`, and `getClientRects().length === 0`.
   - However, its computed CSS visibility defaults to `"visible"`.
   - Therefore, `window.getComputedStyle(el).visibility !== 'hidden'` evaluates to `true`.
   - Because terms were joined with `||` (OR), `false || false || false || true` returns `true`.
   - For an element with `visibility: hidden`, `el.offsetWidth > 0` evaluates to `true` (it occupies layout space). Because of `||`, it immediately returns `true`.
   - Consequently, neither `display: none` nor `visibility: hidden` elements were filtered out.

3. **Remediation Formulation**:
   - In `FOCUSABLE_SELECTOR`, add `:not([tabindex="-1"])` to all interactive selectors.
   - In `getFocusableElements`, explicitly reject:
     a) `if (el.getAttribute('tabindex') === '-1' || el.hasAttribute('disabled') || el.disabled) return false;`
     b) `const style = window.getComputedStyle(el); if (style.visibility === 'hidden' || style.display === 'none') return false;`
     c) Require layout geometry: `return (el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length > 0);`
   - This two-tier approach rejects elements explicitly tagged negative tabindex or disabled, rejects elements with `display: none` or `visibility: hidden`, and rejects elements whose ancestor is `display: none` (since they report zero geometry).

4. **Empirical Verification of Fix**:
   - Verified in `.agents/teamwork/explorer_m2_it2_1/run_harness_with_fix.mjs`:
     - Suite 1 (Scroll Lock): 4/4 PASS
     - Suite 2 (Focus Trap Logic & Exclusion): 4/4 PASS (both previous failures resolved)
     - Suite 3 (Keyboard Simulation): 4/4 PASS
     - Suite 4 (ESC Dismissal): 2/2 PASS
     - Suite 5 (Return Focus): 2/2 PASS
     - Suite 6 (DrawerToggle Accessibility): 6/6 PASS
     - Total: **22/22 (100%) PASSED, 0 FAILURES**.

---

## 3. Caveats

- **Scope Boundary**: The fix is strictly scoped to `src/components/ui/drawer/useDrawer.js`. No changes are required to `Drawer.jsx`, `DrawerToggle.jsx`, `LeftDrawer.jsx`, or `RightDrawer.jsx`.
- **Pre-existing Next.js dev server warning**: On Node v24, a warning about module typeless package parsing appears when importing `.js` files in harness scripts (`MODULE_TYPELESS_PACKAGE_JSON`); this is a Node warning for test harness imports and does not affect Next.js / Turbopack compilation.

---

## 4. Conclusion

The failures identified by Challenger 2 have been fully analyzed, reproduced, and proven resolved with a clean, surgical fix to `src/components/ui/drawer/useDrawer.js`.

### Exact Fix Snippet:
```javascript
export const FOCUSABLE_SELECTOR = [
  'a[href]:not([tabindex="-1"])',
  'area[href]:not([tabindex="-1"])',
  'input:not([disabled]):not([type="hidden"]):not([tabindex="-1"])',
  'select:not([disabled]):not([tabindex="-1"])',
  'textarea:not([disabled]):not([tabindex="-1"])',
  'button:not([disabled]):not([tabindex="-1"])',
  'iframe:not([tabindex="-1"])',
  'object:not([tabindex="-1"])',
  'embed:not([tabindex="-1"])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]:not([tabindex="-1"])',
].join(', ');

export function getFocusableElements(container) {
  if (!container || typeof window === 'undefined') return [];
  const elements = Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR));
  return elements.filter((el) => {
    if (el.getAttribute('tabindex') === '-1' || el.hasAttribute('disabled') || el.disabled) {
      return false;
    }
    const style = window.getComputedStyle(el);
    if (style.visibility === 'hidden' || style.display === 'none') {
      return false;
    }
    return (
      el.offsetWidth > 0 ||
      el.offsetHeight > 0 ||
      el.getClientRects().length > 0
    );
  });
}
```

A ready-to-apply unified patch is stored at:  
`c:\www\next16-template\.agents\teamwork\explorer_m2_it2_1\useDrawer.patch`

---

## 5. Verification Method

To independently verify the fix:

1. **Verify Full 6-Suite Test Harness (22 tests)**:
   ```powershell
   node .agents/teamwork/explorer_m2_it2_1/run_harness_with_fix.mjs
   ```
   *Expected Output*: `TEST EXECUTION SUMMARY: 22/22 PASSED, FAILURES: 0`.

2. **Verify Focus Trap Wrapping on Boundary Elements**:
   ```powershell
   node .agents/teamwork/explorer_m2_it2_1/test_trap_fixed.mjs
   ```
   *Expected Output*:
   ```json
   {
     "focusablesCount": 2,
     "matchedIds": ["btn-first", "btn-middle"],
     "shiftTabWrappedProperly": true,
     "tabWrappedProperly": true
   }
   ```

3. **Verify Challenger 2 Corrected Filter**:
   ```powershell
   node .agents/teamwork/challenger_m2_2/test_corrected_filter.mjs
   ```
   *Expected Output*: Only 7 standard interactive elements returned; zero hidden, disabled, or tabindex="-1" elements.
