# Investigation & Remediation Report: Drawer Focus Trap & Accessibility Defects

**Milestone**: Milestone 2 — Reusable Drawer Core System & Accessibility (Iteration 2)  
**Agent**: Explorer 1 (`explorer_m2_it2_1`)  
**Target File**: `src/components/ui/drawer/useDrawer.js`  
**Reference Gate Failure**: `.agents/teamwork/challenger_m2_2/handoff.md`  
**Status**: Root Cause Identified, Fix Formulated & Verified (22/22 Empirical Tests Passing)  

---

## 1. Executive Summary

During Milestone 2 Quality Gate evaluation, Challenger 2 identified two critical accessibility defects in `src/components/ui/drawer/useDrawer.js` within `FOCUSABLE_SELECTOR` and `getFocusableElements`:
1. **Defect 1**: Native interactive elements (`<button>`, `<a>`, `<input>`, `<select>`, `<textarea>`, `<iframe>`) carrying `tabindex="-1"` were erroneously included in the focus trap sequence.
2. **Defect 2**: An inverted boolean expression in the visibility filter (`|| window.getComputedStyle(el).visibility !== 'hidden'`) caused elements styled with `display: none` or `visibility: hidden` (and elements inside hidden containers) to bypass the filter and be treated as focusable.

These defects led to silent focus failure during keyboard Tab and Shift-Tab navigation: invisible or un-tabbable elements became target wrapping candidates (`first` or `last`), stalling keyboard focus or dumping focus to `document.body`, violating W3C WAI-ARIA authoring guidelines.

This report details the root causes, empirical reproduction, precise remediation code, and test verification proving 100% resolution (22/22 tests passing).

---

## 2. Root Cause Analysis

### 2.1 Defect 1: Native Elements with `tabindex="-1"` Not Excluded

#### The Flawed Code:
In `src/components/ui/drawer/useDrawer.js` (lines 16–29):
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
```

#### Mechanism of Failure:
- CSS selector `[tabindex]:not([tabindex="-1"])` only acts upon generic elements that rely on `tabindex` for focusability (e.g. `<div tabindex="0">`).
- Native interactive tags (`button:not([disabled])`, `a[href]`, `input:not([disabled]):not([type="hidden"])`, `select:not([disabled])`, `textarea:not([disabled])`) lacked the `:not([tabindex="-1"])` negation pseudo-class.
- In `getFocusableElements`, the `querySelectorAll` results were passed through a filter that contained **no check** for `el.getAttribute('tabindex') === '-1'`.
- As a result, elements explicitly marked with `tabindex="-1"` to remove them from sequential keyboard navigation (e.g., helper buttons, roving tabindex items, or offscreen containers) were retained in the focus trap list.

---

### 2.2 Defect 2: Inverted Boolean Condition in Visibility Filter

#### The Flawed Code:
In `src/components/ui/drawer/useDrawer.js` (lines 39–46):
```javascript
  return elements.filter((el) => {
    return (
      el.offsetWidth > 0 ||
      el.offsetHeight > 0 ||
      el.getClientRects().length > 0 ||
      window.getComputedStyle(el).visibility !== 'hidden'
    );
  });
```

#### Mechanism of Failure:
1. **Case A: `display: none` elements**:
   - In CSS, an element with `display: none` (or inside a `display: none` ancestor) has `offsetWidth === 0`, `offsetHeight === 0`, and `getClientRects().length === 0`.
   - However, its computed `visibility` property defaults to `"visible"`.
   - The expression `window.getComputedStyle(el).visibility !== 'hidden'` evaluates to `"visible" !== 'hidden'`, which is **`true`**!
   - Because the expression connects terms with disjunctions (`||`), `false || false || false || true` evaluates to **`true`**.
   - Consequently, **ALL `display: none` elements are included**.
2. **Case B: `visibility: hidden` elements**:
   - In CSS, an element with `visibility: hidden` still occupies layout dimensions (`offsetWidth > 0`, `offsetHeight > 0`).
   - The first condition `el.offsetWidth > 0` immediately short-circuits to **`true`**.
   - Consequently, **ALL `visibility: hidden` elements are included**.
3. **Case C: Elements inside hidden containers**:
   - Same as Case A; child elements report `visibility: "visible"` and pass through due to the `||`.

---

## 3. Blast Radius on Focus Trap Architecture

In `useDrawerAccessibility` (`src/components/ui/drawer/useDrawer.js`, lines 480–505):
```javascript
const focusables = getFocusableElements(drawerRef.current);
if (focusables.length === 0) {
  e.preventDefault();
  return;
}

const first = focusables[0];
const last = focusables[focusables.length - 1];
const active = document.activeElement;

