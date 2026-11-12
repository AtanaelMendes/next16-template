# BRIEFING — 2026-11-12T15:53:00Z

## Mission
Audit codebase for legacy dependencies (`axios`, `@amcharts/amcharts5`, `@amcharts/amcharts5-geodata`), document existing chart implementations and HTTP usage, and propose native fetch and SVG+React chart replacements.

## 🔒 My Identity
- Archetype: explorer
- Roles: survey_explorer_1
- Working directory: c:\www\next16-template
- State folder: c:\www\next16-template\.agents\teamwork\survey_explorer_1
- Original parent: c069720f-3ad7-4b72-9dc5-04cabcd31783
- Milestone: M1_survey_and_spec

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Audit codebase for dependencies to remove: axios, @amcharts/amcharts5, @amcharts/amcharts5-geodata
- Find all files importing or referencing them
- Document current chart implementations and data visualizations
- Document current HTTP usage and recommend native fetch client design for src/lib/http/
- Propose lightweight pure SVG + React replacements for all charts
- Save full investigation to .agents/teamwork/survey_explorer_1/report.md and write handoff.md

## Current Parent
- Conversation ID: c069720f-3ad7-4b72-9dc5-04cabcd31783
- Updated: 2026-11-12T15:45:32Z

## Investigation State
- **Explored paths**:
  - `package.json`, `package-lock.json`, git commit `171ed74`
  - `src/plugins/axios.js` and `src/lib/http/index.js`
  - `src/components/ui/charts/*` (AnswersChart, MapChart, MultiAxisLineChart, PieChart, UserHoursBarChart, XyVerticalChart, YearlySeriesChart, exemploXY.js)
  - All 25 input, notification, and chatbot components importing axios
- **Key findings**:
  - `package.json` and `package-lock.json` have already had the 3 libraries removed (commit 171ed74).
  - Codebase is in a half-migrated state: 26 files still reference `axios`, 8 files still reference `amcharts`/`am5`.
  - `src/plugins/axios.js` is an untracked adapter violating the zero-residual requirement (AC R5.10).
  - All 7 amcharts components can be cleanly replaced with pure SVG + React without third-party chart libraries.
  - Existing `src/lib/http/index.js` is well structured, needing minor enhancements in `HttpError` and standardization of `AbortController` in callers.
- **Unexplored areas**: None within the scope of legacy dependency audit and chart replacements.

## Key Decisions Made
- Documented full inventory of 26 axios references and 8 amcharts files in `report.md`.
- Designed pure React + SVG replacement specifications for all 7 charts.
- Outlined precise migration steps for replacing `axios.CancelToken` with `AbortController` and `isAbortError`.
- Recommended complete deletion of `src/plugins/axios.js` and `src/components/ui/charts/exemploXY.js`.

## Artifact Index
- `DISPATCH.md` — Initial task instructions and updates
- `BRIEFING.md` — Working memory and status
- `progress.md` — Liveness heartbeat and progress log
- `report.md` — Comprehensive legacy dependencies & charts audit report
- `handoff.md` — Standard 5-component handoff report
