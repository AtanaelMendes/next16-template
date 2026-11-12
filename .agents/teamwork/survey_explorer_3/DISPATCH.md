# Dispatch: Survey Explorer 3 (Testing Infrastructure & Playwright Setup)

## Objective
Investigate test infrastructure, build pipeline, and define implementation plan for Playwright covering the 10 mandatory test scenarios.

## Scope & Instructions
1. Read `c:\www\next16-template\.agents\teamwork\ORIGINAL_REQUEST.md`.
2. Inspect the current project scripts (`package.json`), build configuration, and whether Playwright or any test runner is installed.
3. Determine how Playwright should be configured:
   - Config file (`playwright.config.ts`), webServer configuration (e.g. running against dev server or preview build).
   - Test directory layout (e.g., `tests/` or `e2e/`).
   - Browser requirements (Chromium, mobile viewport emulation, etc.).
4. Detail the verification strategies for the 10 mandatory test scenarios:
   1. Left Drawer abre e fecha.
   2. Right Drawer abre e fecha.
   3. Cada drawer mantém estado independente.
   4. O botão de toggle permanece acessível.
   5. Drawer fechado pode ser reaberto.
   6. Layout se adapta aos estados.
   7. Comportamento mobile funciona.
   8. ESC fecha drawer temporário.
   9. Navegação por teclado funciona.
   10. Não existem referências remanescentes a Axios ou amCharts.
5. Formulate recommendations for test selectors, accessible roles/aria attributes, and automated verification scripts.
6. Write your comprehensive report to `.agents/teamwork/survey_explorer_3/report.md` and deliver `handoff.md`.


## 2026-11-12T15:45:44Z
From: c069720f-3ad7-4b72-9dc5-04cabcd31783 (parent)
Content:
You are Survey Explorer 3.
Read your dispatch instructions at `c:\www\next16-template\.agents\teamwork\survey_explorer_3\DISPATCH.md` and `c:\www\next16-template\.agents\teamwork\ORIGINAL_REQUEST.md`.
Your mission:
- Inspect testing infrastructure in the project (package.json scripts, dev server, build pipeline).
- Check if Playwright is installed or needs installation/configuration.
- Propose `playwright.config.ts` setup with webServer pointing to Next.js dev or build/start.
- Map out test implementation strategies for the 10 mandatory test scenarios (R5):
  1. Left Drawer opens and closes.
  2. Right Drawer opens and closes.
  3. Independent drawer states.
  4. Toggle button permanently accessible.
  5. Closed drawer can be reopened.
  6. Layout adapts to states.
  7. Mobile behavior works (viewport emulation, overlay, backdrop click).
  8. ESC closes temporary drawer.
  9. Keyboard navigation works (focus management, TAB, Enter/Space, return focus).
  10. Zero remaining references to Axios and amCharts.
- Save your full investigation to `c:\www\next16-template\.agents\teamwork\survey_explorer_3\report.md` and write `handoff.md` in your state folder.
- Notify the orchestrator via send_message when done.
