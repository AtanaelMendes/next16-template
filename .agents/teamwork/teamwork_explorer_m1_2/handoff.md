# Handoff Report: Detailed Refactoring Map for Axios Elimination (26 Files)

**Explorer:** Explorer 2 (Milestone 1)  
**Date:** 2026-11-12  
**Target:** Sub-Orchestrator M1 & Implementers  
**Workspace:** `c:\www\next16-template`  

---

## 1. Observation

A full forensic search across the entire codebase (`src/`, `tests/`, `package.json`, `package-lock.json`) was executed to locate all direct and indirect references to `axios`:

```powershell
Get-ChildItem -Path src -Recurse -File | Select-String -Pattern "axios" -CaseSensitive:$false
```

### Exact Inventory: 26 Files Detected in `src/`
1. `src/plugins/axios.js` (Legacy adapter shim, lines 2, 9, 18)
2. `src/components/ui/inputs/Select2Analista.jsx` (lines 9, 10, 18, 65, 94, 98, 102, 109)
3. `src/components/ui/inputs/Select2Candidato.jsx` (lines 9, 10, 18, 90, 124, 129, 134, 141)
4. `src/components/ui/inputs/Select2Cliente.jsx` (lines 9, 10, 18, 70, 99, 103, 110, 117)
5. `src/components/ui/inputs/Select2VagaAnalista.jsx` (lines 9, 11, 24, 50, 57, 61, 65, 70)
6. `src/components/ui/inputs/DebouncedSearch/DebouncedSearchSelect.jsx` (lines 5, 9, 64, 89, 167)
7. `src/components/features/chatbot/WhatsappChat.jsx` (lines 6, 37, 46)
8. `src/components/features/notifications/JobNotification.jsx` (lines 10, 38, 41)
9. `src/components/features/notifications/VagaRecrutamentoNotification.jsx` (lines 11, 36, 39)
10. `src/components/ui/inputs/InputCPF.jsx` (lines 7, 42, 47, 53)
11. `src/components/ui/inputs/InputNIT.jsx` (lines 7, 34, 39, 44, 51)
12. `src/components/ui/inputs/InputPIS.jsx` (lines 7, 34, 39, 44, 51)
13. `src/components/ui/inputs/RadioTipoProcesso.jsx` (lines 9, 63, 66, 83, 85)
14. `src/components/ui/inputs/Select2CargosSip.jsx` (lines 9, 20, 24, 28)
15. `src/components/ui/inputs/Select2Vaga.jsx` (lines 9, 65, 67, 76, 78)
16. `src/components/ui/inputs/SelectAnalistaFilter.jsx` (lines 8, 85, 89, 90)
17. `src/components/ui/inputs/SelectCidade.jsx` (lines 8, 82, 85, 86)
18. `src/components/ui/inputs/SelectCidadeFilter.jsx` (lines 9, 47, 49, 50)
19. `src/components/ui/inputs/SelectCompetencias.jsx` (lines 8, 79, 80, 81)
20. `src/components/ui/inputs/SelectEstado.jsx` (lines 8, 95, 99)
21. `src/components/ui/inputs/SelectIdiomas.jsx` (lines 8, 88, 89, 90)
22. `src/components/ui/inputs/SelectOrgaoEmissor.jsx` (lines 8, 72, 73, 74)
23. `src/components/ui/inputs/SelectPais.jsx` (lines 9, 84, 85)
24. `src/components/ui/inputs/SelectSoftwares.jsx` (lines 8, 80, 81, 82)
25. `src/components/ui/inputs/SelectTestes.jsx` (lines 8, 84, 87, 88)
26. `src/components/ui/inputs/SelectUnidade.jsx` (lines 9, 67, 72, 77, 92, 97, 102)

### Automated Test Constraint (Scenario 10)
In `tests/verification/clean-repo.spec.ts`:
- Lines 12-20: `BANNED_PATTERNS` regex includes `/\baxios\b/i`. Any occurrence of the word `axios` in `src/` fails the test.
- Lines 71-76: `src/plugins/axios.js` MUST NOT exist (`expect(fs.existsSync(legacyAxiosPlugin)).toBe(false)`).
- Lines 85-120: `src/` directory scan requires ZERO occurrences of `axios`.

