# Challenger 2 Handoff Report: Accessibility & DOM Lifecycle Stress-Testing

**Date**: 2026-11-12  
**Milestone**: Milestone 2 — Reusable Drawer Core System & Accessibility  
**Agent**: Challenger 2 (`challenger_m2_2`)  
**Target System**: `src/components/ui/drawer/` (`useDrawer.js`, `Drawer.jsx`, `DrawerToggle.jsx`, etc.)  
**Verdict**: **FAIL**

---

## 1. Observation

### 1.1 Implementation Code Under Review (`src/components/ui/drawer/useDrawer.js`)
In `src/components/ui/drawer/useDrawer.js`, lines 16–47:

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

### 1.2 Empirical Test Execution Output
Command executed:
```powershell
node .agents/teamwork/challenger_m2_2/harness.mjs
```

Verbatim stdout:
```
================================================================
STARTING EMPIRICAL CHALLENGER TEST HARNESS: MILESTONE 2
================================================================

Suite 1: Body Scroll Lock Lifecycle & Reference Counting
  [PASS] Single locker sets document.body.style.overflow = "hidden" and restores original style on unlock
  [PASS] Multiple lockers reference counting: overflow remains "hidden" until last locker unlocks (count = 0)
  [PASS] Underflow defense: calling unlock with count=0 does not make counter negative and recovers cleanly
  [PASS] Preserves pre-existing custom body overflow (e.g., "scroll" or "auto") upon unlocking

Suite 2: Focus Trap Logic & getFocusableElements
  [PASS] Discovers all standard focusable elements (button, link with href, text input, select, textarea, tabindex="0", contenteditable)
  [PASS] Excludes elements with disabled attribute, type="hidden" inputs, and <a> tags without href
  [FAIL] Excludes elements with tabindex="-1" (<button>, <a>, <input>, <select>, <textarea>, <div>)
         Details: {"divMinus1Excluded":true,"buttonMinus1Excluded":false,"linkMinus1Excluded":false,"inputMinus1Excluded":false,"selectMinus1Excluded":false,"textareaMinus1Excluded":false,"allMatchedIds":["btn-standard","link-standard","input-standard","select-standard","textarea-standard","div-tabindex-0","editable-div","btn-tabindex-minus-1","link-tabindex-minus-1","input-tabindex-minus-1","select-tabindex-minus-1","textarea-tabindex-minus-1","btn-display-none","btn-visibility-hidden","btn-in-hidden-parent"]}
  [FAIL] Excludes invisible elements (display: none, visibility: hidden, elements in hidden parents)
         Details: {"displayNoneExcluded":false,"visibilityHiddenExcluded":false,"hiddenParentExcluded":false,"allMatchedIds":["btn-standard","link-standard","input-standard","select-standard","textarea-standard","div-tabindex-0","editable-div","btn-tabindex-minus-1","link-tabindex-minus-1","input-tabindex-minus-1","select-tabindex-minus-1","textarea-tabindex-minus-1","btn-display-none","btn-visibility-hidden","btn-in-hidden-parent"]}

Suite 3: Keyboard Navigation Handlers (Focus Trap Simulation)
  [PASS] Forward Tab on last focusable element wraps focus back to the first element and prevents default
  [PASS] Backward Shift-Tab on first focusable element wraps focus back to the last element and prevents default
  [PASS] Mid-drawer Tab does not prevent default, allowing native sequential keyboard progression
  [PASS] Outside focus interception traps runaway focus back into drawer on Tab (first) and Shift-Tab (last)

Suite 4: ESC Key Dismissal
  [PASS] Escape key triggers onClose callback and prevents event default/propagation in temporary modal mode
  [PASS] Escape key does not dismiss drawer when in persistent desktop layout mode

Suite 5: Return Focus on Close
  [PASS] Restores focus to triggerRef.current via requestAnimationFrame upon drawer closure
  [PASS] Safely guards against unmounted/removed triggers without throwing exceptions

Suite 6: Permanent Toggle Accessibility (DrawerToggle)
  [PASS] Left toggle closed state: renders <button type="button"> with aria-expanded="false", aria-controls="left-drawer", and data-testid="left-drawer-toggle"
  [PASS] Left toggle open state: renders <button type="button"> with aria-expanded="true", aria-controls="left-drawer", and data-testid="left-drawer-toggle"
  [PASS] Right toggle closed state: renders <button type="button"> with aria-expanded="false", aria-controls="right-drawer", and data-testid="right-drawer-toggle"
  [PASS] Right toggle open state: renders <button type="button"> with aria-expanded="true", aria-controls="right-drawer", and data-testid="right-drawer-toggle"
  [PASS] Accepts and prioritizes custom ariaLabel, ariaControls, and dataTestId props
  [PASS] Space keydown triggers toggle handler and prevents default page scroll

================================================================
TEST EXECUTION SUMMARY: 20/22 PASSED
FAILURES: 2
================================================================
```

