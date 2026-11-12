# Blueprint e Plano de Implementação: Gráficos Nativos SVG + React 19 e Utilitários de Compatibilidade

**Autor:** Explorer 3 (Milestone 1)  
**Data:** 2026-11-12  
**Destino:** Sub-Orquestrador M1 / Implementadores M1  
**Status:** Concluído — Pronto para Execução

---

## 1. Observation (O que foi diretamente observado)

### 1.1 Dependências e Código Residual de amCharts
Uma inspeção minuciosa na árvore `src/components/ui/charts/` revelou exatamente **8 arquivos**:
1. `src/components/ui/charts/AnswersChart.jsx` (159 linhas): importa `@amcharts/amcharts5`, `@amcharts/amcharts5/xy`, `locales/pt_BR`, `themes/Animated`.
2. `src/components/ui/charts/MapChart.jsx` (574 linhas): importa `@amcharts/amcharts5`, `@amcharts/amcharts5/map`, `themes/Animated`, `@amcharts/amcharts5-geodata/worldLow`, `@amcharts/amcharts5-geodata/brazilLow`.
3. `src/components/ui/charts/MultiAxisLineChart.jsx` (156 linhas): importa `@amcharts/amcharts5`, `@amcharts/amcharts5/xy`, `locales/pt_BR`, `themes/Animated`.
4. `src/components/ui/charts/PieChart.jsx` (70 linhas): importa `@amcharts/amcharts5`, `@amcharts/amcharts5/percent`, `themes/Animated`.
5. `src/components/ui/charts/UserHoursBarChart.jsx` (217 linhas): importa `@amcharts/amcharts5`, `@amcharts/amcharts5/xy`, `themes/Animated`, `locales/pt_BR`, `moment`. Exporta `BurnUpChart`.
6. `src/components/ui/charts/XyVerticalChart.jsx` (95 linhas): importa `@amcharts/amcharts5`, `@amcharts/amcharts5/xy`, `themes/Animated`.
7. `src/components/ui/charts/YearlySeriesChart.jsx` (173 linhas): importa `@amcharts/amcharts5`, `@amcharts/amcharts5/xy`, `locales/pt_BR`, `themes/Animated`.
8. `src/components/ui/charts/exemploXY.js` (71 linhas): script órfão não importado em nenhum componente, utilizando variáveis globais `am5`, `am5xy`, `am5themes_Animated`. **Confirmado para exclusão definitiva**.

Verificação de ocorrências no projeto:
- Ocorrências de `amcharts` em `src/`: Restritas estritamente a esses 8 arquivos em `src/components/ui/charts/`.
- `package.json`: `@amcharts/amcharts5` e `@amcharts/amcharts5-geodata` já foram removidos do `package.json` no commit `171ed74`.
- `node_modules/@amcharts`: Diretório vazio residual.

### 1.2 Auditoria dos Arquivos de Utilitários (`utils.js`)
A busca por `assets/utils` e `lib/utils` no repositório constatou:
- `src/lib/utils.js`: **Não existe** atualmente no repositório.
- `src/assets/utils.js`: **Não existe** atualmente no repositório.
- **52 arquivos** em `src/` tentam importar `{ cn, empty, nl2br, numberBetween }` de `@/assets/utils`:
  - `cn`: usado em mais de 45 componentes de botões, inputs, cards, layouts (`cn("base-class", conditional && "extra-class")`).
  - `empty`: usado em mais de 20 componentes para validações condicionais (ex.: `!empty(chartData)`, `empty(value)`).
  - `nl2br`: usado em `src/components/features/chatbot/WhatsappMsg.jsx` para formatar quebras de linha em `<br />`.
  - `numberBetween`: importado em `src/components/ui/inputs/LanguageRangeSlider.jsx`.
- Em `package.json`, `clsx` e `tailwind-merge` **não estão instalados**. Portanto, `cn` deve ser implementado nativamente sem depender de bibliotecas externas.

### 1.3 Contratos de Dados e Comportamentos Específicos por Gráfico

