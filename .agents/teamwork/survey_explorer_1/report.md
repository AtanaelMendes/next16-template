# Relatório de Auditoria: Dependências Legadas (Axios & amCharts), Cliente HTTP Nativo e Gráficos SVG + React

**Data da Auditoria:** 2026-11-12  
**Autor:** Survey Explorer 1  
**Escopo:** `package.json`, `package-lock.json`, toda a árvore `src/`, rotas, componentes de gráficos e consumo de APIs HTTP  
**Objetivo:** Mapeamento completo e plano de ação para eliminação total de `axios`, `@amcharts/amcharts5` e `@amcharts/amcharts5-geodata`, substituição por cliente `fetch` nativo padronizado em `src/lib/http/` e componentes de gráficos leves em SVG + React.

---

## 1. Sumário Executivo & Diagnóstico Atual

A análise da árvore do repositório revelou um **estado de migração parcial crítico**:

1. **Dependências em `package.json`**:
   - No commit `171ed74638b588b65fd9789f1a62e66be698731f` ("FEAT: removido libs nao necessarias"), as entradas de `@amcharts/amcharts5` (^5.21.5), `@amcharts/amcharts5-geodata` (^5.1.6) e `axios` (^1.21.1) foram removidas de `package.json` e `package-lock.json`.
   - Porém, **o código-fonte NÃO foi adaptado**: existem **26 arquivos** com referências ativas a `axios` e **8 arquivos** com referências ativas a `amcharts`/`am5`.
   - Foi criado um adapter provisório não versionado em `src/plugins/axios.js` apontando para um cliente incipiente em `src/lib/http/index.js`, violando o Critério de Aceite R5.10 ("Não existem referências remanescentes a Axios ou amCharts").
   - Como os módulos foram desinstalados do `node_modules`, qualquer importação direta dos gráficos em `src/components/ui/charts/` ou de formulários em `src/components/ui/inputs/` resulta em falha de resolução de módulo em tempo de compilação ou execução.
2. **Impacto e Risco Imediato**:
   - `npm run build` passa atualmente apenas porque `src/app/page.js` não referencia nenhum dos componentes de gráficos ou componentes de inputs que contêm essas importações quebradas.
   - Assim que o Dashboard integrar os gráficos ou os Drawers referenciarem esses componentes, a build falhará imediatamente.
3. **Ação Requerida**:
   - Expurgar totalmente o arquivo `src/plugins/axios.js`.
   - Refatorar os 25 componentes que consomem `@/plugins/axios` e 5 que usam `axios` diretamente (`CancelToken`, `isCancel`) para usar `src/lib/http/index.js` (`http`, `AbortController`, `isAbortError`).
   - Reescrever os 7 componentes de gráficos em `src/components/ui/charts/` utilizando SVG puro e React, sem dependências externas.
   - Deletar o arquivo de exemplo residual `src/components/ui/charts/exemploXY.js`.
   - Remover diretórios vazios remanescentes em `node_modules/@amcharts` e `src/plugins/`.

---

## 2. Auditoria de Dependências (`package.json` e `package-lock.json`)

### 2.1 Histórico de Remoção no Git
- **Commit analisado:** `171ed74` - *FEAT: removido libs nao necessarias*
  - `package.json`: linhas removidas:
    ```diff
    -    "@amcharts/amcharts5": "^5.21.5",
    -    "@amcharts/amcharts5-geodata": "^5.1.6",
    -    "axios": "^1.21.1",
    ```
  - `package-lock.json`: 1670 linhas removidas correspondentes a amcharts e axios.

### 2.2 Estado Atual
- `package.json`: Nenhuma dependência `axios` ou `@amcharts` presente.
- `package-lock.json`: Nenhuma ocorrência no lockfile.
- `npm ls axios @amcharts/amcharts5 @amcharts/amcharts5-geodata`: Retorna vazio (`-- (empty)`).
- `node_modules/`:
  - `node_modules/axios` não existe.
  - `node_modules/@amcharts` existe como diretório residual vazio (órfão de instalação anterior). Recomenda-se remoção segura da pasta ou execução de `npm prune`.

---

## 3. Inventário Completo de Ocorrências e Referências no Código

### 3.1 Arquivos com Referências a `axios` (Total: 26 arquivos)

