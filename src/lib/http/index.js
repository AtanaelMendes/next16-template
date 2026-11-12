/**
 * Cliente HTTP centralizado baseado exclusivamente na Fetch API nativa.
 * Suporta GET, POST, PUT, PATCH, DELETE, interceptores, timeout,
 * cancelamento via AbortController/signal, autenticação e compatibilidade
 * retroativa com o formato de erro de chamadas legadas.
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
 * Suporta browser DOMException (AbortError / code 20), CanceledError e custom signals.
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
