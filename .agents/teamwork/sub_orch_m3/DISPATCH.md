# Dispatch: Sub-Orchestrator Milestone 3 (M3)

You are the Sub-Orchestrator for **Milestone 3**: Dashboard Layout Integration & /components Interactive Documentation.
Your role: Orchestrator for M3.
Working directory: `c:\www\next16-template`
State folder: `c:\www\next16-template\.agents\teamwork\sub_orch_m3\`
Scope document: `c:\www\next16-template\.agents\teamwork\sub_orch_m3\SCOPE.md`
Original request: `c:\www\next16-template\.agents\teamwork\ORIGINAL_REQUEST.md`
PROJECT document: `c:\www\next16-template\PROJECT.md`
TEST_READY document: `c:\www\next16-template\TEST_READY.md`
E2E Test File (for exact selector contracts): `c:\www\next16-template\tests\e2e\drawers.spec.ts`

## Instructions
1. Initialize your `BRIEFING.md` and `progress.md` in `.agents/teamwork/sub_orch_m3/`.
2. Follow the Project Pattern Iteration Loop (Assess -> 2B Iteration Loop):
   - Dispatch Worker (with mandatory integrity warning) to implement all items in `SCOPE.md`.
     - Strict adherence to test contracts: `data-testid="left-drawer"`, `data-testid="right-drawer"`, `data-testid="left-drawer-toggle"`, `data-testid="right-drawer-toggle"`, `data-testid="dashboard-main"`, `data-testid="drawer-backdrop"`, `aria-controls`, `aria-expanded`, `aria-label`.
     - Build `DashboardLayout.jsx`, `DashboardHeader.jsx`, `src/app/page.js` (with SVG charts from M1), and `src/app/components/page.js` (with full interactive documentation and demos).
   - Dispatch 2 Independent Reviewers to verify fluid layout (zero horizontal overflow across all 4 states), responsive mobile behavior, permanent toggle visibility, and documentation completeness.
   - Dispatch 2 Challengers to empirically verify layout widths, mobile overlay/backdrop click dismissal, keyboard navigation, and production build.
   - Dispatch 1 Forensic Auditor (`teamwork_auditor`) to verify zero cheating / fake implementations.
   - Check Gate criteria and record in `GATE_STATUS.md`.
3. Report back to parent orchestrator with your final status and handoff.


## 2026-11-12T16:56:43Z
[Message] sender=c069720f-3ad7-4b72-9dc5-04cabcd31783
You are Sub-Orchestrator for Milestone 3 (M3).
Read your dispatch instructions at `c:\www\next16-template\.agents\teamwork\sub_orch_m3\DISPATCH.md`, your scope at `c:\www\next16-template\.agents\teamwork\sub_orch_m3\SCOPE.md`, `c:\www\next16-template\PROJECT.md`, `c:\www\next16-template\TEST_READY.md`, `c:\www\next16-template\tests\e2e\drawers.spec.ts`, and `c:\www\next16-template\.agents\teamwork\ORIGINAL_REQUEST.md`.
Your mission:
- Orchestrate Milestone 3: Implement DashboardLayout, DashboardHeader, navigation & contextual panels, update `src/app/page.js` to showcase full fluid dashboard with SVG charts, and build `/components` interactive documentation page at `src/app/components/page.js`.
- Strictly fulfill all DOM data contracts: `data-testid="left-drawer"`, `data-testid="right-drawer"`, `data-testid="left-drawer-toggle"`, `data-testid="right-drawer-toggle"`, `data-testid="dashboard-main"`, `data-testid="drawer-backdrop"`, unconditional `aria-controls` and `aria-label`, fluid resizing with zero horizontal scroll (`scrollWidth <= innerWidth`), and permanent toggle accessibility.
- Dispatch your worker, reviewers, challengers, and forensic auditor. Enforce the mandatory integrity warning.
- Verify production build passes cleanly (`npm run build`).
- Save your state in `c:\www\next16-template\.agents\teamwork\sub_orch_m3\` and send your completion report via send_message to parent orchestrator.
