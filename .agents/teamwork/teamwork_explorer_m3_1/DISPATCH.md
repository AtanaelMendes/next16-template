# Explorer 1 Dispatch: Drawer Integration & Layout Contracts

Working directory: `c:\www\next16-template`
State folder: `c:\www\next16-template\.agents\teamwork\teamwork_explorer_m3_1\`
Mandatory reading:
- `c:\www\next16-template\.agents\teamwork\ORIGINAL_REQUEST.md`
- `c:\www\next16-template\PROJECT.md`
- `c:\www\next16-template\.agents\teamwork\sub_orch_m3\SCOPE.md`
- `c:\www\next16-template\tests\e2e\drawers.spec.ts`

Mission:
Investigate existing drawer components in `src/components/ui/drawer/` (built in M2: Drawer, LeftDrawer, RightDrawer, DrawerToggle, DrawerHeader, DrawerContent, DrawerFooter, hooks, contexts), inspect test expectations in `tests/e2e/drawers.spec.ts`, and determine exact architecture and implementation details for:
- `src/components/layout/DashboardLayout.jsx`
- `src/components/layout/DashboardHeader.jsx`
- `src/components/layout/SidebarNav.jsx`
- `src/components/layout/ContextPanel.jsx`

Ensure exact contract matching:
- `data-testid="left-drawer"`
- `data-testid="right-drawer"`
- `data-testid="left-drawer-toggle"`
- `data-testid="right-drawer-toggle"`
- `data-testid="dashboard-main"`
- `data-testid="drawer-backdrop"`
- unconditional `aria-controls` ("left-drawer", "right-drawer") and `aria-label`
- mobile overlay/scroll lock and ESC/click dismissal
- desktop fluid resizing with zero horizontal overflow

Write your detailed findings and implementation spec to `c:\www\next16-template\.agents\teamwork\teamwork_explorer_m3_1\analysis.md` and deliver your handoff.


## 2026-11-12T16:58:49Z
You are Drawer Integration Explorer for Milestone 3.
Your state folder is `c:\www\next16-template\.agents\teamwork\teamwork_explorer_m3_1\`.
Read `c:\www\next16-template\.agents\teamwork\ORIGINAL_REQUEST.md`, `c:\www\next16-template\PROJECT.md`, `c:\www\next16-template\.agents\teamwork\sub_orch_m3\SCOPE.md`, `c:\www\next16-template\tests\e2e\drawers.spec.ts`, and `c:\www\next16-template\.agents\teamwork\teamwork_explorer_m3_1\DISPATCH.md`.
Investigate the existing drawer implementation in `src/components/ui/drawer/` (Drawer, LeftDrawer, RightDrawer, DrawerToggle, etc.) and write a comprehensive analysis report with the exact implementation plan for:
- `src/components/layout/DashboardLayout.jsx`
- `src/components/layout/DashboardHeader.jsx`
- `src/components/layout/SidebarNav.jsx`
- `src/components/layout/ContextPanel.jsx`
Ensure all contracts in `drawers.spec.ts` are respected (testids, aria attributes, permanent accessibility, mobile overlay, body scroll lock, zero horizontal scroll).
Write your report to `c:\www\next16-template\.agents\teamwork\teamwork_explorer_m3_1\analysis.md` and complete your handoff.
