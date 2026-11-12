## 2026-11-12T16:11:43Z

You are E2E Test Infrastructure Worker 2 (Iteration 2).
Your working directory is `c:\www\next16-template`.
Your state folder is `c:\www\next16-template\.agents\teamwork\worker_e2e_2\`.

Read these files FIRST before taking any action:
1. `c:\www\next16-template\.agents\teamwork\ORIGINAL_REQUEST.md` (mandatory read first)
2. `c:\www\next16-template\PROJECT.md`
3. `c:\www\next16-template\.agents\teamwork\sub_orch_e2e\SCOPE.md`
4. `c:\www\next16-template\.agents\teamwork\challenger_e2e_2\handoff.md` (mandatory read: contains the exact adversarial findings, gap analyses, and replacement code)
5. `c:\www\next16-template\.agents\teamwork\reviewer_e2e_2\handoff.md`
6. `c:\www\next16-template\tests\verification\clean-repo.spec.ts`
7. `c:\www\next16-template\tests\e2e\drawers.spec.ts`

Write Ownership & Boundary Constraints:
You EXCLUSIVELY own:
- `package.json`
- `package-lock.json`
- `playwright.config.ts`
- `tests/e2e/drawers.spec.ts`
- `tests/verification/clean-repo.spec.ts`
- `TEST_INFRA.md` (at project root)
- `TEST_READY.md` (at project root)
You MUST NOT touch any files under `src/`.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Detailed Hardening Tasks:
A. In `tests/verification/clean-repo.spec.ts`:
   1. Harden `BANNED_PATTERNS`:
      Replace word-boundary constrained patterns with robust patterns that catch all variants (`axiosInstance`, `AxiosError`, `axiosClient`, `AXIOS_CONFIG`, standalone `am5`, `am5geodata`, `am5locales`, `amcharts`):
      ```typescript
      const BANNED_PATTERNS = [
        /axios/i,
        /amcharts/i,
        /\bam5([a-zA-Z0-9_]*|\b)/i,
      ];
      ```
   2. Harden `package-lock.json` verification:
      Ensure `package-lock.json` exists (`expect(fs.existsSync(lockPath), 'package-lock.json must exist').toBe(true)`), and scan ALL keys in `lock.packages` (checking if any key ends with `node_modules/${pkgName}` or contains `/node_modules/${pkgName}`) AND root `dependencies` (`lock.packages?.['']?.dependencies?.[pkgName]` and top-level `lock.dependencies?.[pkgName]`).
B. In `tests/e2e/drawers.spec.ts`:
   1. Enforce strict, unconditional `aria-controls` & `aria-label`:
      Replace `if (ariaControls)` with unconditional assertions:
      ```typescript
      await expect(leftToggle).toHaveAttribute('aria-controls', 'left-drawer');
      await expect(leftToggle).toHaveAttribute('aria-label', /.+/);
      await expect(rightToggle).toHaveAttribute('aria-controls', 'right-drawer');
      await expect(rightToggle).toHaveAttribute('aria-label', /.+/);
      ```
   2. Add Space key navigation in Scenario 9:
      Test opening and closing toggles with `page.keyboard.press('Space')` as well as `Enter`.
   3. Test true Focus Trap cycling & wrapping:
      In Scenario 9, tab past the last focusable element and verify focus wraps back to the first element; press `Shift+Tab` on the first element and verify focus wraps to the last element. Also ensure focus returns to trigger on close.
   4. Add Right Drawer mobile & toggle coverage:
      In Scenario 4: open `rightDrawer` and assert `rightToggle` remains visible, positioned within viewport, and clickable.
      In Scenario 7 & 8: add tests verifying Right Drawer mobile overlay backdrop, backdrop click dismissal (at coordinates outside the right drawer, e.g. x=20 on mobile), body scroll lock, and ESC key dismissal.
   5. Lock Desktop Viewport in Scenario 3:
      Add `await page.setViewportSize({ width: 1280, height: 800 });` at the start of Scenario 3 (or specifically for Permutation 2) so that testing simultaneous open occurs on a desktop viewport, matching the desktop layout contract.
   6. Add rapid clicks resilience test:
      Verify rapid clicking on drawer toggle does not break state machine or trigger unhandled errors.
C. Update `TEST_INFRA.md` and `TEST_READY.md` at project root with updated test counts and hardened criteria.
D. Verification:
   - Run `npx playwright test --list` to confirm all tests parse and register cleanly.
   - Run `npx playwright test tests/verification/clean-repo.spec.ts` to confirm it cleanly catches existing legacy references in `src/`.
E. Report:
   - Maintain `progress.md` in `.agents/teamwork/worker_e2e_2/progress.md`.
   - Write full handoff report in `.agents/teamwork/worker_e2e_2/handoff.md`.
   - Message the orchestrator upon completion.
