"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon, type IconName } from "@/components/icon";
import { CondoMap } from "@/components/condo-map";
import { CondoAssistant } from "@/components/condo-assistant";

export type AttentionItem = {
  id: string;
  count: number;
  label: string;
  detail?: string;
  sublabel?: string;
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

export type DashboardReservation = {
  id: number;
  amenityName: string;
  date: string;
  time: string;
  unit: string;
  status: string;
};

export type DashboardVendor = {
  id: number;
  name: string;
  company: string;
  category: string;
  rating: number;
  reviewsCount: number;
  verified: boolean;
};

export function DashboardClient({
  userName,
  condoName,
  condoAddress,
  role = "sindico",
  isResident = false,
  unitLabel = null,
  attentionItems,
  stats,
  residentStats = { myOccurrences: 0, myReservations: 0, myParcels: 0, announcements: 0 },
  recentActivities,
  upcomingReservations,
  recommendedVendors,
}: {
  userName: string;
  condoName: string;
  condoAddress: string;
  role?: string;
  isResident?: boolean;
  unitLabel?: string | null;
  attentionItems: AttentionItem[];
  stats: {
    openOccurrences: number;
    executingOrders: number;
    slaPercent: number;
    monthlyExpenses: string;
  };
  residentStats?: {
    myOccurrences: number;
    myReservations: number;
    myParcels: number;
    announcements: number;
  };
  recentActivities: DashboardOccurrence[];
  upcomingReservations: DashboardReservation[];
  recommendedVendors: DashboardVendor[];
}) {
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [fullMapModalOpen, setFullMapModalOpen] = useState(false);
  const [indicatorTooltip, setIndicatorTooltip] = useState(false);

  // Filter only items with count > 0 for attention section
  const activeAttention = attentionItems.filter((i) => i.count > 0);

  return (
    <div className="space-y-7">
      {/* 1. Executive Hero Card (Profissional, Equilibrado e com Indicadores em Tempo Real) */}
      <div className="relative overflow-hidden rounded-[24px] border border-slate-200/80 bg-white p-5 sm:p-6 shadow-[0_4px_24px_-4px_rgba(15,23,42,0.06),0_1px_3px_rgba(15,23,42,0.03)]">
        {/* Top subtle brand solid blue highlight line */}
        <div className="absolute top-0 inset-x-0 h-[3px] bg-[#0055D4]" />

        <div className="relative flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          {/* Left: User Avatar + Personalized Greeting + Condominium Details */}
          <div className="flex items-center gap-4 min-w-0">
            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#0055D4] text-white font-black text-lg shadow-xs">
              {userName.charAt(0).toUpperCase()}
              <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-white ring-1 ring-emerald-500/30" />
            </div>

            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#0F172A]">
                  Olá, {userName}
                </h1>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50/80 px-2.5 py-0.5 text-[11px] font-bold text-[#0055D4] border border-blue-200/60">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#0055D4]" />
                  {isResident ? (unitLabel ? `Unidade ${unitLabel}` : "Espaço do Morador") : "Painel do Condomínio"}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
                <span className="flex items-center gap-1.5 font-bold text-slate-700">
                  <Icon name="building" size={13} className="text-[#0055D4]" />
                  {condoName}
                </span>
                <span className="text-slate-300">·</span>
                <span className="truncate text-slate-400 font-medium">{condoAddress}</span>
              </div>
            </div>
          </div>

          {/* Middle: Live Context Status Strip (Preenche o espaço com informações úteis em tempo real) */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {isResident ? (
              <>
                <div className="flex items-center gap-2.5 rounded-xl bg-slate-50/80 border border-slate-200/70 px-3.5 py-2">
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Portaria 24h</p>
                    <p className="text-xs font-bold text-slate-700">Ativa & Online</p>
                  </div>
                </div>

                <Link
                  href="/painel/encomendas"
                  className="flex items-center gap-2.5 rounded-xl bg-slate-50/80 hover:bg-amber-50/60 border border-slate-200/70 hover:border-amber-200 px-3.5 py-2 transition-colors group"
                >
                  <Icon name="package" size={16} className={residentStats.myParcels > 0 ? "text-amber-600" : "text-slate-400"} />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Encomendas</p>
                    <p className="text-xs font-bold text-slate-800 group-hover:text-amber-700">
                      {residentStats.myParcels > 0 ? `${residentStats.myParcels} para retirar` : "Nenhuma pendente"}
                    </p>
                  </div>
                </Link>

                <Link
                  href="/painel/comunicados"
                  className="flex items-center gap-2.5 rounded-xl bg-slate-50/80 hover:bg-blue-50/60 border border-slate-200/70 hover:border-blue-200 px-3.5 py-2 transition-colors group"
                >
                  <Icon name="bell" size={16} className={residentStats.announcements > 0 ? "text-[#0055D4]" : "text-slate-400"} />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Comunicados</p>
                    <p className="text-xs font-bold text-slate-800 group-hover:text-[#0055D4]">
                      {residentStats.announcements > 0 ? `${residentStats.announcements} informativos` : "Em dia"}
                    </p>
                  </div>
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/painel/ocorrencias"
                  className="flex items-center gap-2.5 rounded-xl bg-slate-50/80 hover:bg-blue-50/60 border border-slate-200/70 hover:border-blue-200 px-3.5 py-2 transition-colors group"
                >
                  <Icon name="clipboard" size={16} className="text-[#0055D4]" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Ocorrências</p>
                    <p className="text-xs font-bold text-slate-800 group-hover:text-[#0055D4]">{stats.openOccurrences} em aberto</p>
                  </div>
                </Link>

                <Link
                  href="/painel/ordens"
                  className="flex items-center gap-2.5 rounded-xl bg-slate-50/80 hover:bg-blue-50/60 border border-slate-200/70 hover:border-blue-200 px-3.5 py-2 transition-colors group"
                >
                  <Icon name="wrench" size={16} className="text-slate-600" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Manutenções</p>
                    <p className="text-xs font-bold text-slate-800 group-hover:text-[#0055D4]">{stats.executingOrders} em execução</p>
                  </div>
                </Link>

                <div className="flex items-center gap-2.5 rounded-xl bg-slate-50/80 border border-slate-200/70 px-3.5 py-2">
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">SLA Técnico</p>
                    <p className="text-xs font-bold text-emerald-600">{stats.slaPercent}% no prazo</p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Right: Action Buttons (Contatos de Emergência + Assistente Virtual IA) */}
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            {!isResident && (
              <div className="relative">
                <button
                  type="button"
                  onMouseEnter={() => setIndicatorTooltip(true)}
                  onMouseLeave={() => setIndicatorTooltip(false)}
                  onClick={() => setIndicatorTooltip(!indicatorTooltip)}
                  className="group flex items-center gap-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 px-3.5 py-2 text-xs transition-colors"
                >
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" />
                  <div className="text-left">
                    <div className="flex items-baseline gap-0.5 font-bold tabular-nums text-slate-800">
                      <span className="text-xs">87</span>
                      <span className="text-[10px] text-slate-400 font-medium">/100</span>
                    </div>
                    <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Conformidade</p>
                  </div>
                </button>

                {indicatorTooltip && (
                  <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-600 shadow-xl leading-relaxed animate-in fade-in-50 duration-100">
                    <span className="font-bold text-[#0F172A] block mb-1">Índice de Conformidade</span>
                    Média ponderada baseada no SLA de chamados, manutenções preventivas e conformidade técnica do condomínio.
                  </div>
                )}
              </div>
            )}

            {/* Emergency Contacts Button */}
            <button
              type="button"
              onClick={() => setEmergencyModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-rose-50/80 hover:bg-rose-100 text-rose-700 border border-rose-200/80 px-3.5 py-2 text-xs font-bold transition-all shadow-xs hover:shadow-sm"
            >
              <Icon name="phone" size={13} className="text-rose-600" />
              <span>Contatos de emergência</span>
            </button>

            {/* Zeladoria IA Copilot Button */}
            <button
              type="button"
              onClick={() => setAssistantOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-[#0055D4] hover:bg-[#0043A8] text-white px-3.5 py-2 text-xs font-bold transition-all shadow-xs hover:scale-[1.01]"
            >
              <Icon name="sparkles" size={14} className="text-[#FFD000] animate-pulse" />
              <span>Zeladoria IA</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. AÇÕES PRINCIPAIS (Zeladoria Cidades: 1º amarelo, demais azul) */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-[11px] font-black uppercase tracking-wider text-slate-400">
            Ações Principais
          </h2>
          <span className="text-[11px] font-medium text-slate-400 hidden sm:inline">
            Acesso rápido aos módulos
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 pb-3 pt-1">
          {(isResident
            ? [
                {
                  label: "Registrar ocorrência",
                  desc: "Relatar problema ou reparo",
                  href: "/painel/ocorrencias/nova",
                  icon: "clipboard" as IconName,
                  variant: "yellow" as const,
                },
                {
                  label: "Nova reserva",
                  desc: "Salão, churrasqueira e áreas",
                  href: "/painel/reservas",
                  icon: "calendar" as IconName,
                  variant: "blue" as const,
                },
                {
                  label: "Autorizar visitante",
                  desc: "Liberar acesso na portaria",
                  href: "/painel/visitantes",
                  icon: "users" as IconName,
                  variant: "blue" as const,
                },
                {
                  label: "Solicitar serviço",
                  desc: "Manutenções e orçamentos",
                  href: "/painel/servicos?solicitar=true",
                  icon: "sparkles" as IconName,
                  variant: "blue" as const,
                },
              ]
            : [
                {
                  label: "Registrar ocorrência",
                  desc: "Relatar problema ou reparo",
                  href: "/painel/ocorrencias/nova",
                  icon: "clipboard" as IconName,
                  variant: "yellow" as const,
                },
                {
                  label: "Nova reserva",
                  desc: "Salão, churrasqueira e áreas",
                  href: "/painel/reservas",
                  icon: "calendar" as IconName,
                  variant: "blue" as const,
                },
                {
                  label: "Ordens de serviço",
                  desc: "Acompanhar manutenções",
                  href: "/painel/ordens",
                  icon: "wrench" as IconName,
                  variant: "blue" as const,
                },
                {
                  label: "Prestadores",
                  desc: "Profissionais avaliados",
                  href: "/painel/servicos",
                  icon: "briefcase" as IconName,
                  variant: "blue" as const,
                },
              ]
          ).map((action) => {
            const isYellow = action.variant === "yellow";

            return (
              <Link
                key={action.label}
                href={action.href}
                className={`group relative flex min-h-[145px] sm:min-h-[160px] flex-col justify-between rounded-[26px] p-5 sm:p-6 transition-all duration-200 hover:-translate-y-1 ${
                  isYellow
                    ? "bg-[#FFD000] text-[#12162A] shadow-lg shadow-[#FFD000]/25 hover:shadow-xl hover:shadow-[#FFD000]/35"
                    : "bg-[#0070F3] text-white shadow-lg shadow-[#0070F3]/20 hover:shadow-xl hover:shadow-[#0070F3]/30"
                }`}
              >
                {/* Top-left Icon */}
                <div className="flex items-center justify-start">
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-xl transition-transform group-hover:scale-110 ${
                      isYellow
                        ? "bg-[#12162A]/10 text-[#12162A]"
                        : "bg-white/15 text-white"
                    }`}
                  >
                    <Icon name={action.icon} size={20} strokeWidth={2.2} />
                  </span>
                </div>

                {/* Bottom-left Content */}
                <div className="pr-8 pt-4">
                  <h3
                    className={`text-base sm:text-lg font-black tracking-tight leading-snug ${
                      isYellow ? "text-[#12162A]" : "text-white"
                    }`}
                  >
                    {action.label}
                  </h3>
                  <p
                    className={`mt-1 text-xs font-medium leading-normal ${
                      isYellow ? "text-[#12162A]/75" : "text-white/80"
                    }`}
                  >
                    {action.desc}
                  </p>
                </div>

                {/* Protruding circular arrow button at bottom-right corner */}
                <div
                  className={`absolute -bottom-2 -right-2 sm:-bottom-2.5 sm:-right-2.5 flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-white shadow-md shadow-black/10 border-[3px] border-[#F8FAFC] transition-all duration-200 group-hover:scale-110 group-hover:shadow-lg ${
                    isYellow ? "text-[#12162A]" : "text-[#0070F3]"
                  }`}
                >
                  <Icon name="arrow-up-right" size={17} strokeWidth={2.6} />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 3. PRECISA DA SUA ATENÇÃO / SUAS PENDÊNCIAS */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-[11px] font-black uppercase tracking-wider text-slate-400">
              {isResident ? "Suas Pendências" : "Precisa da sua atenção"}
            </h2>
            {activeAttention.length > 0 && (
              <span className="flex h-5 items-center justify-center rounded-full bg-rose-500/10 px-2 text-[10px] font-black text-rose-600">
                {activeAttention.reduce((acc, curr) => acc + curr.count, 0)} pendências
              </span>
            )}
          </div>
          <span className="text-[11px] font-medium text-slate-400 hidden sm:inline">
            {isResident
              ? "Acompanhe seus registros, reservas e encomendas"
              : "Ações prioritárias para manter o condomínio em dia"}
          </span>
        </div>

        {activeAttention.length === 0 ? (
          <div className="flex items-center gap-2.5 rounded-[16px] bg-emerald-50/60 border border-emerald-200/60 px-4 py-3 text-xs font-semibold text-emerald-800">
            <Icon name="check-circle" size={16} className="text-emerald-600 shrink-0" />
            <span>
              {isResident
                ? "Tudo em ordem! Nenhuma ocorrência ou encomenda pendente no momento."
                : "Tudo em ordem! Nenhuma ocorrência ou pendência imediata no condomínio."}
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {activeAttention.map((item) => {
              const isUrgent = item.urgent;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`group flex items-center justify-between rounded-[18px] border p-4 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md ${
                    isUrgent
                      ? "bg-rose-50/40 border-rose-200/80 hover:border-rose-300"
                      : "bg-amber-50/40 border-amber-200/80 hover:border-amber-300"
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] shadow-xs ${
                        isUrgent
                          ? "bg-rose-100 text-rose-600"
                          : "bg-amber-100 text-amber-600"
                      }`}
                    >
                      <Icon
                        name={isUrgent ? "alert" : "calendar"}
                        size={18}
                        strokeWidth={2.2}
                      />
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-[#0F172A] group-hover:text-[#0055D4] transition-colors truncate">
                          {item.count} {item.label}
                        </p>
                        {isUrgent && (
                          <span className="rounded-full bg-rose-100 px-1.5 py-0.2 text-[9px] font-extrabold uppercase text-rose-700">
                            Alta prioridade
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                        {item.detail || item.sublabel || "Aguardando ação"}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white transition-transform group-hover:translate-x-0.5 shadow-xs border ${
                      isUrgent
                        ? "text-rose-600 border-rose-100"
                        : "text-amber-600 border-amber-100"
                    }`}
                  >
                    <Icon name="arrow-right" size={13} strokeWidth={2.5} />
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* 4. RESUMO (Minimalista, Moderno e Elegante) */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-[11px] font-black uppercase tracking-wider text-slate-400">
            {isResident ? "Meu Resumo" : "Resumo do Condomínio"}
          </h2>
          <span className="text-[11px] font-medium text-slate-400 hidden sm:inline">
            {isResident ? "Visão rápida da sua unidade" : "Indicadores operacionais consolidados"}
          </span>
        </div>

        {isResident ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Link
              href="/painel/ocorrencias"
              className="group relative flex flex-col justify-between rounded-[20px] border border-slate-200/80 bg-white p-4 sm:p-5 shadow-[0_1px_3px_rgba(15,23,42,0.03)] hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[#0055D4] transition-transform group-hover:scale-110">
                  <Icon name="clipboard" size={17} strokeWidth={2.2} />
                </span>
                <Icon name="arrow-up-right" size={14} strokeWidth={2.4} className="text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </div>
              <div className="mt-4">
                <span className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 tabular-nums">
                  {residentStats.myOccurrences}
                </span>
                <p className="text-xs font-bold text-slate-800 mt-1 group-hover:text-[#0055D4] transition-colors">
                  Minhas ocorrências
                </p>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5 truncate">
                  Solicitações ativas
                </p>
              </div>
            </Link>

            <Link
              href="/painel/reservas"
              className="group relative flex flex-col justify-between rounded-[20px] border border-slate-200/80 bg-white p-4 sm:p-5 shadow-[0_1px_3px_rgba(15,23,42,0.03)] hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-transform group-hover:scale-110">
                  <Icon name="calendar" size={17} strokeWidth={2.2} />
                </span>
                <Icon name="arrow-up-right" size={14} strokeWidth={2.4} className="text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </div>
              <div className="mt-4">
                <span className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 tabular-nums">
                  {residentStats.myReservations}
                </span>
                <p className="text-xs font-bold text-slate-800 mt-1 group-hover:text-indigo-600 transition-colors">
                  Minhas reservas
                </p>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5 truncate">
                  Espaços agendados
                </p>
              </div>
            </Link>

            <Link
              href="/painel/encomendas"
              className="group relative flex flex-col justify-between rounded-[20px] border border-slate-200/80 bg-white p-4 sm:p-5 shadow-[0_1px_3px_rgba(15,23,42,0.03)] hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 transition-transform group-hover:scale-110">
                  <Icon name="package" size={17} strokeWidth={2.2} />
                </span>
                <Icon name="arrow-up-right" size={14} strokeWidth={2.4} className="text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </div>
              <div className="mt-4">
                <span className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 tabular-nums">
                  {residentStats.myParcels}
                </span>
                <p className="text-xs font-bold text-slate-800 mt-1 group-hover:text-amber-600 transition-colors">
                  Encomendas
                </p>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5 truncate">
                  Disponíveis na portaria
                </p>
              </div>
            </Link>

            <Link
              href="/painel/comunicados"
              className="group relative flex flex-col justify-between rounded-[20px] border border-slate-200/80 bg-white p-4 sm:p-5 shadow-[0_1px_3px_rgba(15,23,42,0.03)] hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-transform group-hover:scale-110">
                  <Icon name="bell" size={17} strokeWidth={2.2} />
                </span>
                <Icon name="arrow-up-right" size={14} strokeWidth={2.4} className="text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </div>
              <div className="mt-4">
                <span className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 tabular-nums">
                  {residentStats.announcements}
                </span>
                <p className="text-xs font-bold text-slate-800 mt-1 group-hover:text-emerald-600 transition-colors">
                  Comunicados
                </p>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5 truncate">
                  Informativos no mural
                </p>
              </div>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Link
              href="/painel/ocorrencias"
              className="group relative flex flex-col justify-between rounded-[20px] border border-slate-200/80 bg-white p-4 sm:p-5 shadow-[0_1px_3px_rgba(15,23,42,0.03)] hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[#0055D4] transition-transform group-hover:scale-110">
                  <Icon name="alert" size={17} strokeWidth={2.2} />
                </span>
                <Icon name="arrow-up-right" size={14} strokeWidth={2.4} className="text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </div>
              <div className="mt-4">
                <span className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 tabular-nums">
                  {stats.openOccurrences}
                </span>
                <p className="text-xs font-bold text-slate-800 mt-1 group-hover:text-[#0055D4] transition-colors">
                  Ocorrências abertas
                </p>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5 truncate">
                  Demandas do condomínio
                </p>
              </div>
            </Link>

            <Link
              href="/painel/ordens"
              className="group relative flex flex-col justify-between rounded-[20px] border border-slate-200/80 bg-white p-4 sm:p-5 shadow-[0_1px_3px_rgba(15,23,42,0.03)] hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-transform group-hover:scale-110">
                  <Icon name="wrench" size={17} strokeWidth={2.2} />
                </span>
                <Icon name="arrow-up-right" size={14} strokeWidth={2.4} className="text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </div>
              <div className="mt-4">
                <span className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 tabular-nums">
                  {stats.executingOrders}
                </span>
                <p className="text-xs font-bold text-slate-800 mt-1 group-hover:text-indigo-600 transition-colors">
                  Ordens em execução
                </p>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5 truncate">
                  Manutenções ativas
                </p>
              </div>
            </Link>

            <div className="group relative flex flex-col justify-between rounded-[20px] border border-slate-200/80 bg-white p-4 sm:p-5 shadow-[0_1px_3px_rgba(15,23,42,0.03)]">
              <div className="flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Icon name="clock" size={17} strokeWidth={2.2} />
                </span>
              </div>
              <div className="mt-4">
                <span className="text-2xl sm:text-3xl font-black tracking-tight text-emerald-600 tabular-nums">
                  {stats.slaPercent}%
                </span>
                <p className="text-xs font-bold text-slate-800 mt-1">
                  SLA cumprimento
                </p>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5 truncate">
                  Índice de pontualidade
                </p>
              </div>
            </div>

            <div className="group relative flex flex-col justify-between rounded-[20px] border border-slate-200/80 bg-white p-4 sm:p-5 shadow-[0_1px_3px_rgba(15,23,42,0.03)]">
              <div className="flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                  <Icon name="wallet" size={17} strokeWidth={2.2} />
                </span>
              </div>
              <div className="mt-4">
                <span className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 tabular-nums">
                  {stats.monthlyExpenses}
                </span>
                <p className="text-xs font-bold text-slate-800 mt-1">
                  Gastos este mês
                </p>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5 truncate">
                  Previsão orçamentária
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 6. MAPA DO CONDOMÍNIO (Apenas para Gestão/Síndico) */}
      {!isResident && (
        <section className="space-y-2">
          <CondoMap onExpand={() => setFullMapModalOpen(true)} />
        </section>
      )}

      {/* 5. ATIVIDADES RECENTES & PRÓXIMAS RESERVAS (Lista com divisores sutis + Empty State Inteligente com Ícones) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Atividades Recentes */}
        <div className="rounded-[18px] bg-white border border-slate-200/80 p-5 sm:p-6 shadow-[0_1px_3px_rgba(15,23,42,0.02)] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[#0055D4]">
                <Icon name="clock" size={17} strokeWidth={2.2} />
              </span>
              <div>
                <h3 className="text-sm font-bold text-[#0F172A]">
                  {isResident ? "Minhas atividades recentes" : "Atividades recentes"}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {isResident
                    ? "Acompanhe o andamento de suas solicitações"
                    : "Movimentações e registros no condomínio"}
                </p>
              </div>
            </div>
            <Link
              href="/painel/ocorrencias"
              className="flex items-center gap-1 text-xs font-bold text-[#0055D4] hover:text-[#0047BA] transition-colors group"
            >
              <span>Ver todas</span>
              <Icon name="chevron-right" size={13} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {recentActivities.length === 0 ? (
              <div className="py-8 flex flex-col items-center justify-center text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 border border-slate-100 text-slate-400 mb-2.5 shadow-2xs">
                  <Icon name="clipboard" size={22} strokeWidth={1.8} />
                </span>
                <p className="text-xs font-bold text-slate-700">
                  {isResident ? "Nenhuma atividade recente registrada" : "Nenhuma atividade recente"}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5 max-w-xs">
                  {isResident
                    ? "Novas ocorrências e solicitações aparecerão listadas aqui."
                    : "Novas movimentações no condomínio aparecerão aqui."}
                </p>
              </div>
            ) : (
              recentActivities.map((item) => (
                <Link
                  key={item.id}
                  href="/painel/ocorrencias"
                  className="py-2.5 first:pt-1 last:pb-0 flex items-center justify-between gap-3 hover:bg-slate-50/60 -mx-2 px-2 rounded-[10px] transition-colors group"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-mono text-[11px] font-bold text-[#0055D4]">
                        {item.code}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {item.timeAgo}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-[#0F172A] group-hover:text-[#0055D4] transition-colors truncate">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {item.location}
                    </p>
                  </div>

                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600 shrink-0">
                    {item.status}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Próximas Reservas & Empty State com Ícones */}
        <div className="rounded-[18px] bg-white border border-slate-200/80 p-5 sm:p-6 shadow-[0_1px_3px_rgba(15,23,42,0.02)] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Icon name="calendar" size={17} strokeWidth={2.2} />
              </span>
              <div>
                <h3 className="text-sm font-bold text-[#0F172A]">
                  {isResident ? "Minhas próximas reservas" : "Próximas reservas"}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {isResident
                    ? "Espaços agendados pela sua unidade"
                    : "Áreas comuns reservadas pelos moradores"}
                </p>
              </div>
            </div>
            <Link
              href="/painel/reservas"
              className="flex items-center gap-1 text-xs font-bold text-[#0055D4] hover:text-[#0047BA] transition-colors group"
            >
              <span>Ver todas</span>
              <Icon name="chevron-right" size={13} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          <div>
            {upcomingReservations.length === 0 ? (
              <div className="py-7 flex flex-col items-center justify-center text-center space-y-2.5">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50/80 border border-indigo-100/60 text-indigo-600 shadow-2xs">
                  <Icon name="calendar" size={22} strokeWidth={1.8} />
                </span>
                <div>
                  <p className="text-xs font-bold text-[#0F172A]">
                    Nenhuma reserva próxima
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Que tal planejar um momento no salão de festas ou churrasqueira?
                  </p>
                </div>
                <Link
                  href="/painel/reservas"
                  className="flex items-center gap-1.5 rounded-xl bg-[#0055D4] hover:bg-[#0047BA] text-white text-xs font-bold px-4 py-2 shadow-xs transition-all hover:scale-[1.02] mt-1"
                >
                  <Icon name="plus" size={13} strokeWidth={2.6} />
                  <span>Nova reserva</span>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {upcomingReservations.map((res) => (
                  <div key={res.id} className="py-2.5 first:pt-1 last:pb-0 flex items-center justify-between gap-3">
                    <div>
                      <h4 className="text-xs font-bold text-[#0F172A]">
                        {res.amenityName}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {res.date} · {res.time} ({res.unit})
                      </p>
                    </div>
                    <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                      Confirmada
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 6. SERVIÇOS RECOMENDADOS (Com Ícones e Estrelas) */}
      <section className="rounded-[18px] bg-white border border-slate-200/80 p-5 sm:p-6 shadow-[0_1px_3px_rgba(15,23,42,0.02)] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Icon name="briefcase" size={17} strokeWidth={2.2} />
            </span>
            <div>
              <h3 className="text-sm font-bold text-[#0F172A]">
                Serviços recomendados
              </h3>
              <p className="text-[11px] text-slate-400">
                Profissionais avaliados pelo condomínio
              </p>
            </div>
          </div>
          <Link
            href="/painel/servicos"
            className="flex items-center gap-1 text-xs font-bold text-[#0055D4] hover:text-[#0047BA] transition-colors group"
          >
            <span>Ver todos</span>
            <Icon name="chevron-right" size={13} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {recommendedVendors.map((vendor) => (
            <div
              key={vendor.id}
              className="group flex items-center justify-between p-3.5 rounded-[16px] bg-slate-50/70 border border-slate-200/60 hover:bg-white hover:border-slate-300 hover:shadow-xs transition-all"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white border border-slate-200/80 text-[#0055D4] text-xs font-bold shadow-2xs group-hover:scale-105 transition-transform">
                  <Icon name="briefcase" size={16} />
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-bold text-[#0F172A] truncate group-hover:text-[#0055D4] transition-colors">
                      {vendor.name}
                    </h4>
                    {vendor.verified && (
                      <Icon name="check-circle" size={13} className="text-[#0055D4] shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    {vendor.category} · {vendor.company}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0 rounded-lg bg-white border border-slate-200/80 px-2 py-1 text-xs font-bold text-slate-700 shadow-2xs">
                <Icon name="star" size={11} className="text-[#FFD000] fill-[#FFD000]" />
                <span>{vendor.rating.toFixed(1)}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* MODAL: Contatos de Emergência */}
      {emergencyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
            onClick={() => setEmergencyModalOpen(false)}
            aria-hidden
          />
          <div className="relative w-full max-w-md rounded-[16px] border border-slate-200 bg-white p-6 shadow-xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-red-600">
                <Icon name="phone" size={18} />
                <h3 className="text-base font-bold text-red-700">Contatos de Emergência</h3>
              </div>
              <button
                type="button"
                onClick={() => setEmergencyModalOpen(false)}
                className="p-1 rounded-[8px] text-slate-400 hover:bg-slate-100"
              >
                <Icon name="x" size={16} />
              </button>
            </div>

            <div className="space-y-2.5">
              {[
                { title: "Portaria Central", phone: "(11) 3456-7890", desc: "Ramal 100 · 24 Horas" },
                { title: "Síndico(a) / Zelador", phone: "(11) 98765-4321", desc: "Plantão Operacional" },
                { title: "SAMU", phone: "192", desc: "Emergência Médica" },
                { title: "Corpo de Bombeiros", phone: "193", desc: "Incêndio e Resgate" },
                { title: "Polícia Militar", phone: "190", desc: "Segurança Pública" },
              ].map((item) => (
                <div key={item.title} className="flex items-center justify-between p-3 rounded-[8px] bg-slate-50 border border-slate-200/60">
                  <div>
                    <h4 className="text-xs font-bold text-[#0F172A]">{item.title}</h4>
                    <p className="text-[11px] text-slate-500">{item.desc}</p>
                  </div>
                  <a
                    href={`tel:${item.phone.replace(/\D/g, "")}`}
                    className="inline-flex items-center gap-1.5 rounded-[8px] bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 text-xs font-bold transition-colors"
                  >
                    <Icon name="phone" size={12} />
                    <span>{item.phone}</span>
                  </a>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setEmergencyModalOpen(false)}
                className="btn-ghost btn-sm w-full"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Mapa Completo Expandido */}
      {fullMapModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
            onClick={() => setFullMapModalOpen(false)}
            aria-hidden
          />
          <div className="relative w-full max-w-5xl rounded-[16px] border border-slate-200 bg-white p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-[#0F172A]">
                  Mapa Completo do Condomínio
                </h3>
                <p className="text-xs text-slate-400">
                  Visualização ampliada com todas as camadas e pontos de interesse
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFullMapModalOpen(false)}
                className="p-1.5 rounded-[8px] text-slate-400 hover:bg-slate-100"
              >
                <Icon name="x" size={18} />
              </button>
            </div>

            <div className="h-[600px] w-full overflow-hidden rounded-[10px] border border-slate-200">
              <CondoMap />
            </div>
          </div>
        </div>
      )}

      {/* Zeladoria IA Assistant Drawer */}
      {assistantOpen && (
        <CondoAssistant onClose={() => setAssistantOpen(false)} />
      )}
    </div>
  );
}
