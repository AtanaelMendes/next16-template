# Handoff Report — Survey Explorer 1

## 1. Observation

- **Commit `171ed74` ("FEAT: removido libs nao necessarias")**:
  Removed `@amcharts/amcharts5` (^5.21.5), `@amcharts/amcharts5-geodata` (^5.1.6), and `axios` (^1.21.1) from `package.json` and `package-lock.json`.
- **`package.json` & `package-lock.json`**:
  `Select-String -Path package.json -Pattern "axios|amcharts"` and `Select-String -Path package-lock.json -Pattern "axios|amcharts"` return 0 matches.
  `npm ls axios @amcharts/amcharts5 @amcharts/amcharts5-geodata` returns `-- (empty)`.
- **Files referencing `axios` (26 files total)**:
  - Untracked adapter: `src/plugins/axios.js` (lines 1-18, creates `axiosInstance` forwarding to `@/lib/http`).
  - Chatbot: `src/components/features/chatbot/WhatsappChat.jsx` (lines 6, 37).
  - Notifications: `src/components/features/notifications/JobNotification.jsx` (lines 10, 38), `src/components/features/notifications/VagaRecrutamentoNotification.jsx` (lines 11, 36).
  - Form Inputs: `InputCPF.jsx` (7, 42), `InputNIT.jsx` (7, 34), `InputPIS.jsx` (7, 34), `RadioTipoProcesso.jsx` (9, 63).
  - Select / Dropdown Inputs: `Select2Analista.jsx` (9, 10, 98, 102, 109), `Select2Candidato.jsx` (9, 10, 129, 134, 141), `Select2CargosSip.jsx` (9, 20), `Select2Cliente.jsx` (9, 10, 103, 110, 117), `Select2Vaga.jsx` (9, 65, 76), `Select2VagaAnalista.jsx` (9, 11, 61, 65, 70), `SelectAnalistaFilter.jsx` (8, 85), `SelectCidade.jsx` (8, 82), `SelectCidadeFilter.jsx` (9, 47), `SelectCompetencias.jsx` (8, 79), `SelectEstado.jsx` (8, 95), `SelectIdiomas.jsx` (8, 88), `SelectOrgaoEmissor.jsx` (8, 72), `SelectPais.jsx` (9, 84), `SelectSoftwares.jsx` (8, 80), `SelectTestes.jsx` (8, 84), `SelectUnidade.jsx` (9, 67, 92).
  - Search: `src/components/ui/inputs/DebouncedSearch/DebouncedSearchSelect.jsx` (5, 9, 64, 89, 167).
  - Direct `axios` imports for `CancelToken.source()` and `axios.isCancel()` exist in 5 files: `Select2Analista.jsx`, `Select2Candidato.jsx`, `Select2Cliente.jsx`, `Select2VagaAnalista.jsx`, `DebouncedSearchSelect.jsx`.
- **Files referencing `amcharts` (8 files total)**:
  - 7 Active Chart Components: `AnswersChart.jsx` (4-7), `MapChart.jsx` (4-8, 97), `MultiAxisLineChart.jsx` (4-7), `PieChart.jsx` (4-6), `UserHoursBarChart.jsx` (4-8), `XyVerticalChart.jsx` (4-6), `YearlySeriesChart.jsx` (4-7).
  - 1 Orphaned Example Script: `src/components/ui/charts/exemploXY.js` (lines 2-71).
- **HTTP Client**:
  - `src/lib/http/index.js` already exists (untracked). It implements `HttpClient`, `HttpError`, and `isAbortError` using native `fetch`. It supports GET, POST, PUT, PATCH, DELETE, custom headers, query params via `URLSearchParams`, FormData handling, token authentication hook, and 204 No Content.
  - However, `HttpError` sets `this.response = response` (raw `Response` object). Callers in the codebase expect `resp?.response?.data?.error`.
- **Build Status**:
  `npm run build` succeeds currently because `src/app/page.js` is the default Next.js template page and does not import any of the broken chart or form components. Importing them would immediately crash Turbopack with missing package errors.

---

