# BRIEFING — 2026-11-12T16:57:00Z

## Mission
Atualizar e aprimorar o projeto `next16-template` para ambiente de produção: remoção de dependências legadas (axios, amcharts), criação de LeftDrawer e RightDrawer acessíveis e reutilizáveis, integração ao Dashboard, documentação interativa em `/components`, suite de testes Playwright e garantia de build de produção.

## 🔒 My Identity
- Archetype: teamwork_orchestrator
- Roles: orchestrator, user_liaison, human_reporter, successor
- Working directory: c:\www\next16-template
- State folder: c:\www\next16-template\.agents\teamwork\orchestrator\
- Original parent: parent
- Original parent conversation ID: 299c3ba8-10fa-41b5-bb58-6e2849807cb7

## 🔒 My Workflow
- **Pattern**: Project Pattern
- **Scope document**: c:\www\next16-template\PROJECT.md
1. **Decompose**: Survey codebase with 3 parallel Explorers/Spec Miners -> PROJECT.md Feature Inventory -> Milestone decomposition (Dual Track: Implementation Track + E2E Testing Track)
2. **Dispatch & Execute**:
   - Implementation Track: Sequential/parallel milestones delegated to sub-orchestrators or Explorer -> Worker -> Reviewer -> Challenger -> Auditor iteration loops.
   - E2E Testing Track: E2E Testing Orchestrator / workers creating test infra & 10 required Playwright scenarios.
3. **On failure**:
   - Retry: nudge stuck agent or re-send task
   - Replace: spawn fresh agent with partial progress
   - Skip: proceed without (only if non-critical)
   - Redistribute: split stuck agent's remaining work
   - Redesign: re-partition decomposition
   - Escalate: report to parent (sub-orchestrators only, last resort)
4. **Succession**: At 16 spawns, write handoff.md, spawn successor.
- **Work items**:
  1. Survey & Reconnaissance [done]
  2. Milestone 1: Dependency removal, HTTP client & pure SVG charts [done]
  3. Milestone 2: Reusable LeftDrawer & RightDrawer components [done]
  4. E2E Testing Track: Test infra & 10 Playwright scenarios [done]
  5. Milestone 3: Dashboard Layout integration & /components documentation [in-progress]
  6. Final Milestone: 100% E2E test pass & build verification [pending]
- **Current phase**: 2 (Execution)
- **Current focus**: Milestone 3: Dashboard Layout Integration & /components Documentation

## 🔒 Key Constraints
- NEVER write, modify, or create source code files directly.
- NEVER run build/test commands yourself — require workers to do so.
- NEVER investigate or explore the problem at the code level — dispatch Explorers for technical investigation.
- DO NOT CHEAT. All implementations must be genuine.
- Integrity mode: demo. The team must NOT copy code from existing open-source projects for core logic.
- Completely remove axios, @amcharts/amcharts5, and @amcharts/amcharts5-geodata.
- No remote push or GitHub Actions execution.
- Maintain permanent accessibility of Toggle button (open & closed).
- No hydration mismatch with localStorage persistence.
- Never reuse a subagent after it has delivered its handoff — always spawn fresh.

## Current Parent
- Conversation ID: 299c3ba8-10fa-41b5-bb58-6e2849807cb7
- Updated: not yet

## Key Decisions Made
- Milestone 1 DONE: Gate PASS, Audit CLEAN.
- Milestone 2 DONE: Gate PASS, Audit CLEAN.
- E2E Testing Track DONE: Gate PASS, Audit CLEAN.
- Milestone 3 dispatched: Sub-Orchestrator M3 (`bce4dc6d-6a0c-4a3c-bdc2-f509ac21046d`) implementing DashboardLayout, DashboardHeader, full SVG charts dashboard on `/`, and interactive documentation on `/components`.

## Team Roster
| Agent | Type | Work Item | Status | Conv ID |
|-------|------|-----------|--------|---------|
| survey_explorer_1 | teamwork_explorer | Audit dependencies & charts | completed | 468041cf-f447-422f-8ffe-bc67d7435f07 |
| survey_miner_2 | teamwork_spec_miner | Next.js 16 specs & Drawer architecture | completed | 9c7676cd-6a1f-4245-8ec4-494ac74fa08e |
| survey_explorer_3 | teamwork_explorer | Test infra & Playwright scenarios | completed | c010c55a-f617-4aac-93cf-8fe2bd6c3090 |
| sub_orch_m1 | self | Milestone 1 (Deps, HTTP, Charts) | completed | 42da1151-1077-46e9-af08-06724a001be0 |
| sub_orch_m2 | self | Milestone 2 (Drawer Core System) | completed | 4f24b5ca-f091-4c39-b9c8-5cc2058deed1 |
| sub_orch_e2e | self | E2E Testing Track (Playwright & Scenarios) | completed | 5c0e0953-ee1f-453e-a4ed-4ebe42e27a99 |
| sub_orch_m3 | self | Milestone 3 (Dashboard Layout & /components) | in-progress | bce4dc6d-6a0c-4a3c-bdc2-f509ac21046d |

## Succession Status
- Succession required: no
- Spawn count: 7 / 16
- Pending subagents: bce4dc6d-6a0c-4a3c-bdc2-f509ac21046d
- Predecessor: none
- Successor spawned: not yet spawned
- Successor generation: none
- Successor state folder: none

## Active Timers
- Heartbeat cron: c069720f-3ad7-4b72-9dc5-04cabcd31783/task-295
- Safety timer: c069720f-3ad7-4b72-9dc5-04cabcd31783/task-297
- On succession: kill all timers before spawning successor
- On context truncation: handle timers as step 4 of the State Recovery section says

## Artifact Index
- c:\www\next16-template\PROJECT.md — Global architecture, feature inventory, milestones, contracts
- c:\www\next16-template\TEST_INFRA.md — E2E Test infrastructure documentation
- c:\www\next16-template\TEST_READY.md — Test runner commands and coverage matrix
- c:\www\next16-template\.agents\teamwork\ORIGINAL_REQUEST.md — Immutable original request
- c:\www\next16-template\.agents\teamwork\orchestrator\DISPATCH.md — Parent dispatch messages
- c:\www\next16-template\.agents\teamwork\sub_orch_m1\SCOPE.md — Scope for M1
- c:\www\next16-template\.agents\teamwork\sub_orch_m1\handoff.md — Completed handoff for M1
- c:\www\next16-template\.agents\teamwork\sub_orch_m2\SCOPE.md — Scope for M2
- c:\www\next16-template\.agents\teamwork\sub_orch_m2\handoff.md — Completed handoff for M2
- c:\www\next16-template\.agents\teamwork\sub_orch_e2e\SCOPE.md — Scope for E2E Testing Track
- c:\www\next16-template\.agents\teamwork\sub_orch_e2e\handoff.md — Completed handoff for E2E track
- c:\www\next16-template\.agents\teamwork\sub_orch_m3\SCOPE.md — Scope for M3
