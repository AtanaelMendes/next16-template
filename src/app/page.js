'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  LeftDrawer,
  RightDrawer,
  DrawerToggle,
  DrawerHeader,
  DrawerContent,
  DrawerFooter,
} from '@/components/ui/drawer';
import PieChart from '@/components/ui/charts/PieChart';
import AnswersChart from '@/components/ui/charts/AnswersChart';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHome,
  faCube,
  faChartPie,
  faUsers,
  faBell,
  faCog,
  faShieldHalved,
  faCheckCircle,
  faBolt,
  faArrowRight,
} from '@fortawesome/free-solid-svg-icons';

export default function DashboardPage() {
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const [leftCompact, setLeftCompact] = useState(false);

  // Itens de navegação principal para o LeftDrawer
  const navItems = [
    {
      id: 'dashboard',
      label: 'Visão Geral',
      href: '/',
      icon: <FontAwesomeIcon icon={faHome} />,
      active: true,
    },
    {
      id: 'components',
      label: 'Catálogo /components',
      href: '/components',
      icon: <FontAwesomeIcon icon={faCube} />,
      active: false,
      badge: 'Docs',
    },
    {
      id: 'analytics',
      label: 'Métricas & Gráficos',
      href: '#',
      icon: <FontAwesomeIcon icon={faChartPie} />,
      active: false,
    },
    {
      id: 'users',
      label: 'Equipe & Permissões',
      href: '#',
      icon: <FontAwesomeIcon icon={faUsers} />,
      active: false,
    },
  ];

  // Dados para os gráficos demonstrativos SVG
  const pieData = [
    { label: 'Concluídas', value: 45 },
    { label: 'Em Andamento', value: 30 },
    { label: 'Pendentes', value: 15 },
    { label: 'Canceladas', value: 10 },
  ];

  const answersData = [
    { label: 'Jan', value: 65, total: 100 },
    { label: 'Fev', value: 80, total: 100 },
    { label: 'Mar', value: 92, total: 100 },
    { label: 'Abr', value: 75, total: 100 },
    { label: 'Mai', value: 88, total: 100 },
  ];

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      {/* ========================================================================= */}
      {/* 1. LEFT DRAWER (Navegação Principal) */}
      {/* ========================================================================= */}
      <LeftDrawer
        open={leftOpen}
        onOpenChange={setLeftOpen}
        compact={leftCompact}
        onCompactChange={setLeftCompact}
        storageKey="app:dashboard:left-drawer"
        items={navItems}
        title="Next16 Template"
        subtitle="Painel de Navegação"
        footer={
          <div className="flex flex-col gap-2 text-xs text-slate-500">
            <Link
              href="/components"
              className="flex items-center justify-between p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium hover:underline"
            >
              <span>Ver /components</span>
              <FontAwesomeIcon icon={faArrowRight} className="w-3 h-3" />
            </Link>
            <div className="flex items-center justify-between px-1">
              <span>Next.js 16.4</span>
              <button
                type="button"
                onClick={() => setLeftCompact(!leftCompact)}
                className="hover:underline text-blue-600 dark:text-blue-400"
              >
                {leftCompact ? 'Expandir' : 'Modo Compacto'}
              </button>
            </div>
          </div>
        }
      />

      {/* ========================================================================= */}
      {/* 2. ÁREA CENTRAL RESPONSIVA (Header + Main) */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden transition-all duration-200">
        {/* HEADER CENTRAL */}
        <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur px-4 flex items-center justify-between shrink-0 shadow-sm z-50 relative">
          {/* Botão de Toggle do Left Drawer SEMPRE VISÍVEL E ACESSÍVEL */}
          <div className="flex items-center gap-3">
            <DrawerToggle
              side="left"
              open={leftOpen}
              onToggle={() => setLeftOpen((prev) => !prev)}
              className="border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
            <div className="flex flex-col">
              <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                Template Corporativo
              </span>
              <h2 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <span>Dashboard Principal</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
                  Online
                </span>
              </h2>
            </div>
          </div>

          {/* Links e Botão de Toggle do Right Drawer SEMPRE ACESSÍVEL */}
          <div className="flex items-center gap-3">
            <Link
              href="/components"
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition"
            >
              <FontAwesomeIcon icon={faCube} className="w-3.5 h-3.5" />
              <span>Documentação de Componentes</span>
            </Link>

            <DrawerToggle
              side="right"
              open={rightOpen}
              onToggle={() => setRightOpen((prev) => !prev)}
              className="border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
          </div>
        </header>

        {/* MAIN BODY RESPONSIVO */}
        <main
          data-testid="dashboard-main"
          className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6"
        >
          {/* Banner de Boas-Vindas */}
          <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/20 text-xs font-semibold backdrop-blur">
                <FontAwesomeIcon icon={faBolt} className="w-3 h-3 text-amber-300" />
                <span>Next.js 16 + React 19 Nativo</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Painel Integrado com Gavetas Duplas
              </h1>
              <p className="text-sm text-blue-100 max-w-xl">
                Dependências legadas removidas com sucesso.
                Controle completo de Left e Right Drawer com botões permanentemente acessíveis em todos os estados.
              </p>
            </div>

            <div className="flex gap-3 shrink-0">
              <Link
                href="/components"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-white text-blue-900 hover:bg-blue-50 transition shadow"
              >
                Explorar /components
              </Link>
            </div>
          </div>

          {/* Cards de Métricas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Cliente HTTP
              </span>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  Fetch Nativo
                </span>
                <FontAwesomeIcon icon={faCheckCircle} className="text-emerald-500 w-5 h-5" />
              </div>
              <p className="text-[11px] text-slate-400">100% nativo com Fetch API.</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Gráficos Leves
              </span>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  SVG + React
                </span>
                <FontAwesomeIcon icon={faChartPie} className="text-blue-500 w-5 h-5" />
              </div>
              <p className="text-[11px] text-slate-400">Gráficos SVG puros e responsivos.</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Left Drawer
              </span>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                  {leftOpen ? 'Expandido' : 'Recolhido'}
                </span>
                <button
                  type="button"
                  onClick={() => setLeftOpen(!leftOpen)}
                  className="text-xs px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300"
                >
                  Alternar
                </button>
              </div>
              <p className="text-[11px] text-slate-400">Navegação e árvore de rotas.</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Right Drawer
              </span>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                  {rightOpen ? 'Visível' : 'Oculto'}
                </span>
                <button
                  type="button"
                  onClick={() => setRightOpen(!rightOpen)}
                  className="text-xs px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300"
                >
                  Alternar
                </button>
              </div>
              <p className="text-[11px] text-slate-400">Painel contextual e ações rápidas.</p>
            </div>
          </div>

          {/* Gráficos Demonstrativos SVG */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <FontAwesomeIcon icon={faChartPie} className="text-blue-500" />
                  <span>Distribuição de Tarefas (Gráfico Pie SVG)</span>
                </h3>
                <span className="text-xs text-slate-400 font-mono">100% SVG nativo</span>
              </div>
              <div className="min-h-[280px] flex items-center justify-center">
                <PieChart chartData={pieData} nmChart="dashboard-pie" height="280px" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <FontAwesomeIcon icon={faBolt} className="text-amber-500" />
                  <span>Desempenho Mensal (Gráfico SVG)</span>
                </h3>
                <span className="text-xs text-slate-400 font-mono">Reutilizável</span>
              </div>
              <div className="min-h-[280px] flex items-center justify-center">
                <AnswersChart data={answersData} height="280px" />
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ========================================================================= */}
      {/* 3. RIGHT DRAWER (Painel Contextual) */}
      {/* ========================================================================= */}
      <RightDrawer
        open={rightOpen}
        onOpenChange={setRightOpen}
        storageKey="app:dashboard:right-drawer"
        title="Painel Contextual"
        subtitle="Notificações e ajustes do sistema"
        footer={
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Preferências sincronizadas</span>
            <button
              type="button"
              onClick={() => setRightOpen(false)}
              className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium transition"
            >
              Fechar
            </button>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900">
            <span className="font-bold text-blue-900 dark:text-blue-300 block mb-1">
              Status da Aplicação
            </span>
            <p className="text-blue-800 dark:text-blue-400">
              Todos os módulos estão atualizados de acordo com as regras estabelecidas.
            </p>
          </div>

          <div className="space-y-2">
            <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
              Notificações Recentes
            </span>
            <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
              <div className="flex items-center justify-between">
                <strong className="text-slate-800 dark:text-slate-200">Dependências</strong>
                <span className="text-[10px] text-emerald-600 font-bold">Removidas</span>
              </div>
              <p className="text-slate-500">Bibliotecas legadas foram expurgadas do template.</p>
            </div>

            <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
              <div className="flex items-center justify-between">
                <strong className="text-slate-800 dark:text-slate-200">Gavetas</strong>
                <span className="text-[10px] text-blue-600 font-bold">Ativas</span>
              </div>
              <p className="text-slate-500">Toggles sempre acessíveis e layout responsivo.</p>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
            <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
              Acesso Rápido
            </span>
            <Link
              href="/components"
              className="block w-full py-2 px-3 text-center rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition"
            >
              Abrir Demonstrações /components
            </Link>
          </div>
        </div>
      </RightDrawer>
    </div>
  );
}
