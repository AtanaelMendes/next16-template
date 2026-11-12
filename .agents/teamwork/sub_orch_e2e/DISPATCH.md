# Dispatch: Sub-Orchestrator E2E Testing Track

You are the Sub-Orchestrator for the **E2E Testing Track**.
Your role: E2E Testing Orchestrator.
Working directory: `c:\www\next16-template`
State folder: `c:\www\next16-template\.agents\teamwork\sub_orch_e2e\`
Scope document: `c:\www\next16-template\.agents\teamwork\sub_orch_e2e\SCOPE.md`
Original request: `c:\www\next16-template\.agents\teamwork\ORIGINAL_REQUEST.md`
PROJECT document: `c:\www\next16-template\PROJECT.md`
Survey Explorer 3 report: `c:\www\next16-template\.agents\teamwork\survey_explorer_3\report.md`

## Instructions
1. Initialize your `BRIEFING.md` and `progress.md` in `.agents/teamwork/sub_orch_e2e/`.
2. Follow the Project Pattern Iteration Loop for test suite creation:
   - Dispatch `teamwork_test_writer` or worker (with mandatory integrity warning) to configure Playwright and write test cases for all 10 scenarios.
   - Publish `TEST_INFRA.md` and `TEST_READY.md` at project root.
   - Dispatch Reviewer to verify test coverage, selector contracts, and test syntax.
   - Dispatch Forensic Auditor to verify genuine tests without hardcoding or bypasses.
   - Check Gate criteria and record in `GATE_STATUS.md`.
3. Report back to parent orchestrator with your final status and handoff.


## 2026-11-12T15:56:17Z
You are Sub-Orchestrator for the E2E Testing Track.
Read your dispatch instructions at `c:\www\next16-template\.agents\teamwork\sub_orch_e2e\DISPATCH.md`, your scope at `c:\www\next16-template\.agents\teamwork\sub_orch_e2e\SCOPE.md`, `c:\www\next16-template\PROJECT.md`, `c:\www\next16-template\.agents\teamwork\ORIGINAL_REQUEST.md`, and `c:\www\next16-template\.agents\teamwork\survey_explorer_3\report.md`.
Your mission:
- Deploy the E2E Testing Infrastructure: install `@playwright/test` into devDependencies, configure `playwright.config.ts`, publish `TEST_INFRA.md`.
- Implement automated test suites under `tests/` covering all 10 mandatory test scenarios (R5).
- When test cases and test runner are ready, publish `TEST_READY.md` at project root.
- Dispatch test writers / workers, reviewers, and forensic auditor. Enforce the mandatory integrity warning.
- Save your state in `c:\www\next16-template\.agents\teamwork\sub_orch_e2e\` and send your completion report via send_message to parent orchestrator.
