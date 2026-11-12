## 2026-11-12T15:44:01Z

Atualizar e aprimorar o projeto `next16-template` para ambiente de produção, removendo dependências legadas, implementando gavetas de navegação e contexto (Left Drawer e Right Drawer) reutilizáveis e acessíveis, integrando-as ao layout do dashboard com documentação interativa e cobertura de testes.

Working directory: c:\www\next16-template
Integrity mode: demo
The team must NOT: copy code from existing open-source projects for core logic

## Requirements

### R1. Remoção de dependências e cliente HTTP nativo
Remover completamente `axios`, `@amcharts/amcharts5` e `@amcharts/amcharts5-geodata`, verificando o projeto inteiro antes da remoção e atualizando `package.json` e `package-lock.json` via npm. Utilizar exclusivamente a API nativa `fetch` para chamadas HTTP, criando um cliente centralizado em `src/lib/http/` somente se necessário (com suporte a GET, POST, PUT, PATCH, DELETE, headers personalizados, tratamento padronizado de erros, AbortController, suporte a autenticação futura e respostas JSON, texto e sem conteúdo, sem abstração excessiva). Para os gráficos do dashboard demonstrativo, utilizar componentes leves reutilizáveis e responsivos com SVG e React, sem instalar bibliotecas pesadas.

### R2. Left Drawer e Right Drawer obrigatórios e reutilizáveis
Implementar componentes independentes e reutilizáveis `LeftDrawer` e `RightDrawer` compartilhando uma estrutura base `Drawer` (com `side="left"` ou `side="right"`), além dos componentes auxiliares `DrawerHeader`, `DrawerContent`, `DrawerFooter` e `DrawerToggle`. Cada drawer deve suportar estado `open`, estado `closed`, abertura e fechamento por botão com transições suaves, layout responsivo, controle de estado independente (tanto controlado via `open`/`onOpenChange` quanto não controlado via `defaultOpen`), suporte a conteúdo dinâmico, persistência opcional no localStorage sem causar erros de hidratação (hydration mismatch), e navegação por teclado / acessibilidade (com `aria-label` e `aria-expanded`). O botão de alternância de estado (`DrawerToggle`) deve estar permanentemente disponível e acessível para o usuário tanto com o drawer aberto quanto fechado, para ambos os lados.

### R3. Comportamento específico dos Drawers e integração ao Dashboard
O `LeftDrawer` é voltado para navegação (menu principal, ícones, identificação de item ativo, grupos recolhíveis, navegação entre páginas, scroll independente quando necessário) e no desktop pode recolher em modo compacto exibindo somente ícones. O `RightDrawer` é voltado para painel contextual (notificações, configurações, detalhes de registros, formulários rápidos) e pode ficar oculto quando fechado no desktop; no mobile, ambos operam como painéis temporários com overlay, fechamento por ESC e backdrop, gerenciamento de foco, bloqueio de scroll e retorno de foco ao disparador. O layout principal do dashboard deve integrar o Left Drawer, Header central, área principal responsiva e Right Drawer, ajustando a largura do conteúdo central conforme os drawers abrem ou fecham sem sobreposição indevida, cortes ou scroll horizontal.

### R4. Documentação interativa na página /components
Criar demonstrações interativas na página `/components` cobrindo todos os estados (Left Drawer aberto/fechado, Right Drawer aberto/fechado, ambos abertos simultaneamente, ambos fechados, temporário, permanente, conteúdo personalizado), documentando propriedades, eventos, exemplos de código e comportamento responsivo, permitindo testar diretamente na interface.

### R5. Testes obrigatórios com Playwright e restrições de infraestrutura
Configurar o Playwright e implementar testes automatizados cobrindo os 10 cenários obrigatórios:
1. Left Drawer abre e fecha.
2. Right Drawer abre e fecha.
3. Cada drawer mantém estado independente.
4. O botão de toggle permanece acessível.
5. Drawer fechado pode ser reaberto.
6. Layout se adapta aos estados.
7. Comportamento mobile funciona.
8. ESC fecha drawer temporário.
9. Navegação por teclado funciona.
10. Não existem referências remanescentes a Axios ou amCharts.
Executar todas as alterações no projeto existente sem recriar o projeto e sem realizar push ou executar GitHub Actions automaticamente.

## Acceptance Criteria

### Integridade e Dependências
- [ ] `axios`, `@amcharts/amcharts5` e `@amcharts/amcharts5-geodata` estão completamente removidos do projeto, de `package.json` e de `package-lock.json`.
- [ ] Nenhuma referência, importação quebrada ou menção residual a Axios ou amCharts existe no repositório.
- [ ] Gráficos do dashboard utilizam componentes leves com SVG e React sem bibliotecas pesadas adicionais.
- [ ] Chamadas HTTP utilizam API nativa `fetch` (e cliente em `src/lib/http/` se necessário).

### Drawers e Acessibilidade
- [ ] Componentes reutilizáveis `Drawer`, `DrawerHeader`, `DrawerContent`, `DrawerFooter`, `DrawerToggle`, `LeftDrawer` e `RightDrawer` implementados compartilhando lógica base.
- [ ] Left Drawer e Right Drawer operam de forma independente nos modos controlado (`open`, `onOpenChange`) e não controlado (`defaultOpen`).
- [ ] O usuário tem acesso permanente ao botão de alteração de estado (toggle) tanto no estado aberto quanto fechado em ambos os lados, inclusive em telas pequenas.
- [ ] No desktop, ambos podem ficar abertos simultaneamente quando houver espaço.
- [ ] Drawers temporários implementam overlay, fechamento por ESC, fechamento por backdrop, gerenciamento de foco, bloqueio de scroll e retorno de foco ao botão disparador.
- [ ] Botões de controle possuem `aria-label` e `aria-expanded`.
- [ ] Sem erros de hidratação (hydration mismatch) com persistência opcional no localStorage.

### Dashboard e Documentação
- [ ] Layout principal integra Left Drawer, Header central e Right Drawer com redimensionamento fluido do conteúdo central sem sobreposições inadequadas ou scroll horizontal.
- [ ] Página `/components` contém demonstrações interativas para todos os estados e documentação de propriedades, eventos e exemplos de código.

### Qualidade e Build
- [ ] Todos os 10 cenários de testes automatizados com Playwright passam com sucesso.
- [ ] Build de produção (`npm run build`) executa com sucesso sem erros.
- [ ] Nenhum push para repositório remoto ou execução de GitHub Actions realizada.
