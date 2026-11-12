# BRIEFING — 2026-11-12T13:03:00Z

## Mission
Investigate `src/lib/http/index.js` and legacy component usage to produce an exact blueprint for `HttpError`, abort handling, 204/205 responses, query params, FormData, and headers merging.

## 🔒 My Identity
- Archetype: explorer
- Roles: investigator, synthesizer
- Working directory: c:\www\next16-template
- State folder: c:\www\next16-template\.agents\teamwork\teamwork_explorer_m1_1\
- Original parent: 42da1151-1077-46e9-af08-06724a001be0
- Milestone: Milestone 1 (HTTP Client Modernization & Legacy Compatibility)

## 🔒 Key Constraints
- Read-only investigation — do NOT implement in `src/`
- Full legacy compatibility: callers expecting `error.response.data`, `error.data`, `error.status`, etc.
- No source code or tests in `.agents/teamwork/`
- All coordination back to parent via `send_message`

## Current Parent
- Conversation ID: 42da1151-1077-46e9-af08-06724a001be0
- Updated: 2026-11-12T13:03:00Z

## Investigation State
- **Explored paths**:
  - `ORIGINAL_REQUEST.md`, `PROJECT.md`, `sub_orch_m1\SCOPE.md`, `survey_explorer_1\report.md`
  - `src/lib/http/index.js`
  - `src/plugins/axios.js`
  - All 25 legacy component files referencing `axios`/`axiosInstance`
  - All imports of `@/assets/utils` across `src/components/`
- **Key findings**:
  1. `HttpError` currently assigns `this.response = response` (raw fetch `Response`). Legacy callers (`WhatsappChat`, `Select2CargosSip`, `SelectUnidade`) expect `resp?.response?.data?.error`. Setting `this.response = { status, data, headers, raw: response }` is critical to prevent `undefined` errors.
  2. `isAbortError` currently only checks `error?.name === 'AbortError' || error?.name === 'CanceledError'`. It misses DOMException numeric `code === 20` (DOMException.ABORT_ERR), `code === 'ABORT_ERR'`, `code === 'ERR_CANCELED'`, and `__CANCEL__`.
  3. `HttpClient.prototype.request` handles 204/205 by skipping body parsing, but parsing empty bodies when `Content-Type: application/json` is present can throw `SyntaxError`. Reading `text()` first and checking length is safer.
  4. Query params formatting in `buildUrl` uses `URLSearchParams`, but does not handle array values (`ids: [1,2]`).
  5. FormData handling: currently deletes `finalHeaders['Content-Type']`, but must handle case-insensitivity (`content-type`, `CONTENT-TYPE`).
  6. GET and HEAD requests with body throw `TypeError` in native `fetch`. Must ensure `fetchOptions.body = undefined` for GET/HEAD.
  7. 5 files use `CancelToken`: `Select2Analista`, `Select2Candidato`, `Select2Cliente`, `Select2VagaAnalista`, `DebouncedSearchSelect`. Must migrate to `AbortController` and `isAbortError`.
  8. 50+ components import `{ cn, empty, nl2br, numberBetween }` from `@/assets/utils`. Creating `src/lib/utils.js` and `src/assets/utils.js` is essential for build integrity.
- **Unexplored areas**: None for M1 HTTP client scope.

## Key Decisions Made
- Blueprint designed with zero external dependencies, 100% native fetch, complete Axios backwards compatibility, and strict defensive programming.

## Artifact Index
- handoff.md — Comprehensive investigation report and code blueprint
- progress.md — Liveness heartbeat
- DISPATCH.md — Log of incoming dispatches