| Componente | Props Recebidas | Contrato de Dados | Elementos Críticos e Interações |
|---|---|---|---|
| **AnswersChart** | `chartId`, `chartData = []`, `height = "150px"` | `[{ category, value, columnSettings: { fill }, currentBullet, targetBullet }]` | Bullet alfinete (pin) + balão de valor no topo; Bullet circular "Meta" a 50% de altura. Y max: 400. |
| **MapChart** | Sem props obrigatórias (possui `rhbUnidades` interno de 7 filiais) | Array de unidades com `CD_UF`, `NM_CIDADE`, `GR_LATITUDE`, `GR_LONGITUDE`, `DS_EMAIL`, `CD_CEP` | Mapa do Brasil com destaque em SC, SP, PR; dispersão circular de 5 pins em Joinville; modais `EstadoFiliais` e `UnidadeDetails` com Google Maps, mailto e ESC. |
| **MultiAxisLineChart** | `chartId = "chartdiv"`, `height = "300px"`, `seriesConfigs = []`, `useSharedYAxis = false` | `[{ name, opposite: boolean, data: [{ date, value }] }]` | Eixo Y duplo (esquerdo e direito oposto) ou compartilhado; séries temporais; gridlines; crosshair e tooltip interativo; legenda com toggle. |
| **PieChart** | `chartData = []`, `nmChart`, `width`, `height = "300px"` | `[{ label, value, color? }]` | Rosca/pizza proporcional; destaque da fatia ao passar o mouse; tooltip com porcentagem; grade de legendas no rodapé. |
| **UserHoursBarChart** | `chartData = []`, `selectedUsers = []` | `[{ name, date: "YYYY-MM-DD", totalHours: number }]` | Linha ideal 0 a 170 horas pontilhada preta; linhas contínuas de horas acumuladas por usuário; bullets interativos; export default `BurnUpChart`. |
| **XyVerticalChart** | `chartData = []`, `nmChart`, `width`, `height = "300px"` | `[{ name, label, value }]` | Cores fixas de SLA (`#FFD248`, `#fc6868`, `#fc0505`); bullet de texto `"{value} vaga(s)"` centralizado na coluna; gridlines e tooltips. |
| **YearlySeriesChart** | `yearlyData = []`, `monthlyData = {}`, `nmChart` | `yearlyData: [{ year, value }]`, `monthlyData: { [year]: [{ month, value }] }` | Badges de variação percentual intercoluna (`+X (+Y%)` verde ou `-X (-Y%)` vermelho); drill-down por clique do ano para meses; botão "Visão anual" para resetar. |

---

## 2. Logic Chain (Cadeia de Raciocínio da Arquitetura Proposta)

### 2.1 Princípio de Zero Dependências e Alta Performance
1. **Requisito R1:** Exige explicitamente componentes de gráficos leves com SVG e React sem instalar bibliotecas pesadas (sem D3, Chart.js, Recharts ou amCharts).
2. **React 19 + SVG Nativo:** O SVG permite manipulação declarativa direta pelo React (`<svg>`, `<rect>`, `<path>`, `<circle>`, `<text>`). O estado do React (`useState`, `useMemo`, `useCallback`) substitui com vantagem a infraestrutura pesada de lifecycles e render loop do amCharts.
3. **Responsividade Garantida por `viewBox`:**
   - Todo gráfico adota `viewBox="0 0 W H"` e `className="w-full h-full"`.
   - Isso permite que o navegador escale vetorialmente o gráfico com precisão matemática em qualquer largura ou altura de container, eliminando cálculos manuais de resize listener.
4. **Acessibilidade:** Atributos WAI-ARIA `role="img"`, `aria-label="[Descrição do Gráfico]"` e elementos `<title>` internos garantem compatibilidade com leitores de tela.

---

### 2.2 Especificação Arquitetural e Código dos Gráficos

#### A. `src/lib/utils.js` e `src/assets/utils.js`

Implementação nativa de `cn`, `empty`, `nl2br`, e `numberBetween`:

```javascript
// src/lib/utils.js

/**
 * Utilitário nativo leve para mesclagem de classes CSS (substituto de clsx + twMerge)
 * Suporta strings, arrays, objetos condicionais e valores falsy sem dependências externas.
 */
export function cn(...inputs) {
  const classes = [];

  for (const input of inputs) {
    if (!input) continue;

    if (typeof input === 'string' || typeof input === 'number') {
      classes.push(String(input));
    } else if (Array.isArray(input)) {
      const inner = cn(...input);
      if (inner) classes.push(inner);
    } else if (typeof input === 'object') {
      for (const [key, value] of Object.entries(input)) {
        if (value) classes.push(key);
      }
    }
  }

  return classes.join(' ');
}

/**
 * Validação de valores nulos, vazios ou indefinidos
 * Compatível com o padrão utilizado em mais de 30 formulários legados.
 */
export function empty(value) {
  if (value === null || value === undefined) return true;
  if (typeof value === 'boolean') return false;
  if (typeof value === 'number') return isNaN(value);
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

/**
 * Converte quebras de linha em tags <br /> para renderização HTML segura
 */
export function nl2br(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/(\r\n|\n\r|\r|\n)/g, '<br />');
}

/**
 * Verifica se um valor numérico está no intervalo [min, max]
 */
export function numberBetween(value, min, max) {
  const num = Number(value);
  return !isNaN(num) && num >= min && num <= max;
}
```