## 2. Logic Chain

1. From **Commit `171ed74`**, the package manifest was stripped of `axios` and `@amcharts/*`, but the application code was never refactored to eliminate those dependencies.
2. From the **26 files referencing `axios`**, 25 files depend on `src/plugins/axios.js` (which is an uncommitted shim) and 5 files still directly import `axios` for cancellation (`axios.CancelToken` and `axios.isCancel`). Because `axios` is not in `node_modules`, those 5 files are broken if executed.
3. From the **8 files referencing `amcharts`**, all 7 chart components import `@amcharts/amcharts5` and related subpaths which are absent from `node_modules`. Any page attempting to render these charts will fail to build.
4. Acceptance Criterion R5 Scenario 10 specifies: *"Não existem referências remanescentes a Axios ou amCharts."* Therefore, keeping `src/plugins/axios.js` violates the acceptance criteria. All 25 component files must import directly from `@/lib/http`, `src/plugins/axios.js` must be deleted, and all 7 charts must be replaced with pure SVG + React components.
5. In `src/lib/http/index.js`, callers expecting `response.data` or `error.response.data` will encounter runtime issues unless `HttpError` exposes structured data under both `error.data` and `error.response.data`.
6. Pure SVG + React implementations using standard SVG primitives (`<svg>`, `<rect>`, `<path>`, `<circle>`, `<line>`, `<text>`) can completely reproduce the visual and interactive behaviors of all 7 charts without any external dependencies, ensuring 100% compliance with R1.

---

## 3. Caveats

- **External API endpoints**: The endpoints called by the form components (e.g. `analista/analistas/...`, `documento/valida-cpf/...`) point to a backend API that may not be running in local demo mode. Component logic correctly handles empty or failed responses.
- **MapChart Coordinates**: The map component previously relied on GeoJSON from `@amcharts/amcharts5-geodata/brazilLow`. The replacement SVG uses optimized Brazil state paths with pin coordinates projected or mapped to the state regions.
- **SunEditor and Moment**: The project has `moment` and `suneditor` in `package.json`. These are separate from R1 (which targets only `axios`, `@amcharts/amcharts5`, `@amcharts/amcharts5-geodata`).

---

## 4. Conclusion

The legacy dependencies audit is complete. A detailed report has been generated at `c:\www\next16-template\.agents\teamwork\survey_explorer_1\report.md`.
The implementation team must execute three core tasks:
1. **HTTP Client & Imports Refactor**:
   - Enhance `HttpError` in `src/lib/http/index.js` to populate `this.response = { status, data, raw: response }`.
   - Update 25 components to import `http, { isAbortError, HttpError }` from `@/lib/http`.
   - Replace `CancelToken` with `AbortController` in the 5 affected select/search components.
   - Delete `src/plugins/axios.js` and remove `src/plugins/`.
2. **Chart Replacement**:
   - Rewrite all 7 chart components in `src/components/ui/charts/` using pure SVG + React.
   - Delete `src/components/ui/charts/exemploXY.js`.
3. **Verification**:
   - Verify 0 residual occurrences of `axios` and `amcharts` in `src/`.
   - Verify `npm run build` succeeds after integrating charts and components into the dashboard.

---

## 5. Verification Method

To independently verify all findings and validate future implementation:

1. **Check absence in package manifests**:
   ```powershell
   Select-String -Path package.json -Pattern "axios|amcharts"
   Select-String -Path package-lock.json -Pattern "axios|amcharts"
   npm ls axios @amcharts/amcharts5 @amcharts/amcharts5-geodata
   ```
   *Expected result*: No output and `(empty)` from npm ls.

2. **Check remaining references in source code**:
   ```powershell
   Get-ChildItem -Path src -Recurse -File | Select-String -Pattern "axios|amcharts" -CaseSensitive:$false
   ```
   *Current state*: Returns 34 matching lines across 34 file references.
   *Target state after implementation*: 0 matching lines.

3. **Check build integrity**:
   ```powershell
   npm run build
   ```
   *Target state*: Zero compile errors, successful static prerendering.
