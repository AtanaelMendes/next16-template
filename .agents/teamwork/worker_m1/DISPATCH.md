## 2026-11-12T16:04:43Z
You are Worker 1 for Milestone 1: Dependencies Cleanup, Native HTTP & Pure SVG Charts.
Your state folder is: `c:\www\next16-template\.agents\teamwork\worker_m1\`
You MUST read `c:\www\next16-template\.agents\teamwork\ORIGINAL_REQUEST.md` before starting work.
Also read:
- `c:\www\next16-template\PROJECT.md`
- `c:\www\next16-template\.agents\teamwork\sub_orch_m1\SCOPE.md`
- Explorer 1 Blueprint: `c:\www\next16-template\.agents\teamwork\teamwork_explorer_m1_1\handoff.md`
- Explorer 2 Refactoring Map: `c:\www\next16-template\.agents\teamwork\teamwork_explorer_m1_2\handoff.md`
- Explorer 3 Charts & Utils Blueprint: `c:\www\next16-template\.agents\teamwork\teamwork_explorer_m1_3\handoff.md`

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Write Ownership:
You own exclusively:
- `src/lib/http/index.js`
- `src/lib/utils.js`
- `src/assets/utils.js`
- `src/components/ui/charts/` (`AnswersChart.jsx`, `MapChart.jsx`, `MultiAxisLineChart.jsx`, `PieChart.jsx`, `UserHoursBarChart.jsx`, `XyVerticalChart.jsx`, `YearlySeriesChart.jsx`)
- Deletion of `src/components/ui/charts/exemploXY.js`
- Deletion of `src/plugins/axios.js` (and directory `src/plugins/`)
- All 25 component files referencing axios:
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

## Your Tasks:
1. Update `src/lib/http/index.js` following Explorer 1's blueprint (`HttpError` with `this.response = { status, data, raw: response }` and `this.data = data`, `isAbortError`, 204/205 empty response safety, body handling, URLSearchParams, headers).
2. Create `src/lib/utils.js` (with `cn`, `empty`, `nl2br`, `numberBetween`) and `src/assets/utils.js` (re-exporting from `@/lib/utils`) following Explorer 3's blueprint.
3. Migrate all 25 files referencing axios following Explorer 2's refactoring map. Specifically for the 5 files with CancelToken (`Select2Analista`, `Select2Candidato`, `Select2Cliente`, `Select2VagaAnalista`, `DebouncedSearchSelect`), replace with `AbortController`, `controller.signal`, and `isAbortError`. Add missing `cn` import to `Select2CargosSip.jsx`.
4. Delete `src/plugins/axios.js` and remove the `src/plugins/` directory.
5. Implement all 7 pure SVG + React charts in `src/components/ui/charts/` following Explorer 3's blueprint:
   - `AnswersChart.jsx`
   - `MapChart.jsx` (including modals `EstadoFiliais` and `UnidadeDetails`, Brazil SVG, SC/SP/PR states and pins)
   - `MultiAxisLineChart.jsx` (dual/shared Y axis, crosshair cursor, legend)
   - `PieChart.jsx` (donut/pie SVG arcs, hover highlight, legend)
   - `UserHoursBarChart.jsx` (ideal 170h dashed line, cumulative lines per dev, export default BurnUpChart)
   - `XyVerticalChart.jsx` (SLA colors, vacancy count label)
   - `YearlySeriesChart.jsx` (intercolumn variance badges, drill-down to monthly view, "Visão anual" button)
6. Delete `src/components/ui/charts/exemploXY.js`.
7. Verify:
   - Run verification command: check that `Get-ChildItem -Path src -Recurse -File | Select-String -Pattern "axios|amcharts" -CaseSensitive:$false` returns ZERO occurrences.
   - Run `npm run build` and ensure exit code 0.
8. Write your completion report in `c:\www\next16-template\.agents\teamwork\worker_m1\handoff.md`.
9. Send a message to orchestrator with your results and verification output.
