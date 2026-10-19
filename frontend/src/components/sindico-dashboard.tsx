"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Icon, type IconName } from "@/components/icon";
import { CondoMap, type CondoMapOccurrence, type CondoCoordinates } from "@/components/condo-map";
import { ackOccurrenceAction } from "@/lib/actions/portaria";
import { createWorkOrderFromOccurrenceAction } from "@/lib/actions/admin";

export type SindicoTodaySummary = {
  expectedVisitors: number;
  authorizedProviders: number;
  todayReservations: number;
  scheduledMaintenances: number;
  inProgressOccurrences: number;
};

export type SmartPreventionAlert = {
  id: string;
  equipmentName: string;
  location: string;
  issueCount: number;
  patternDescription: string;
  recommendedAction: string;
};

export type LogbookEntry = {
  id: number;
  code: string;
  title: string;
  description: string;
  category: string;
  severity: string;
  visibility: string;
  occurredAt: string;
  timeAgo: string;
  ackAt: string | null;
  reporterName: string;
  unit?: string;
};

export type ManagementOccurrence = {
  id: number;
  code: string;
  title: string;
  description?: string;
  category: string;
  severity: string;
  status: string;
  exactLocation?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  createdAt: string;
  unitNumber?: string | null;
  blockName?: string | null;
  reportedByName?: string | null;
  assignedToName?: string | null;
};

export type AttentionItem = {
  id: string;
  count: number;
  label: string;
  detail?: string;
  href: string;
  urgent?: boolean;
};

export type DashboardOccurrence = {
  id: number;
  code: string;
  title: string;
  location: string;
  category: string;
  severity: string;
  status: string;
  timeAgo: string;
};

