## 2026-11-12T15:57:23Z
You are Explorer 2 for Milestone 1.
Your state folder is: `c:\www\next16-template\.agents\teamwork\teamwork_explorer_m1_2\`
You MUST read `c:\www\next16-template\.agents\teamwork\ORIGINAL_REQUEST.md` before starting work.
Also read:
- `c:\www\next16-template\PROJECT.md`
- `c:\www\next16-template\.agents\teamwork\sub_orch_m1\SCOPE.md`
- `c:\www\next16-template\.agents\teamwork\survey_explorer_1\report.md`

Your task:
1. Deeply investigate all 26 files with axios references identified in `SCOPE.md`:
   - `src/plugins/axios.js` (confirm for deletion)
   - 25 component files:
     - 5 files using `CancelToken` / `isCancel`: `Select2Analista.jsx`, `Select2Candidato.jsx`, `Select2Cliente.jsx`, `Select2VagaAnalista.jsx`, `DebouncedSearchSelect.jsx`.
     - 20 files importing `@/plugins/axios` or `axios` directly: `WhatsappChat.jsx`, `JobNotification.jsx`, `VagaRecrutamentoNotification.jsx`, `InputCPF.jsx`, `InputNIT.jsx`, `InputPIS.jsx`, `RadioTipoProcesso.jsx`, `Select2CargosSip.jsx`, `Select2Vaga.jsx`, `SelectAnalistaFilter.jsx`, `SelectCidade.jsx`, `SelectCidadeFilter.jsx`, `SelectCompetencias.jsx`, `SelectEstado.jsx`, `SelectIdiomas.jsx`, `SelectOrgaoEmissor.jsx`, `SelectPais.jsx`, `SelectSoftwares.jsx`, `SelectTestes.jsx`, `SelectUnidade.jsx`.
2. Inspect the exact lines in each file where `axios` is imported and invoked.
3. For the 5 CancelToken files, plan the exact replacement using standard `AbortController`:
   - `let controller = new AbortController()`
   - passing `signal: controller.signal` (or `{ signal: controller.signal }`) in options
   - aborting previous controller: `if (controller) controller.abort()`
   - error catch checking: `if (!isAbortError(err)) { ... }`
4. For all 25 files, map out the required import changes to:
   `import http, { isAbortError, HttpError } from '@/lib/http';`
   and verify response data usage (`response.data`).
5. Write a detailed file-by-file refactoring map to `c:\www\next16-template\.agents\teamwork\teamwork_explorer_m1_2\handoff.md`.
6. Send a completion message back with the path to your handoff report.
