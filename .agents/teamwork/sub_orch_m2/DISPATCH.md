# Dispatch: Sub-Orchestrator Milestone 2 (M2)

You are the Sub-Orchestrator for **Milestone 2**: Reusable Drawer Core System & Accessibility.
Your role: Orchestrator for M2.
Working directory: `c:\www\next16-template`
State folder: `c:\www\next16-template\.agents\teamwork\sub_orch_m2\`
Scope document: `c:\www\next16-template\.agents\teamwork\sub_orch_m2\SCOPE.md`
Original request: `c:\www\next16-template\.agents\teamwork\ORIGINAL_REQUEST.md`
PROJECT document: `c:\www\next16-template\PROJECT.md`
Survey Miner 2 report: `c:\www\next16-template\.agents\teamwork\survey_miner_2\report.md`

## Instructions
1. Initialize your `BRIEFING.md` and `progress.md` in `.agents/teamwork/sub_orch_m2/`.
2. Follow the Project Pattern Iteration Loop (Assess -> 2B Iteration Loop):
   - Dispatch Worker (with mandatory integrity warning) to implement all items in `SCOPE.md`.
   - Dispatch 2 Reviewers independently to verify code quality, accessibility, React 19 hydration safety, and API conformance.
   - Dispatch 2 Challengers to empirically verify state toggles, controlled/uncontrolled transitions, localStorage persistence, and focus management.
   - Dispatch 1 Forensic Auditor (`teamwork_auditor`) to verify zero cheating / fake implementations.
   - Check Gate criteria and record in `GATE_STATUS.md`.
3. Report back to parent orchestrator with your final status and handoff.


## 2026-11-12T15:56:11Z
You are Sub-Orchestrator for Milestone 2 (M2).
Read your dispatch instructions at `c:\www\next16-template\.agents\teamwork\sub_orch_m2\DISPATCH.md`, your scope at `c:\www\next16-template\.agents\teamwork\sub_orch_m2\SCOPE.md`, `c:\www\next16-template\PROJECT.md`, `c:\www\next16-template\.agents\teamwork\ORIGINAL_REQUEST.md`, and `c:\www\next16-template\.agents\teamwork\survey_miner_2\report.md`.
Your mission:
- Orchestrate Milestone 2: Reusable, accessible Drawer component system in `src/components/ui/drawer/` (`Drawer.jsx`, `DrawerHeader.jsx`, `DrawerContent.jsx`, `DrawerFooter.jsx`, `DrawerToggle.jsx`, `LeftDrawer.jsx`, `RightDrawer.jsx`, `useDrawer.js`, `index.js`).
- Support controlled/uncontrolled modes, safe localStorage persistence without React 19 hydration mismatch, WAI-ARIA accessibility (roles, aria-label, aria-expanded, aria-controls, ESC dismissal, focus trap, body scroll lock, return focus), and permanent toggle accessibility.
- Dispatch your worker, reviewers, challengers, and forensic auditor. Enforce the mandatory integrity warning.
- Verify component functionality and build pass.
- Save your state in `c:\www\next16-template\.agents\teamwork\sub_orch_m2\` and send your completion report via send_message to parent orchestrator.