| # | Arquivo | Linhas | Tipo de Uso | O que faz no sistema |
|---|---|---|---|---|
| 1 | `src/plugins/axios.js` | 1-18 | Adapter legado que exporta `axiosInstance` e tipos | Ponte não comitada para `src/lib/http`. **Deve ser excluído**. |
| 2 | `src/components/features/chatbot/WhatsappChat.jsx` | 6, 37 | `import axiosInstance from "@/plugins/axios"` | POST em `chatbot/send-message` |
| 3 | `src/components/features/notifications/JobNotification.jsx` | 10, 38 | `import axiosInstance from "@/plugins/axios"` | POST em `analista/confirma-visualizar-vaga` |
| 4 | `src/components/features/notifications/VagaRecrutamentoNotification.jsx` | 11, 36 | `import axiosInstance from "@/plugins/axios"` | POST em `recrutamento/confirma-visualizar-alerta-vaga` |
| 5 | `src/components/ui/inputs/InputCPF.jsx` | 7, 42 | `import axiosInstance from "@/plugins/axios"` | GET em `documento/valida-cpf/${nrCPF}/${cdPessoa}` |
| 6 | `src/components/ui/inputs/InputNIT.jsx` | 7, 34 | `import axiosInstance from "@/plugins/axios"` | GET em `documento/valida-nit/${nrNIT}/${cdPessoa}` |
| 7 | `src/components/ui/inputs/InputPIS.jsx` | 7, 34 | `import axiosInstance from "@/plugins/axios"` | GET em `documento/valida-pis/${nrPIS}/${cdPessoa}` |
| 8 | `src/components/ui/inputs/RadioTipoProcesso.jsx` | 9, 63 | `import axiosInstance from "@/plugins/axios"` | GET em `processo-seletivo/processos-seletivos-tipos` |
| 9 | `src/components/ui/inputs/Select2Analista.jsx` | 9, 10, 98, 102, 109 | `import axios from 'axios'` & `import axiosInstance from '@/plugins/axios'` | GET com `CancelToken.source()` em `analista/analistas/${user.cd_sip}/${filter}` |
| 10 | `src/components/ui/inputs/Select2Candidato.jsx` | 9, 10, 129, 134, 141 | `import axios from "axios"` & `import axiosInstance from "@/plugins/axios"` | GET com `CancelToken.source()` em `/candidato/candidatos/${filter}` |
| 11 | `src/components/ui/inputs/Select2CargosSip.jsx` | 9, 20 | `import axiosInstance from "@/plugins/axios"` | GET em `cargo/sip-cargos` |
| 12 | `src/components/ui/inputs/Select2Cliente.jsx` | 9, 10, 103, 110, 117 | `import axios from "axios"` & `import axiosInstance from "@/plugins/axios"` | GET com `CancelToken.source()` em `cliente/clientes/${filter}/${maxChars}` |
| 13 | `src/components/ui/inputs/Select2Vaga.jsx` | 9, 65, 76 | `import axiosInstance from "@/plugins/axios"` | GET em `vaga/vagas-selecao-relacionar` e `vaga/vagas-atendimento/${user.cd_sip}/${filter}` |
| 14 | `src/components/ui/inputs/Select2VagaAnalista.jsx` | 9, 11, 61, 65, 70 | `import axios from 'axios'` & `import axiosInstance from "@/plugins/axios"` | GET com `CancelToken.source()` em `recrutamento/vagas-relacionar/${user.user_sip}/${filter}` |
| 15 | `src/components/ui/inputs/SelectAnalistaFilter.jsx` | 8, 85 | `import axiosInstance from "@/plugins/axios"` | GET em `analista/analistas-filtro/${user.cd_sip}` |
| 16 | `src/components/ui/inputs/SelectCidade.jsx` | 8, 82 | `import axiosInstance from "@/plugins/axios"` | GET em `cidades/todas-cidades` |
| 17 | `src/components/ui/inputs/SelectCidadeFilter.jsx` | 9, 47 | `import axiosInstance from "@/plugins/axios"` | GET em `cidades/filtro-cidade/${user.user_sip}` |
| 18 | `src/components/ui/inputs/SelectCompetencias.jsx` | 8, 79 | `import axiosInstance from "@/plugins/axios"` | GET em `conhecimento/competencias` |
| 19 | `src/components/ui/inputs/SelectEstado.jsx` | 8, 95 | `import axiosInstance from "@/plugins/axios"` | GET em `estados/estados` |
| 20 | `src/components/ui/inputs/SelectIdiomas.jsx` | 8, 88 | `import axiosInstance from "@/plugins/axios"` | GET em `conhecimento/idiomas` |
| 21 | `src/components/ui/inputs/SelectOrgaoEmissor.jsx` | 8, 72 | `import axiosInstance from "@/plugins/axios"` | GET em `documento/orgao-emissor` |
| 22 | `src/components/ui/inputs/SelectPais.jsx` | 9, 84 | `import axiosInstance from "@/plugins/axios"` | GET em `paises/paises` |
| 23 | `src/components/ui/inputs/SelectSoftwares.jsx` | 8, 80 | `import axiosInstance from "@/plugins/axios"` | GET em `conhecimento/softwares` |
| 24 | `src/components/ui/inputs/SelectTestes.jsx` | 8, 84 | `import axiosInstance from "@/plugins/axios"` | GET em `teste/testes` |
| 25 | `src/components/ui/inputs/SelectUnidade.jsx` | 9, 67, 92 | `import axiosInstance from "@/plugins/axios"` | GET em `unidade/unidades` e `unidade/unidades-usuario/${user.cd_sip}` |
| 26 | `src/components/ui/inputs/DebouncedSearch/DebouncedSearchSelect.jsx` | 5, 9, 64, 89, 167 | `import axios from 'axios'` & `import axiosInstance from '@/plugins/axios'` | GET com cancelamento em `${urlGet}/${searchValue}` |