### Auxiliary Discovery
Multiple inputs import `{ cn, empty } from '@/assets/utils'`. `src/assets/utils.js` does not exist yet. As stated in `SCOPE.md`, `src/lib/utils.js` and `src/assets/utils.js` (re-exporting from `@/lib/utils`) are required to prevent module resolution failures. Additionally, in `Select2CargosSip.jsx:82`, `cn` is referenced in the JSX without being imported in that file.

---

## 2. Logic Chain

1. **Premise 1:** The `axios` npm package was removed from `package.json` and `package-lock.json`. Any runtime invocation of `axios` (such as `axios.CancelToken.source()` or `axios.isCancel()`) will crash at execution time.
2. **Premise 2:** The temporary shim `src/plugins/axios.js` contains the word `axios` and exists at a path prohibited by `clean-repo.spec.ts:71-76`. Therefore, keeping `src/plugins/axios.js` directly violates Scenario 10.
3. **Premise 3:** `src/lib/http/index.js` exports a singleton `http` with methods `get`, `post`, `put`, `patch`, `delete`, returning `{ data, status, statusText, headers, ok }`. Callers expecting `response.data` can consume `http` identically to axios.
4. **Premise 4:** Standard `AbortController` is supported natively in modern Node and all browsers. By replacing `axios.CancelToken.source()` with `new AbortController()`, passing `signal: controller.signal` in the request options, aborting previous controllers via `if (abortController) abortController.abort()`, and catching cancellations via `isAbortError(error)`, full cancellation functionality is preserved without any external dependency.
5. **Premise 5:** `HttpError` in `src/lib/http` supplies `this.status`, `this.data`, and `this.response = { status, data, raw: response }`. This ensures error catch blocks checking `error?.response?.data?.error` or `error?.data?.error` continue to resolve cleanly.
6. **Conclusion:** All 25 component files must be migrated to direct imports from `@/lib/http`, the 5 CancelToken files migrated to native `AbortController`, `src/plugins/axios.js` deleted, and `src/plugins/` directory removed.

---

## 3. Detailed File-by-File Refactoring Map

### 3.1 Legacy Adapter Deletion (1 file)

#### File 0: `src/plugins/axios.js`
- **Action:** Delete `src/plugins/axios.js`. Delete empty directory `src/plugins/`.
- **Reason:** Fulfills `clean-repo.spec.ts` test assertion `fs.existsSync('src/plugins/axios.js') === false`.

---

### 3.2 CancelToken & isCancel Migration (5 files)

#### File 1: `src/components/ui/inputs/Select2Analista.jsx`
- **Target Changes:**
  - **Imports (Lines 9-10):**
    ```diff
    - import axios from 'axios'
    - import axiosInstance from '@/plugins/axios'
    + import http, { isAbortError } from '@/lib/http'
    ```
  - **State (Line 18):**
    ```diff
    - const [cancelTokenSource, setCancelTokenSource] = useState(null);
    + const [abortController, setAbortController] = useState(null);
    ```
  - **Cleanup in useEffect([filter]) (Lines 64-69):**
    ```diff
    - return () => {
    -     if (cancelTokenSource) {
    -         cancelTokenSource.cancel('Componente desmontado.')
    -     }
    -     setAnalistas([])
    - }
    + return () => {
    +     if (abortController) {
    +         abortController.abort();
    +     }
    +     setAnalistas([]);
    + };
    ```
  - **getAnalistas Request & Error Handling (Lines 93-114):**
    ```diff
      const getAnalistas = async () => {
    -     if (cancelTokenSource) {
    -         cancelTokenSource.cancel('Operação cancelada devido a uma nova solicitação.');
    -     }
    -     const source = axios.CancelToken.source();
    -     setCancelTokenSource(source);
    +     if (abortController) {
    +         abortController.abort();
    +     }
    +     const controller = new AbortController();
    +     setAbortController(controller);
          setReady(false);
          try {
    -         const response = await axiosInstance.get(`analista/analistas/${user.cd_sip}/${filter}`, {
    -             cancelToken: source.token,
    -         });
    +         const response = await http.get(`analista/analistas/${user.cd_sip}/${filter}`, {
    +             signal: controller.signal,
    +         });
              setAnalistas(response.data);
              setReady(true);
          } catch (error) {
              setReady(true);
    -         if (!axios.isCancel(error)) {
    +         if (!isAbortError(error)) {
                  toast.error('Não foi possível carregar os analistas.');
                  console.error(error);
              }
          }
      }
    ```
  - **Response Data Verification:** `response.data` returns array of analista objects. Handled directly by `setAnalistas(response.data)`.