### 1.3 Minimal Reproduction of Focus Trap Breakdown (`test_trap_broken.mjs`)
When a drawer contains a visible button followed by a hidden element (e.g., `<button id="btn-hidden-last" style="display: none;">`):
```json
{
  "focusablesCount": 2,
  "lastId": "btn-hidden-last",
  "activeBefore": "btn-first",
  "activeAfter": "btn-first",
  "bodyActive": false
}
```
`btn-hidden-last` is erroneously identified as the last focusable element. When Shift-Tab wraps around, calling `.focus()` on a `display: none` element fails silently, trapping keyboard focus on the first button or dumping focus to `document.body`.

---

## 2. Logic Chain

1. **Dispatch Requirement**:
   The dispatch mandate explicitly instructed:
   > *"Focus trap logic: verify `getFocusableElements` finds all buttons, links, inputs, and excludes elements with `tabindex="-1"` or `disabled`."*

2. **Defect 1 — Native Elements with `tabindex="-1"` are NOT Excluded**:
   - In `FOCUSABLE_SELECTOR`, the selectors are:
     `'button:not([disabled])'`, `'a[href]'`, `'input:not([disabled]):not([type="hidden"])'`, `'select:not([disabled])'`, `'textarea:not([disabled])'`.
   - None of these include `:not([tabindex="-1"])`.
   - The selector `'[tabindex]:not([tabindex="-1"])'` only excludes generic elements like `<div tabindex="-1">`.
   - In `getFocusableElements(container)`, the `.filter(...)` predicate contains NO check for `el.getAttribute('tabindex') !== '-1'`.
   - Consequently, `<button tabindex="-1">`, `<a href="..." tabindex="-1">`, and `<input tabindex="-1">` are matched and returned by `getFocusableElements`. This directly violates WAI-ARIA authoring practices, which mandate that elements with negative tabindex must NOT be part of sequential keyboard navigation (Tab ring).

3. **Defect 2 — Inverted Boolean Condition in Visibility Filter**:
   - In `getFocusableElements`, the visibility filter is written with disjunctions (`||`):
     ```javascript
     return (
       el.offsetWidth > 0 ||
       el.offsetHeight > 0 ||
       el.getClientRects().length > 0 ||
       window.getComputedStyle(el).visibility !== 'hidden'
     );
     ```
   - In CSS, an element with `display: none` (or nested inside a hidden container) has `offsetWidth === 0`, `offsetHeight === 0`, and `getClientRects().length === 0`. However, its computed `visibility` property defaults to `"visible"`, which is `!== 'hidden'` (`true`).
   - Because the expression uses `||`, `window.getComputedStyle(el).visibility !== 'hidden'` evaluates to `true`, short-circuiting the entire condition. Thus, ALL `display: none` elements are included.
   - Conversely, an element with `visibility: hidden` still occupies box layout space in the DOM, so `el.offsetWidth > 0` evaluates to `true`. Because of the `||`, it is also included.
   - Therefore, neither `display: none` nor `visibility: hidden` elements are filtered out.

4. **Blast Radius on Focus Trap**:
   - In `useDrawerAccessibility` (lines 481–504), Tab and Shift-Tab handlers compute `first = focusables[0]` and `last = focusables[focusables.length - 1]`.
   - If an element with `tabindex="-1"` or `display: none` is the first or last element, focus wrap-around focuses an invisible or un-tabbable element.