export function SindicoDashboard({
  userName,
  condoName,
  attentionItems,
  todaySummary,
  smartAlerts = [],
  logbookEntries = [],
  recentActivities = [],
  mapOccurrences = [],
  condoCoordinates,
}: {
  userName: string;
  condoName: string;
  attentionItems: AttentionItem[];
  todaySummary: SindicoTodaySummary;
  smartAlerts?: SmartPreventionAlert[];
  logbookEntries?: LogbookEntry[];
  recentActivities?: DashboardOccurrence[];
  mapOccurrences?: CondoMapOccurrence[];
  condoCoordinates?: CondoCoordinates;
}) {
  const [selectedOccurrenceForOS, setSelectedOccurrenceForOS] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleAck = (id: number) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", String(id));
      await ackOccurrenceAction(formData);
      setFeedback({ type: "success", msg: "Ciência registrada no livro digital da portaria!" });
      setTimeout(() => setFeedback(null), 3500);
    });
  };

  const handleCreateOS = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await createWorkOrderFromOccurrenceAction(formData);
      setFeedback({ type: "success", msg: "Ordem de serviço criada e vinculada à ocorrência!" });
      setSelectedOccurrenceForOS(null);
      setTimeout(() => setFeedback(null), 3500);
    });
  };

  // Ícones mapeados por tipo de item de atenção
  const getAttentionIcon = (id: string): IconName => {
    if (id.includes("occurrence")) return "clipboard";
    if (id.includes("reservation")) return "calendar";
    if (id.includes("maintenance")) return "shield";
    if (id.includes("order") || id.includes("unassigned")) return "wrench";
    if (id.includes("suggestion")) return "megaphone";
    return "alert-triangle";
  };

  // Fallbacks de ações caso haja menos de 4 itens de atenção pendentes
  const fallbackActions = [
    {
      id: "action-comunicado",
      count: undefined,
      label: "Criar comunicado",
      detail: "Enviar aviso geral ou convocação",
      href: "/painel/comunicados",
      icon: "mail" as IconName,
      urgent: false,
    },
    {
      id: "action-ordens",
      count: undefined,
      label: "Ordem de serviço",
      detail: "Reparo, equipe ou OS interna",
      href: "/painel/ordens",
      icon: "wrench" as IconName,
      urgent: false,
    },
    {
      id: "action-manutencao",
      count: undefined,
      label: "Cadastrar manutenção",
      detail: "Plano preventivo de ativos",
      href: "/painel/manutencao",
      icon: "shield" as IconName,
      urgent: false,
    },
    {
      id: "action-servicos",
      count: undefined,
      label: "Contratar prestador",
      detail: "Marketplace e parceiros",
      href: "/painel/servicos",
      icon: "briefcase" as IconName,
      urgent: false,
    },
  ];

  // Montar exatamente 4 cards para a linha: atenção prioritária primeiro, completado com ações
  const activeAttention = attentionItems.filter((i) => i.count > 0);
  const displayCards = [
    ...activeAttention.slice(0, 4).map((item) => ({
      id: item.id,
      count: item.count,
      label: item.label,
      detail: item.detail,
      href: item.href,
      icon: getAttentionIcon(item.id),
      urgent: item.urgent,
    })),
    ...fallbackActions,
  ].slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`flex items-center justify-between p-4 rounded-xl text-sm font-semibold border ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <Icon name={feedback.type === "success" ? "check" : "alert-triangle"} size={18} />
            <span>{feedback.msg}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
            <Icon name="x" size={16} />
          </button>
        </div>
      )}

      {/* 1. CABEÇALHO EXECUTIVO DA GESTÃO */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Olá, {userName}
            </h1>
            <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-[#1355FF] border border-blue-200/60">
              Administração
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-normal mt-0.5">
            {condoName} · Central de Decisão e Governança
          </p>
        </div>

        {/* Ações Rápidas no Topo */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <Link
            href="/painel/relatorios"
            className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-3 py-1.5 text-xs font-semibold transition-colors shadow-2xs"
          >
            <Icon name="chart" size={14} />
            <span>Relatórios</span>
          </Link>
          <Link
            href="/painel/configuracoes"
            className="btn-primary min-h-9 px-3.5 py-1.5 text-xs font-semibold"
          >
            <Icon name="settings" size={14} />
            <span>Configurações</span>
          </Link>
        </div>
      </section>

      {/* 2. PRECISA DA SUA ATENÇÃO (Cards compactos e consistentes no azul primário) */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-blue-50 text-[#1355FF]">
              <Icon name="alert-triangle" size={12} />
            </span>
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Precisa da sua Atenção
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-normal">
            Priorize aprovações e ações críticas
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {displayCards.map((card) => {
            const hasUrgent = card.urgent || (card.count !== undefined && card.count > 0);
            return (
              <Link
                key={card.id}
                href={card.href}
                className="group flex flex-col justify-between rounded-lg border border-slate-200/90 bg-white p-3.5 shadow-2xs hover:border-blue-200 hover:shadow-xs transition-colors"
              >
                <div className="flex items-center justify-between">
                  {card.count !== undefined ? (
                    <span className="text-2xl font-bold tabular-nums tracking-tight text-slate-900 group-hover:text-[#1355FF] transition-colors">
                      {card.count}
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-slate-400">—</span>
                  )}
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-md ${
                      hasUrgent ? "bg-blue-50 text-[#1355FF]" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    <Icon name={card.icon} size={14} />
                  </span>
                </div>

                <div className="pt-2">
                  <h3 className="text-xs font-semibold text-slate-900 group-hover:text-[#1355FF] transition-colors truncate">
                    {card.label}
                  </h3>
                  {card.detail && (
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {card.detail}
                    </p>
                  )}
                </div>

                <div className="pt-2.5 mt-2 border-t border-slate-100 flex justify-between items-center text-[11px] font-semibold text-[#1355FF]">
                  <span>Acessar</span>
                  <Icon name="arrow-up-right" size={12} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 3. RESUMO DA GESTÃO (Indicadores Operacionais) */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Resumo Operacional
          </h2>
          <span className="text-xs text-slate-400 font-normal">Indicadores do dia</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Card 1: Ocorrências Abertas */}
          <div className="flex flex-col justify-between rounded-lg border border-slate-200/90 bg-white p-4 shadow-2xs hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between pb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Ocorrências
              </span>
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-50 text-[#1355FF]">
                <Icon name="clipboard" size={14} />
              </span>
            </div>
            <div className="space-y-0.5">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
                  {todaySummary.inProgressOccurrences}
                </span>
                <span className="text-[11px] font-medium text-blue-700 bg-blue-50 border border-blue-200/60 px-1.5 py-0.2 rounded">
                  abertas
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Chamados e relatos de moradores.
              </p>
            </div>
            <div className="pt-3 mt-2 border-t border-slate-100 flex justify-between items-center text-xs font-semibold">
              <Link href="/painel/ocorrencias" className="text-[#1355FF] hover:underline flex items-center gap-1">
                <span>Gerenciar todas</span>
                <Icon name="arrow-up-right" size={12} />
              </Link>
            </div>
          </div>

          {/* Card 2: Ordens & Manutenções */}
          <div className="flex flex-col justify-between rounded-lg border border-slate-200/90 bg-white p-4 shadow-2xs hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between pb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Manutenções
              </span>
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-50 text-amber-700">
                <Icon name="wrench" size={14} />
              </span>
            </div>
            <div className="space-y-0.5">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
                  {todaySummary.scheduledMaintenances}
                </span>
                <span className="text-[11px] font-medium text-amber-800 bg-amber-50 border border-amber-200/60 px-1.5 py-0.2 rounded">
                  agendadas
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Equipamentos e ordens ativas.
              </p>
            </div>
            <div className="pt-3 mt-2 border-t border-slate-100 flex justify-between items-center text-xs font-semibold">
              <Link href="/painel/manutencao" className="text-[#1355FF] hover:underline flex items-center gap-1">
                <span>Plano preventivo</span>
                <Icon name="arrow-up-right" size={12} />
              </Link>
            </div>
          </div>

          {/* Card 3: Reservas de Hoje */}
          <div className="flex flex-col justify-between rounded-lg border border-slate-200/90 bg-white p-4 shadow-2xs hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between pb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Reservas Hoje
              </span>
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-50 text-indigo-700">
                <Icon name="calendar" size={14} />
              </span>
            </div>
            <div className="space-y-0.5">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
                  {todaySummary.todayReservations}
                </span>
                <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-1.5 py-0.2 rounded">
                  confirmadas
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Espaços comuns em uso hoje.
              </p>
            </div>
            <div className="pt-3 mt-2 border-t border-slate-100 flex justify-between items-center text-xs font-semibold">
              <Link href="/painel/reservas" className="text-[#1355FF] hover:underline flex items-center gap-1">
                <span>Ver calendário</span>
                <Icon name="arrow-up-right" size={12} />
              </Link>
            </div>
          </div>

          {/* Card 4: Portaria & Movimento */}
          <div className="flex flex-col justify-between rounded-lg border border-slate-200/90 bg-white p-4 shadow-2xs hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between pb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Portaria & Acessos
              </span>
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
                <Icon name="users" size={14} />
              </span>
            </div>
            <div className="space-y-0.5">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
                  {todaySummary.expectedVisitors + todaySummary.authorizedProviders}
                </span>
                <span className="text-[11px] font-medium text-slate-700 bg-slate-100 border border-slate-200/60 px-1.5 py-0.2 rounded">
                  previstos
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {todaySummary.expectedVisitors} visitantes e {todaySummary.authorizedProviders} prestadores.
              </p>
            </div>
            <div className="pt-3 mt-2 border-t border-slate-100 flex justify-between items-center text-xs font-semibold">
              <Link href="/painel/visitantes" className="text-[#1355FF] hover:underline flex items-center gap-1">
                <span>Portaria ao vivo</span>
                <Icon name="arrow-up-right" size={12} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 4. PREVENÇÃO INTELIGENTE & ATIVOS CRÍTICOS + LIVRO DIGITAL DA PORTARIA (2 Colunas) */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        {/* Coluna 1: Prevenção Inteligente & Ativos Críticos */}
        <div className="rounded-lg border border-slate-200/90 bg-white p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-blue-50 text-[#1355FF]">
                <Icon name="shield" size={13} />
              </span>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                Prevenção & Ativos
              </h3>
            </div>
            <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-200/60 px-2 py-0.5 rounded">
              Diagnóstico Proativo
            </span>
          </div>

          {smartAlerts.length === 0 ? (
            <div className="py-6 flex flex-col items-center justify-center text-center space-y-1.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-blue-50 text-[#1355FF] mb-1">
                <Icon name="shield" size={20} />
              </span>
              <p className="text-xs font-bold text-slate-800">Ativos com Saúde Normal</p>
              <p className="text-[11px] text-slate-400 max-w-xs">
                Elevadores, bombas e portões sem registros de falha recorrente nos últimos 30 dias.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {smartAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-3.5 rounded-xl border border-amber-200/80 bg-amber-50/40 flex flex-col justify-between space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold text-slate-900">{alert.equipmentName}</p>
                      <p className="text-[11px] text-slate-600 mt-0.5">{alert.patternDescription}</p>
                    </div>
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded shrink-0">
                      {alert.location}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-amber-200/50 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-900">{alert.recommendedAction}</span>
                    <Link
                      href="/painel/manutencao"
                      className="px-2.5 py-1 bg-[#1355FF] hover:bg-[#0D47E6] text-white text-[11px] font-bold rounded-lg transition-colors shrink-0"
                    >
                      Agendar
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Coluna 2: Livro Digital da Portaria */}
        <div className="rounded-lg border border-slate-200/90 bg-white p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-indigo-50 text-indigo-700">
                <Icon name="book" size={13} />
              </span>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                Livro Digital da Portaria
              </h3>
            </div>
            <Link href="/painel/livro" className="text-xs font-semibold text-[#1355FF] hover:underline">
              Ver todos
            </Link>
          </div>

          {logbookEntries.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">
              Nenhum registro no livro digital recentemente.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {logbookEntries.slice(0, 4).map((log) => (
                <div key={log.id} className="py-3 flex items-start justify-between gap-3">
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-black text-slate-700">{log.code}</span>
                      <span className="text-xs font-bold text-slate-900 truncate">{log.title}</span>
                      <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-semibold rounded">
                        {log.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-1">{log.description}</p>
                    <p className="text-[11px] text-slate-400">
                      {log.reporterName} {log.unit ? `· ${log.unit}` : ""} · {log.timeAgo}
                    </p>
                  </div>
                  <div className="shrink-0 flex flex-col gap-1 items-end">
                    {!log.ackAt ? (
                      <button
                        onClick={() => handleAck(log.id)}
                        disabled={isPending}
                        className="px-2.5 py-1 bg-[#1355FF] text-white text-[11px] font-bold rounded-lg hover:bg-[#0044AA] cursor-pointer"
                      >
                        Dar Ciência
                      </button>
                    ) : (
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded">
                        Ciência dada
                      </span>
                    )}
                    <button
                      onClick={() => setSelectedOccurrenceForOS(log.id)}
                      className="text-[11px] font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
                    >
                      + Criar OS
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 5. OCORRÊNCIAS EM ANDAMENTO */}
      <section className="rounded-lg border border-slate-200/90 bg-white p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-blue-50 text-[#1355FF]">
              <Icon name="clipboard" size={13} />
            </span>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
              Ocorrências em Andamento
            </h3>
          </div>
          <Link href="/painel/ocorrencias" className="text-xs font-semibold text-[#1355FF] hover:underline">
            Gerenciar todas
          </Link>
        </div>

        {recentActivities.length === 0 ? (
          <div className="py-6 flex flex-col items-center justify-center text-center">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-50 text-emerald-600 mb-1">
              <Icon name="check" size={16} />
            </span>
            <p className="text-xs font-medium text-slate-600">
              Nenhuma ocorrência em andamento no momento.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentActivities.slice(0, 6).map((occ) => (
              <div key={occ.id} className="py-2.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-slate-700">{occ.code}</span>
                    <span className="text-xs font-semibold text-slate-900 truncate">{occ.title}</span>
                    <span className="px-1.5 py-0.2 bg-blue-50 text-[#1355FF] border border-blue-200/60 text-[10px] font-medium rounded">
                      {occ.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                    {occ.location} · {occ.timeAgo}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedOccurrenceForOS(occ.id)}
                  className="btn-primary min-h-7.5 px-3 py-1 text-xs shrink-0 cursor-pointer"
                >
                  Gerar OS
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* MODAL: CRIAR OS A PARTIR DE OCORRÊNCIA */}
      {selectedOccurrenceForOS && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-[16px] max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Icon name="wrench" size={18} className="text-[#1355FF]" />
                Criar Ordem de Serviço
              </h3>
              <button
                onClick={() => setSelectedOccurrenceForOS(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <Icon name="x" size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateOS} className="space-y-3 mt-4 text-xs">
              <input type="hidden" name="occurrenceId" value={selectedOccurrenceForOS} />

              <div>
                <label className="block font-bold text-slate-700 mb-1">Título da Ordem de Serviço</label>
                <input
                  name="title"
                  required
                  placeholder="Ex: Reparo hidráulico urgente"
                  className="w-full input text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Data Prevista de Execução</label>
                  <input type="date" name="scheduledFor" className="w-full input text-sm" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Custo Estimado (R$)</label>
                  <input name="cost" placeholder="0,00" className="w-full input text-sm" />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Técnico / Responsável Designado</label>
                <input
                  name="technician"
                  placeholder="Ex: Equipe de Manutenção Interna ou Empresa"
                  className="w-full input text-sm"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedOccurrenceForOS(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 bg-[#1355FF] hover:bg-[#0D47E6] text-white rounded-xl font-bold cursor-pointer"
                >
                  {isPending ? "Criando OS..." : "Criar Ordem & Vincular"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