---

### 3.2 Arquivos com Referências a `@amcharts` (Total: 8 arquivos)

| # | Arquivo | Linhas | Imports amCharts | O que o gráfico faz |
|---|---|---|---|---|
| 1 | `src/components/ui/charts/AnswersChart.jsx` | 4-7 | `@amcharts/amcharts5`, `.../xy`, `locales/pt_BR`, `themes/Animated` | Gráfico de barras de respostas com marcadores pin e meta circular |
| 2 | `src/components/ui/charts/MapChart.jsx` | 4-8, 97 | `@amcharts/amcharts5`, `.../map`, `themes/Animated`, `@amcharts/amcharts5-geodata/worldLow`, `.../brazilLow` | Mapa interativo do Brasil com filiais (SC, SP, PR), marcadores com coordenadas e modais de detalhes |
| 3 | `src/components/ui/charts/MultiAxisLineChart.jsx` | 4-7 | `@amcharts/amcharts5`, `.../xy`, `locales/pt_BR`, `themes/Animated` | Gráfico de linha multissérie com eixos Y duplos/compartilhados e séries temporais |
| 4 | `src/components/ui/charts/PieChart.jsx` | 4-6 | `@amcharts/amcharts5`, `.../percent`, `themes/Animated` | Gráfico de pizza / rosca percentual com legendas e rótulos de valores |
| 5 | `src/components/ui/charts/UserHoursBarChart.jsx` | 4-8 | `@amcharts/amcharts5`, `.../xy`, `themes/Animated`, `locales/pt_BR` | Gráfico de Burn-up de horas com linha ideal (0-170h) e horas acumuladas por usuário |
| 6 | `src/components/ui/charts/XyVerticalChart.jsx` | 4-6 | `@amcharts/amcharts5`, `.../xy`, `themes/Animated` | Gráfico de colunas verticais em 3 cores (amarelo, salmão, vermelho) indicando SLA e contagem de vagas |
| 7 | `src/components/ui/charts/YearlySeriesChart.jsx` | 4-7 | `@amcharts/amcharts5`, `.../xy`, `locales/pt_BR`, `themes/Animated` | Gráfico de colunas com variação percentual interanual e drill-down interativo de ano para meses |
| 8 | `src/components/ui/charts/exemploXY.js` | 2-71 | Usa variáveis globais `am5`, `am5xy`, `am5themes_Animated` | Script legado de exemplo desconectado de qualquer componente. **Deve ser excluído**. |

---

## 4. Análise do Cliente HTTP Nativo (`src/lib/http/index.js`)

