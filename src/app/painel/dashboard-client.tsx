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
  attentionItems,
  stats,
  recentActivities,
  upcomingReservations,
  recommendedVendors,
}: {
  userName: string;
  condoName: string;
  condoAddress: string;
  attentionItems: AttentionItem[];
  stats: {
    openOccurrences: number;
    executingOrders: number;
    slaPercent: number;
    monthlyExpenses: string;
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
      {/* 1. Header: Greeting + Condo Context + AI Assistant */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-200/60">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">
              Olá, {userName}
            </h1>
            <span className="hidden sm:inline text-slate-300">·</span>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100/80 px-2.5 py-0.5 rounded-full">
              {condoName}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Bem-vindo ao seu condomínio.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setAssistantOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-[8px] bg-blue-50/70 hover:bg-blue-100/80 text-[#0070F3] px-3 py-1.5 text-xs font-bold transition-colors self-start sm:self-auto border border-blue-100"
        >
          <Icon name="sparkles" size={14} className="text-[#0070F3]" />
          <span>Zeladoria IA</span>
        </button>
      </div>

      {/* 2. Compact Condo Summary & Emergency Trigger (Horizontal Pill) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white rounded-[12px] border border-slate-200/60 px-4 py-2.5 shadow-[0_1px_3px_rgba(15,23,42,0.02)]">
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-blue-50 text-[#0070F3]">
            <Icon name="home" size={16} />
          </span>
          <div className="min-w-0">
            <h2 className="text-xs font-bold text-[#0F172A] truncate">
              {condoName}
            </h2>
            <p className="text-[11px] text-slate-400 truncate">
              {condoAddress}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 justify-between sm:justify-end">
          {/* Indicator Pill with Tooltip */}
          <div className="relative">
            <button
              type="button"
              onMouseEnter={() => setIndicatorTooltip(true)}
              onMouseLeave={() => setIndicatorTooltip(false)}
              onClick={() => setIndicatorTooltip(!indicatorTooltip)}
              className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 border border-slate-200/80 px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <span className="h-2 w-2 rounded-full bg-[#FAB800]" />
              <span className="font-mono font-bold text-[#0070F3]">87</span>
              <span className="text-[10px] text-slate-400 font-medium">/ 100</span>
            </button>

            {indicatorTooltip && (
              <div className="absolute right-0 top-full z-50 mt-1.5 w-60 rounded-[8px] border border-slate-200 bg-white p-2.5 text-[11px] text-slate-600 shadow-lg leading-relaxed animate-in fade-in-50 duration-100">
                <span className="font-bold text-[#0F172A] block mb-0.5">Indicador de Conformidade</span>
                Baseado em SLA de manutenções, ocorrências resolvidas no prazo e vistorias preventivas.
              </div>
            )}
          </div>

          {/* Emergency Trigger */}
          <button
            type="button"
            onClick={() => setEmergencyModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-[8px] bg-red-50 hover:bg-red-100/80 text-red-700 px-3 py-1 text-xs font-bold transition-colors border border-red-200/70"
          >
            <Icon name="phone" size={13} className="text-red-600" />
            <span>Contatos de emergência</span>
          </button>
        </div>
      </div>

      {/* 3. PRECISA DA SUA ATENÇÃO (Lista Inteligente Escaneável) */}
      <section className="space-y-2">
        <h2 className="text-[11px] font-black uppercase tracking-wider text-slate-400">
          Precisa da sua atenção
        </h2>

        {activeAttention.length === 0 ? (
          <div className="flex items-center gap-2 rounded-[12px] bg-emerald-50/50 border border-emerald-100 px-4 py-3 text-xs font-semibold text-emerald-800">
            <Icon name="check-circle" size={15} className="text-emerald-600 shrink-0" />
            <span>Tudo em dia por aqui. Nenhuma pendência imediata.</span>
          </div>
        ) : (
          <div className="rounded-[12px] bg-white border border-slate-200/60 divide-y divide-slate-100 shadow-[0_1px_3px_rgba(15,23,42,0.02)] overflow-hidden">
            {activeAttention.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="flex items-center justify-between px-4 py-3 hover:bg-blue-50/20 transition-colors group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`h-2 w-2 rounded-full shrink-0 ${
                      item.urgent ? "bg-red-500" : "bg-[#FAB800]"
                    }`}
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#0F172A] group-hover:text-[#0070F3] transition-colors truncate">
                      {item.count} {item.label}
                      {(item.detail || item.sublabel) && (
                        <span className="text-[11px] font-normal text-slate-400 ml-1.5">
                          · {item.detail || item.sublabel}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <Icon
                  name="chevron-right"
                  size={14}
                  className="text-slate-400 group-hover:text-[#0070F3] group-hover:translate-x-0.5 transition-all shrink-0 ml-2"
                />
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* 4. AÇÕES PRINCIPAIS (4 Ações Compactas: ícone em quadrado azul claro + nome da ação) */}
      <section className="space-y-2">
        <h2 className="text-[11px] font-black uppercase tracking-wider text-slate-400">
          Ações Principais
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: "Registrar ocorrência",
              href: "/painel/ocorrencias/nova",
              icon: "clipboard" as IconName,
            },
            {
              label: "Nova reserva",
              href: "/painel/reservas",
              icon: "calendar" as IconName,
            },
            {
              label: "Solicitar serviço",
              href: "/painel/servicos?solicitar=true",
              icon: "sparkles" as IconName,
            },
            {
              label: "Prestadores",
              href: "/painel/servicos",
              icon: "briefcase" as IconName,
            },
          ].map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="flex items-center gap-3 rounded-[12px] bg-white border border-slate-200/60 p-3 hover:border-blue-200 hover:bg-blue-50/20 transition-all text-left group shadow-[0_1px_3px_rgba(15,23,42,0.02)]"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-blue-50 text-[#0070F3] group-hover:bg-[#0070F3] group-hover:text-white transition-colors">
                <Icon name={action.icon} size={16} />
              </span>
              <span className="text-xs font-bold text-[#0F172A] group-hover:text-[#0070F3] transition-colors leading-tight">
                {action.label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* 5. RESUMO (Linha Horizontal Compacta com Divisores Discretos) */}
      <section className="space-y-2">
        <h2 className="text-[11px] font-black uppercase tracking-wider text-slate-400">
          Resumo do Condomínio
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 bg-white rounded-[12px] border border-slate-200/60 shadow-[0_1px_3px_rgba(15,23,42,0.02)] divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
          <Link
            href="/painel/ocorrencias"
            className="p-3.5 hover:bg-slate-50/60 transition-colors text-left group"
          >
            <span className="text-lg font-black text-[#0F172A] group-hover:text-[#0070F3] transition-colors">
              {stats.openOccurrences}
            </span>
            <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
              Ocorrências abertas
            </p>
          </Link>

          <Link
            href="/painel/ordens"
            className="p-3.5 hover:bg-slate-50/60 transition-colors text-left group"
          >
            <span className="text-lg font-black text-slate-700 group-hover:text-[#0070F3] transition-colors">
              {stats.executingOrders}
            </span>
            <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
              Ordens em execução
            </p>
          </Link>

          <div className="p-3.5 text-left">
            <span className="text-lg font-black text-emerald-600">
              {stats.slaPercent}%
            </span>
            <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
              SLA cumprimento
            </p>
          </div>

          <div className="p-3.5 text-left">
            <span className="text-lg font-black text-slate-700">
              {stats.monthlyExpenses}
            </span>
            <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
              Gastos este mês
            </p>
          </div>
        </div>
      </section>

      {/* 6. ATIVIDADES RECENTES & PRÓXIMAS RESERVAS (Lista com divisores sutis + Empty State Inteligente) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Atividades Recentes */}
        <div className="rounded-[14px] bg-white border border-slate-200/60 p-5 shadow-[0_1px_3px_rgba(15,23,42,0.02)] space-y-3">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-[#0F172A]">
                Atividades recentes
              </h3>
              <p className="text-[11px] text-slate-400">
                Movimentações e registros no condomínio
              </p>
            </div>
            <Link
              href="/painel/ocorrencias"
              className="text-xs font-bold text-[#0070F3] hover:underline"
            >
              Ver todas &gt;
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {recentActivities.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">
                Nenhuma atividade recente registrada.
              </p>
            ) : (
              recentActivities.map((item) => (
                <Link
                  key={item.id}
                  href="/painel/ocorrencias"
                  className="py-2.5 first:pt-1 last:pb-0 flex items-center justify-between gap-3 hover:bg-slate-50/60 -mx-2 px-2 rounded-[8px] transition-colors group"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-mono text-[11px] font-bold text-[#0070F3]">
                        {item.code}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {item.timeAgo}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-[#0F172A] group-hover:text-[#0070F3] transition-colors truncate">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {item.location}
                    </p>
                  </div>

                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 shrink-0">
                    {item.status}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Próximas Reservas & Empty State Inteligente */}
        <div className="rounded-[14px] bg-white border border-slate-200/60 p-5 shadow-[0_1px_3px_rgba(15,23,42,0.02)] space-y-3">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-[#0F172A]">
                Próximas reservas
              </h3>
              <p className="text-[11px] text-slate-400">
                Áreas comuns com agendamento
              </p>
            </div>
            <Link
              href="/painel/reservas"
              className="text-xs font-bold text-[#0070F3] hover:underline"
            >
              Ver todas &gt;
            </Link>
          </div>

          <div>
            {upcomingReservations.length === 0 ? (
              /* Empty State Inteligente: transforma espaço vazio em ação útil */
              <div className="py-6 flex flex-col items-center text-center space-y-2.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-[#0070F3]">
                  <Icon name="calendar" size={18} />
                </span>
                <div>
                  <p className="text-xs font-bold text-[#0F172A]">
                    Nenhuma reserva próxima
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Que tal planejar um momento no salão ou churrasqueira?
                  </p>
                </div>
                <Link
                  href="/painel/reservas"
                  className="btn-primary btn-sm mt-1"
                >
                  <Icon name="plus" size={13} />
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
                    <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                      Confirmada
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 7. MAPA DO CONDOMÍNIO (Secundário, compacto, com botão 'Ver mapa completo >') */}
      <section className="rounded-[14px] bg-white border border-slate-200/60 p-4 sm:p-5 shadow-[0_1px_3px_rgba(15,23,42,0.02)] space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#0F172A]">
              Mapa do Condomínio
            </h3>
            <p className="text-[11px] text-slate-400">
              Localização de ocorrências e equipamentos
            </p>
          </div>

          <button
            type="button"
            onClick={() => setFullMapModalOpen(true)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0070F3] hover:underline"
          >
            <span>Ver mapa completo &gt;</span>
          </button>
        </div>

        {/* Embedded map */}
        <CondoMap />
      </section>

      {/* 8. SERVIÇOS RECOMENDADOS (Secundário) */}
      <section className="rounded-[14px] bg-white border border-slate-200/60 p-4 sm:p-5 shadow-[0_1px_3px_rgba(15,23,42,0.02)] space-y-3">
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-[#0F172A]">
              Serviços recomendados
            </h3>
            <p className="text-[11px] text-slate-400">
              Profissionais avaliados pelo condomínio
            </p>
          </div>
          <Link
            href="/painel/servicos"
            className="text-xs font-bold text-[#0070F3] hover:underline"
          >
            Ver todos &gt;
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {recommendedVendors.map((vendor) => (
            <div
              key={vendor.id}
              className="flex items-center justify-between p-3 rounded-[10px] bg-slate-50/60 border border-slate-200/40"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[#0070F3] text-xs font-bold">
                  {vendor.name.slice(0, 1).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <h4 className="text-xs font-bold text-[#0F172A] truncate">
                      {vendor.name}
                    </h4>
                    {vendor.verified && (
                      <Icon name="check-circle" size={12} className="text-[#0070F3] shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">
                    {vendor.category} · {vendor.company}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0 rounded bg-white border border-slate-200/60 px-1.5 py-0.5 text-xs font-bold text-slate-700">
                <Icon name="star" size={10} className="text-[#FAB800] fill-[#FAB800]" />
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
