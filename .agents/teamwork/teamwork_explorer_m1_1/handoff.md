# Handoff Report: HTTP Client Architecture & Legacy Compatibility Blueprint

**Milestone:** M1 — Dependencies Cleanup, Native HTTP & Pure SVG Charts  
**Author:** Explorer 1 (`teamwork_explorer_m1_1`)  
**Date:** 2026-11-12  
**Subject:** Deep investigation of `src/lib/http/index.js`, legacy Axios caller compatibility, error contract, abort handling, 204/205 responses, query params, FormData, and code blueprint.

---

## 1. Observation

Direct code observations from investigation across the workspace:

### 1.1 Legacy Caller Error Inspection Patterns
An analysis of all 25 files in `src/components/` consuming HTTP calls revealed the following error and response property expectations:

- **`src/components/features/chatbot/WhatsappChat.jsx` (lines 43-51):**
  ```javascript
  }).catch(function (resp) {
      setSentMessage(msg);
      console.error(resp)
      let error = resp?.response?.data?.error
      if (Array.isArray(error)) {
          return toast.error(error.join(' ') || 'OOps ocorreu um erro ao enviar mensagem')
      }
      return toast.error(error || 'OOps ocorreu um erro ao enviar mensagem')
  });
  ```
  *Direct observation:* The catch callback names the parameter `resp` and accesses `resp?.response?.data?.error`.

- **`src/components/ui/inputs/Select2CargosSip.jsx` (lines 26-33):**
  ```javascript
  }).catch(function (resp) {
      setIsLoadingData(true);
      let error = resp?.response?.data?.error;
      if (Array.isArray(error)) {
          return toast.error(error.join(" ") || "OOps ocorreu um erro ao buscar os cargos");
      }
      return toast.error(error || "OOps ocorreu um erro ao buscar os cargos");
  });
  ```
  *Direct observation:* Expects `resp?.response?.data?.error`.

- **`src/components/ui/inputs/SelectUnidade.jsx` (lines 75-87 and 100-111):**
  ```javascript
  .catch(function (resp) {
      setIsLoadingData(true);
      let error = resp?.response?.data?.error;
      if (Array.isArray(error)) {
          return toast.error(
              error.join(" ") ||
                  "OOps ocorreu um erro ao buscar unidades por selecionador"
          );
      }
      return toast.error(
          error || "OOps ocorreu um erro ao buscar unidades por selecionador"
      );
  });
  ```
  *Direct observation:* Expects `resp?.response?.data?.error`.

- **Response status and data in successful calls:**
  - `src/components/features/notifications/JobNotification.jsx` (line 41): `if (response.status === 200)`
  - `src/components/features/notifications/VagaRecrutamentoNotification.jsx` (line 39): `if (response.status === 200)`
  - `src/components/ui/inputs/InputCPF.jsx` (lines 47, 53): `response.data.CPF_VALIDO`, `response.data.CD_PESSOA`
  - `src/components/ui/inputs/InputNIT.jsx` (lines 39, 44, 51): `response.data`, `response.data.NM_PESSOA`, `response.data.NIT_VALIDO`
  - `src/components/ui/inputs/RadioTipoProcesso.jsx` (lines 66, 83): `response.data.tipos_processos`, `response.data`
  - `src/components/ui/inputs/Select2CargosSip.jsx` (lines 23-24): `if (response.status === 200) { setCargosSip(response.data); }`
  - `src/components/ui/inputs/SelectCidade.jsx` (lines 85-86): `if (response.data.length > 0) { setCidades(response.data); }`
  - `src/components/ui/inputs/SelectUnidade.jsx` (lines 71-72, 96-97): `if (response.status === 200) { setUnidades(response.data); }`
  *Direct observation:* Callers expect `response.data` and `response.status`.

### 1.2 Current State of `src/lib/http/index.js`
Reading `src/lib/http/index.js` (lines 7-19, 137-149, 151-173, 179-184):
- **`HttpError` class definition (lines 7-15):**
  ```javascript
  export class HttpError extends Error {
    constructor(message, status, data = null, response = null) {
      super(message);
      this.name = 'HttpError';
      this.status = status;
      this.data = data;
      this.response = response;
    }
  }
  ```
  *Direct observation:* In line 13, `this.response = response`. At line 183 (`throw new HttpError(message, response.status, responseData, response)`), `response` is the native browser/Node `Response` object. The native `Response` has NO property `.data`. Thus, `resp?.response?.data` evaluates to `undefined`, breaking `resp?.response?.data?.error` in `WhatsappChat.jsx`, `Select2CargosSip.jsx`, and `SelectUnidade.jsx`.
