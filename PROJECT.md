# Project: next16-template Production Upgrade

## Architecture

The project is built on **Next.js 16.4.6** (App Router, Turbopack, React 19.3.0, Tailwind CSS 4.3.3).
The upgrade replaces legacy dependencies and incomplete implementations with high-performance, modular, accessible native components:

1. **Native HTTP Layer (`src/lib/http/`)**:
   - Centralized native `fetch` client (`HttpClient`) supporting GET, POST, PUT, PATCH, DELETE, URLSearchParams, FormData, custom headers, AbortController, authentication hooks, and structured `HttpError` (exposing `error.data` and `error.response.data`).
   - Zero references to `axios`, removal of `src/plugins/axios.js`.

2. **Lightweight SVG Chart Components (`src/components/ui/charts/`)**:
   - 7 reusable, responsive, accessible charts implemented in pure SVG + React without external chart libraries:
     - `AnswersChart.jsx`: Stacked or vertical comparison bar chart with SVG tooltips.
     - `MapChart.jsx`: Interactive Brazil map with state paths, region highlighting, click handlers, and modal pins.
     - `MultiAxisLineChart.jsx`: Dual-axis time series with SVG bezier curves and legend.
     - `PieChart.jsx`: Donut / pie chart with SVG arc segments, legend, and hover tooltips.
     - `UserHoursBarChart.jsx`: Burn-up chart with bars, cumulative line, and 170h ideal target line.
     - `XyVerticalChart.jsx`: Column chart with SLA color coding and metric labels.
     - `YearlySeriesChart.jsx`: Multi-year trend line chart with variance badges and drill-down.
   - Deletion of orphaned `src/components/ui/charts/exemploXY.js`.

3. **Reusable & Accessible Drawer System (`src/components/ui/drawer/`)**:
   - Compound components: `Drawer`, `DrawerHeader`, `DrawerContent`, `DrawerFooter`, `DrawerToggle`.
   - Specialized variants: `LeftDrawer` (navigation, desktop compact icon mode, mobile temporary overlay) and `RightDrawer` (contextual panel, desktop collapsible, mobile temporary overlay).
   - Dual-mode state: Controlled (`open`, `onOpenChange`) and Uncontrolled (`defaultOpen`).
   - LocalStorage persistence with two-phase hydration (`useHydratedDrawerState` / post-mount synchronization) to guarantee zero SSR hydration mismatch.
   - Accessibility (WAI-ARIA): `role="dialog"` or `role="navigation"`, `aria-label`, `aria-expanded`, `aria-controls`, ESC key dismissal, focus trap within temporary drawers, body scroll lock, return focus to trigger on close.
   - Permanent toggle accessibility: `DrawerToggle` buttons accessible in both open and closed states, on both sides, across mobile and desktop viewports.

4. **Fluid Dashboard Layout (`src/components/layout/` & `src/app/`)**:
   - `DashboardLayout` integrating `LeftDrawer`, sticky `DashboardHeader`, fluid `main` content area, and `RightDrawer`.
   - Fluid resizing using flex layout with `min-w-0` and `overflow-x-hidden` ensuring zero horizontal scrollbars or clipping when drawers open/close.
   - `src/app/page.js`: Complete dashboard showcasing metrics, SVG charts, and contextual actions.

5. **Interactive Documentation (`src/app/components/page.js`)**:
   - Showcase page allowing live interaction with all drawer states (Left open/closed, Right open/closed, both open, both closed, temporary overlay modal, permanent layout, custom dynamic content).
   - Property definitions, event contracts, code examples, and responsive behavior documentation.

6. **Test Automation Infrastructure (`tests/` & `playwright.config.ts`)**:
   - Playwright test runner configured against local Next.js server (`webServer` on port 3000).
   - 10 mandatory automated test scenarios covering drawer interactions, responsiveness, accessibility, and zero-legacy repository verification.

---

## Feature Inventory

| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F1 | Remoção de dependências legadas | Remover completamente `axios`, `@amcharts/amcharts5`, `@amcharts/amcharts5-geodata` de manifests e código fonte | M1 | ORIGINAL_REQUEST §R1 |
| F2 | Cliente HTTP Nativo (`src/lib/http/`) | Cliente centralizado baseado em `fetch` com GET, POST, PUT, PATCH, DELETE, headers, AbortController e tratamento de erros compatível | M1 | ORIGINAL_REQUEST §R1 |
| F3 | Migração de chamadas HTTP | Migrar todos os 25 componentes com chamadas axios para `@/lib/http` e substituir `CancelToken` por `AbortController` | M1 | ORIGINAL_REQUEST §R1 |
| F4 | Gráficos leves em SVG + React | Substituir os 7 componentes de gráficos em `src/components/ui/charts/` por implementações leves em SVG nativo e remover arquivos órfãos | M1 | ORIGINAL_REQUEST §R1 |
| F5 | Componentes base de Drawer | Implementar `Drawer`, `DrawerHeader`, `DrawerContent`, `DrawerFooter`, `DrawerToggle` reutilizáveis compartilhando estrutura base | M2 | ORIGINAL_REQUEST §R2 |
| F6 | Variantes `LeftDrawer` e `RightDrawer` | Implementar `LeftDrawer` (navegação) e `RightDrawer` (contexto) reutilizáveis e integrados à estrutura base | M2 | ORIGINAL_REQUEST §R2, §R3 |
| F7 | Controle de estado dual (controlado / não controlado) | Suportar controle via `open`/`onOpenChange` e via `defaultOpen` de forma independente por drawer | M2 | ORIGINAL_REQUEST §R2 |
| F8 | Persistência em localStorage sem hydration mismatch | Persistir estado opcionalmente em localStorage usando sincronização pós-hidratação para evitar erros de hidratação | M2 | ORIGINAL_REQUEST §R2 |
| F9 | Acessibilidade e navegação por teclado | `aria-label`, `aria-expanded`, navegação por teclado (Enter/Space), ESC para fechar, focus trap em modo temporário e retorno de foco | M2 | ORIGINAL_REQUEST §R2, §R3 |
| F10 | Botão de Toggle permanentemente acessível | `DrawerToggle` acessível tanto com drawer aberto quanto fechado, para ambos os lados, inclusive em mobile | M2 | ORIGINAL_REQUEST §R2 |
| F11 | Comportamento Mobile (Overlay e Scroll Lock) | No mobile, ambos drawers funcionam como overlay temporário com backdrop, bloqueio de scroll do body e fechamento por toque fora ou ESC | M3 | ORIGINAL_REQUEST §R3 |
| F12 | Modo compacto LeftDrawer & painel RightDrawer | No desktop, LeftDrawer suporta modo compacto (ícones) e RightDrawer recolhe; ambos podem ficar abertos simultaneamente | M3 | ORIGINAL_REQUEST §R3 |
| F13 | Integração ao Dashboard e layout fluido | Integrar LeftDrawer, Header central, área principal com gráficos e RightDrawer com redimensionamento fluido sem sobreposição ou scroll horizontal | M3 | ORIGINAL_REQUEST §R3 |
| F14 | Documentação interativa em `/components` | Criar página `/components` com demos interativas de todos os estados, tabelas de props, eventos e exemplos de código | M3 | ORIGINAL_REQUEST §R4 |
| F15 | Infraestrutura Playwright | Configurar `@playwright/test` e `playwright.config.ts` com suporte a `webServer` e execução de testes | M4 | ORIGINAL_REQUEST §R5 |
| F16 | 10 Cenários de Testes Automatizados | Implementar e validar os 10 cenários de testes obrigatórios cobrindo drawers, layout, mobile, teclado e limpeza de repositório | M4 | ORIGINAL_REQUEST §R5 |
| F17 | Build de produção sem erros | Executar `npm run build` com sucesso garantindo integridade de tipos, rotas e compilação estática | M4 | ORIGINAL_REQUEST Acceptance Criteria |

---

## Milestones

| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Remoção de dependências, HTTP Nativo e Gráficos SVG | F1, F2, F3, F4 (limpeza axios/amcharts, cliente HTTP, migração de 25 arquivos, 7 gráficos SVG nativos, utils) | none | DONE |
| M2 | Componentes Reutilizáveis de Drawer e Acessibilidade | F5, F6, F7, F8, F9, F10 (Drawer, Header, Content, Footer, Toggle, LeftDrawer, RightDrawer, estado, persistência segura, WAI-ARIA) | none | DONE |
| M3 | Integração ao Dashboard e Documentação `/components` | F11, F12, F13, F14 (DashboardLayout, mobile overlay, desktop compact/collapsible, página /components interativa) | M1, M2 | IN_PROGRESS |
| M4 | Testes Automatizados Playwright e Build de Produção | F15, F16, F17 (configuração Playwright, 10 cenários obrigatórios, validação E2E, npm run build limpo) | M3 | PLANNED (Test Infra & Suites Ready) |

