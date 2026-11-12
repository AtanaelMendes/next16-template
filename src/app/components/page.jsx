'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';

// ── UI Components ────────────────────────────────────────────────────────────
import Button from '@/components/ui/buttons/Button';
import ButtonGroup from '@/components/ui/buttons/ButtonGroup';
import ButtonToggle from '@/components/ui/buttons/ButtonToggle';
import { FabCancel, FabSave } from '@/components/ui/buttons/FloatActionButton';
import PillsBadge from '@/components/ui/buttons/PillsBadge';
import Card, { CardTitle, CardBody, CardActions } from '@/components/ui/cards/Card';
import Accordion from '@/components/ui/display/Accordion';
import Blockquote from '@/components/ui/display/Blockquote';
import { Title, Subtitle, Label, Caption, FieldLabel } from '@/components/ui/display/Typography';
import Timeline from '@/components/ui/display/Timeline';
import { TooltipComponent } from '@/components/ui/overlays/TooltipComponent';
import Balloon from '@/components/ui/overlays/Balloon';
import Confirm from '@/components/ui/overlays/Confirm';
import Checkbox from '@/components/ui/inputs/Checkbox';
import Radio from '@/components/ui/inputs/Radio';
import InputText from '@/components/ui/inputs/InputText';
import ProgressBar from '@/components/ui/inputs/ProgressBar';
import Select from '@/components/ui/inputs/Select';
import { Pagination } from '@/components/ui/navigation/Pagination';
import { SortControl } from '@/components/ui/navigation/SortControl';
import DataTable from '@/components/ui/tables/DataTable';
import {
  LeftDrawer, RightDrawer,
  DrawerHeader, DrawerContent, DrawerFooter, DrawerToggle,
} from '@/components/ui/drawer';

// ── Chart components ──────────────────────────────────────────────────────────
import PieChart from '@/components/ui/charts/PieChart';
import AnswersChart from '@/components/ui/charts/AnswersChart';
import UserHoursBarChart from '@/components/ui/charts/UserHoursBarChart';

// ── FontAwesome Icons ─────────────────────────────────────────────────────────
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHome, faCube, faCog, faBell, faUser, faCheck, faTimes,
  faPlus, faEdit, faTrash, faStar, faInfo, faWarning,
  faArrowLeft, faLayerGroup, faCode, faBookOpen, faPalette,
  faTable, faSliders, faToggleOn, faFont, faBars,
} from '@fortawesome/free-solid-svg-icons';