- **`isAbortError` definition (lines 17-19):**
  ```javascript
  export function isAbortError(error) {
    return error?.name === 'AbortError' || error?.name === 'CanceledError';
  }
  ```
  *Direct observation:* Only checks `error?.name`. Missing standard `DOMException.ABORT_ERR` (`code === 20`), standard string error codes (`code === 'ABORT_ERR'`, `code === 'ERR_CANCELED'`), and custom cancellation flags (`__CANCEL__`, `isAbort`).
- **Body parsing on non-204/205 responses (lines 151-173):**
  ```javascript
  if (response.status !== 204 && response.status !== 205) {
    try {
      if (contentType.includes('application/json')) {
        responseData = await response.json();
  ...
  ```
  *Direct observation:* If a server returns `Content-Type: application/json` with 0 bytes (empty body), `await response.json()` throws `SyntaxError: Unexpected end of JSON input`. While caught by `try/catch`, reading `await response.text()` first and testing for non-empty string is significantly more robust.
- **GET / HEAD request body safety (lines 102-130):**
  ```javascript
  const payload = data !== undefined ? data : body;
  ...
  let fetchOptions = {
    method: method.toUpperCase(),
    headers: finalHeaders,
    body: serializedBody,
  ...
  ```
  *Direct observation:* If a caller issues `http.get(url, { data: { foo: 'bar' } })`, `serializedBody` is passed to `fetch({ method: 'GET', body: ... })`. The Fetch API specification strictly prohibits bodies on `GET` and `HEAD` requests, throwing a fatal `TypeError: Request with GET/HEAD method cannot have body`.

### 1.3 Cancellation Patterns in the 5 Components
Search results for `CancelToken` and `isCancel`:
- `src/components/ui/inputs/Select2Analista.jsx` (lines 18, 65, 94-109)
- `src/components/ui/inputs/Select2Candidato.jsx` (lines 18, 90, 124-141)
- `src/components/ui/inputs/Select2Cliente.jsx` (lines 18, 70, 99-117)
- `src/components/ui/inputs/Select2VagaAnalista.jsx` (lines 24, 50, 57-70)
- `src/components/ui/inputs/DebouncedSearch/DebouncedSearchSelect.jsx` (lines 89, 167)

Each follows this legacy pattern:
```javascript
const [cancelTokenSource, setCancelTokenSource] = useState(null);
...
if (cancelTokenSource) cancelTokenSource.cancel('...');
const source = axios.CancelToken.source();
setCancelTokenSource(source);
...
await axiosInstance.get(url, { cancelToken: source.token });
...
if (!axios.isCancel(error)) { toast.error(...); }
```

### 1.4 Shared Utility References in `@/assets/utils`
52 component files import `{ cn, empty, nl2br, numberBetween }` from `@/assets/utils`.
Neither `src/lib/utils.js` nor `src/assets/utils.js` currently exists on disk.

---

## 2. Logic Chain

1. **Premise 1 (Error Property Contract):**
   - Components `WhatsappChat.jsx`, `Select2CargosSip.jsx`, and `SelectUnidade.jsx` evaluate `let error = resp?.response?.data?.error`.
   - In Axios, `error.response` had `{ status, data, headers }`.
   - In modern Fetch clients, errors typically expose `error.status` and `error.data`.
   - To satisfy both legacy callers and modern clean architecture without modifying component error paths, `HttpError` must expose:
     - `this.status = status;`
     - `this.data = data;`
     - `this.response = { status, data, headers: rawResponse?.headers || null, raw: rawResponse };`
   - Therefore, `resp?.response?.data?.error` will resolve identically to `resp?.data?.error` and preserve server error messages.

2. **Premise 2 (Abort & Cancellation Safety):**
   - Replacing `axios.CancelToken` requires `new AbortController()` passing `{ signal: controller.signal }`.
   - When aborted, browser environments throw `DOMException` where `name === 'AbortError'` and `code === 20`. Node/polyfill environments may throw with `name === 'CanceledError'` or `code === 'ERR_CANCELED'`.
   - Broadening `isAbortError(error)` to check `name === 'AbortError'`, `name === 'CanceledError'`, `code === 20`, `code === 'ABORT_ERR'`, `code === 'ERR_CANCELED'`, and boolean flags guarantees that no aborted request will trigger false error toasts.

