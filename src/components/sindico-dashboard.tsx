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
    },
    {
      id: "action-ordens",
      count: undefined,
      label: "Ordem de serviço",
      detail: "Reparo, equipe ou OS interna",
      href: "/painel/ordens",
      icon: "wrench" as IconName,
    },
    {
      id: "action-manutencao",
      count: undefined,
      label: "Cadastrar manutenção",
      detail: "Plano preventivo de ativos",
      href: "/painel/manutencao",
      icon: "shield" as IconName,
    },
    {
      id: "action-servicos",
      count: undefined,
      label: "Contratar prestador",
      detail: "Marketplace e parceiros",
      href: "/painel/servicos",
      icon: "briefcase" as IconName,
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

      {/* 1. HERO DO SÍNDICO (Azul Sólido #0055D4, sem gradiente) */}
      <section className="relative overflow-hidden rounded-[16px] sm:rounded-[20px] bg-[#0055D4] p-5 sm:p-7 text-white shadow-sm select-none">
        {/* Logo branca oficial da Zeladoria como marca d'água de fundo */}
        <div className="pointer-events-none absolute -right-4 -bottom-6 sm:-right-8 sm:-bottom-10 opacity-10 sm:opacity-15 select-none overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-white.png"
            alt=""
            className="h-44 w-44 sm:h-64 sm:w-64 object-contain pointer-events-none select-none"
          />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div className="space-y-1.5 max-w-xl">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
              Olá, {userName}
            </h1>

            <p className="text-xs sm:text-sm text-blue-100 font-medium">
              {condoName} · Central de Decisão e Governança
            </p>
            <p className="text-[11px] sm:text-xs text-blue-200/90 font-normal">
              Veja o que precisa da sua atenção, aprove solicitações e gerencie o condomínio.
            </p>
          </div>

          {/* Ações Rápidas no Hero: Relatórios e Configurações */}
          <div className="flex items-center gap-2.5 flex-wrap shrink-0 pt-2 sm:pt-0">
            <Link
              href="/painel/relatorios"
              className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-[10px] bg-white/15 hover:bg-white/25 active:bg-white/30 text-white border border-white/20 px-3.5 py-2 text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Icon name="chart" size={15} strokeWidth={2.4} />
              <span>Relatórios</span>
            </Link>
            <Link
              href="/painel/configuracoes"
              className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-[10px] bg-white hover:bg-blue-50 active:bg-blue-100 text-[#0055D4] px-4 py-2 text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Icon name="settings" size={15} strokeWidth={2.4} />
              <span>Configurações</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 2. PRECISA DA SUA ATENÇÃO (Linha de 4 itens: 1º Amarelo #FFD000, 3 Azuis #0070F3) */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-[6px] bg-amber-50 text-amber-700">
              <Icon name="alert-triangle" size={13} />
            </span>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Precisa da sua Atenção
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Priorize aprovações e decisões críticas
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {displayCards.map((card, index) => {
            const isFirst = index === 0;
            return (
              <Link
                key={card.id}
                href={card.href}
                className={`group relative flex min-h-[128px] sm:min-h-[140px] flex-col justify-between overflow-hidden rounded-[16px] p-4 sm:p-5 shadow-xs transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md ${
                  isFirst
                    ? "bg-[#FFD000] text-[#12162A]"
                    : "bg-[#0070F3] text-white hover:bg-[#0062D6]"
                }`}
              >
                <div className="flex items-center justify-between">
                  {card.count !== undefined ? (
                    <span
                      className={`text-2xl sm:text-3xl font-black tabular-nums tracking-tight ${
                        isFirst ? "text-[#12162A]" : "text-white"
                      }`}
                    >
                      {card.count}
                    </span>
                  ) : (
                    <div />
                  )}
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-[8px] ${
                      isFirst ? "bg-[#12162A]/10 text-[#12162A]" : "bg-white/15 text-white"
                    }`}
                  >
                    <Icon name={card.icon} size={15} strokeWidth={2.4} />
                  </span>
                </div>

                <div className="pr-8 pt-2">
                  <h3
                    className={`text-xs sm:text-sm font-black tracking-tight leading-tight ${
                      isFirst ? "text-[#12162A]" : "text-white"
                    }`}
                  >
                    {card.label}
                  </h3>
                  {card.detail && (
                    <p
                      className={`mt-0.5 text-[11px] sm:text-xs font-medium line-clamp-1 ${
                        isFirst ? "text-[#12162A]/75" : "text-white/80"
                      }`}
                    >
                      {card.detail}
                    </p>
                  )}
                </div>

                <div
                  className={`absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-[8px] bg-white shadow-xs transition-all duration-150 group-hover:scale-110 group-hover:shadow-sm ${
                    isFirst ? "text-[#12162A]" : "text-[#0070F3]"
                  }`}
                >
                  <Icon name="arrow-up-right" size={15} strokeWidth={2.6} />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 3. RESUMO DA GESTÃO (4 Cards Brancos Minimalistas e Elegantes) */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Resumo da Gestão
          </h2>
          <span className="text-xs text-slate-400 font-medium">Indicadores operacionais de hoje</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Ocorrências Abertas */}
          <div className="flex flex-col justify-between rounded-[16px] border border-slate-200/90 bg-white p-5 shadow-2xs hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between pb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Ocorrências
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-blue-50 text-[#0055D4]">
                <Icon name="clipboard" size={16} />
              </span>
            </div>
            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black tracking-tight text-slate-900 tabular-nums">
                  {todaySummary.inProgressOccurrences}
                </span>
                <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-[6px]">
                  abertas
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-snug">
                Chamados e relatos de moradores no condomínio.
              </p>
            </div>
            <div className="pt-4 mt-2 border-t border-slate-100 flex justify-between items-center text-xs font-bold">
              <Link href="/painel/ocorrencias" className="text-[#0055D4] hover:underline flex items-center gap-1">
                <span>Gerenciar todas</span>
                <Icon name="arrow-up-right" size={13} />
              </Link>
            </div>
          </div>

          {/* Card 2: Ordens & Manutenções */}
          <div className="flex flex-col justify-between rounded-[16px] border border-slate-200/90 bg-white p-5 shadow-2xs hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between pb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Manutenções
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-amber-50 text-amber-700">
                <Icon name="wrench" size={16} />
              </span>
            </div>
            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black tracking-tight text-slate-900 tabular-nums">
                  {todaySummary.scheduledMaintenances}
                </span>
                <span className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-[6px]">
                  agendadas
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-snug">
                Equipamentos em manutenção e ordens ativas.
              </p>
            </div>
            <div className="pt-4 mt-2 border-t border-slate-100 flex justify-between items-center text-xs font-bold">
              <Link href="/painel/manutencao" className="text-[#0055D4] hover:underline flex items-center gap-1">
                <span>Plano preventivo</span>
                <Icon name="arrow-up-right" size={13} />
              </Link>
            </div>
          </div>

          {/* Card 3: Reservas de Hoje */}
          <div className="flex flex-col justify-between rounded-[16px] border border-slate-200/90 bg-white p-5 shadow-2xs hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between pb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Reservas Hoje
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-indigo-50 text-indigo-600">
                <Icon name="calendar" size={16} />
              </span>
            </div>
            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black tracking-tight text-slate-900 tabular-nums">
                  {todaySummary.todayReservations}
                </span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-[6px]">
                  confirmadas
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-snug">
                Áreas comuns e salões de festas em uso hoje.
              </p>
            </div>
            <div className="pt-4 mt-2 border-t border-slate-100 flex justify-between items-center text-xs font-bold">
              <Link href="/painel/reservas" className="text-[#0055D4] hover:underline flex items-center gap-1">
                <span>Ver calendário</span>
                <Icon name="arrow-up-right" size={13} />
              </Link>
            </div>
          </div>

          {/* Card 4: Portaria & Movimento */}
          <div className="flex flex-col justify-between rounded-[16px] border border-slate-200/90 bg-white p-5 shadow-2xs hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between pb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Portaria & Acessos
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-emerald-50 text-emerald-700">
                <Icon name="users" size={16} />
              </span>
            </div>
            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black tracking-tight text-slate-900 tabular-nums">
                  {todaySummary.expectedVisitors + todaySummary.authorizedProviders}
                </span>
                <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-[6px]">
                  previstos
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-snug">
                {todaySummary.expectedVisitors} visitantes e {todaySummary.authorizedProviders} prestadores hoje.
              </p>
            </div>
            <div className="pt-4 mt-2 border-t border-slate-100 flex justify-between items-center text-xs font-bold">
              <Link href="/painel/visitantes" className="text-[#0055D4] hover:underline flex items-center gap-1">
                <span>Portaria ao vivo</span>
                <Icon name="arrow-up-right" size={13} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 4. PREVENÇÃO INTELIGENTE & ATIVOS CRÍTICOS + LIVRO DIGITAL DA PORTARIA (2 Colunas) */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        {/* Coluna 1: Prevenção Inteligente & Ativos Críticos */}
        <div className="rounded-[16px] border border-slate-200/90 bg-white p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-[6px] bg-blue-50 text-[#0055D4]">
                <Icon name="shield" size={13} />
              </span>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Prevenção Inteligente & Ativos
              </h3>
            </div>
            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-[6px]">
              Diagnóstico Proativo
            </span>
          </div>

          {smartAlerts.length === 0 ? (
            <div className="py-6 flex flex-col items-center justify-center text-center space-y-1.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-blue-50 text-[#0055D4] mb-1">
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
                      className="px-2.5 py-1 bg-slate-900 hover:bg-black text-white text-[11px] font-bold rounded-lg transition-colors shrink-0"
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
        <div className="rounded-[16px] border border-slate-200/90 bg-white p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-[6px] bg-indigo-50 text-indigo-600">
                <Icon name="book" size={13} />
              </span>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Livro Digital da Portaria
              </h3>
            </div>
            <Link href="/painel/livro" className="text-xs font-bold text-[#0055D4] hover:underline">
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
                        className="px-2.5 py-1 bg-[#0055D4] text-white text-[11px] font-bold rounded-lg hover:bg-[#0044AA] cursor-pointer"
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
      <section className="rounded-[16px] border border-slate-200/90 bg-white p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-[6px] bg-blue-50 text-[#0055D4]">
              <Icon name="clipboard" size={13} />
            </span>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Ocorrências em Andamento
            </h3>
          </div>
          <Link href="/painel/ocorrencias" className="text-xs font-bold text-[#0055D4] hover:underline">
            Gerenciar todas
          </Link>
        </div>

        {recentActivities.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">
            Nenhuma ocorrência em andamento no momento.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentActivities.slice(0, 6).map((occ) => (
              <div key={occ.id} className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-black text-slate-700">{occ.code}</span>
                    <span className="text-xs font-bold text-slate-900 truncate">{occ.title}</span>
                    <span className="px-2 py-0.5 bg-blue-50 text-[#0055D4] text-[10px] font-bold rounded">
                      {occ.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                    {occ.location} · Status: <strong>{occ.status}</strong> · {occ.timeAgo}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedOccurrenceForOS(occ.id)}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-lg transition-colors shrink-0 cursor-pointer"
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
                <Icon name="wrench" size={18} className="text-[#0055D4]" />
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
                  className="px-5 py-2 bg-[#0055D4] hover:bg-[#0047BA] text-white rounded-xl font-bold cursor-pointer"
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