// ─────────────────────────────────────────────────────────────────────────────
// SECTION WRAPPER
// ─────────────────────────────────────────────────────────────────────────────
const Section = ({ id, title, description, children }) => (
  <section id={id} className="mb-16 scroll-mt-20">
    <div className="mb-6 border-b-2 border-blue-200 pb-3">
      <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
      {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
    </div>
    {children}
  </section>
);

const SubSection = ({ title, children }) => (
  <div className="mb-8">
    <h3 className="mb-3 text-lg font-semibold text-gray-700 flex items-center gap-2">
      <span className="w-1 h-5 bg-blue-500 rounded-full inline-block" />
      {title}
    </h3>
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="p-5">{children}</div>
    </div>
  </div>
);

const CodeSnippet = ({ code }) => (
  <details className="mt-4">
    <summary className="cursor-pointer text-xs text-blue-600 hover:underline select-none flex items-center gap-1">
      <FontAwesomeIcon icon={faCode} width={12} /> Ver código
    </summary>
    <pre className="mt-2 overflow-x-auto rounded-lg bg-gray-900 p-4 text-xs text-green-300 leading-relaxed">
      <code>{code}</code>
    </pre>
  </details>
);

const PropTable = ({ props: propList }) => (
  <div className="mt-4 overflow-x-auto rounded-lg border border-gray-200">
    <table className="w-full text-sm text-left">
      <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
        <tr>
          <th className="px-4 py-2">Prop</th>
          <th className="px-4 py-2">Tipo</th>
          <th className="px-4 py-2">Padrão</th>
          <th className="px-4 py-2">Descrição</th>
        </tr>
      </thead>
      <tbody>
        {propList.map((p) => (
          <tr key={p.name} className="border-t border-gray-100 odd:bg-white even:bg-gray-50">
            <td className="px-4 py-2 font-mono text-blue-700">{p.name}</td>
            <td className="px-4 py-2 font-mono text-purple-600">{p.type}</td>
            <td className="px-4 py-2 font-mono text-gray-500">{p.default ?? '—'}</td>
            <td className="px-4 py-2 text-gray-600">{p.desc}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// SIDEBAR NAV
// ─────────────────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: 'buttons', label: 'Buttons', icon: faCube },
  { id: 'pills', label: 'PillsBadge', icon: faStar },
  { id: 'cards', label: 'Cards', icon: faLayerGroup },
  { id: 'typography', label: 'Typography', icon: faFont },
  { id: 'display', label: 'Display', icon: faPalette },
  { id: 'charts', label: 'Charts', icon: faSliders },
  { id: 'inputs', label: 'Inputs', icon: faEdit },
  { id: 'navigation', label: 'Navigation', icon: faBars },
  { id: 'overlays', label: 'Overlays', icon: faWarning },
  { id: 'tables', label: 'Tables', icon: faTable },
  { id: 'drawers', label: 'Drawers', icon: faToggleOn },
];

// ─────────────────────────────────────────────────────────────────────────────
// MOCKED DATA
// ─────────────────────────────────────────────────────────────────────────────
const MOCK_TABLE_HEADER = [
  { label: 'ID', align: 'left' },
  { label: 'Nome', align: 'left' },
  { label: 'Status', align: 'center' },
  { label: 'Data', align: 'left' },
];

const MOCK_TABLE_DATA = [
  { id: '001', nome: 'Ana Souza', status: 'Ativo', data: '01/11/2026' },
  { id: '002', nome: 'Bruno Lima', status: 'Inativo', data: '05/11/2026' },
  { id: '003', nome: 'Carla Perez', status: 'Ativo', data: '08/11/2026' },
  { id: '004', nome: 'Diego Faria', status: 'Pendente', data: '10/11/2026' },
  { id: '005', nome: 'Elena Castro', status: 'Ativo', data: '12/11/2026' },
];

const MOCK_TIMELINE = [
  { title: 'Criado', time: '01/11/2026 09:00', description: 'Registro criado no sistema.' },
  { title: 'Em análise', time: '03/11/2026 14:30', description: 'Equipe iniciou revisão.' },
  { title: 'Aprovado', time: '05/11/2026 11:00', description: 'Aprovado sem ressalvas.' },
];

const MOCK_ACCORDION_ITEMS = [
  { title: 'O que é este template?', subTitle: 'Visão geral', content: '<p>Template moderno com Next.js 16, React 19 e Tailwind CSS 4.</p>' },
  { title: 'Como usar os drawers?', subTitle: 'Layout', content: '<p>Importe <strong>LeftDrawer</strong> ou <strong>RightDrawer</strong> de <code>@/components/ui/drawer</code>.</p>' },
  { title: 'Preciso de bibliotecas HTTP externas?', subTitle: 'HTTP', content: '<p>Não. Usamos a API nativa <code>fetch</code> via <code>src/lib/http</code>.</p>' },
];

const MOCK_PIE_DATA = [
  { label: 'Aprovados', value: 42, color: '#22c55e' },
  { label: 'Reprovados', value: 18, color: '#ef4444' },
  { label: 'Pendentes', value: 25, color: '#f59e0b' },
  { label: 'Em análise', value: 15, color: '#3b82f6' },
];

const MOCK_ANSWERS_DATA = [
  { label: 'Jan', value: 30 },
  { label: 'Fev', value: 55 },
  { label: 'Mar', value: 42 },
  { label: 'Abr', value: 70 },
  { label: 'Mai', value: 65 },
  { label: 'Jun', value: 80 },
];

const MOCK_HOURS_DATA = [
  { user: 'Ana', hours: 120 },
  { user: 'Bruno', hours: 95 },
  { user: 'Carla', hours: 140 },
  { user: 'Diego', hours: 60 },
];

const SORT_OPTIONS = [
  { label: 'Nome A→Z', field: 'nome', direction: 'asc', type: 'string' },
  { label: 'Nome Z→A', field: 'nome', direction: 'desc', type: 'string' },
  { label: 'Data ↑', field: 'data', direction: 'asc', type: 'date' },
  { label: 'Data ↓', field: 'data', direction: 'desc', type: 'date' },
];

const PAGE_TABS_MOCK = [
  { id: 'tab1', name: 'Geral', active: true, visible: true },
  { id: 'tab2', name: 'Configurações', active: false, visible: true },
  { id: 'tab3', name: 'Histórico', active: false, visible: true },
  { id: 'tab4', name: 'Oculta', active: false, visible: false },
];

// ─────────────────────────────────────────────────────────────────────────────
// PAGE COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function ComponentsPage() {
  // ── local states ────────────────────────────────────────────────────────────
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirmResult, setConfirmResult] = useState(null);
  const [balloonVisible, setBalloonVisible] = useState(true);
  const [toggleA, setToggleA] = useState(false);
  const [toggleB, setToggleB] = useState(true);
  const [checkA, setCheckA] = useState(false);
  const [checkB, setCheckB] = useState(true);
  const [radioVal, setRadioVal] = useState('opt2');
  const [inputVal, setInputVal] = useState('');
  const [progress, setProgress] = useState(65);
  const [selectVal, setSelectVal] = useState('');
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const [paginationData] = useState(Array.from({ length: 47 }, (_, i) => ({ id: i + 1, name: `Item ${i + 1}` })));
  const [sortedData, setSortedData] = useState(MOCK_TABLE_DATA);
  const [activeTab, setActiveTab] = useState('tab1');
  const [tabs, setTabs] = useState(PAGE_TABS_MOCK);
  const [fabDemoVisible, setFabDemoVisible] = useState(false);

  const handleTabChange = (id) => {
    setActiveTab(id);
    setTabs(prev => prev.map(t => ({ ...t, active: t.id === id })));
  };

  const handleInputChange = useCallback((id, val) => {
    setInputVal(val);
  }, []);

  const handleSelectChange = useCallback((id, val) => {
    setSelectVal(val);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── TOP HEADER ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-screen-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1">
              <FontAwesomeIcon icon={faArrowLeft} width={12} /> Dashboard
            </Link>
            <span className="text-gray-300">/</span>
            <span className="text-gray-700 font-semibold text-sm flex items-center gap-2">
              <FontAwesomeIcon icon={faBookOpen} width={14} className="text-blue-600" />
              Catálogo de Componentes
            </span>
          </div>
          <span className="text-xs text-gray-400 hidden sm:block">src/components/ui/</span>
        </div>
      </header>

      <div className="max-w-screen-2xl mx-auto flex gap-0 md:gap-6 px-4 py-6">
        {/* ── STICKY SIDEBAR NAV ─────────────────────────────────────────────── */}
        <nav className="hidden md:block w-52 shrink-0">
          <div className="sticky top-20 rounded-xl bg-white border border-gray-200 shadow-sm p-3">
            <p className="text-xs font-semibold uppercase text-gray-400 mb-2 px-2">Seções</p>
            <ul className="space-y-0.5">
              {NAV_ITEMS.map(item => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                  >
                    <FontAwesomeIcon icon={item.icon} width={13} className="text-gray-400" />
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* ── MAIN CONTENT ────────────────────────────────────────────────────── */}
        <main className="flex-1 min-w-0">

          {/* ══════════════════════════════════════════════════════════════════
              1. BUTTONS
          ══════════════════════════════════════════════════════════════════ */}
          <Section id="buttons" title="🔘 Buttons" description="src/components/ui/buttons/Button.jsx — Componente de botão com variantes, tamanhos e estilos.">

            <SubSection title="Variantes (buttonType)">
              <div className="flex flex-wrap gap-2">
                {['primary', 'secondary', 'success', 'danger', 'warning', 'ghost'].map(t => (
                  <Button key={t} buttonType={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</Button>
                ))}
              </div>
              <CodeSnippet code={`<Button buttonType="primary">Primary</Button>
<Button buttonType="success">Success</Button>
<Button buttonType="danger">Danger</Button>`} />
            </SubSection>

            <SubSection title="Outline + Bordered">
              <div className="flex flex-wrap gap-2">
                {['primary', 'success', 'danger', 'warning'].map(t => (
                  <Button key={t} buttonType={t} outline bordered>{t}</Button>
                ))}
              </div>
            </SubSection>

            <SubSection title="Tamanhos (size)">
              <div className="flex flex-wrap items-center gap-3">
                <Button buttonType="primary" size="small">Small</Button>
                <Button buttonType="primary">Medium (padrão)</Button>
              </div>
            </SubSection>

            <SubSection title="Pill, Block e Disabled">
              <div className="flex flex-wrap items-center gap-3">
                <Button buttonType="primary" pill>Pill</Button>
                <Button buttonType="success" disabled>Disabled</Button>
                <div className="w-48">
                  <Button buttonType="primary" block>Block (100%)</Button>
                </div>
              </div>
            </SubSection>

            <SubSection title="ButtonGroup">
              <ButtonGroup buttons={[
                { id: 'g1', label: 'Editar', tooltip: 'Editar registro', onclick: () => alert('Editar') },
                { id: 'g2', label: 'Excluir', tooltip: 'Excluir registro', onclick: () => alert('Excluir') },
                { id: 'g3', label: 'Visualizar', tooltip: 'Ver detalhes', onclick: () => alert('Ver') },
              ]} />
              <CodeSnippet code={`<ButtonGroup buttons={[
  { id: 'g1', label: 'Editar', tooltip: 'Editar registro', onclick: () => {} },
  { id: 'g2', label: 'Excluir', tooltip: 'Excluir registro', onclick: () => {} },
]} />`} />
            </SubSection>

            <SubSection title="ButtonToggle (switch)">
              <div className="flex flex-wrap gap-6 items-center">
                <ButtonToggle
                  id="toggle-a" primary label="Ativo" checked={toggleA}
                  onChange={(id, val, checked) => setToggleA(checked)}
                />
                <ButtonToggle
                  id="toggle-b" success label="Habilitado" checked={toggleB}
                  onChange={(id, val, checked) => setToggleB(checked)}
                />
                <ButtonToggle
                  id="toggle-c" danger labelOn="Ligado" LabelOff="Desligado"
                  checked={toggleA} onChange={(id, val, checked) => setToggleA(checked)}
                />
                <ButtonToggle
                  id="toggle-d" warning label="Aviso" checked={false}
                  onChange={() => {}}
                />
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Estado A: <strong>{toggleA ? 'ON' : 'OFF'}</strong> | Estado B: <strong>{toggleB ? 'ON' : 'OFF'}</strong>
              </div>
              <CodeSnippet code={`<ButtonToggle
  id="meu-toggle" primary label="Ativo"
  checked={checked} onChange={(id, val, isChecked) => setChecked(isChecked)}
/>`} />
              <PropTable props={[
                { name: 'id', type: 'string', desc: 'ID único do input' },
                { name: 'checked', type: 'boolean', desc: 'Estado do toggle' },
                { name: 'onChange', type: 'function', desc: '(id, value, checked) => void' },
                { name: 'primary/success/danger/warning', type: 'boolean', desc: 'Variante de cor (uma obrigatória)' },
                { name: 'label', type: 'string', desc: 'Texto fixo' },
                { name: 'labelOn / LabelOff', type: 'string', desc: 'Texto condicional por estado' },
                { name: 'disabled', type: 'boolean', default: 'false', desc: 'Desabilita o toggle' },
              ]} />
            </SubSection>

            <SubSection title="FloatActionButton (FAB)">
              <div className="relative h-24 bg-gray-50 rounded-lg border border-dashed border-gray-300 flex items-center justify-center gap-4">
                <span className="text-gray-400 text-sm">Área de demo (posição absoluta)</span>
                <FabSave
                  absolute small disableZIndex
                  className="bottom-3 right-3"
                  onClick={() => setFabDemoVisible(true)}
                />
                <FabCancel
                  absolute small disableZIndex
                  className="bottom-3 right-16"
                  onClick={() => setFabDemoVisible(false)}
                />
              </div>
              {fabDemoVisible && <div className="mt-2 text-green-600 text-sm">✅ FAB Save clicado!</div>}
              <CodeSnippet code={`import { FabSave, FabCancel } from '@/components/ui/buttons/FloatActionButton';

<FabSave onClick={handleSave} />
<FabCancel onClick={handleCancel} />`} />
            </SubSection>
          </Section>

          {/* ══════════════════════════════════════════════════════════════════
              2. PILLS / BADGE
          ══════════════════════════════════════════════════════════════════ */}
          <Section id="pills" title="🏷️ PillsBadge" description="src/components/ui/buttons/PillsBadge.jsx — Badges e etiquetas com variantes de cor.">
            <SubSection title="Variantes">
              <div className="flex flex-wrap gap-2 items-center">
                {['default', 'primary', 'primary-dark', 'danger', 'success', 'warning', 'warning-dark'].map(t => (
                  <PillsBadge key={t} type={t}>{t}</PillsBadge>
                ))}
              </div>
            </SubSection>
            <SubSection title="Tamanho small">
              <div className="flex flex-wrap gap-2 items-center">
                {['primary', 'danger', 'success', 'warning'].map(t => (
                  <PillsBadge key={t} type={t} small>{t} sm</PillsBadge>
                ))}
              </div>
            </SubSection>
            <CodeSnippet code={`<PillsBadge type="success">Aprovado</PillsBadge>
<PillsBadge type="danger" small>Urgente</PillsBadge>`} />
          </Section>

          {/* ══════════════════════════════════════════════════════════════════
              3. CARDS
          ══════════════════════════════════════════════════════════════════ */}
          <Section id="cards" title="🃏 Cards" description="src/components/ui/cards/Card.jsx — Card com título, corpo, ações e imagem.">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

              <Card>
                <CardTitle>Card Padrão</CardTitle>
                <CardBody>
                  <p className="text-sm">Conteúdo básico do card, podendo incluir qualquer elemento React.</p>
                </CardBody>
                <CardActions align="right">
                  <Button buttonType="primary" size="small">Ação</Button>
                </CardActions>
              </Card>

              <Card>
                <CardTitle primary button onClick={() => alert('menu')}>Card Primary</CardTitle>
                <CardBody>
                  <p className="text-sm">Título com cor primary e botão de menu (três pontinhos).</p>
                  <div className="mt-2">
                    <PillsBadge type="primary">Novo</PillsBadge>
                  </div>
                </CardBody>
                <CardActions>
                  <Button buttonType="success" size="small">Aceitar</Button>
                  <Button buttonType="danger" size="small" outline className="ml-2">Recusar</Button>
                </CardActions>
              </Card>

              <Card>
                <CardTitle danger>Card Danger</CardTitle>
                <CardBody>
                  <p className="text-sm">Card com destaque de alerta ou erro.</p>
                  <Blockquote type="danger" className="mt-2">Atenção: ação irreversível.</Blockquote>
                </CardBody>
              </Card>
            </div>

            <CodeSnippet code={`import Card, { CardTitle, CardBody, CardActions } from '@/components/ui/cards/Card';

<Card>
  <CardTitle primary>Meu Card</CardTitle>
  <CardBody>Conteúdo aqui</CardBody>
  <CardActions align="right">
    <Button buttonType="primary" size="small">Salvar</Button>
  </CardActions>
</Card>`} />

            <PropTable props={[
              { name: 'children', type: 'ReactNode', desc: 'Conteúdo (CardTitle, CardBody, CardActions, CardImage)' },
              { name: 'width', type: 'string', default: 'w-full', desc: 'Classe Tailwind de largura' },
              { name: 'className', type: 'string', desc: 'Classes adicionais' },
            ]} />
          </Section>

          {/* ══════════════════════════════════════════════════════════════════
              4. TYPOGRAPHY
          ══════════════════════════════════════════════════════════════════ */}
          <Section id="typography" title="🔤 Typography" description="src/components/ui/display/Typography.jsx — Componentes de texto padronizados.">
            <SubSection title="Componentes de texto">
              <div className="space-y-2">
                <div><Title>Title — font-semibold</Title></div>
                <div><Subtitle>Subtitle — text-base</Subtitle></div>
                <div><Label>Label — text-sm</Label></div>
                <div><Caption>Caption — text-xs text-slate-400</Caption></div>
                <div><FieldLabel>FieldLabel — rótulo de formulário</FieldLabel></div>
                <div><FieldLabel required>FieldLabel required</FieldLabel></div>
              </div>
              <CodeSnippet code={`import { Title, Subtitle, Label, Caption, FieldLabel } from '@/components/ui/display/Typography';

<Title>Título da seção</Title>
<FieldLabel required>Campo obrigatório</FieldLabel>`} />
            </SubSection>
          </Section>

          {/* ══════════════════════════════════════════════════════════════════
              5. DISPLAY
          ══════════════════════════════════════════════════════════════════ */}
          <Section id="display" title="🎨 Display" description="src/components/ui/display/ — Blockquote, Accordion, Timeline.">

            <SubSection title="Blockquote">
              <div className="space-y-2">
                {['default', 'primary', 'success', 'warning', 'danger'].map(t => (
                  <Blockquote key={t} type={t}>
                    Blockquote <strong>{t}</strong> — use para destacar informações importantes.
                  </Blockquote>
                ))}
              </div>
              <CodeSnippet code={`<Blockquote type="warning">Atenção ao preencher este campo.</Blockquote>
<Blockquote type="danger" size="md">Erro crítico detectado.</Blockquote>`} />
            </SubSection>

            <SubSection title="Accordion">
              <Accordion items={MOCK_ACCORDION_ITEMS} />
              <CodeSnippet code={`<Accordion items={[
  { title: 'Pergunta 1', subTitle: 'Subtítulo', content: '<p>Resposta HTML aqui.</p>' },
]} />`} />
            </SubSection>

            <SubSection title="Timeline">
              <div className="relative ml-4 mt-2">
                <Timeline data={MOCK_TIMELINE} />
              </div>
              <CodeSnippet code={`<Timeline data={[
  { title: 'Criado', time: '01/11/2026 09:00', description: 'Registro criado.' },
]} />`} />
            </SubSection>
          </Section>

          {/* ══════════════════════════════════════════════════════════════════
              6. CHARTS
          ══════════════════════════════════════════════════════════════════ */}
          <Section id="charts" title="📊 Charts" description="src/components/ui/charts/ — Gráficos SVG nativos, sem bibliotecas externas.">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SubSection title="PieChart">
                <div className="h-56">
                  <PieChart data={MOCK_PIE_DATA} title="Distribuição de Candidatos" />
                </div>
                <CodeSnippet code={`<PieChart
  title="Distribuição"
  data={[
    { label: 'Aprovados', value: 42, color: '#22c55e' },
    { label: 'Reprovados', value: 18, color: '#ef4444' },
  ]}
/>`} />
              </SubSection>

              <SubSection title="AnswersChart (Barras)">
                <div className="h-56">
                  <AnswersChart data={MOCK_ANSWERS_DATA} title="Respostas por Mês" />
                </div>
                <CodeSnippet code={`<AnswersChart
  title="Respostas por Mês"
  data={[{ label: 'Jan', value: 30 }, { label: 'Fev', value: 55 }]}
/>`} />
              </SubSection>

              <SubSection title="UserHoursBarChart">
                <div className="h-56">
                  <UserHoursBarChart data={MOCK_HOURS_DATA} title="Horas por Usuário" />
                </div>
                <CodeSnippet code={`<UserHoursBarChart
  title="Horas por Usuário"
  data={[{ user: 'Ana', hours: 120 }, { user: 'Bruno', hours: 95 }]}
/>`} />
              </SubSection>
            </div>
          </Section>

          {/* ══════════════════════════════════════════════════════════════════
              7. INPUTS
          ══════════════════════════════════════════════════════════════════ */}
          <Section id="inputs" title="📝 Inputs" description="src/components/ui/inputs/ — Componentes de formulário.">

            <SubSection title="InputText">
              <div className="max-w-sm space-y-3">
                <InputText id="demo-text" label="Nome completo" placeholder="Digite seu nome" value={inputVal} onChange={handleInputChange} />
                <InputText id="demo-cpf" label="CPF" mask="cpf" placeholder="000.000.000-00" value="" onChange={() => {}} />
                <InputText id="demo-disabled" label="Campo desabilitado" value="Valor fixo" disabled onChange={() => {}} />
                <InputText id="demo-clearable" label="Pesquisa" placeholder="Digite para filtrar..." value={inputVal} onChange={handleInputChange} clearable />
                <InputText id="demo-required" label="E-mail" placeholder="email@exemplo.com" required onChange={() => {}} hint="Informe um e-mail válido." />
              </div>
              <div className="mt-2 text-xs text-gray-500">Valor atual: <strong>"{inputVal}"</strong></div>
              <CodeSnippet code={`<InputText
  id="nome" label="Nome" placeholder="Digite..." 
  value={value} onChange={(id, val) => setValue(val)}
  clearable required hint="Campo obrigatório"
/>`} />
              <PropTable props={[
                { name: 'id', type: 'string', desc: 'ID do campo' },
                { name: 'label', type: 'string', desc: 'Rótulo visível' },
                { name: 'value', type: 'string', desc: 'Valor controlado' },
                { name: 'onChange', type: 'function', desc: '(id, value) => void' },
                { name: 'placeholder', type: 'string', desc: 'Texto placeholder' },
                { name: 'mask', type: 'string', desc: '"cpf" | "cnpj" | "phone" | "cep"' },
                { name: 'disabled', type: 'boolean', default: 'false', desc: 'Desabilita o input' },
                { name: 'clearable', type: 'boolean', default: 'false', desc: 'Exibe botão de limpar' },
                { name: 'required', type: 'object|boolean', desc: 'Validação de obrigatoriedade' },
                { name: 'hint', type: 'string', desc: 'Texto de ajuda (tooltip)' },
              ]} />
            </SubSection>

            <SubSection title="Select">
              <div className="max-w-sm space-y-3">
                <Select
                  id="select-demo"
                  label="Estado"
                  value={selectVal}
                  placeholder="Selecione um estado..."
                  onChange={handleSelectChange}
                  options={[
                    { value: 'SP', label: 'São Paulo' },
                    { value: 'RJ', label: 'Rio de Janeiro' },
                    { value: 'MG', label: 'Minas Gerais' },
                    { value: 'RS', label: 'Rio Grande do Sul' },
                    { value: 'BA', label: 'Bahia' },
                  ]}
                />
                <div className="text-xs text-gray-500">Selecionado: <strong>"{selectVal}"</strong></div>
              </div>
              <CodeSnippet code={`<Select
  id="estado" label="Estado" value={selectVal}
  onChange={(id, val) => setSelectVal(val)}
  options={[{ value: 'SP', label: 'São Paulo' }]}
/>`} />
            </SubSection>

            <SubSection title="Checkbox">
              <div className="space-y-2">
                <Checkbox id="chk-a" label="Aceito os termos e condições" checked={checkA}
                  onChange={(id, checked) => setCheckA(checked)} />
                <Checkbox id="chk-b" label="Receber notificações por e-mail" checked={checkB}
                  onChange={(id, checked) => setCheckB(checked)} />
                <Checkbox id="chk-c" label="Campo desabilitado" checked={false} disabled onChange={() => {}} />
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Termos: <strong>{checkA ? 'Aceito' : 'Recusado'}</strong> | Notificações: <strong>{checkB ? 'Sim' : 'Não'}</strong>
              </div>
              <CodeSnippet code={`<Checkbox
  id="aceitar" label="Aceitar termos" checked={checked}
  onChange={(id, isChecked) => setChecked(isChecked)}
/>`} />
            </SubSection>

            <SubSection title="Radio">
              <div className="space-y-2">
                {[
                  { id: 'opt1', value: 'opt1', label: 'Opção 1 — Presencial' },
                  { id: 'opt2', value: 'opt2', label: 'Opção 2 — Híbrido' },
                  { id: 'opt3', value: 'opt3', label: 'Opção 3 — Remoto' },
                ].map(opt => (
                  <Radio key={opt.id} id={opt.id} value={opt.value} name="modalidade"
                    label={opt.label} checked={radioVal === opt.value}
                    onChange={(id, val) => setRadioVal(val)} className="" />
                ))}
              </div>
              <div className="mt-2 text-xs text-gray-500">Selecionado: <strong>"{radioVal}"</strong></div>
              <CodeSnippet code={`<Radio
  id="opt1" value="opt1" name="modalidade" label="Presencial"
  checked={radioVal === 'opt1'} onChange={(id, val) => setRadioVal(val)}
  className=""
/>`} />
            </SubSection>

            <SubSection title="ProgressBar">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <ProgressBar id="pb-demo" value={progress} width="w-64" />
                </div>
                <div className="flex gap-2 mt-3">
                  <Button buttonType="primary" size="small" onClick={() => setProgress(p => Math.max(0, p - 10))}>−10%</Button>
                  <Button buttonType="success" size="small" onClick={() => setProgress(p => Math.min(100, p + 10))}>+10%</Button>
                  <Button buttonType="secondary" size="small" onClick={() => setProgress(0)}>Reset</Button>
                </div>
              </div>
              <CodeSnippet code={`<ProgressBar id="carregamento" value={65} width="w-64" />`} />
            </SubSection>
          </Section>

          {/* ══════════════════════════════════════════════════════════════════
              8. NAVIGATION
          ══════════════════════════════════════════════════════════════════ */}
          <Section id="navigation" title="🧭 Navigation" description="src/components/ui/navigation/ — Tabs, paginação e controle de ordenação.">

            <SubSection title="PageTabs">
              <div className="bg-blue-50 rounded-lg p-3">
                <ul className="flex gap-1">
                  {tabs.filter(t => t.visible).map(tab => (
                    <li key={tab.id}
                      className={`rounded-t-lg cursor-pointer px-4 py-2 text-sm font-medium transition-colors
                        ${tab.active ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-300 hover:bg-blue-100'}`}
                      onClick={() => handleTabChange(tab.id)}>
                      {tab.name}
                    </li>
                  ))}
                </ul>
                <div className="bg-white border border-t-0 border-gray-300 rounded-b-lg p-4 text-sm text-gray-700">
                  Conteúdo da aba: <strong>{tabs.find(t => t.active)?.name}</strong>
                </div>
              </div>
              <CodeSnippet code={`// PageTabs usa objetos { id, name, active, visible }
// Renderize sua própria lista de <li> ou use o componente PageTabs
import PageTabs from '@/components/ui/navigation/PageTabs';
<PageTabs pageTabs={tabs} onClick={handleTabChange} />`} />
            </SubSection>

            <SubSection title="Pagination">
              <Pagination
                data={paginationData}
                itemsPerPage={10}
                showPaginator
                showItemCountSelector
                callBackChangePage={(items) => { /* items da página atual */ }}
              />
              <div className="mt-2 text-xs text-gray-500">47 itens totais, 10 por página → 5 páginas</div>
              <CodeSnippet code={`<Pagination
  data={meuArray}
  itemsPerPage={10}
  showPaginator
  showItemCountSelector
  callBackChangePage={(pageItems) => setCurrentItems(pageItems)}
/>`} />
              <PropTable props={[
                { name: 'data', type: 'array', desc: 'Array completo de itens' },
                { name: 'itemsPerPage', type: 'number', default: '50', desc: 'Itens por página inicial' },
                { name: 'callBackChangePage', type: 'function', desc: '(items) => void — slice da página atual' },
                { name: 'showPaginator', type: 'boolean', default: 'false', desc: 'Exibe os botões de página' },
                { name: 'showItemCountSelector', type: 'boolean', default: 'false', desc: 'Exibe seletor de itens/página' },
                { name: 'size', type: 'string', default: '"md"', desc: '"sm" | "md" | "lg"' },
              ]} />
            </SubSection>

            <SubSection title="SortControl">
              <SortControl
                configOptions={SORT_OPTIONS}
                dataObject={MOCK_TABLE_DATA}
                setSortedDataFn={setSortedData}
                useCompact
              />
              <div className="mt-2 text-xs text-gray-500">
                Dados ordenados: {sortedData.map(d => d.nome).join(', ')}
              </div>
              <CodeSnippet code={`<SortControl
  configOptions={[
    { label: 'Nome A→Z', field: 'nome', direction: 'asc', type: 'string' },
    { label: 'Nome Z→A', field: 'nome', direction: 'desc', type: 'string' },
  ]}
  dataObject={minhaLista}
  setSortedDataFn={setLista}
  useCompact
/>`} />
            </SubSection>
          </Section>

          {/* ══════════════════════════════════════════════════════════════════
              9. OVERLAYS
          ══════════════════════════════════════════════════════════════════ */}
          <Section id="overlays" title="🪟 Overlays" description="src/components/ui/overlays/ — Tooltip, Balloon, Confirm, Dialog.">

            <SubSection title="TooltipComponent">
              <div className="flex flex-wrap gap-6 items-center py-4">
                {(['top', 'bottom', 'left', 'right']).map(side => (
                  <TooltipComponent key={side} content={`Tooltip ${side}`} side={side}>
                    <Button buttonType="primary" size="small">{side}</Button>
                  </TooltipComponent>
                ))}
              </div>
              <CodeSnippet code={`<TooltipComponent content="Meu tooltip" side="top">
  <Button buttonType="primary">Hover me</Button>
</TooltipComponent>`} />
              <PropTable props={[
                { name: 'content', type: 'ReactNode', desc: 'Conteúdo do tooltip' },
                { name: 'side', type: 'string', default: '"top"', desc: '"top" | "bottom" | "left" | "right"' },
                { name: 'children', type: 'ReactNode', desc: 'Elemento disparador' },
              ]} />
            </SubSection>

            <SubSection title="Balloon">
              <div className="flex gap-3 items-center">
                <Button buttonType="primary" size="small" onClick={() => setBalloonVisible(v => !v)}>
                  {balloonVisible ? 'Ocultar' : 'Mostrar'} Balloon
                </Button>
                <Balloon visible={balloonVisible} color="primary" placement="bottom">
                  Conteúdo dinâmico do Balloon
                </Balloon>
              </div>
              <CodeSnippet code={`<Balloon visible={visible} color="primary" placement="bottom">
  Meu conteúdo flutuante
</Balloon>`} />
            </SubSection>

            <SubSection title="Confirm Dialog">
              <div className="flex gap-3 items-center flex-wrap">
                <Button buttonType="danger" onClick={() => { setConfirmVisible(true); setConfirmResult(null); }}>
                  Abrir Confirmação
                </Button>
                {confirmResult !== null && (
                  <span className={`text-sm font-medium ${confirmResult ? 'text-green-600' : 'text-red-600'}`}>
                    {confirmResult ? '✅ Confirmado!' : '❌ Cancelado'}
                  </span>
                )}
              </div>
              <Confirm
                visible={confirmVisible}
                setVisible={setConfirmVisible}
                primaryText="Deseja realmente excluir este registro?"
                secondaryText="Esta ação não pode ser desfeita."
                btnAccept="Sim, excluir"
                btnDecline="Cancelar"
                confirmActionCallback={() => setConfirmResult(true)}
                cancelActionCallback={() => setConfirmResult(false)}
              />
              <CodeSnippet code={`<Confirm
  visible={visible} setVisible={setVisible}
  primaryText="Deseja excluir?"
  secondaryText="Ação irreversível."
  btnAccept="Excluir" btnDecline="Cancelar"
  confirmActionCallback={() => handleDelete()}
  cancelActionCallback={() => {}}
/>`} />
              <PropTable props={[
                { name: 'visible', type: 'boolean', desc: 'Exibe o modal de confirmação' },
                { name: 'setVisible', type: 'function', desc: '(bool) => void — controla visibilidade' },
                { name: 'primaryText', type: 'string', desc: 'Texto principal' },
                { name: 'secondaryText', type: 'string', desc: 'Texto secundário (subtítulo)' },
                { name: 'btnAccept', type: 'string', default: '"Sim"', desc: 'Rótulo do botão de aceite' },
                { name: 'btnDecline', type: 'string', desc: 'Rótulo do botão de cancelamento' },
                { name: 'confirmActionCallback', type: 'function', desc: 'Callback ao aceitar' },
                { name: 'cancelActionCallback', type: 'function', desc: 'Callback ao cancelar' },
              ]} />
            </SubSection>
          </Section>

          {/* ══════════════════════════════════════════════════════════════════
              10. TABLES
          ══════════════════════════════════════════════════════════════════ */}
          <Section id="tables" title="📋 Tables" description="src/components/ui/tables/DataTable.jsx — Tabela com busca, filtro e colunas configuráveis.">
            <SubSection title="DataTable com dados mockados">
              <DataTable
                header={MOCK_TABLE_HEADER}
                data={MOCK_TABLE_DATA}
                mainText="Usuários do sistema"
                action={<Button buttonType="success" size="small"><FontAwesomeIcon icon={faPlus} width={12} className="mr-1" />Novo</Button>}
              />
              <CodeSnippet code={`const header = [
  { label: 'ID', align: 'left' },
  { label: 'Nome', align: 'left' },
  { label: 'Status', align: 'center' },
];

const data = [
  { id: '001', nome: 'Ana', status: 'Ativo' },
];

<DataTable
  header={header} data={data}
  mainText="Minha tabela"
  action={<Button buttonType="success" size="small">Novo</Button>}
/>`} />
              <PropTable props={[
                { name: 'header', type: 'array', desc: 'Array de { label, align?, title? } definindo as colunas' },
                { name: 'data', type: 'array', desc: 'Array de objetos com as linhas (keys devem corresponder à ordem do header)' },
                { name: 'mainText', type: 'string', desc: 'Título exibido no topo da tabela' },
                { name: 'action', type: 'ReactNode', desc: 'Elemento de ação (ex: botão Novo) no cabeçalho' },
                { name: 'dense', type: 'boolean', default: 'false', desc: 'Reduz o espaçamento das células' },
              ]} />
            </SubSection>
          </Section>

          {/* ══════════════════════════════════════════════════════════════════
              11. DRAWERS
          ══════════════════════════════════════════════════════════════════ */}
          <Section id="drawers" title="🗂️ Drawers" description="src/components/ui/drawer/ — LeftDrawer, RightDrawer, Drawer base e componentes auxiliares.">

            {/* ── Live playground ───────────────────────────────────────────── */}
            <SubSection title="Playground interativo">
              <div className="flex flex-wrap gap-3 mb-4">
                <Button buttonType="primary" onClick={() => { setLeftOpen(true); setRightOpen(false); }}>
                  Só Left aberto
                </Button>
                <Button buttonType="secondary" onClick={() => { setLeftOpen(false); setRightOpen(true); }}>
                  Só Right aberto
                </Button>
                <Button buttonType="success" onClick={() => { setLeftOpen(true); setRightOpen(true); }}>
                  Ambos abertos
                </Button>
                <Button buttonType="ghost" bordered onClick={() => { setLeftOpen(false); setRightOpen(false); }}>
                  Ambos fechados
                </Button>
              </div>

              <div className="relative h-72 rounded-xl overflow-hidden border border-gray-300 bg-gray-100 flex">
                {/* Left Drawer (permanent in demo) */}
                <div className={`bg-blue-700 text-white transition-all duration-300 overflow-hidden ${leftOpen ? 'w-52' : 'w-0'} shrink-0`}>
                  <div className="p-3">
                    <p className="font-semibold text-sm mb-3">LeftDrawer</p>
                    <nav className="space-y-1">
                      {[
                        { icon: faHome, label: 'Dashboard' },
                        { icon: faCube, label: 'Componentes', active: true },
                        { icon: faCog, label: 'Configurações' },
                      ].map(item => (
                        <div key={item.label}
                          className={`flex items-center gap-2 px-2 py-1.5 rounded text-sm cursor-pointer
                            ${item.active ? 'bg-blue-500' : 'hover:bg-blue-600'}`}>
                          <FontAwesomeIcon icon={item.icon} width={14} />
                          <span>{item.label}</span>
                        </div>
                      ))}
                    </nav>
                  </div>
                </div>

                {/* Main area */}
                <div className="flex-1 flex flex-col items-center justify-center gap-2 min-w-0">
                  <div className="flex gap-3">
                    <button
                      onClick={() => setLeftOpen(o => !o)}
                      className="bg-white border border-gray-300 rounded px-2 py-1 text-xs hover:bg-gray-50"
                      aria-label={leftOpen ? 'Fechar navegação' : 'Abrir navegação'}
                      aria-expanded={leftOpen}
                    >
                      ◀ Left {leftOpen ? '(fechar)' : '(abrir)'}
                    </button>
                    <button
                      onClick={() => setRightOpen(o => !o)}
                      className="bg-white border border-gray-300 rounded px-2 py-1 text-xs hover:bg-gray-50"
                      aria-label={rightOpen ? 'Fechar painel' : 'Abrir painel'}
                      aria-expanded={rightOpen}
                    >
                      Right {rightOpen ? '(fechar)' : '(abrir)'} ▶
                    </button>
                  </div>
                  <p className="text-xs text-gray-400">Área de conteúdo principal</p>
                  <div className="flex gap-2 text-xs">
                    <PillsBadge type={leftOpen ? 'success' : 'default'}>Left: {leftOpen ? 'open' : 'closed'}</PillsBadge>
                    <PillsBadge type={rightOpen ? 'primary' : 'default'}>Right: {rightOpen ? 'open' : 'closed'}</PillsBadge>
                  </div>
                </div>

                {/* Right Drawer (permanent in demo) */}
                <div className={`bg-gray-800 text-white transition-all duration-300 overflow-hidden ${rightOpen ? 'w-52' : 'w-0'} shrink-0`}>
                  <div className="p-3">
                    <p className="font-semibold text-sm mb-3">RightDrawer</p>
                    <div className="space-y-2">
                      <div className="bg-gray-700 rounded p-2 text-xs">
                        <div className="flex items-center gap-1 mb-1"><FontAwesomeIcon icon={faBell} width={12} /> Notificação</div>
                        <p className="text-gray-300">Novo registro criado.</p>
                      </div>
                      <div className="bg-gray-700 rounded p-2 text-xs">
                        <div className="flex items-center gap-1 mb-1"><FontAwesomeIcon icon={faUser} width={12} /> Perfil</div>
                        <p className="text-gray-300">Admin · Online</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <CodeSnippet code={`const [leftOpen, setLeftOpen] = useState(true);
const [rightOpen, setRightOpen] = useState(false);

<LeftDrawer open={leftOpen} onOpenChange={setLeftOpen}
  navItems={[{ id: 'home', label: 'Dashboard', href: '/', icon: <HomeIcon /> }]}
/>

<RightDrawer open={rightOpen} onOpenChange={setRightOpen}>
  <DrawerHeader>Painel contextual</DrawerHeader>
  <DrawerContent>Conteúdo dinâmico aqui</DrawerContent>
  <DrawerFooter>Rodapé</DrawerFooter>
</RightDrawer>`} />
            </SubSection>

            {/* ── Drawer real (LeftDrawer) ───────────────────────────────────── */}
            <SubSection title="LeftDrawer real (clique para abrir)">
              <div className="flex gap-3">
                <Button buttonType="primary" onClick={() => setLeftOpen(true)}>
                  <FontAwesomeIcon icon={faBars} width={14} className="mr-2" /> Abrir LeftDrawer
                </Button>
              </div>
              {leftOpen && (
                <LeftDrawer
                  open={leftOpen}
                  onOpenChange={setLeftOpen}
                  variant="temporary"
                  items={[
                    { id: 'home', label: 'Dashboard', href: '/', icon: <FontAwesomeIcon icon={faHome} width={16} /> },
                    { id: 'components', label: 'Componentes', href: '/components', icon: <FontAwesomeIcon icon={faCube} width={16} />, active: true },
                    { id: 'settings', label: 'Configurações', href: '#', icon: <FontAwesomeIcon icon={faCog} width={16} /> },
                  ]}
                />
              )}
            </SubSection>

            {/* ── RightDrawer real ──────────────────────────────────────────── */}
            <SubSection title="RightDrawer real (clique para abrir)">
              <div className="flex gap-3">
                <Button buttonType="secondary" bordered onClick={() => setRightOpen(true)}>
                  <FontAwesomeIcon icon={faBell} width={14} className="mr-2" /> Abrir RightDrawer
                </Button>
              </div>
              {rightOpen && (
                <RightDrawer open={rightOpen} onOpenChange={setRightOpen}>
                  <DrawerHeader>Painel de Notificações</DrawerHeader>
                  <DrawerContent>
                    <div className="space-y-3">
                      {[
                        { icon: faBell, text: 'Nova candidatura recebida', time: 'há 2 min', color: 'text-blue-500' },
                        { icon: faCheck, text: 'Relatório gerado com sucesso', time: 'há 15 min', color: 'text-green-500' },
                        { icon: faWarning, text: 'Prazo expirando amanhã', time: 'há 1h', color: 'text-yellow-500' },
                      ].map((n, i) => (
                        <div key={i} className="flex gap-3 p-2 rounded-lg hover:bg-gray-50 border border-gray-100">
                          <FontAwesomeIcon icon={n.icon} width={16} className={`mt-0.5 ${n.color}`} />
                          <div>
                            <p className="text-sm text-gray-700">{n.text}</p>
                            <span className="text-xs text-gray-400">{n.time}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </DrawerContent>
                  <DrawerFooter>
                    <Button buttonType="primary" size="small" block onClick={() => setRightOpen(false)}>
                      Fechar painel
                    </Button>
                  </DrawerFooter>
                </RightDrawer>
              )}
            </SubSection>

            {/* ── API Reference ─────────────────────────────────────────────── */}
            <SubSection title="API de Componentes — LeftDrawer / RightDrawer">
              <PropTable props={[
                { name: 'open', type: 'boolean', desc: 'Estado controlado — drawer aberto ou fechado' },
                { name: 'onOpenChange', type: 'function', desc: '(open: boolean) => void — callback de mudança de estado' },
                { name: 'defaultOpen', type: 'boolean', default: 'false', desc: 'Estado inicial para modo não controlado' },
                { name: 'navItems', type: 'array', desc: '[LeftDrawer] Array de { id, label, href, icon, active?, badge? }' },
                { name: 'children', type: 'ReactNode', desc: '[RightDrawer] Conteúdo interno (DrawerHeader, DrawerContent, DrawerFooter)' },
                { name: 'persistent', type: 'boolean', default: 'false', desc: 'Drawer empurra o conteúdo (não sobrepõe)' },
              ]} />
            </SubSection>

            <SubSection title="API — Drawer (base compartilhada)">
              <PropTable props={[
                { name: 'side', type: '"left" | "right"', desc: 'Lado do drawer' },
                { name: 'open', type: 'boolean', desc: 'Controlado: estado de abertura' },
                { name: 'onOpenChange', type: 'function', desc: '(open: boolean) => void' },
                { name: 'defaultOpen', type: 'boolean', desc: 'Não controlado: valor inicial' },
                { name: 'persistent', type: 'boolean', desc: 'Se true, empurra conteúdo em vez de sobrepor' },
                { name: 'width', type: 'string', desc: 'Classe de largura Tailwind (ex: "w-64")' },
                { name: 'children', type: 'ReactNode', desc: 'Conteúdo interno' },
              ]} />
            </SubSection>

            <SubSection title="DrawerToggle">
              <div className="flex gap-4 items-center">
                <DrawerToggle
                  open={leftOpen}
                  onToggle={() => setLeftOpen(o => !o)}
                  side="left"
                  aria-label="Alternar navegação lateral"
                />
                <span className="text-sm text-gray-600">
                  DrawerToggle (side=left) — estado: <strong>{leftOpen ? 'aberto' : 'fechado'}</strong>
                </span>
              </div>
              <CodeSnippet code={`<DrawerToggle
  open={leftOpen}
  onToggle={() => setLeftOpen(o => !o)}
  side="left"
  aria-label="Alternar navegação"
/>`} />
              <PropTable props={[
                { name: 'open', type: 'boolean', desc: 'Estado atual do drawer' },
                { name: 'onToggle', type: 'function', desc: '() => void — alterna o estado' },
                { name: 'side', type: '"left" | "right"', desc: 'Lado — afeta a direção do ícone' },
                { name: 'aria-label', type: 'string', desc: 'Acessibilidade (obrigatório)' },
                { name: 'className', type: 'string', desc: 'Classes adicionais' },
              ]} />
            </SubSection>
          </Section>

          {/* ── Back to top ─────────────────────────────────────────────────── */}
          <div className="flex justify-center mt-8 pb-12">
            <a href="#" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
              ↑ Voltar ao topo
            </a>
          </div>
        </main>
      </div>
    </div>
  );
}