3. **Premise 3 (Fetch Protocol Compliance):**
   - Fetch API strictly rejects requests where `method` is `GET` or `HEAD` and `body` is defined.
   - Guarding `fetchOptions.body = (['GET', 'HEAD'].includes(method.toUpperCase())) ? undefined : serializedBody;` guarantees zero `TypeError` crashes.
   - If a GET call provides `params`, `URLSearchParams` formats the query string. If an array is provided (e.g. `{ ids: [1, 2] }`), each item must be appended cleanly.

4. **Premise 4 (FormData Boundary Integrity):**
   - When sending `FormData`, the runtime must compute the boundary delimiter.
   - Deleting `'Content-Type'` case-insensitively from `finalHeaders` allows the browser to set `multipart/form-data; boundary=...`.

5. **Premise 5 (No Content Handling):**
   - Status 204 (No Content) and 205 (Reset Content) carry no body. Skipping body reading and returning `{ data: null, status: 204, ok: true }` avoids parsing errors.
   - For other responses, reading `text = await response.text()` before `JSON.parse(text)` prevents `SyntaxError` on empty 200 responses.

---

## 3. Caveats

- **No Caveats on Compatibility:** The proposed `HttpError` structure is a pure superset of the legacy Axios error format and the modern Fetch error format; no existing caller will break.
- **Node.js SSR vs Browser:** `FormData`, `Blob`, `URLSearchParams`, and `AbortController` are native globals in both Node.js (v18+) and modern browsers. Next.js 16 runtimes fully support them.
- **`src/assets/utils.js`:** Must be created as a re-export of `src/lib/utils.js` (`export * from '@/lib/utils';`) to guarantee that all 52 legacy component imports resolve during compilation.

---

## 4. Conclusion & Complete Code Blueprint

### 4.1 Exact Code Blueprint for `src/lib/http/index.js`