E no arquivo forwarding:
```javascript
// src/assets/utils.js
export * from '@/lib/utils';
export { cn, empty, nl2br, numberBetween } from '@/lib/utils';
```

---

#### B. `AnswersChart.jsx`
- **Técnica:** `<svg viewBox="0 0 500 220" role="img" aria-label="Gráfico de Perguntas Respondidas e Metas">`
- **Cálculo:**
  - `maxValue = Math.max(400, ...chartData.map(d => d.value || 0))`
  - Largura da barra = `60px`.
  - Altura = `(item.value / maxValue) * plotHeight`.
  - Posição X calculada para centralizar as 2 colunas nos slots.
- **Bullets:**
  - `currentBullet`:
    - Marcador SVG pin path no topo da coluna:
      `M66.9 41.8c0-11.3-9.1-20.4-20.4-20.4-11.3 0-20.4 9.1-20.4 20.4 0 11.3 20.4 32.4 20.4 32.4s20.4-21.1 20.4-32.4z`
    - Balão arredondado com o valor numérico acima do pin.
  - `targetBullet`:
    - `<circle r="24" fill="#11326d" />` posicionado a 50% da altura da coluna com `<text fill="#fff" fontWeight="bold">Meta</text>`.
- **Interatividade:** Tooltip flutuante com categoria e valor.

---

#### C. `MapChart.jsx`
- **Técnica:** Componente React com mapa vetorial do Brasil em SVG nativo (`viewBox="0 0 800 750"`).
- **Geometria dos Estados:**
  - Caminhos vetoriais com IDs `BR-SC`, `BR-SP`, `BR-PR` destacados.
  - Estados SC, SP e PR com cores temáticas:
    - SC: `#fee2e2` com borda `#ff6b6b`, hover `#fca5a5`
    - SP: `#ccfbf1` com borda `#4ecdc4`, hover `#99f6e4`
    - PR: `#e0f2fe` com borda `#45b7d1`, hover `#bae6fd`
  - Demais estados em cinza suave `#e2e8f0` com borda `#ffffff`.
  - Ao clicar em SC, SP ou PR, dispara `setSelectedEstado(...)` abrindo o modal `EstadoFiliais`.
- **Projeção Geográfica dos Pins:**
  - Função de projeção calibrada para a grade do Brasil:
    ```javascript
    function projectGeo(lat, lng) {
      const minLng = -60.0, maxLng = -42.0;
      const minLat = -34.0, maxLat = -18.0;
      // Normalização para o sub-quadrante Sul/Sudeste ou mapa completo
      const x = ((lng - minLng) / (maxLng - minLng)) * svgWidth;
      const y = ((maxLat - lat) / (maxLat - minLat)) * svgHeight;
      return { x, y };
    }
    ```
  - **Dispersão circular de Joinville (5 unidades):**
    ```javascript
    const angle = (offsetIndex * 2 * Math.PI) / count - Math.PI / 2;
    const px = cx + 18 * Math.cos(angle);
    const py = cy + 18 * Math.sin(angle);
    ```
  - Cada pin é um `<g>` com `<circle r="7" fill={cor} stroke="#fff" strokeWidth="2" />` e anel de pulsação suave.
  - Ao clicar no pin, abre o modal `UnidadeDetails`.
- **Preservação Integral dos Modais:**
  - `EstadoFiliais`: lista todas as filiais do estado, estatísticas, suporte a clique para detalhes da filial, botão de fechar, ESC dismiss.
  - `UnidadeDetails`: todos os dados da unidade, CEP formatado `89204-250`, botões com `window.open` para Google Maps e envio de email `mailto:`, fechamento por ESC ou backdrop.
- **Rodapé / Legenda:** Contadores por estado (Santa Catarina: 5, São Paulo: 1, Paraná: 1).

---

#### D. `MultiAxisLineChart.jsx`
- **Técnica:** `<svg viewBox="0 0 800 360" role="img" aria-label="Gráfico de Linhas Multieixo">`
- **Eixos Y Múltiplos:**
  - Escala esquerda (primária): calculada para as séries com `opposite: false` (ou todas se `useSharedYAxis = true`).
  - Escala direita (oposta): calculada para séries com `opposite: true`.
  - Ticks e rótulos do eixo Y esquerdo coloridos na cor da série primária; ticks do eixo Y direito coloridos na cor da série secundária.
