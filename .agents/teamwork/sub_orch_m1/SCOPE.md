# Scope: Milestone 1 — Dependencies Cleanup, Native HTTP & Pure SVG Charts

## Architecture & Boundaries
This sub-orchestrator is responsible for completely eliminating legacy dependencies (`axios`, `@amcharts/amcharts5`, `@amcharts/amcharts5-geodata`), completing the native HTTP client, and providing pure SVG + React replacements for all charts.

### Exclusively Owned Files
- `src/lib/http/index.js`
- `src/lib/utils.js` (and `src/assets/utils.js`)
- `src/components/ui/charts/` (`AnswersChart.jsx`, `MapChart.jsx`, `MultiAxisLineChart.jsx`, `PieChart.jsx`, `UserHoursBarChart.jsx`, `XyVerticalChart.jsx`, `YearlySeriesChart.jsx`)
- Delete `src/components/ui/charts/exemploXY.js`
- Delete `src/plugins/axios.js` (and directory `src/plugins/` if empty)
- 25 files in `src/components/` referencing `axios`:
  - `src/components/features/chatbot/WhatsappChat.jsx`
  - `src/components/features/notifications/JobNotification.jsx`
  - `src/components/features/notifications/VagaRecrutamentoNotification.jsx`
  - `src/components/ui/inputs/InputCPF.jsx`
  - `src/components/ui/inputs/InputNIT.jsx`
  - `src/components/ui/inputs/InputPIS.jsx`
  - `src/components/ui/inputs/RadioTipoProcesso.jsx`
  - `src/components/ui/inputs/Select2Analista.jsx`
  - `src/components/ui/inputs/Select2Candidato.jsx`
  - `src/components/ui/inputs/Select2CargosSip.jsx`
  - `src/components/ui/inputs/Select2Cliente.jsx`
  - `src/components/ui/inputs/Select2Vaga.jsx`
  - `src/components/ui/inputs/Select2VagaAnalista.jsx`
  - `src/components/ui/inputs/SelectAnalistaFilter.jsx`
  - `src/components/ui/inputs/SelectCidade.jsx`
  - `src/components/ui/inputs/SelectCidadeFilter.jsx`
  - `src/components/ui/inputs/SelectCompetencias.jsx`
  - `src/components/ui/inputs/SelectEstado.jsx`
  - `src/components/ui/inputs/SelectIdiomas.jsx`
  - `src/components/ui/inputs/SelectOrgaoEmissor.jsx`
  - `src/components/ui/inputs/SelectPais.jsx`
  - `src/components/ui/inputs/SelectSoftwares.jsx`
  - `src/components/ui/inputs/SelectTestes.jsx`
  - `src/components/ui/inputs/SelectUnidade.jsx`
  - `src/components/ui/inputs/DebouncedSearch/DebouncedSearchSelect.jsx`

## Detailed Requirements
1. **HTTP Client Enhancements (`src/lib/http/index.js`)**:
   - Ensure `HttpError` sets `this.response = { status, data, raw: response }` and `this.data = data` so legacy callers inspecting `error.response.data` or `error.data` work seamlessly.
   - Support GET, POST, PUT, PATCH, DELETE, custom headers, query params via `URLSearchParams`, FormData handling, token authentication hook, and 204 No Content.
2. **Axios References Migration**:
   - Change imports in all 25 files from `@/plugins/axios` or `axios` to `@/lib/http` (e.g. `import http, { isAbortError, HttpError } from '@/lib/http';`).
   - In the 5 files using `CancelToken` (`Select2Analista`, `Select2Candidato`, `Select2Cliente`, `Select2VagaAnalista`, `DebouncedSearchSelect`), replace `axios.CancelToken.source()` and `axios.isCancel()` with standard `new AbortController()`, passing `signal: controller.signal` and checking `isAbortError(err)`.
   - Delete `src/plugins/axios.js`.
3. **Pure SVG + React Charts (`src/components/ui/charts/`)**:
   - Zero third-party chart dependencies.
   - Implement responsive, clean SVG visualizations for all 7 charts matching their domain logic described in `.agents/teamwork/survey_explorer_1/report.md`.
   - Delete `src/components/ui/charts/exemploXY.js`.
4. **Helper Utilities**:
   - Create `src/lib/utils.js` exporting `cn(...classes)` (using simple class concatenation or basic merger) and any other shared utilities.
   - Create `src/assets/utils.js` exporting from `src/lib/utils.js` to ensure legacy imports resolve cleanly.

## Milestone Status: DONE
- Gate Result: PASS (Reviewer 1 APPROVE, Reviewer 2 APPROVE, Challenger 1 APPROVE, Challenger 2 APPROVE, Auditor CLEAN)

## Acceptance Criteria
- [x] 0 remaining occurrences of `axios` and `amcharts` in `src/`.
- [x] `npm run build` compiles with exit code 0.
- [x] Forensic Auditor reports CLEAN integrity.