```javascript
/**
 * Cliente HTTP centralizado baseado exclusivamente na Fetch API nativa.
 * Suporta GET, POST, PUT, PATCH, DELETE, interceptores, timeout,
 * cancelamento via AbortController/signal, autenticação e compatibilidade
 * retroativa com o formato de erro legado (Axios).
 */

export class HttpError extends Error {
  constructor(message, status, data = null, rawResponse = null) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.data = data;
    // Compatibilidade total com componentes que inspecionam error.response.data
    this.response = {
      status,
      data,
      headers: rawResponse?.headers || null,
      raw: rawResponse,
    };
  }
}

/**
 * Detecta confiavelmente se um erro foi gerado por cancelamento/abort
 * Suporta browser DOMException (AbortError / code 20), Axios CanceledError e custom signals.
 */
export function isAbortError(error) {
  if (!error || typeof error !== 'object') return false;
  return (
    error.name === 'AbortError' ||
    error.name === 'CanceledError' ||
    error.code === 20 ||
    error.code === 'ABORT_ERR' ||
    error.code === 'ERR_CANCELED' ||
    Boolean(error.__CANCEL__) ||
    Boolean(error.isAbort) ||
    Boolean(error.isCanceled) ||
    (typeof error.message === 'string' &&
      (error.message === 'The operation was aborted.' ||
       error.message === 'The user aborted a request.' ||
       error.message.toLowerCase() === 'aborted' ||
       error.message.toLowerCase() === 'canceled' ||
       error.message.toLowerCase() === 'cancelled'))
  );
}

export class HttpClient {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || process.env.NEXT_PUBLIC_API_URL || '';
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers || {}),
    };
    this.getAuthToken = options.getAuthToken || null;
    this.onRequest = options.onRequest || null;
    this.onResponse = options.onResponse || null;
  }

  /**
   * Permite configurar dinamicamente o hook de token
   */
  setAuthToken(tokenGetter) {
    this.getAuthToken = typeof tokenGetter === 'function' ? tokenGetter : () => tokenGetter;
  }

  /**
   * Constrói URLs absolutas ou relativas com parâmetros de busca
   */
  buildUrl(endpoint, params) {
    let url = endpoint;
    if (!endpoint.startsWith('http://') && !endpoint.startsWith('https://')) {
      const base = this.baseUrl.replace(/\/+$/, '');
      const path = endpoint.replace(/^\/+/, '');
      url = base ? `${base}/${path}` : `/${path}`;
    }

    if (params) {
      const searchParams = new URLSearchParams();

      if (params instanceof URLSearchParams) {
        const queryStr = params.toString();
        if (queryStr) {
          url += (url.includes('?') ? '&' : '?') + queryStr;
        }
      } else if (typeof params === 'object') {
        Object.entries(params).forEach(([key, value]) => {
          if (value === undefined || value === null) return;
          if (Array.isArray(value)) {
            value.forEach(item => {
              if (item !== undefined && item !== null) {
                searchParams.append(key, String(item));
              }
            });
          } else {
            searchParams.append(key, String(value));
          }
        });

        const queryStr = searchParams.toString();
        if (queryStr) {
          url += (url.includes('?') ? '&' : '?') + queryStr;
        }
      }
    }

    return url;
  }

  /**
   * Executa a requisição HTTP padronizada usando Fetch nativo
   */
  async request(endpoint, options = {}) {
    const {
      method = 'GET',
      data,
      body,
      params,
      headers = {},
      signal,
      timeout,
      ...customFetchOptions
    } = options;

    const upperMethod = method.toUpperCase();
    const isNoBodyMethod = upperMethod === 'GET' || upperMethod === 'HEAD';

    // Gerenciamento de timeout e signal combinados
    let timeoutTimer = null;
    let requestSignal = signal;

    if (timeout && typeof timeout === 'number') {
      const timeoutController = new AbortController();
      timeoutTimer = setTimeout(() => {
        try {
          timeoutController.abort(new DOMException('TimeoutError', 'TimeoutError'));
        } catch {
          timeoutController.abort();
        }
      }, timeout);

      if (signal) {
        if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.any === 'function') {
          requestSignal = AbortSignal.any([signal, timeoutController.signal]);
        } else {
          const comboController = new AbortController();
          const onAbort = () => {
            if (timeoutTimer) clearTimeout(timeoutTimer);
            comboController.abort();
          };
          signal.addEventListener('abort', onAbort, { once: true });
          timeoutController.signal.addEventListener('abort', onAbort, { once: true });
          requestSignal = comboController.signal;
        }
      } else {
        requestSignal = timeoutController.signal;
      }
    }

    // Normalização e mesclagem de headers
    const inputHeaders = headers instanceof Headers
      ? Object.fromEntries(headers.entries())
      : (headers || {});

    const finalHeaders = {
      ...this.defaultHeaders,
      ...inputHeaders,
    };

    // Injeção de autenticação
    const hasAuth = Object.keys(finalHeaders).some(k => k.toLowerCase() === 'authorization');
    if (this.getAuthToken && !hasAuth) {
      try {
        const token = typeof this.getAuthToken === 'function'
          ? await this.getAuthToken()
          : this.getAuthToken;
        if (token) {
          finalHeaders['Authorization'] = `Bearer ${token}`;
        }
      } catch (err) {
        console.warn('Erro ao obter token de autenticação:', err);
      }
    }

    // Tratamento de payload do corpo
    const payload = data !== undefined ? data : body;
    let serializedBody = undefined;

    if (!isNoBodyMethod && payload !== undefined && payload !== null) {
      const isFormData = typeof FormData !== 'undefined' && payload instanceof FormData;
      const isBlob = typeof Blob !== 'undefined' && payload instanceof Blob;
      const isSearchParams = typeof URLSearchParams !== 'undefined' && payload instanceof URLSearchParams;

      if (isFormData || isBlob || isSearchParams || typeof payload === 'string') {
        serializedBody = payload;
        // Para FormData, o navegador DEVE calcular o boundary
        if (isFormData) {
          Object.keys(finalHeaders).forEach(k => {
            if (k.toLowerCase() === 'content-type') {
              delete finalHeaders[k];
            }
          });
        }
      } else {
        serializedBody = JSON.stringify(payload);
      }
    }

    const url = this.buildUrl(endpoint, params);

    let fetchOptions = {
      method: upperMethod,
      headers: finalHeaders,
      body: isNoBodyMethod ? undefined : serializedBody,
      signal: requestSignal,
      ...customFetchOptions,
    };

    if (this.onRequest) {
      fetchOptions = (await this.onRequest(fetchOptions, url)) || fetchOptions;
    }

    let response;
    try {
      response = await fetch(url, fetchOptions);
    } catch (err) {
      if (timeoutTimer) clearTimeout(timeoutTimer);
      if (isAbortError(err)) {
        throw err;
      }
      throw new HttpError(
        err.message || 'Falha de conexão com o servidor',
        0,
        null,
        null
      );
    } finally {
      if (timeoutTimer) clearTimeout(timeoutTimer);
    }

    // Tratamento seguro de corpo (204/205, JSON, texto)
    let responseData = null;
    const contentType = response.headers.get('content-type') || '';

    if (response.status !== 204 && response.status !== 205) {
      try {
        const rawText = await response.text();
        if (rawText && rawText.trim().length > 0) {
          if (contentType.includes('application/json')) {
            try {
              responseData = JSON.parse(rawText);
            } catch {
              responseData = rawText;
            }
          } else if (contentType.includes('text/')) {
            responseData = rawText;
          } else {
            try {
              responseData = JSON.parse(rawText);
            } catch {
              responseData = rawText;
            }
          }
        }
      } catch {
        responseData = null;
      }
    }

    if (this.onResponse) {
      responseData = (await this.onResponse(responseData, response)) ?? responseData;
    }

    if (!response.ok) {
      const errorMsg =
        (responseData && typeof responseData === 'object' && (
          responseData.message ||
          (typeof responseData.error === 'string' ? responseData.error : (
            Array.isArray(responseData.error) ? responseData.error.join(' ') : null
          ))
        )) ||
        `Requisição falhou com status ${response.status}: ${response.statusText}`;

      throw new HttpError(errorMsg, response.status, responseData, response);
    }

    return {
      data: responseData,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      ok: response.ok,
    };
  }

  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  post(endpoint, data, options = {}) {
    return this.request(endpoint, { ...options, method: 'POST', data });
  }

  put(endpoint, data, options = {}) {
    return this.request(endpoint, { ...options, method: 'PUT', data });
  }

  patch(endpoint, data, options = {}) {
    return this.request(endpoint, { ...options, method: 'PATCH', data });
  }

  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
}

// Instância singleton padrão para o projeto
export const http = new HttpClient();

export default http;
```