O arquivo existente em `src/lib/http/index.js` já implementa grande parte da funcionalidade necessária com a API nativa `fetch`. Abaixo detalhamos a avaliação técnica da classe, compatibilidade e ajustes recomendados.

### 4.1 Recursos já implementados em `src/lib/http/index.js`
- **Métodos nativos:** `get(url, options)`, `post(url, data, options)`, `put(url, data, options)`, `patch(url, data, options)`, `delete(url, options)`, `request(endpoint, options)`.
- **Tratamento de Headers:** Mescla headers padrão (`Content-Type: application/json`, `Accept: application/json`) com headers customizados passados na chamada. Se o corpo for `FormData`, o cabeçalho `Content-Type` é removido para que o browser gere o boundary multipart correto.
- **Suporte a Query Params:** Método auxiliar `buildUrl(endpoint, params)` usando `URLSearchParams`.
- **Cancelamento de requisição:** Suporte a `signal` (via `AbortController`) e timeout em milissegundos.
- **Detecção de cancelamento:** Função auxiliar exportada `isAbortError(error)`.
- **Autenticação futura:** Suporte a `getAuthToken()` injetando `Authorization: Bearer <token>`.
- **Interceptores flexíveis:** Suporte a hooks `onRequest` e `onResponse`.
- **Respostas diversas:** Suporte a JSON, texto simples e status sem conteúdo (`204 No Content` / `205 Reset Content`).
- **Retorno padronizado:** Objeto `{ data, status, statusText, headers, ok }` compatível com a expectativa dos componentes legados (que utilizavam `response.data` e `response.status`).

### 4.2 Lacunas e Melhorias Recomendadas no `HttpClient`

Para garantir 100% de compatibilidade com os padrões de código identificados nas 25 chamadas do projeto:

1. **Retrocompatibilidade de Erro (`HttpError`):**
   Vários componentes acessavam `resp?.response?.data?.error` (padrão Axios):
   ```javascript
   // Exemplo em WhatsappChat.jsx:
   let error = resp?.response?.data?.error;
   ```
   Atualmente, `HttpError` instancia `this.data = data` e `this.response = response` (sendo `response` o objeto nativo `Response`).
   **Recomendação:** No `HttpError`, estruturar `this.response` para conter também a propriedade `data`:
   ```javascript
   export class HttpError extends Error {
     constructor(message, status, data = null, rawResponse = null) {
       super(message);
       this.name = 'HttpError';
       this.status = status;
       this.data = data;
       this.response = {
         status,
         data,
         raw: rawResponse,
       };
     }
   }
   ```

2. **Cancelamento Padronizado (Substituição de CancelToken):**
   Nos 5 componentes que utilizavam `axios.CancelToken.source()`:
   ```javascript
   // Padrão antigo:
   const source = axios.CancelToken.source();
   setCancelTokenSource(source);
   const response = await axiosInstance.get(url, { cancelToken: source.token });
   if (!axios.isCancel(error)) { ... }
   ```
   **Novo padrão com fetch nativo:**
   ```javascript
   if (abortController) {
     abortController.abort();
   }
   const controller = new AbortController();
   setAbortController(controller);
   try {
     const response = await http.get(url, { signal: controller.signal });
     // ...
   } catch (error) {
     if (!isAbortError(error)) {
       toast.error('Erro na requisição');
     }
   }
   ```

3. **Remoção de `src/plugins/axios.js`:**
   Todos os imports devem migrar diretamente para:
   ```javascript
   import http, { isAbortError, HttpError } from '@/lib/http';
   ```
   Após migrar os 25 componentes, o diretório `src/plugins/` deve ser deletado.

---

## 5. Auditoria Detalhada dos Componentes de Gráficos (amCharts)

Abaixo está o mapeamento detalhado da visualização, estrutura de dados e comportamento de cada um dos 7 gráficos que utilizam `@amcharts/amcharts5`.

---