---

#### File 2: `src/components/ui/inputs/Select2Candidato.jsx`
- **Target Changes:**
  - **Imports (Lines 9-10):**
    ```diff
    - import axios from "axios";
    - import axiosInstance from "@/plugins/axios";
    + import http, { isAbortError } from "@/lib/http";
    ```
  - **State (Line 18):**
    ```diff
    - const [cancelTokenSource, setCancelTokenSource] = useState(null);
    + const [abortController, setAbortController] = useState(null);
    ```
  - **Cleanup in useEffect([filter]) (Lines 89-94):**
    ```diff
    - return () => {
    -     if (cancelTokenSource) {
    -         cancelTokenSource.cancel("Componente desmontado.");
    -     }
    -     setCandidatos([]);
    - };
    + return () => {
    +     if (abortController) {
    +         abortController.abort();
    +     }
    +     setCandidatos([]);
    + };
    ```
  - **getCandidatos Request & Error Handling (Lines 123-146):**
    ```diff
      const getCandidatos = async () => {
    -     if (cancelTokenSource) {
    -         cancelTokenSource.cancel("Nova solicitação de candidatos.");
    -     }
    -     const source = axios.CancelToken.source();
    -     setCancelTokenSource(source);
    +     if (abortController) {
    +         abortController.abort();
    +     }
    +     const controller = new AbortController();
    +     setAbortController(controller);
          try {
              setReady(false);
    -         const response = await axiosInstance.get(`/candidato/candidatos/${filter}`, {
    -             cancelToken: source.token,
    -         });
    +         const response = await http.get(`/candidato/candidatos/${filter}`, {
    +             signal: controller.signal,
    +         });
              setCandidatos(response.data);
              setReady(true);
          } catch (error) {
              setReady(true);
    -         if (!axios.isCancel(error)) {
    +         if (!isAbortError(error)) {
                  toast.error("Não foi possível carregar os candidatos.");
                  console.error(error);
              }
          }
      };
    ```
  - **Response Data Verification:** `response.data` returns array of candidates. Handled directly by `setCandidatos(response.data)`.

---

#### File 3: `src/components/ui/inputs/Select2Cliente.jsx`
- **Target Changes:**
  - **Imports (Lines 9-10):**
    ```diff
    - import axios from "axios";
    - import axiosInstance from "@/plugins/axios";
    + import http, { isAbortError } from "@/lib/http";
    ```
  - **State (Line 18):**
    ```diff
    - const [cancelTokenSource, setCancelTokenSource] = useState(null);
    + const [abortController, setAbortController] = useState(null);
    ```
  - **Cleanup in useEffect([filter]) (Lines 69-74):**
    ```diff
    - return () => {
    -     if (cancelTokenSource) {
    -         cancelTokenSource.cancel("Componente desmontado.");
    -     }
    -     setClientes([]);
    - };
    + return () => {
    +     if (abortController) {
    +         abortController.abort();
    +     }
    +     setClientes([]);
    + };
    ```
  - **getClientes Request & Error Handling (Lines 98-122):**
    ```diff
      const getClientes = async () => {
    -     if (cancelTokenSource) {
    -         cancelTokenSource.cancel("Operação cancelada devido a uma nova solicitação.");
    -     }
    -     const source = axios.CancelToken.source();
    -     setCancelTokenSource(source);
    +     if (abortController) {
    +         abortController.abort();
    +     }
    +     const controller = new AbortController();
    +     setAbortController(controller);
          setReady(false);
          const maxChars = props?.maxChars || 0;
          try {
    -         const response = await axiosInstance.get(`cliente/clientes/${filter}/${maxChars}`, {
    -             cancelToken: source.token,
    -         });
    +         const response = await http.get(`cliente/clientes/${filter}/${maxChars}`, {
    +             signal: controller.signal,
    +         });
              setReady(true);
              setClientes(response.data);
          } catch (error) {
              setReady(true);
    -         if (!axios.isCancel(error)) {
    +         if (!isAbortError(error)) {
                  toast.error("Não foi possível carregar os clientes.");
                  console.error(error);
              }
          }
      };
    ```
  - **Response Data Verification:** `response.data` returns array of clients. Handled directly by `setClientes(response.data)`.