---

## Interface Contracts

### HTTP Client (`src/lib/http/index.js`)
```javascript
export class HttpError extends Error {
  constructor(message, status, data, response) { ... }
  // this.status = status;
  // this.data = data;
  // this.response = { status, data, raw: response }; // backwards-compatible with axios callers
}

export const http = {
  get(url, options = {}) => Promise<any>,
  post(url, body, options = {}) => Promise<any>,
  put(url, body, options = {}) => Promise<any>,
  patch(url, body, options = {}) => Promise<any>,
  delete(url, options = {}) => Promise<any>,
};

export function isAbortError(error) => boolean;
```

### Drawer Component System (`src/components/ui/drawer/`)
```typescript
interface DrawerProps {
  side?: 'left' | 'right';
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  variant?: 'persistent' | 'temporary' | 'compact';
  storageKey?: string; // localStorage persistence key
  className?: string;
  children: React.ReactNode;
}

interface DrawerToggleProps {
  side: 'left' | 'right';
  open?: boolean;
  onToggle?: () => void;
  className?: string;
  'aria-label'?: string;
}
```

### Data Contract for Testing Selectors
- Left Drawer root: `[data-testid="left-drawer"]`, `data-state="open"|"closed"|"collapsed"`
- Right Drawer root: `[data-testid="right-drawer"]`, `data-state="open"|"closed"`
- Left Toggle: `[data-testid="left-drawer-toggle"]`, `aria-expanded="true"|"false"`, `aria-controls="left-drawer"`
- Right Toggle: `[data-testid="right-drawer-toggle"]`, `aria-expanded="true"|"false"`, `aria-controls="right-drawer"`
- Backdrop Overlay: `[data-testid="drawer-backdrop"]`
- Main Content Area: `[data-testid="dashboard-main"]`

---

## Code Layout

```
c:\www\next16-template\
├── package.json
├── playwright.config.ts                     # Playwright configuration (M4)
├── tests/                                   # Automated Playwright tests (M4)
│   ├── e2e/
│   │   └── drawers.spec.ts                  # Scenarios 1-9
│   └── verification/
│       └── clean-repo.spec.ts               # Scenario 10
├── src/
│   ├── app/
│   │   ├── layout.js                        # Root layout
│   │   ├── page.js                          # Dashboard page with LeftDrawer, SVG charts, RightDrawer (M3)
│   │   └── components/
│   │       └── page.js                      # Interactive Drawer documentation & demos (M3)
│   ├── components/
│   │   ├── layout/
│   │   │   ├── DashboardLayout.jsx          # Fluid 3-column layout (M3)
│   │   │   └── DashboardHeader.jsx          # Top header with permanent toggles (M3)
│   │   ├── ui/
│   │   │   ├── charts/                      # Pure SVG + React charts (M1)
│   │   │   │   ├── AnswersChart.jsx
│   │   │   │   ├── MapChart.jsx
│   │   │   │   ├── MultiAxisLineChart.jsx
│   │   │   │   ├── PieChart.jsx
│   │   │   │   ├── UserHoursBarChart.jsx
│   │   │   │   ├── XyVerticalChart.jsx
│   │   │   │   └── YearlySeriesChart.jsx
│   │   │   └── drawer/                      # Reusable accessible drawer system (M2)
│   │   │       ├── Drawer.jsx
│   │   │       ├── DrawerHeader.jsx
│   │   │       ├── DrawerContent.jsx
│   │   │       ├── DrawerFooter.jsx
│   │   │       ├── DrawerToggle.jsx
│   │   │       ├── LeftDrawer.jsx
│   │   │       ├── RightDrawer.jsx
│   │   │       └── useDrawer.js
│   └── lib/
│       ├── http/
│       │   └── index.js                     # Centralized native fetch client (M1)
│       └── utils.js                         # Shared utility functions (cn, etc.)
```
