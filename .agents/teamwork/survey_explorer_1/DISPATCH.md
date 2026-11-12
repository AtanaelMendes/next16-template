# Dispatch: Survey Explorer 1 (Legacy Dependencies & Charts Audit)

## Objective
Investigate the entire repository for dependencies and legacy code to be removed, HTTP client usage, and existing chart usage.

## Scope & Instructions
1. Read `c:\www\next16-template\.agents\teamwork\ORIGINAL_REQUEST.md`.
2. Inspect `package.json` and `package-lock.json` for `axios`, `@amcharts/amcharts5`, `@amcharts/amcharts5-geodata`, and any other dependencies.
3. Search the entire codebase for all occurrences, imports, references, or types related to:
   - `axios`
   - `@amcharts/amcharts5`
   - `@amcharts/amcharts5-geodata`
4. Inspect all files using these libraries. Document exactly what each file does, what amCharts charts are currently rendered (types of charts, data sources, interactivity), and where HTTP requests are made.
5. Recommend:
   - Safe removal strategy for `package.json` and `package-lock.json`.
   - Native `fetch` strategy and whether a centralized client in `src/lib/http/` is needed, with signatures/design complying with R1.
   - Pure React + SVG lightweight replacement designs for all amCharts charts, without external heavy libraries.
6. Write your comprehensive report to `.agents/teamwork/survey_explorer_1/report.md` and deliver `handoff.md`.


## 2026-11-12T15:45:32Z
You are Survey Explorer 1.
Read your dispatch instructions at `c:\www\next16-template\.agents\teamwork\survey_explorer_1\DISPATCH.md` and `c:\www\next16-template\.agents\teamwork\ORIGINAL_REQUEST.md`.
Your mission:
- Audit the entire codebase for dependencies to be removed: `axios`, `@amcharts/amcharts5`, `@amcharts/amcharts5-geodata`.
- Find all files importing or referencing them.
- Document current chart implementations and what data/visualizations they present.
- Document current HTTP usage and recommend native fetch client design for `src/lib/http/`.
- Propose lightweight pure SVG + React replacements for all charts without external heavy libraries.
- Save your full investigation to `c:\www\next16-template\.agents\teamwork\survey_explorer_1\report.md` and write `handoff.md` in your state folder.
- Notify the orchestrator via send_message when done.