---

#### File 4: `src/components/ui/inputs/Select2VagaAnalista.jsx`
- **Target Changes:**
  - **Imports (Lines 9, 11):**
    ```diff
    - import axiosInstance from "@/plugins/axios";
    - import axios from 'axios'
    + import http, { isAbortError } from "@/lib/http";
    ```
  - **State (Line 24):**
    ```diff
    - const [cancelTokenSource, setCancelTokenSource] = useState(null)
    + const [abortController, setAbortController] = useState(null)
    ```
  - **Cleanup in useEffect([filter]) (Lines 49-53):**
    ```diff
    - return () => {
    -     if (cancelTokenSource) {
    -         cancelTokenSource.cancel('Componente desmontado.');
    -     }
    - }
    + return () => {
    +     if (abortController) {
    +         abortController.abort();
    +     }
    + }
    ```
  - **getVagasAnalista Request & Error Handling (Lines 56-76):**
    ```diff
      const getVagasAnalista = async () => {
    -     if (cancelTokenSource) {
    -         cancelTokenSource.cancel('Operação cancelada devido a uma nova solicitação.')
    -     }
    -     const source = axios.CancelToken.source();
    -     setCancelTokenSource(source);
    +     if (abortController) {
    +         abortController.abort();
    +     }
    +     const controller = new AbortController();
    +     setAbortController(controller);
          try {
    -         const response = await axiosInstance.get(`recrutamento/vagas-relacionar/${user.user_sip}/${filter}`, {
    -             cancelToken: source.token,
    -         })
    +         const response = await http.get(`recrutamento/vagas-relacionar/${user.user_sip}/${filter}`, {
    +             signal: controller.signal,
    +         });
              setVagas(response.data);
          } catch (error) {
    -         if (!axios.isCancel(error)) {
    +         if (!isAbortError(error)) {
                  toast.error("Não foi possível carregar as vagas.");
                  console.error(error);
                  setVagas([]);
              }
          }
      };
    ```
  - **Response Data Verification:** `response.data` returns array of jobs. Handled directly by `setVagas(response.data)`.

---

#### File 5: `src/components/ui/inputs/DebouncedSearch/DebouncedSearchSelect.jsx`
- **Target Changes:**
  - **Imports (Lines 3, 5, 9):**
    ```diff
    - import { useCallback, useContext, useEffect, useState } from 'react'
    + import { useCallback, useContext, useEffect, useRef, useState } from 'react'
    - import axios from 'axios'
    - import axiosInstance from '@/plugins/axios'
    + import http, { isAbortError } from '@/lib/http'
    ```
  - **DebouncedSearchSelectDelayed Controller & Request (Lines 26-97):**
    Add `const abortControllerRef = useRef(null);` inside `DebouncedSearchSelectDelayed`.
    ```diff
      const getData = useCallback(
          async searchValue => {
              if (!searchValue) return
    +         if (abortControllerRef.current) {
    +             abortControllerRef.current.abort();
    +         }
    +         const controller = new AbortController();
    +         abortControllerRef.current = controller;
              setLoading(true)
    -         await axiosInstance
    -             .get(`${urlGet}/${searchValue}${otherParamsAsString()}`)
    +         await http
    +             .get(`${urlGet}/${searchValue}${otherParamsAsString()}`, {
    +                 signal: controller.signal,
    +             })
                  .then(response => {
                      const dataArray = Array.isArray(response.data) ? response.data : [response.data]
                      const fetchedOptions = dataArray
                          .filter(opt => opt && opt[optId] && opt[optLabel])
                          .map(opt => ({
                              value: opt[optId],
                              label: `${opt[optId]} - ${opt[optLabel]}`,
                          }))
                      setOptions(fetchedOptions)
                  })
                  .catch(error => {
    -                 if (!axios.isCancel(error)) {
    +                 if (!isAbortError(error)) {
                          console.error('Erro ao buscar opções:', error)
                      }
                      return []
                  })
                  .finally(() => {
                      setLoading(false)
                  })
          },
          [urlGet, optId, optLabel, otherParamsAsString]
      )
    ```
  - **DebouncedSearchSelectNormal Request (Lines 165-177):**
    ```diff
      const getOptions = async () => {
          setLoading(true)
    -     await axiosInstance
    -         .get(urlGet)
    +     await http
    +         .get(urlGet)
              .then(response => {
                  const fetchedOptions = response.data
    ```