### 5.1 `AnswersChart.jsx`
- **Arquivo:** `src/components/ui/charts/AnswersChart.jsx` (159 linhas)
- **Props recebidas:** `chartId`, `chartData = []`, `height = "150px"`
- **Estrutura dos dados:**
  ```javascript
  [
    {
      category: "Perguntas Respondidas",
      value: 280,
      columnSettings: { fill: "#36A2EB" },
      currentBullet: true, // Adiciona ícone de marcador (pin) e balão de texto acima da coluna
      targetBullet: false
    },
    {
      category: "Meta Prevista",
      value: 350,
      columnSettings: { fill: "#11326d" },
      currentBullet: false,
      targetBullet: true   // Adiciona círculo azul com label 'Meta' a 50% de altura
    }
  ]
  ```
- **Comportamento visual amCharts:**
  - Gráfico de colunas com `min: 0`, `max: 400`. Eixo Y com grid e labels ocultos. Eixo X com categorias.
  - Bullets customizados:
    - `currentBullet`: Marcador SVG de geolocalização / alfinete e caixa arredondada contendo o valor da coluna.
    - `targetBullet`: Círculo com raio 28px preenchido com `#11326d` e texto "[bold]Meta[/]" branco centralizado na barra.

---

### 5.2 `MapChart.jsx`
- **Arquivo:** `src/components/ui/charts/MapChart.jsx` (574 linhas)
- **Props recebidas:** Nenhuma prop obrigatória (possui dados embutidos de filiais `rhbUnidades`).
- **Dependências amCharts:** `@amcharts/amcharts5/map`, `@amcharts/amcharts5-geodata/brazilLow`, `am5geodata_worldLow`.
- **Estrutura dos dados:**
  - Array de objetos com unidades RHBrasil em SC (Joinville, Matriz, Trade, Dream Job, Dayone), PR (Curitiba), SP (São Paulo).
  - Coordenadas geográficas (`GR_LATITUDE`, `GR_LONGITUDE`), códigos de UF, emails, CEP.
- **Comportamento visual amCharts:**
  - Mapa mercator do Brasil renderizado a partir do GeoJSON `brazilLow`.
  - Estados clicáveis: ao clicar em SC, SP ou PR, abre modal `EstadoFiliais` listando as filiais e estatísticas daquele estado.
  - Marcadores de filiais com cores por UF (SC: `#ff6b6b`, SP: `#4ecdc4`, PR: `#45b7d1`).
  - Distribuição circular de pins para cidades com múltiplas filiais (como Joinville com 5 unidades) para evitar sobreposição de pins.
  - Ao clicar em um pin de filial, abre modal `UnidadeDetails` com contatos, CEP formatado, botão para Google Maps e envio de email.
  - Legenda interativa na base com totalizadores por estado.

---

### 5.3 `MultiAxisLineChart.jsx`
- **Arquivo:** `src/components/ui/charts/MultiAxisLineChart.jsx` (156 linhas)
- **Props recebidas:** `chartId = "chartdiv"`, `height = "300px"`, `seriesConfigs = []`, `useSharedYAxis = false`
- **Estrutura dos dados:**
  ```javascript
  seriesConfigs = [
    {
      name: "Candidatos Inscritos",
      opposite: false,
      data: [{ date: "2026-01-01", value: 120 }, { date: "2026-01-02", value: 180 }]
    },
    {
      name: "Vagas Preenchidas",
      opposite: true,
      data: [{ date: "2026-01-01", value: 15 }, { date: "2026-01-02", value: 25 }]
    }
  ]
  ```
- **Comportamento visual amCharts:**
  - Eixo X com `DateAxis` formatando dias.
  - Eixo Y configurável: único/compartilhado ou múltiplos eixos independentes (um à esquerda, outro oposto à direita).
  - Linhas com espessura 1px, cores distintas.
  - Cursor interativo com tooltip mostrando valor e legenda no rodapé.

---

### 5.4 `PieChart.jsx`
- **Arquivo:** `src/components/ui/charts/PieChart.jsx` (70 linhas)
- **Props recebidas:** `chartData`, `nmChart`, `width`, `height`
- **Consumo identificado:** Usado em `src/components/features/chatbot/graficos/UsoChatBotAnalistas.jsx`.
- **Estrutura dos dados:**
  ```javascript
  chartData = [
    { label: "Joinville", value: 45 },
    { label: "São Paulo", value: 30 },
    { label: "Curitiba", value: 25 }
  ]
  ```
