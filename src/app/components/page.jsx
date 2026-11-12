'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Drawer,
  LeftDrawer,
  RightDrawer,
  DrawerToggle,
  DrawerHeader,
  DrawerContent,
  DrawerFooter,
} from '@/components/ui/drawer';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHome,
  faCube,
  faSliders,
  faBell,
  faCog,
  faCheck,
  faLayerGroup,
  faWindowMaximize,
  faMobileScreen,
  faBook,
  faCode,
  faExchangeAlt,
  faArrowLeft,
} from '@fortawesome/free-solid-svg-icons';

export default function ComponentsDocPage() {
  // Estados para o Live Playground Demonstrativo
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(false);
  const [leftCompact, setLeftCompact] = useState(false);
  const [demoVariant, setDemoVariant] = useState('responsive'); // 'responsive' | 'temporary' | 'persistent'
  const [customContentMode, setCustomContentMode] = useState(false);

  // Itens de navegação para o Left Drawer da demo
  const navItems = [
    { id: 'home', label: 'Dashboard Principal', href: '/', icon: <FontAwesomeIcon icon={faHome} />, active: false },
    { id: 'components', label: 'Documentação /components', href: '/components', icon: <FontAwesomeIcon icon={faCube} />, active: true, badge: 'Novo' },
    { id: 'settings', label: 'Configurações Globais', href: '#', icon: <FontAwesomeIcon icon={faCog} />, active: false },
  ];

  // Presets para os cenários requisitados
  const applyPreset = (preset) => {
    switch (preset) {
      case 'left-open':
        setLeftOpen(true);
        setRightOpen(false);
        setDemoVariant('responsive');
        break;
      case 'left-closed':
        setLeftOpen(false);
        setRightOpen(false);
        setDemoVariant('responsive');
        break;
      case 'right-open':
        setLeftOpen(false);
        setRightOpen(true);
        setDemoVariant('responsive');
        break;
      case 'right-closed':
        setRightOpen(false);
        setDemoVariant('responsive');
        break;
      case 'both-open':
        setLeftOpen(true);
        setRightOpen(true);
        setDemoVariant('responsive');
        break;
      case 'both-closed':
        setLeftOpen(false);
        setRightOpen(false);
        setDemoVariant('responsive');
        break;
      case 'temporary':
        setDemoVariant('temporary');
        setLeftOpen(true);
        break;
      case 'permanent':
        setDemoVariant('persistent');
        setLeftOpen(true);
        setRightOpen(true);
        break;
      case 'custom-content':
        setCustomContentMode(true);
        setRightOpen(true);
        break;
      default:
        break;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Header Fixo de Navegação Superior */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 px-4 py-3 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="w-3.5 h-3.5" />
              <span>Voltar ao Dashboard</span>
            </Link>
            <span className="h-4 w-px bg-slate-200 dark:bg-slate-700 hidden sm:inline-block" />
            <h1 className="text-base sm:text-lg font-bold flex items-center gap-2">
              <FontAwesomeIcon icon={faCube} className="text-blue-600 dark:text-blue-400" />
              <span>Catálogo & Demonstrações de Componentes</span>
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800">
              Next.js 16 + React 19
            </span>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 space-y-12">
        {/* Introdução */}
        <section className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white rounded-2xl p-6 sm:p-8 shadow-lg">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold backdrop-blur">
              <FontAwesomeIcon icon={faLayerGroup} className="w-3 h-3" />
              <span>Arquitetura de Gavetas Duplas Reutilizáveis</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              LeftDrawer & RightDrawer Interativos
            </h2>
            <p className="text-blue-100 text-sm sm:text-base leading-relaxed">
              Sistema completo de gavetas modulares que compartilham uma estrutura base (<code className="bg-black/20 px-1.5 py-0.5 rounded text-white font-mono">Drawer</code>),
              com suporte a estado controlado/não controlado, persistência sem hydration mismatch, modos responsivo, temporário e persistente, e acessibilidade WAI-ARIA com gerenciamento de foco e ESC.
            </p>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SEÇÃO DE DEMONSTRAÇÃO INTERATIVA / PLAYGROUND AO VIVO */}
        {/* ========================================================================= */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                <FontAwesomeIcon icon={faWindowMaximize} className="text-indigo-600 dark:text-indigo-400" />
                <span>Demonstração Interativa ao Vivo</span>
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Teste todos os estados, permutações e variantes clicando nos botões abaixo ou diretamente nos toggles permanentes.
              </p>
            </div>

            {/* Status dos drawers em tempo real */}
            <div className="flex items-center gap-3 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-xl shadow-sm">
              <span className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${leftOpen ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                Left: <strong>{leftOpen ? 'OPEN' : 'CLOSED'}</strong>
              </span>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <span className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${rightOpen ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                Right: <strong>{rightOpen ? 'OPEN' : 'CLOSED'}</strong>
              </span>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <span>Modo: <strong>{demoVariant}</strong></span>
            </div>
          </div>

          {/* Botões de Presets Rápidos Requisitados */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Cenários Obrigatórios para Teste Rápido:
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => applyPreset('left-open')}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 dark:bg-slate-800 dark:hover:bg-blue-900/40 dark:text-slate-300 dark:hover:text-blue-300 border border-slate-200 dark:border-slate-700 transition"
              >
                1. Left Drawer Aberto
              </button>
              <button
                type="button"
                onClick={() => applyPreset('left-closed')}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 dark:bg-slate-800 dark:hover:bg-blue-900/40 dark:text-slate-300 dark:hover:text-blue-300 border border-slate-200 dark:border-slate-700 transition"
              >
                2. Left Drawer Fechado
              </button>
              <button
                type="button"
                onClick={() => applyPreset('right-open')}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 dark:bg-slate-800 dark:hover:bg-blue-900/40 dark:text-slate-300 dark:hover:text-blue-300 border border-slate-200 dark:border-slate-700 transition"
              >
                3. Right Drawer Aberto
              </button>
              <button
                type="button"
                onClick={() => applyPreset('right-closed')}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 dark:bg-slate-800 dark:hover:bg-blue-900/40 dark:text-slate-300 dark:hover:text-blue-300 border border-slate-200 dark:border-slate-700 transition"
              >
                4. Right Drawer Fechado
              </button>
              <button
                type="button"
                onClick={() => applyPreset('both-open')}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 transition"
              >
                5. Ambos Abertos Simultaneamente
              </button>
              <button
                type="button"
                onClick={() => applyPreset('both-closed')}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800 transition"
              >
                6. Ambos Fechados
              </button>
              <button
                type="button"
                onClick={() => applyPreset('temporary')}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-50 hover:bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:hover:bg-purple-900/60 dark:text-purple-300 border border-purple-300 dark:border-purple-800 transition"
              >
                7. Drawer Temporário (Modal com Overlay & ESC)
              </button>
              <button
                type="button"
                onClick={() => applyPreset('permanent')}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800 transition"
              >
                8. Drawer Permanente (Desktop Layout)
              </button>
              <button
                type="button"
                onClick={() => applyPreset('custom-content')}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-50 hover:bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800 transition"
              >
                9. Drawer com Conteúdo Personalizado
              </button>
            </div>
          </div>

          {/* Área de Visualização Sandbox */}
          <div className="relative border-2 border-slate-300 dark:border-slate-700 rounded-2xl overflow-hidden min-h-[500px] flex bg-slate-100 dark:bg-slate-900 shadow-inner">
            {/* LEFT DRAWER DA DEMO */}
            <LeftDrawer
              open={leftOpen}
              onOpenChange={setLeftOpen}
              compact={leftCompact}
              onCompactChange={setLeftCompact}
              variant={demoVariant}
              storageKey="demo:left-drawer"
              items={navItems}
              title="Menu Demonstrativo"
              subtitle="Navegação em árvore"
              footer={
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>v1.0.0</span>
                  <button
                    type="button"
                    onClick={() => setLeftCompact(!leftCompact)}
                    className="hover:underline text-blue-600 dark:text-blue-400"
                  >
                    {leftCompact ? 'Expandir' : 'Modo Compacto'}
                  </button>
                </div>
              }
            />

            {/* ÁREA CENTRAL DO SANDBOX */}
            <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-950 transition-all duration-200">
              {/* Barra superior de controle integrada */}
              <div className="border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between gap-2 bg-slate-50 dark:bg-slate-900">
                {/* Botão de Toggle do Left Drawer SEMPRE ACESSÍVEL */}
                <div className="flex items-center gap-2">
                  <DrawerToggle
                    side="left"
                    open={leftOpen}
                    onToggle={() => setLeftOpen(!leftOpen)}
                    dataTestId="demo-left-toggle"
                    className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm"
                  />
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 hidden sm:inline">
                    Toggle Esquerdo ({leftOpen ? 'Aberto' : 'Fechado'})
                  </span>
                </div>

                <div className="text-center text-xs font-medium text-slate-500 dark:text-slate-400">
                  Área de Conteúdo Central Adaptativa
                </div>

                {/* Botão de Toggle do Right Drawer SEMPRE ACESSÍVEL */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 hidden sm:inline">
                    Toggle Direito ({rightOpen ? 'Aberto' : 'Fechado'})
                  </span>
                  <DrawerToggle
                    side="right"
                    open={rightOpen}
                    onToggle={() => setRightOpen(!rightOpen)}
                    dataTestId="demo-right-toggle"
                    className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm"
                  />
                </div>
              </div>

              {/* Corpo da Área Central */}
              <div className="p-6 space-y-4 overflow-y-auto max-h-[420px]">
                <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-sm">
                  <h4 className="font-bold text-blue-900 dark:text-blue-200 mb-1">
                    Regra Fundamental Atendida:
                  </h4>
                  <p className="text-blue-800 dark:text-blue-300">
                    O usuário nunca fica sem acesso ao botão de alteração de estado.
                    Se o drawer estiver aberto, exibe botão para fechá-lo. Se estiver fechado, mantém botão visível e acessível para reabri-lo.
                    Essa regra se aplica tanto ao Left quanto ao Right Drawer.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                    <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Left Drawer</span>
                    <p className="text-slate-500">
                      Responsável pela navegação principal, rotas, menu ativo e modo compacto com ícones no desktop.
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                    <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Right Drawer</span>
                    <p className="text-slate-500">
                      Responsável pelo painel contextual, notificações, configurações rápidas, filtros e detalhes.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT DRAWER DA DEMO */}
            <RightDrawer
              open={rightOpen}
              onOpenChange={setRightOpen}
              variant={demoVariant}
              storageKey="demo:right-drawer"
              title={customContentMode ? "Formulário & Detalhes" : "Painel Contextual"}
              subtitle={customContentMode ? "Conteúdo personalizado ativo" : "Ajustes rápidos e alertas"}
              footer={
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setRightOpen(false)}
                    className="w-full py-1.5 px-3 rounded-lg text-xs font-medium bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 transition"
                  >
                    Fechar Painel
                  </button>
                </div>
              }
            >
              {customContentMode ? (
                <div className="space-y-4 text-sm">
                  <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-lg border border-purple-200 dark:border-purple-900 text-purple-900 dark:text-purple-300 text-xs">
                    Demonstração de formulário rápido contextual inserido dinamicamente.
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Nome do Registro:
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Novo Relatório"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Prioridade:
                    </label>
                    <select className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs outline-none">
                      <option>Alta</option>
                      <option>Média</option>
                      <option>Baixa</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Notificações</span>
                      <span className="px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px]">3 novas</span>
                    </div>
                    <p className="text-slate-500">
                      Atualizações de status em tempo real do sistema.
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Configurações de Tela</span>
                    <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-400">
                      <input type="checkbox" defaultChecked className="rounded text-blue-600" />
                      <span>Transições suaves ativadas</span>
                    </label>
                  </div>
                </div>
              )}
            </RightDrawer>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SEÇÃO DE DOCUMENTAÇÃO DA API E PROPRIEDADES (PROPS) */}
        {/* ========================================================================= */}
        <section className="space-y-6">
          <div>
            <h3 className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
              <FontAwesomeIcon icon={faBook} className="text-blue-600 dark:text-blue-400" />
              <span>Referência de Propriedades (Props API)</span>
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Contratos completos de tipos, padrões e comportamentos dos componentes.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {/* Tabela Drawer Base */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
              <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
                <h4 className="font-bold text-sm font-mono text-blue-600 dark:text-blue-400">
                  &lt;Drawer /&gt; (Componente Base Compartilhado)
                </h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-3 font-semibold">Prop</th>
                      <th className="p-3 font-semibold">Tipo</th>
                      <th className="p-3 font-semibold">Padrão</th>
                      <th className="p-3 font-semibold">Descrição</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-600 dark:text-slate-400">
                    <tr>
                      <td className="p-3 font-mono text-indigo-600 dark:text-indigo-400">side</td>
                      <td className="p-3 font-mono">&apos;left&apos; | &apos;right&apos;</td>
                      <td className="p-3 font-mono">&apos;left&apos;</td>
                      <td className="p-3">Posicionamento lateral do drawer no viewport.</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono text-indigo-600 dark:text-indigo-400">variant</td>
                      <td className="p-3 font-mono">&apos;responsive&apos; | &apos;persistent&apos; | &apos;temporary&apos;</td>
                      <td className="p-3 font-mono">&apos;responsive&apos;</td>
                      <td className="p-3">Modo de exibição (overlay modal no mobile ou permanente no desktop).</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono text-indigo-600 dark:text-indigo-400">open</td>
                      <td className="p-3 font-mono">boolean</td>
                      <td className="p-3 font-mono">undefined</td>
                      <td className="p-3">Estado controlado de abertura.</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono text-indigo-600 dark:text-indigo-400">defaultOpen</td>
                      <td className="p-3 font-mono">boolean</td>
                      <td className="p-3 font-mono">false</td>
                      <td className="p-3">Estado inicial para uso não controlado.</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono text-indigo-600 dark:text-indigo-400">onOpenChange</td>
                      <td className="p-3 font-mono">(open: boolean) =&gt; void</td>
                      <td className="p-3 font-mono">undefined</td>
                      <td className="p-3">Callback disparado na alteração do estado de abertura.</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono text-indigo-600 dark:text-indigo-400">storageKey</td>
                      <td className="p-3 font-mono">string</td>
                      <td className="p-3 font-mono">undefined</td>
                      <td className="p-3">Chave para persistência opcional no localStorage sem hydration mismatch.</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono text-indigo-600 dark:text-indigo-400">closeOnEsc</td>
                      <td className="p-3 font-mono">boolean</td>
                      <td className="p-3 font-mono">true</td>
                      <td className="p-3">Fecha a gaveta ao pressionar a tecla ESC no modo temporário.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tabela DrawerToggle */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
              <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
                <h4 className="font-bold text-sm font-mono text-emerald-600 dark:text-emerald-400">
                  &lt;DrawerToggle /&gt; (Botão Permanente de Alternância Obrigatório)
                </h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-3 font-semibold">Prop</th>
                      <th className="p-3 font-semibold">Tipo</th>
                      <th className="p-3 font-semibold">Padrão</th>
                      <th className="p-3 font-semibold">Descrição</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-600 dark:text-slate-400">
                    <tr>
                      <td className="p-3 font-mono text-indigo-600 dark:text-indigo-400">side</td>
                      <td className="p-3 font-mono">&apos;left&apos; | &apos;right&apos;</td>
                      <td className="p-3 font-mono">&apos;left&apos;</td>
                      <td className="p-3">Define o lado associado caso usado fora de contexto.</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono text-indigo-600 dark:text-indigo-400">onToggle</td>
                      <td className="p-3 font-mono">() =&gt; void</td>
                      <td className="p-3 font-mono">context.toggle</td>
                      <td className="p-3">Handler customizado para alternar o estado do drawer.</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono text-indigo-600 dark:text-indigo-400">aria-expanded</td>
                      <td className="p-3 font-mono">string (&apos;true&apos; | &apos;false&apos;)</td>
                      <td className="p-3 font-mono">automático</td>
                      <td className="p-3">Indica o estado para leitores de tela e acessibilidade.</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono text-indigo-600 dark:text-indigo-400">aria-controls</td>
                      <td className="p-3 font-mono">string</td>
                      <td className="p-3 font-mono">&apos;left-drawer&apos; / &apos;right-drawer&apos;</td>
                      <td className="p-3">ID do elemento de gaveta controlado.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SEÇÃO DE EXEMPLOS DE CÓDIGO */}
        {/* ========================================================================= */}
        <section className="space-y-4">
          <div>
            <h3 className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
              <FontAwesomeIcon icon={faCode} className="text-purple-600 dark:text-purple-400" />
              <span>Exemplos de Implementação de Código</span>
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Padrões recomendados para estado controlado e não controlado no Next.js 16.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Exemplo Controlado */}
            <div className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs overflow-x-auto shadow-md border border-slate-800">
              <div className="text-slate-400 mb-2 font-sans font-semibold text-xs border-b border-slate-800 pb-1">
                // 1. Estado Controlado Independente
              </div>
              <pre>{`const [leftOpen, setLeftOpen] = useState(true);
const [rightOpen, setRightOpen] = useState(false);

return (
  <div className="flex h-screen overflow-hidden">
    <LeftDrawer
      open={leftOpen}
      onOpenChange={setLeftOpen}
      items={navigationRoutes}
    />

    <main className="flex-1 flex flex-col">
      <header className="flex justify-between p-4">
        <DrawerToggle side="left" open={leftOpen} onToggle={() => setLeftOpen(!leftOpen)} />
        <DrawerToggle side="right" open={rightOpen} onToggle={() => setRightOpen(!rightOpen)} />
      </header>
      <div className="flex-1 overflow-auto p-6">{children}</div>
    </main>

    <RightDrawer
      open={rightOpen}
      onOpenChange={setRightOpen}
    >
      <NotificationsPanel />
    </RightDrawer>
  </div>
);`}</pre>
            </div>

            {/* Exemplo Não Controlado */}
            <div className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs overflow-x-auto shadow-md border border-slate-800">
              <div className="text-slate-400 mb-2 font-sans font-semibold text-xs border-b border-slate-800 pb-1">
                // 2. Estado Não Controlado com Persistência
              </div>
              <pre>{`// O Drawer gerencia seu próprio estado internamente
// sincronizando automaticamente com localStorage sem hydration mismatch

return (
  <div className="flex h-screen">
    <LeftDrawer
      defaultOpen={true}
      storageKey="app:left-drawer"
      items={menuItems}
    />

    <main className="flex-1">
      <header>
        <DrawerToggle side="left" />
        <DrawerToggle side="right" />
      </header>
      <div>Conteúdo principal do app</div>
    </main>

    <RightDrawer
      defaultOpen={false}
      storageKey="app:right-drawer"
    >
      <ContextualTools />
    </RightDrawer>
  </div>
);`}</pre>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* REQUISITOS DE ACESSIBILIDADE E COMPORTAMENTO RESPONSIVO */}
        {/* ========================================================================= */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
          <h3 className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white">
            <FontAwesomeIcon icon={faMobileScreen} className="text-emerald-600 dark:text-emerald-400" />
            <span>Acessibilidade e Comportamento Responsivo</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <strong className="text-slate-800 dark:text-slate-200 font-semibold block">Navegação por Teclado</strong>
              <p className="text-slate-600 dark:text-slate-400">
                Os botões de alternância respondem às teclas <kbd className="px-1 py-0.5 bg-slate-200 dark:bg-slate-700 rounded">Enter</kbd> e <kbd className="px-1 py-0.5 bg-slate-200 dark:bg-slate-700 rounded">Espaço</kbd>.
                No fechamento por <kbd className="px-1 py-0.5 bg-slate-200 dark:bg-slate-700 rounded">ESC</kbd>, o foco retorna ao botão disparador.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <strong className="text-slate-800 dark:text-slate-200 font-semibold block">Gerenciamento de Foco</strong>
              <p className="text-slate-600 dark:text-slate-400">
                Em modo modal temporário, o foco é mantido ciclando exclusivamente dentro da gaveta (Focus Trap), evitando que navegue para elementos do fundo.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <strong className="text-slate-800 dark:text-slate-200 font-semibold block">Bloqueio de Scroll e Overlay</strong>
              <p className="text-slate-600 dark:text-slate-400">
                Em telas mobile ou modo temporário, o scroll do corpo da página é bloqueado (<code className="font-mono">overflow: hidden</code>) enquanto a gaveta estiver aberta.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 text-center text-xs text-slate-500">
        Next16 Template — LeftDrawer & RightDrawer Architecture & Documentation
      </footer>
    </div>
  );
}