---

### 3.3 Direct Axios Consumers Migration (20 files)

#### File 6: `src/components/features/chatbot/WhatsappChat.jsx`
- **Imports:**
  - Line 6: Replace `import axiosInstance from "@/plugins/axios";` with `import http from "@/lib/http";`
- **Invocation (Lines 37-51):**
  - Line 37: Replace `axiosInstance.post('chatbot/send-message', params)` with `http.post('chatbot/send-message', params)`
  - Catch block: `let error = resp?.response?.data?.error;` is fully supported by `HttpError` (`resp.response.data`).

#### File 7: `src/components/features/notifications/JobNotification.jsx`
- **Imports:**
  - Line 10: Replace `import axiosInstance from "@/plugins/axios";` with `import http from "@/lib/http";`
- **Invocation (Lines 38-41):**
  - Line 38: Replace `axiosInstance.post('analista/confirma-visualizar-vaga', { id_alerta: alertID })` with `http.post('analista/confirma-visualizar-vaga', { id_alerta: alertID })`
  - Line 41: `response.status === 200` works directly.

#### File 8: `src/components/features/notifications/VagaRecrutamentoNotification.jsx`
- **Imports:**
  - Line 11: Replace `import axiosInstance from "@/plugins/axios";` with `import http from "@/lib/http";`
- **Invocation (Lines 36-39):**
  - Line 36: Replace `axiosInstance.post('analista/confirma-visualizar-vaga', { id_alerta: alertID })` with `http.post('analista/confirma-visualizar-vaga', { id_alerta: alertID })`
  - Line 39: `response.status === 200` works directly.

#### File 9: `src/components/ui/inputs/InputCPF.jsx`
- **Imports:**
  - Line 7: Replace `import axiosInstance from "@/plugins/axios";` with `import http from "@/lib/http";`
- **Invocation (Lines 42-43):**
  - Line 42: Replace `axiosInstance.get('documento/valida-cpf/' + ...)` with `http.get('documento/valida-cpf/' + ...)`
  - Lines 47, 53: `response.data.CPF_VALIDO` and `response.data.CD_PESSOA` work directly.

#### File 10: `src/components/ui/inputs/InputNIT.jsx`
- **Imports:**
  - Line 7: Replace `import axiosInstance from "@/plugins/axios";` with `import http from "@/lib/http";`
- **Invocation (Lines 34-35):**
  - Line 34: Replace `axiosInstance.get('documento/valida-nit/' + ...)` with `http.get('documento/valida-nit/' + ...)`
  - Lines 39, 44, 51: `response.data` object properties work directly.

#### File 11: `src/components/ui/inputs/InputPIS.jsx`
- **Imports:**
  - Line 7: Replace `import axiosInstance from "@/plugins/axios";` with `import http from "@/lib/http";`
- **Invocation (Lines 34-35):**
  - Line 34: Replace `axiosInstance.get('documento/valida-pis/' + ...)` with `http.get('documento/valida-pis/' + ...)`
  - Lines 39, 44, 51: `response.data` object properties work directly.

#### File 12: `src/components/ui/inputs/RadioTipoProcesso.jsx`
- **Imports:**
  - Line 9: Replace `import axiosInstance from "@/plugins/axios";` with `import http from "@/lib/http";`
- **Invocation (Lines 63-64):**
  - Line 63: Replace `axiosInstance.get('agendamento/dados-tipo-processo/' + ...)` with `http.get('agendamento/dados-tipo-processo/' + ...)`
  - Lines 66, 83, 85: `response.data.tipos_processos` array works directly.

#### File 13: `src/components/ui/inputs/Select2CargosSip.jsx`
- **Imports:**
  - Line 9: Replace `import axiosInstance from "@/plugins/axios";` with `import http from "@/lib/http";`
  - Also ensure `import { cn } from "@/lib/utils";` is present since line 82 invokes `cn()`.