- **Comportamento visual amCharts:**
  - Gráfico de pizza com raio de 80%, rótulos com tamanho de fonte 11px, ticks (linhas guia conectando rótulos às fatias).
  - Legenda em grade centralizada no rodapé com valores formatados e cores correspondentes.

---

### 5.5 `UserHoursBarChart.jsx` (BurnUpChart)
- **Arquivo:** `src/components/ui/charts/UserHoursBarChart.jsx` (217 linhas)
- **Props recebidas:** `chartData`, `selectedUsers`
- **Estrutura dos dados:**
  ```javascript
  chartData = [
    { name: "Dev 1", date: "2026-01-05", totalHours: 8 },
    { name: "Dev 2", date: "2026-01-05", totalHours: 6 }
  ]
  ```
- **Comportamento visual amCharts:**
  - Calcula a amplitude de datas entre a primeira e a última data nos dados.
  - Gera automaticamente uma linha ideal pontilhada preta (`strokeDasharray: [5, 5]`) progredindo linearmente de 0 a 170 horas.
  - Para cada usuário em `selectedUsers` (ou todos os usuários), acumula cumulativamente as horas ao longo dos dias (`cumulativeHours += entry.value`).
  - Plota linhas contínuas coloridas com marcadores circulares em cada ponto e tooltips mostrando `{user}: {valueY} horas`.

---

### 5.6 `XyVerticalChart.jsx`
- **Arquivo:** `src/components/ui/charts/XyVerticalChart.jsx` (95 linhas)
- **Props recebidas:** `chartData`, `nmChart`, `width`, `height`
- **Estrutura dos dados:**
  ```javascript
  chartData = [
    { name: "No Prazo", label: "No Prazo", value: 14 },
    { name: "Atenção", label: "Atenção", value: 8 },
    { name: "Atrasado", label: "Atrasado", value: 3 }
  ]
  ```
- **Comportamento visual amCharts:**
  - Gráfico de colunas com 3 faixas de cores fixas: `["#FFD248", "#fc6868", "#fc0505"]` (alerta/SLA).
  - Marcador (bullet) com texto centralizado dentro de cada coluna informando `"{valueY} vaga(s)"`.
  - Tooltip informativo no topo de cada coluna.

---

### 5.7 `YearlySeriesChart.jsx`
- **Arquivo:** `src/components/ui/charts/YearlySeriesChart.jsx` (173 linhas)
- **Props recebidas:** `yearlyData`, `monthlyData`, `nmChart`
- **Estrutura dos dados:**
  ```javascript
  yearlyData = [
    { year: "2024", value: 1200 },
    { year: "2025", value: 1540 },
    { year: "2026", value: 1380 }
  ];
  monthlyData = {
    "2025": [
      { month: "Jan", value: 110 },
      { month: "Fev", value: 135 },
      // ...
    ]
  };
  ```
- **Comportamento visual amCharts:**
  - Gráfico de colunas com cálculo de variação percentual automática entre colunas adjacentes:
    `diff = valueNext - value; percent = round((diff / value) * 100)`.
  - Exibe badges verticais entre as colunas com a variação em verde (`+X (+Y%)`) ou em vermelho (`-X (-Y%)`).
  - **Drill-down interativo:** Ao clicar em uma coluna de determinado ano, o gráfico alterna automaticamente a visualização para os dados mensais daquele ano (`monthlyData[selectedYear]`).
  - Botão de controle no gráfico intitulado "Visão anual" para restaurar a visão macro dos anos.

---

## 6. Proposta de Arquitetura dos Gráficos em SVG Puro + React

Para cumprir estritamente o requisito R1 (*"utilizar componentes leves reutilizáveis e responsivos com SVG e React, sem instalar bibliotecas pesadas"*), propõe-se a seguinte biblioteca interna de componentes em `src/components/ui/charts/`:

### 6.1 Princípios de Design dos Gráficos SVG
1. **Zero dependências externas:** Sem D3, sem Chart.js, sem Recharts, sem amCharts. Utilizar apenas React 19 (`useState`, `useMemo`, `useCallback`) e marcação SVG padrão.
2. **Responsividade total com `viewBox`:** Todos os gráficos devem utilizar `svg viewBox="0 0 width height" className="w-full h-full"` garantindo redimensionamento fluido sem distorção.
3. **Acessibilidade nativa:** Uso de atributos `role="img"`, `aria-label`, `<title>` e `<desc>` dentro do SVG para leitores de tela.
4. **Interatividade rica e leve:**
   - Tooltips em CSS puro / Tailwind ou estado React leve.
   - Eventos de mouse (`onMouseEnter`, `onMouseLeave`, `onClick`) diretamente nos elementos SVG (`<rect>`, `<circle>`, `<path>`).
   - Transições de cores e destaque suave com classes Tailwind (`transition-all duration-200`).