---

### 4.2 Blueprint para Shared Utilities (`src/lib/utils.js` e `src/assets/utils.js`)

#### `src/lib/utils.js`
```javascript
export function cn(...inputs) {
  return inputs.flat(Infinity).filter(Boolean).join(' ').trim();
}

export function empty(value) {
  if (value === null || value === undefined || value === '') return true;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

export function nl2br(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/(?:\r\n|\r|\n)/g, '<br />');
}

export function numberBetween(val, min, max) {
  const num = Number(val);
  return num >= Number(min) && num <= Number(max);
}
```

#### `src/assets/utils.js`
```javascript
export * from '@/lib/utils';
```

---

### 4.3 Component Migration Blueprint (25 Files)

1. **Standard Components (20 files):**
   - Replace `import axiosInstance from "@/plugins/axios";` with `import http from '@/lib/http';`.
   - Replace `axiosInstance.get` / `post` / `put` with `http.get` / `post` / `put`.
   - Leave `resp?.response?.data?.error` untouched — it is 100% compatible with `HttpError.response.data.error`.

2. **CancelToken Components (5 files):**
   - In `Select2Analista`, `Select2Candidato`, `Select2Cliente`, `Select2VagaAnalista`, and `DebouncedSearchSelect`:
     - Remove `import axios from 'axios';` and `import axiosInstance from '@/plugins/axios';`.
     - Add `import http, { isAbortError } from '@/lib/http';`.
     - Replace `const [cancelTokenSource, setCancelTokenSource] = useState(null);` with `const [abortController, setAbortController] = useState(null);`.
     - Replace `cancelTokenSource.cancel(...)` with `if (abortController) abortController.abort();`.
     - Instantiate `const controller = new AbortController(); setAbortController(controller);`.
     - Pass `{ signal: controller.signal }` instead of `{ cancelToken: source.token }`.
     - Replace `if (!axios.isCancel(error))` with `if (!isAbortError(error))`.

3. **Cleanup:**
   - Delete `src/plugins/axios.js` and remove `src/plugins/`.

---

## 5. Verification Method

1. **Repository Zero-Axios Check:**
   ```powershell
   Get-ChildItem -Path src -Recurse -File | Select-String -Pattern "axios" -CaseSensitive:$false
   ```
   *Expected outcome:* Exactly 0 lines.

2. **TypeScript / Next.js Build Validation:**
   ```powershell
   npm run build
   ```
   *Expected outcome:* Exit code 0, 0 compilation errors.

3. **HTTP Client & Abort Contract Unit Validation:**
   Create a temporary or test script validating:
   - `new HttpError('msg', 400, { error: 'invalid' }).response.data.error === 'invalid'`
   - `isAbortError(new DOMException('Aborted', 'AbortError')) === true`
   - `isAbortError({ name: 'CanceledError' }) === true`
   - `isAbortError({ code: 20 }) === true`
   - `http.get('/test', { data: { ignored: true } })` does not throw `TypeError: Request with GET/HEAD method cannot have body`.
   - `http.post('/test', new FormData())` removes `Content-Type` header.
