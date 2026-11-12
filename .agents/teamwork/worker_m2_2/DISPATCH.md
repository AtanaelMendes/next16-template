## 2026-11-12T16:36:00Z
You are Worker 2 for Milestone 2 (Iteration 2): Reusable Drawer Core System Remediation.
Working directory: `c:\www\next16-template`
State folder: `c:\www\next16-template\.agents\teamwork\worker_m2_2\`
Scope document: `c:\www\next16-template\.agents\teamwork\sub_orch_m2\SCOPE.md`
PROJECT document: `c:\www\next16-template\PROJECT.md`
ORIGINAL_REQUEST: `c:\www\next16-template\.agents\teamwork\ORIGINAL_REQUEST.md`
Explorer 1 Remediation Report: `c:\www\next16-template\.agents\teamwork\explorer_m2_it2_1\report.md` (and `useDrawer.patch`)
Explorer 2 Hardening Report: `c:\www\next16-template\.agents\teamwork\explorer_m2_it2_2\report.md` (and `proposed_Drawer.jsx`)
Explorer 3 Synthesis Blueprint: `c:\www\next16-template\.agents\teamwork\explorer_m2_it2_3\report.md`

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Exclusively Owned Files:
- `src/components/ui/drawer/useDrawer.js`
- `src/components/ui/drawer/Drawer.jsx`

## Task Instructions:
1. Update `src/components/ui/drawer/useDrawer.js`:
   - In `FOCUSABLE_SELECTOR`, add `:not([tabindex="-1"])` to interactive selectors (`a[href]:not([tabindex="-1"])`, `button:not([disabled]):not([tabindex="-1"])`, `input:not([disabled]):not([type="hidden"]):not([tabindex="-1"])`, `select:not([disabled]):not([tabindex="-1"])`, `textarea:not([disabled]):not([tabindex="-1"])`, `iframe:not([tabindex="-1"])`, etc.).
   - In `getFocusableElements(container)`, reject elements where `el.getAttribute('tabindex') === '-1'`, elements with `disabled`, and elements where computed style is `visibility === 'hidden'` or `display === 'none'`. Require positive layout geometry (`el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length > 0`).
2. Update `src/components/ui/drawer/Drawer.jsx`:
   - In `positionClasses`, add `invisible` to the closed desktop class string and closed modal class string so closed drawers are completely removed from browser tab order.
   - Add `inert={!isOpen ? true : undefined}` to the root `<aside>` element.
   - Cleanly resolve `resolvedAriaLabelledBy = ariaLabelledBy || undefined` and `resolvedAriaLabel = resolvedAriaLabelledBy ? undefined : (ariaLabel || defaultLabel)` to prevent dangling `:r0:` IDs.
3. Verification commands:
   - Run `node .agents/teamwork/challenger_m2_2/harness.mjs` -> verify 22/22 tests PASS (0 failures).
   - Run `node .agents/teamwork/challenger_m2_1/stress_test_use_drawer.mjs` -> verify 92/92 assertions PASS.
   - Run `npm run build` -> verify Next.js production build compiles cleanly with exit code 0.
4. Document all verification outputs and file diffs in your handoff report `c:\www\next16-template\.agents\teamwork\worker_m2_2\handoff.md` and send completion message to Sub-Orchestrator M2.