---

### 6.2 Especificação dos Componentes Substitutos

#### 1. `AnswersChart.jsx` (Substituto SVG Puro)
- **Técnica:** `<svg viewBox="0 0 500 200">`.
- **Cálculo de colunas:**
  - Largura da coluna = `(larguraÚtil / totalItens) * 0.5`.
  - Altura = `(item.value / 400) * alturaÚtil`.
- **Marcadores customizados:**
  - Para `currentBullet`: Renderiza `<path d="M..."/>` do alfinete no topo da barra + `<g>` com retângulo arredondado `<rect rx="8"/>` e texto do valor.
  - Para `targetBullet`: Renderiza `<circle r="22" fill="#11326d"/>` centralizado a 50% da altura da barra com `<text fill="#fff">Meta</text>`.
- **Compatibilidade:** Mantém exatamente as mesmas props (`chartId`, `chartData`, `height`).

#### 2. `MapChart.jsx` (Substituto SVG Puro)
- **Técnica:**
  - Como a dependência pesada `@amcharts/amcharts5-geodata` (mais de 15MB) foi removida, o mapa do Brasil pode ser renderizado através de um SVG vetorial leve e otimizado com os 27 estados federativos (caminhos `<path id="BR-SC" d="..." />`, `<path id="BR-SP" d="..." />`, `<path id="BR-PR" d="..." />`, etc.).
  - Os estados SC, SP e PR recebem destaque de cor e suporte a clique que dispara o modal existente `EstadoFiliais`.
  - Os marcadores das filiais são renderizados como `<g>` contendo `<circle>` SVG com coordenadas escalonadas para a grade do mapa brasileiro, aplicando o mesmo cálculo de dispersão circular para Joinville.
  - Os modais `EstadoFiliais` e `UnidadeDetails` já são 100% React e Tailwind e continuarão funcionando exatamente como antes, com suporte a fechamento por clique ou ESC.
- **Vantagem dramática:** Redução de mais de 98% no bundle do mapa, carregamento instantâneo sem licenças ou dependências externas.

#### 3. `MultiAxisLineChart.jsx` (Substituto SVG Puro)
- **Técnica:** `<svg viewBox="0 0 800 350">`.
- **Cálculo de séries:**
  - Conversão de datas e valores numéricos em coordenadas X/Y normalizadas.
  - Geração de caminhos de linha usando SVG `<polyline points="..." />` ou `<path d="..." />`.
  - Eixos Y duplos: escala à esquerda para a primeira série, escala à direita para a série configurada com `opposite: true`.
  - Gridlines horizontais com `<line stroke="#e5e7eb" strokeDasharray="3 3"/>`.
  - Legenda interativa na base permitindo alternar a visibilidade de cada série.
  - Tooltip flutuante sincronizado com a posição do mouse no hover.

#### 4. `PieChart.jsx` (Substituto SVG Puro)
- **Técnica:** `<svg viewBox="0 0 400 320">`.
- **Cálculo de fatias de pizza:**
  - Para cada fatia, calcula o ângulo inicial e final em radianos baseado na proporção `value / total`.
  - Constrói o caminho de arco SVG com `M cx cy L x1 y1 A r r 0 largeArcFlag 1 x2 y2 Z`.
  - Paleta de cores moderna e contrastante via array de cores Tailwind/Hex.
  - Grade de legenda abaixo da pizza exibindo marcador colorido, rótulo e valor numérico.
  - Suporte a efeito hover destacando a fatia selecionada (`transform scale(1.05)`).