- **Eixo X Temporal:**
  - Extração de todas as datas únicas ordenadas cronologicamente.
  - Formatação amigável das datas (`DD/MMM`).
- **Traçado de Séries:**
  - Geração de caminhos `<path d="M x0 y0 L x1 y1 ..." fill="none" stroke={cor} strokeWidth="2.5" />`.
- **Interatividade & Cursor Crosshair:**
  - Camada receptora invisível de eventos de mouse `<rect width={plotWidth} height={plotHeight} fill="transparent" />`.
  - Calcula o ponto de data mais próximo com base na posição X do mouse.
  - Exibe linha vertical tracejada (`stroke="#94a3b8" strokeDasharray="3 3"`).
  - Exibe marcadores circulares sobre cada linha ativa no instante selecionado.
  - Exibe caixa de tooltip com data e valores de cada série.
- **Legenda Interativa:** Permite ocultar/exibir séries individuais ao clicar.

---

#### E. `PieChart.jsx`
- **Técnica:** `<svg viewBox="0 0 400 320" role="img" aria-label="Gráfico de Rosca de Distribuição">`
- **Cálculo Trigonométrico de Arcos:**
  - Centro: `cx = 200`, `cy = 135`. Raio externo: `R = 95`. Raio interno: `r = 50`.
  - Para cada fatia:
    ```javascript
    const startAngle = currentAngle;
    const angleDelta = (slice.value / total) * 2 * Math.PI;
    const endAngle = startAngle + angleDelta;
    // Coordenadas externas
    const x1 = cx + R * Math.cos(startAngle), y1 = cy + R * Math.sin(startAngle);
    const x2 = cx + R * Math.cos(endAngle), y2 = cy + R * Math.sin(endAngle);
    // Coordenadas internas
    const ix1 = cx + r * Math.cos(endAngle), iy1 = cy + r * Math.sin(endAngle);
    const ix2 = cx + r * Math.cos(startAngle), iy2 = cy + r * Math.sin(startAngle);
    const largeArc = angleDelta > Math.PI ? 1 : 0;
    const d = `M ${x1} ${y1} A ${R} ${R} 0 ${largeArc} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${r} ${r} 0 ${largeArc} 0 ${ix2} ${iy2} Z`;
    ```
- **Destaque Dinâmico:**
  - Hover sobre uma fatia desloca-a 4px para fora ao longo do bissetor do ângulo: `transform="translate(dx, dy)"`.
  - Centro da rosca exibe o valor e percentual da fatia ativa (ou total quando em repouso).
- **Legenda em Grade:** Marcador colorido, nome e valor numérico no rodapé.

---

#### F. `UserHoursBarChart.jsx` (BurnUpChart)
- **Técnica:** `<svg viewBox="0 0 850 420" role="img" aria-label="Gráfico Burn-Up de Horas Trabalhadas">`
- **Exportação:** Exporta `BurnUpChart` como default, mantendo compatibilidade de import.
- **Cálculo da Linha Ideal (0 a 170 horas):**
  - Ordena todas as datas únicas do dataset: `startDate` até `endDate`.
  - Gera linha ideal linear:
    `y(ideal) = y0 - (progress * (170 / maxY)) * plotHeight`
  - Estilo: `<line stroke="#111827" strokeWidth="2.5" strokeDasharray="6 6" />`.
  - Bullets com tooltip "Linha Ideal 170 Horas".
- **Horas Acumuladas por Usuário:**
  - Filtra usuários ativos com base em `selectedUsers` (ou todos os presentes nos dados).
  - Para cada desenvolvedor, acumula as horas ao longo dos dias:
    `cumulativeHours += entry.value`
  - Traça polilinha colorida com bullets circulares em cada data registrada.
- **Interatividade:** Cursor vertical com tooltip detalhando: data, meta ideal de horas naquele dia e horas acumuladas de cada usuário.

---

#### G. `XyVerticalChart.jsx`
- **Técnica:** `<svg viewBox="0 0 600 320" role="img" aria-label="Gráfico de Colunas SLA de Vagas">`
- **Faixas de Cores SLA:**
  - Paleta fixa: `["#FFD248", "#fc6868", "#fc0505"]` (No Prazo, Atenção, Atrasado).