- **Invocation (Lines 20-24):**
  - Line 20: Replace `axiosInstance.get('cargo/sip-cargos')` with `http.get('cargo/sip-cargos')`
  - Line 24: `response.data` array of cargos works directly.
  - Line 28: `resp?.response?.data?.error` supported by `HttpError`.

#### File 14: `src/components/ui/inputs/Select2Vaga.jsx`
- **Imports:**
  - Line 9: Replace `import axiosInstance from "@/plugins/axios";` with `import http from "@/lib/http";`
- **Invocation (Lines 65, 76):**
  - Line 65: Replace `axiosInstance.get('vaga/vagas-selecao-relacionar?' + filtrosJoin)` with `http.get('vaga/vagas-selecao-relacionar?' + filtrosJoin)`
  - Line 76: Replace `axiosInstance.get('vaga/vagas-atendimento/' + user.cd_sip + '/' + filter)` with `http.get(...)`
  - Lines 67, 78: `response.data` array works directly.

#### File 15: `src/components/ui/inputs/SelectAnalistaFilter.jsx`
- **Imports:**
  - Line 8: Replace `import axiosInstance from "@/plugins/axios";` with `import http from "@/lib/http";`
- **Invocation (Lines 85-87):**
  - Line 85: Replace `await axiosInstance.get('analista/filtro-analista/' + props.cdEmpresa)` with `await http.get(...)`
  - Lines 89, 90: `response.data` array works directly.

#### File 16: `src/components/ui/inputs/SelectCidade.jsx`
- **Imports:**
  - Line 8: Replace `import axiosInstance from "@/plugins/axios";` with `import http from "@/lib/http";`
- **Invocation (Lines 82-84):**
  - Line 82: Replace `await axiosInstance.get('cidades/cidades-por-estado/' + ...)` with `await http.get(...)`
  - Lines 85, 86: `response.data` array works directly.

#### File 17: `src/components/ui/inputs/SelectCidadeFilter.jsx`
- **Imports:**
  - Line 9: Replace `import axiosInstance from "@/plugins/axios";` with `import http from "@/lib/http";`
- **Invocation (Line 47):**
  - Line 47: Replace `await axiosInstance.get('cidades/filtro-cidade/' + user.user_sip)` with `await http.get(...)`
  - Lines 49, 50: `response.data` array works directly.

#### File 18: `src/components/ui/inputs/SelectCompetencias.jsx`
- **Imports:**
  - Line 8: Replace `import axiosInstance from "@/plugins/axios";` with `import http from "@/lib/http";`
- **Invocation (Line 79):**
  - Line 79: Replace `await axiosInstance.get('conhecimento/competencias')` with `await http.get('conhecimento/competencias')`
  - Lines 80, 81: `response.data` array works directly.

#### File 19: `src/components/ui/inputs/SelectEstado.jsx`
- **Imports:**
  - Line 8: Replace `import axiosInstance from "@/plugins/axios";` with `import http from "@/lib/http";`
- **Invocation (Lines 95-97):**
  - Line 95: Replace `await axiosInstance.get('estados/estados-por-pais/' + (props.cdPais ?? 1))` with `await http.get(...)`
  - Lines 99, 100: `response.data` array works directly.

#### File 20: `src/components/ui/inputs/SelectIdiomas.jsx`
- **Imports:**
  - Line 8: Replace `import axiosInstance from "@/plugins/axios";` with `import http from "@/lib/http";`
- **Invocation (Line 88):**
  - Line 88: Replace `await axiosInstance.get("conhecimento/idiomas")` with `await http.get("conhecimento/idiomas")`
  - Lines 89, 90: `response.data` array works directly.

#### File 21: `src/components/ui/inputs/SelectOrgaoEmissor.jsx`
- **Imports:**
  - Line 8: Replace `import axiosInstance from "@/plugins/axios";` with `import http from "@/lib/http";`
- **Invocation (Line 72):**
  - Line 72: Replace `await axiosInstance.get('documento/orgao-emissor')` with `await http.get('documento/orgao-emissor')`
  - Lines 73, 74: `response.data` array works directly.

#### File 22: `src/components/ui/inputs/SelectPais.jsx`
- **Imports:**
  - Line 9: Replace `import axiosInstance from "@/plugins/axios";` with `import http from "@/lib/http";`