if (e.shiftKey) {
  if (active === first || !drawerRef.current.contains(active)) {
    e.preventDefault();
    last.focus();
  }
} else {
  if (active === last || !drawerRef.current.contains(active)) {
    e.preventDefault();
    first.focus();
  }
}
```

When an element with `display: none` or `tabindex="-1"` exists at the boundary of a drawer (e.g., a hidden submit button or a helper link with `tabindex="-1"`):
1. `last` is assigned to the invisible or non-tabbable element.
2. When the user presses `Shift-Tab` from `first`, the trap executes `last.focus()`.
3. In browser DOM implementations, calling `.focus()` on a `display: none` element is an operational no-op.
4. Focus fails to shift. Keyboard focus either remains pinned to `first` or drops to `document.body`.
5. Once focus drops to `document.body`, the trap is broken and the next Tab key stroke escapes the drawer into page background elements, violating WCAG 2.1 Guideline 2.1.2 (No Keyboard Trap).

---

## 4. Precise Remediation Strategy

The remediation is clean, self-contained, and isolated entirely to `src/components/ui/drawer/useDrawer.js`.

### 4.1 Update `FOCUSABLE_SELECTOR`
Add `:not([tabindex="-1"])` to every interactive element selector:

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
```

### 4.2 Update `getFocusableElements`
Enforce defensive two-tier filtering:
1. **Attribute/Property check**: Reject elements with `tabindex === "-1"` or `disabled`.
2. **Computed Style check**: Immediately reject if `style.visibility === 'hidden'` or `style.display === 'none'`.
3. **Layout check**: Require positive box geometry (`offsetWidth > 0 || offsetHeight > 0 || getClientRects().length > 0`) to filter out elements inside hidden ancestors (`display: none` parents).

```javascript
/**
 * Returns all visible focusable elements within a container element.
 * Excludes disabled elements, elements with tabindex="-1", and invisible elements
 * (display: none, visibility: hidden, or elements inside hidden parents).
 *
 * @param {HTMLElement|null} container
 * @returns {HTMLElement[]}
 */
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

---

## 5. Verification Evidence

### 5.1 Suite-by-Suite Test Execution Results
We verified the complete 6-suite empirical test suite in `.agents/teamwork/explorer_m2_it2_1/run_harness_with_fix.mjs` against Chromium headless browser:

```
================================================================
VERIFYING FULL 6 SUITES WITH FIXED FOCUSABLE LOGIC
================================================================

Suite 1: Body Scroll Lock Lifecycle & Reference Counting
  [PASS] Single locker sets document.body.style.overflow = "hidden" and restores original style on unlock
  [PASS] Multiple lockers reference counting: overflow remains "hidden" until last locker unlocks (count = 0)
  [PASS] Underflow defense: calling unlock with count=0 does not make counter negative and recovers cleanly
  [PASS] Preserves pre-existing custom body overflow (e.g., "scroll" or "auto") upon unlocking

Suite 2: Focus Trap Logic & getFocusableElements (WITH FIX)
  [PASS] Discovers all standard focusable elements (button, link with href, text input, select, textarea, tabindex="0", contenteditable)
  [PASS] Excludes elements with disabled attribute, type="hidden" inputs, and <a> tags without href
  [PASS] Excludes elements with tabindex="-1" (<button>, <a>, <input>, <select>, <textarea>, <div>)
  [PASS] Excludes invisible elements (display: none, visibility: hidden, elements in hidden parents)

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
TEST EXECUTION SUMMARY: 22/22 PASSED
FAILURES: 0
================================================================
```

### 5.2 Specific Focus Trap Resolution Test
In `.agents/teamwork/explorer_m2_it2_1/test_trap_fixed.mjs`, a drawer containing:
- `btn-first` (visible)
- `btn-middle` (visible)
- `btn-hidden-last` (style="display: none;")
- `btn-minus1-last` (tabindex="-1")

Output with fix:
```json
{
  "focusablesCount": 2,
  "matchedIds": ["btn-first", "btn-middle"],
  "firstId": "btn-first",
  "lastId": "btn-middle",
  "shiftTabWrappedProperly": true,
  "tabWrappedProperly": true
}
```
Both `btn-hidden-last` and `btn-minus1-last` are cleanly excluded. Shift-Tab wraps directly to `btn-middle`, and Tab from `btn-middle` wraps to `btn-first`.

---

## 6. Worker Implementation Guidance

1. Apply patch located at: `.agents/teamwork/explorer_m2_it2_1/useDrawer.patch`  
   Or directly edit `src/components/ui/drawer/useDrawer.js` lines 16–47 replacing `FOCUSABLE_SELECTOR` and `getFocusableElements` with the code in Section 4.
2. Confirm zero regressions by running `node .agents/teamwork/explorer_m2_it2_1/run_harness_with_fix.mjs` and Challenger's harness `node .agents/teamwork/challenger_m2_2/harness.mjs`.