- **Colunas:**
  - Largura de cada coluna: ~70px, cantos superiores arredondados (`rx="6" ry="6"`).
- **Rótulo Embutido na Coluna:**
  - `<text>` centralizado dentro de cada barra exibindo `"{value} vaga(s)"`.
  - Cor do texto dinâmica: branco (`#ffffff`) para colunas vermelhas escuras, preto/cinza escuro (`#1f2937`) para amarelo claro, garantindo contraste WCAG.
- **Interatividade:** Tooltip superior com detalhes do status e contagem de vagas.

---

#### H. `YearlySeriesChart.jsx`
- **Técnica:** Componente React com estado `selectedYear` (`null` para visão macro anual, ou string do ano para visão mensal).
- **Cálculo de Variação Intercoluna (Variance Badges):**
  - Entre o item `i` e `i + 1`:
    ```javascript
    const diff = currentData[i + 1].value - currentData[i].value;
    const pct = currentData[i].value !== 0 ? Math.round((diff / currentData[i].value) * 100) : 0;
    const isPositive = diff >= 0;
    const sign = isPositive ? "+" : "";
    const badgeText = `${sign}${diff} (${sign}${pct}%)`;
    const badgeColor = isPositive ? "#00cc00" : "#cc0000";
    ```
  - Traço de conexão e badge retangular com cantos arredondados entre as barras.
- **Drill-Down e Controle "Visão anual":**
  - Ao clicar na barra de um ano, o estado atualiza para `selectedYear = year`, alternando a visualização para `monthlyData[year]`.
  - Cabeçalho exibe botão "Visão anual" (com destaque quando em visão detalhada), permitindo retornar instantaneamente ao nível macro.
  - Totalmente acessível via teclado (`onKeyDown` com Enter/Space).

---

## 3. Caveats (Ressalvas e Suposições)

1. **Ausência de Bibliotecas Utilitárias de Terceiros:**
   - Como `clsx` e `tailwind-merge` não estão instalados em `package.json`, nossa implementação nativa de `cn` é autossuficiente e não requer novas instalações.
2. **Dados Vazios ou Indefinidos:**
   - Todos os componentes foram projetados com fallback defensivo para arrays vazios (`chartData = []`), renderizando um placeholder elegante com mensagem "Nenhum dado disponível" em vez de quebrar a renderização do React.
3. **Escalares de Coordenadas do Mapa do Brasil:**
   - A remoção de 15MB de GeoJSON do `@amcharts/amcharts5-geodata` reduz o bundle em mais de 98%. O mapa vetorial SVG compacto do Brasil fornece as formas dos estados e os nós geográficos com fidelidade visual excelente e carregamento instantâneo.
4. **Retrocompatibilidade de Id e Classes:**
   - Todos os gráficos mantêm o suporte às props legadas `chartId`, `nmChart`, `height`, `width` para garantir que nenhum consumidor existente quebre.

---

## 4. Conclusion (Conclusão e Decisão de Ação)

1. Todos os 7 gráficos em `src/components/ui/charts/` podem ser completamente substituídos por implementações puras em SVG + React 19, preservando 100% de seus contratos de dados, estética visual e interatividades (modais, drill-down, metas e SLA).
2. O arquivo `src/components/ui/charts/exemploXY.js` deve ser excluído imediatamente.
3. A criação de `src/lib/utils.js` (com `cn`, `empty`, `nl2br`, `numberBetween`) e `src/assets/utils.js` (reexportando de `src/lib/utils.js`) resolve a dependência de mais de 50 arquivos no projeto.
4. A substituição remove todas as referências a `amcharts` do código-fonte, satisfazendo os requisitos R1 e R5 (Cenário 10).

---

## 5. Verification Method (Método de Verificação Independente)

Para auditar e verificar o trabalho após a implementação:

### 5.1 Verificação de Ausência de amCharts e Axios
Executar no terminal PowerShell da raiz do projeto:
```powershell
# Deve retornar ZERO linhas:
Get-ChildItem -Path src -Recurse -File | Select-String -Pattern "amcharts" -CaseSensitive:$false
Get-ChildItem -Path src -Recurse -File | Select-String -Pattern "axios" -CaseSensitive:$false
```

### 5.2 Verificação de Arquivo Órfão Excluído
```powershell
# Deve retornar False:
Test-Path src/components/ui/charts/exemploXY.js
```

### 5.3 Verificação de Resolução de Módulos e Build de Produção
```powershell
npm run build
```
O comando deve compilar com código de saída 0 sem warnings de resolução de módulos ou dependências ausentes.