5. **Robust Components Verified (20/22 Passed)**:
   - **Body scroll lock**: Reference counting cleanly manages 1, 2, or multiple lockers, protects against underflow, and accurately restores original overflow styles (`'hidden'` during lock, `''` or `'scroll'` upon drop to 0).
   - **Keyboard wrap-around handlers**: Forward Tab and backward Shift-Tab prevent default and cycle focus accurately when the focusable element array is valid.
   - **ESC key dismissal**: Dispatches `onClose` in temporary modal mode with event cancellation, and ignores ESC in persistent desktop mode.
   - **Return focus**: Accurately invokes `triggerRef.current?.focus()` via `requestAnimationFrame` upon drawer closure and gracefully guards against unmounted triggers.
   - **DrawerToggle accessibility**: Permanently renders `<button type="button">`, carries accurate `aria-expanded`, `aria-controls`, and `data-testid` in all states, and handles Spacebar activation.

---

## 3. Caveats

- **No Caveats on Component Mechanics**: The empirical test harness (`harness.mjs`) used headless Chromium to evaluate DOM behavior in a 100% genuine browser environment, validating both SSR strings and live client DOM manipulation.
- **Scope Boundary**: Milestone 2 governs component creation under `src/components/ui/drawer/`. The integration into `src/app/page.js` is explicitly scheduled for Milestone 3 (`PROJECT.md`). The failure verdict is strictly based on the accessibility contract violations within `src/components/ui/drawer/useDrawer.js`.

---

## 4. Conclusion

**Verdict: FAIL**

While 5 out of the 6 core systems are robust, `src/components/ui/drawer/useDrawer.js` fails 2 vital accessibility requirements specified in the dispatch:
1. `getFocusableElements` fails to exclude native elements (`<button>`, `<a>`, `<input>`, `<select>`, `<textarea>`) carrying `tabindex="-1"`.
2. `getFocusableElements` fails to exclude invisible elements (`display: none`, `visibility: hidden`, and elements in hidden parents).

### Concrete Remediation Guidance for Worker
In `src/components/ui/drawer/useDrawer.js`:

1. Update `FOCUSABLE_SELECTOR` (lines 16–28) to exclude `tabindex="-1"` from all native selectors:
```javascript
export const FOCUSABLE_SELECTOR = [
  'a[href]:not([tabindex="-1"])',
  'area[href]:not([tabindex="-1"])',
  'input:not([disabled]):not([type="hidden"]):not([tabindex="-1"])',
  'select:not([disabled]):not([tabindex="-1"])',
  'textarea:not([disabled]):not([tabindex="-1"])',
  'button:not([disabled]):not([tabindex="-1"])',
  'iframe:not([tabindex="-1"])',
  'object',
  'embed',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]:not([tabindex="-1"])',
].join(', ');
```

2. Update `getFocusableElements` (lines 36–47) to enforce positive layout size AND check computed styles AND ensure `tabindex !== '-1'`:
```javascript
export function getFocusableElements(container) {
  if (!container || typeof window === 'undefined') return [];
  const elements = Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR));
  return elements.filter((el) => {
    if (el.getAttribute('tabindex') === '-1' || el.hasAttribute('disabled')) {
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

This fix has already been verified in `.agents/teamwork/challenger_m2_2/test_corrected_filter.mjs` and results in **22/22 (100%) tests passing**.

---

## 5. Verification Method

1. **Execute Empirical Test Harness**:
   ```powershell
   node .agents/teamwork/challenger_m2_2/harness.mjs
   ```
   *Expected Current Output*: 20/22 PASSED, 2 FAILURES in Suite 2.
   *Target Output After Fix*: 22/22 PASSED, 0 FAILURES.

2. **Verify Corrected Filter**:
   ```powershell
   node .agents/teamwork/challenger_m2_2/test_corrected_filter.mjs
   ```
   *Expected Output*: Only visible, enabled, non-negative-tabindex elements are returned.

3. **Inspect Output Logs & Artifacts**:
   - Results JSON: `.agents/teamwork/challenger_m2_2/results.json`
   - Log Output: `.agents/teamwork/challenger_m2_2/test_output.txt`
   - Bug Reproduction: `.agents/teamwork/challenger_m2_2/test_trap_broken.mjs`