- **Invocation (Line 84):**
  - Line 84: Replace `await axiosInstance.get("paises/paises")` with `await http.get("paises/paises")`
  - Lines 85, 86: `response.data` array works directly.

#### File 23: `src/components/ui/inputs/SelectSoftwares.jsx`
- **Imports:**
  - Line 8: Replace `import axiosInstance from "@/plugins/axios";` with `import http from "@/lib/http";`
- **Invocation (Line 80):**
  - Line 80: Replace `await axiosInstance.get('conhecimento/softwares')` with `await http.get('conhecimento/softwares')`
  - Lines 81, 82: `response.data` array works directly.

#### File 24: `src/components/ui/inputs/SelectTestes.jsx`
- **Imports:**
  - Line 8: Replace `import axiosInstance from "@/plugins/axios";` with `import http from "@/lib/http";`
- **Invocation (Lines 84-86):**
  - Line 84: Replace `await axiosInstance.get('teste/lista-testes/' + ...)` with `await http.get(...)`
  - Lines 87, 88: `response.data` array works directly.

#### File 25: `src/components/ui/inputs/SelectUnidade.jsx`
- **Imports:**
  - Line 9: Replace `import axiosInstance from "@/plugins/axios";` with `import http from "@/lib/http";`
- **Invocation (Lines 67-69, 92-94):**
  - Line 67: Replace `axiosInstance.get('unidade/unidades-selecionador/' + user.cd_sip)` with `http.get(...)`
  - Line 92: Replace `axiosInstance.get('unidade/lista-unidades/' + user.user_sip)` with `http.get(...)`
  - Lines 72, 97: `response.data` array works directly.
  - Lines 77, 102: `resp?.response?.data?.error` supported by `HttpError`.

---

## 4. Caveats

1. **`cn` and `empty` utility imports:**
   Almost all input components import `{ cn, empty } from '@/assets/utils'`. `src/assets/utils.js` currently does not exist. The implementer must create `src/lib/utils.js` (with `cn` and `empty`) and re-export them from `src/assets/utils.js` so all existing imports resolve without runtime errors.
2. **Missing `cn` import in `Select2CargosSip.jsx`:**
   In `Select2CargosSip.jsx`, line 82 calls `cn(...)`, but `cn` was omitted from the original file's imports. The implementer should add `import { cn } from '@/lib/utils';` to prevent a reference error when `cn` is evaluated.
3. **Empty directories:**
   After deleting `src/plugins/axios.js`, `src/plugins/` will be empty. It should be removed from the directory tree to keep the workspace clean and adhere to repository layout rules.
4. **Mock API vs Backend in demo mode:**
   Components invoke backend endpoints (`analista/...`, `candidato/...`, `cliente/...`). If the backend server is not running during local testing or demo builds, the HTTP client will throw network errors handled by component `.catch()` blocks without breaking the application build or layout rendering.

---

## 5. Conclusion

- **Scope:** Exactly 26 files (1 legacy adapter file to delete + 25 component files to migrate).
- **Zero-Axios Guarantee:** Every single reference to `axios` or `@/plugins/axios` has been mapped to `@/lib/http`.
- **AbortController Replacement:** All 5 CancelToken files have concrete, drop-in replacement patterns using native `AbortController` and `isAbortError`.
- **Response Compatibility:** All 20 direct consumer files expect `{ data, status }`, which is exactly what `http.get` / `http.post` return.
- **Action Readiness:** The refactoring map provides exact before/after snippets ready for immediate implementation in Phase 2 of Milestone 1.

---

## 6. Verification Method

Once changes are applied by the implementer, verify using the following steps:

1. **Zero Occurrences of Axios in `src/`:**
   ```powershell
   Get-ChildItem -Path src -Recurse -File | Select-String -Pattern "axios" -CaseSensitive:$false
   ```
   *Expected result: 0 lines returned.*

2. **Absence of Legacy Files:**
   ```powershell
   Test-Path "src/plugins/axios.js"
   ```
   *Expected result: False.*

3. **Production Build Integrity:**
   ```powershell
   npm run build
   ```
   *Expected result: Exit code 0, Turbopack builds successfully.*

4. **Automated Playwright Scenario 10:**
   ```powershell
   npx playwright test tests/verification/clean-repo.spec.ts
   ```
   *Expected result: All tests pass.*