#### 5. `UserHoursBarChart.jsx` (Substituto SVG Puro)
- **Técnica:** `<svg viewBox="0 0 800 400">`.
- **Cálculo de Burn-up:**
  - Ordenação cronológica de todas as datas disponíveis.
  - Traçado da **Linha Ideal (0 a 170 horas)** usando `<line>` ou `<polyline stroke="#111827" strokeDasharray="6 6" strokeWidth="2"/>`.
  - Traçado cumulativo das horas trabalhadas por usuário com `<polyline>` de cores distintas.
  - Marcadores circulares interativos (`<circle r="4" fill="..." />`) em cada ponto do histórico com tooltip informando nome, data e horas acumuladas.
  - Mantém o nome exportado `BurnUpChart` e export default para compatibilidade total.

#### 6. `XyVerticalChart.jsx` (Substituto SVG Puro)
- **Técnica:** `<svg viewBox="0 0 500 300">`.
- **Cálculo de colunas de SLA:**
  - 3 colunas estilizadas nas cores `#FFD248` (amarelo), `#fc6868` (coral) e `#fc0505` (vermelho).
  - Texto centralizado dentro de cada coluna com `<text textAnchor="middle">X vaga(s)</text>`.
  - Rótulos no eixo X na base de cada barra e linhas de grade discretas no eixo Y.

#### 7. `YearlySeriesChart.jsx` (Substituto SVG Puro)
- **Técnica:** Componente React com estado `currentView` ('yearly' ou ano selecionado).
- **Cálculo de variação:**
  - Função matemática calculando delta absoluto e percentual entre itens adjacentes.
  - Renderização de badges SVG com seta de variação e porcentagem (`+X (+Y%)` verde ou `-X (-Y%)` vermelho).
- **Interatividade:**
  - Ao clicar na coluna de um ano, atualiza o estado para exibir as colunas mensais daquele ano (`monthlyData[selectedYear]`).
  - Botão interativo estilizado "Visão anual" permitindo ao usuário retornar ao nível macro a qualquer momento.

---

## 7. Plano de Migração do Cliente HTTP

### 7.1 Refatoração de `src/lib/http/index.js`
1. Ajustar `HttpError` para popular `this.response = { status, data, raw: response }`.
2. Assegurar que `isAbortError` capture tanto `AbortError` do browser quanto eventuais instâncias de erros cancelados.
3. Não criar abstrações excessivas: manter o singleton `http` exportado com métodos `get`, `post`, `put`, `patch`, `delete`.

### 7.2 Migração de Componentes Consumidores
Todos os 25 componentes devem ter seus imports atualizados:
```diff
- import axiosInstance from "@/plugins/axios";
- import axios from "axios";
+ import http, { isAbortError, HttpError } from "@/lib/http";
```

Nos componentes com cancelamento (`Select2Analista`, `Select2Candidato`, `Select2Cliente`, `Select2VagaAnalista`, `DebouncedSearchSelect`):
```diff
- const source = axios.CancelToken.source();
- setCancelTokenSource(source);
- const response = await axiosInstance.get(url, { cancelToken: source.token });
+ if (abortController) abortController.abort();
+ const controller = new AbortController();
+ setAbortController(controller);
+ const response = await http.get(url, { signal: controller.signal });
```
```diff
- if (!axios.isCancel(error)) {
+ if (!isAbortError(error)) {
```

### 7.3 Exclusão de Arquivos Legados
- Excluir `src/plugins/axios.js`.
- Excluir o diretório `src/plugins/`.
- Excluir `src/components/ui/charts/exemploXY.js`.

---

## 8. Verificação de Integridade & Critério R5.10

Para validação automatizada do cenário 10 de testes Playwright (*"Não existem referências remanescentes a Axios ou amCharts"*):

```powershell
# Comando de verificação em PowerShell (deve retornar 0 linhas):
Get-ChildItem -Path src -Recurse -File | Select-String -Pattern "axios|amcharts" -CaseSensitive:$false
```

Quando a migração for concluída:
1. Nenhuma ocorrência de `axios` existirá em `src/`, `package.json`, `package-lock.json` ou imports.
2. Nenhuma ocorrência de `amcharts` ou `@amcharts` existirá em `src/`, `package.json`, `package-lock.json` ou imports.
3. A build de produção (`npm run build`) executará com sucesso e sem warnings de resolução de módulos.
4. Todos os gráficos do dashboard demonstrativo e documentações interativas em `/components` funcionarão com SVG puro e React sem pacotes externos.
