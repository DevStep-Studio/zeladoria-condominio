"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
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

export type CondoNotice = {
  id: string;
  kind: "assembleia" | "comunicado" | "alerta";
  title: string;
  detail: string;
  date: string;
  href: string;
  priority?: "alta" | "normal";
};

const NOTICE_META: Record<
  CondoNotice["kind"],
  { label: string; icon: IconName; badge: string; chip: string }
> = {
  assembleia: {
    label: "Assembleia",
    icon: "scale",
    badge: "bg-indigo-50 text-indigo-700",
    chip: "bg-indigo-50 text-indigo-700",
  },
  comunicado: {
    label: "Comunicado",
    icon: "megaphone",
    badge: "bg-blue-50 text-[#0055D4]",
    chip: "bg-blue-50 text-[#0055D4]",
  },
  alerta: {
    label: "Alerta",
    icon: "alert-triangle",
    badge: "bg-red-50 text-red-600",
    chip: "bg-red-50 text-red-700",
  },
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
  notices = [],
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
  notices?: CondoNotice[];
}) {
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);
  const [fullMapModalOpen, setFullMapModalOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [indicatorTooltip, setIndicatorTooltip] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  const handleCopyPhone = useCallback((phone: string) => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(phone).catch(() => {});
      }
    } catch {
      // ignore clipboard permission errors
    }
    setCopiedPhone(phone);
    setTimeout(() => {
      setCopiedPhone((cur) => (cur === phone ? null : cur));
    }, 2200);
  }, []);

  useEffect(() => {
    if (!emergencyModalOpen && !fullMapModalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setEmergencyModalOpen(false);
        setFullMapModalOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [emergencyModalOpen, fullMapModalOpen]);

  // Filter only items with count > 0 for attention section
  const activeAttention = attentionItems.filter((i) => i.count > 0);
  const totalPending = activeAttention.reduce((acc, curr) => acc + curr.count, 0);

  // Modal: Central de Emergência e SOS (compartilhado entre perfis)
  const EmergencyModal = emergencyModalOpen ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150"
        onClick={() => setEmergencyModalOpen(false)}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Central de Emergência e Telefones Úteis 24h"
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-[14px] border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95 duration-150 overflow-hidden"
      >
        {/* Header Vermelho Sólido Executivo */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-red-600 text-white select-none">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] bg-white/15 text-white">
              <Icon name="phone" size={16} />
            </span>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">
                Central de Emergência 24h
              </h3>
              <p className="text-[11px] text-red-100">
                Telefones úteis, apoio predial e resgate imediato
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-red-200 bg-red-700 px-2 py-0.5 rounded-[4px] hidden sm:inline-block">
              ESC
            </span>
            <button
              type="button"
              onClick={() => setEmergencyModalOpen(false)}
              className="p-1 rounded-[6px] text-white/80 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
              aria-label="Fechar"
            >
              <Icon name="x" size={18} />
            </button>
          </div>
        </div>

        {/* Corpo do Modal */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Aviso Inicial */}
          <div className="p-3 rounded-[8px] bg-red-50 border border-red-200/80 flex items-start gap-2.5 text-red-950">
            <Icon name="alert-triangle" size={16} className="text-red-600 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <strong className="font-bold text-red-950 block">Risco Imediato à Vida, Incêndio ou Invasão:</strong>
              Ligue diretamente para as linhas públicas gratuitas: <strong>193 (Bombeiros)</strong>, <strong>192 (SAMU)</strong> ou <strong>190 (Polícia)</strong>. As chamadas funcionam mesmo sem créditos.
            </div>
          </div>

          {/* 1. Atendimento Interno do Condomínio */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Atendimento Interno do Condomínio
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Portaria */}
              <div className="p-3.5 rounded-[8px] bg-slate-50 border border-slate-200/80 flex flex-col justify-between space-y-2.5">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h5 className="text-xs font-bold text-slate-900">
                      Portaria Central
                    </h5>
                    <span className="text-[11px] font-semibold text-slate-500">
                      Ramal 100
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug mt-1">
                    Guarita, controle de portões e ocorrências de acesso. Plantão 24h.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href="tel:1134567890"
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-[6px] bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 text-xs font-semibold transition-colors"
                  >
                    <Icon name="phone" size={12} />
                    <span>Ligar (11) 3456-7890</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => handleCopyPhone("(11) 3456-7890")}
                    className="flex items-center justify-center gap-1 rounded-[6px] bg-white hover:bg-slate-100 border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                    title="Copiar número"
                  >
                    {copiedPhone === "(11) 3456-7890" ? (
                      <span className="text-emerald-600 text-[11px]">Copiado!</span>
                    ) : (
                      <Icon name="copy" size={12} className="text-slate-500" />
                    )}
                  </button>
                </div>
              </div>

              {/* Síndico / Zeladoria */}
              <div className="p-3.5 rounded-[8px] bg-slate-50 border border-slate-200/80 flex flex-col justify-between space-y-2.5">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h5 className="text-xs font-bold text-slate-900">
                      Síndico(a) & Zeladoria
                    </h5>
                    <span className="text-[11px] font-semibold text-slate-500">
                      Operações
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug mt-1">
                    Falhas de água/gás, elevadores e apoio técnico predial.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href="tel:11987654321"
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-[6px] bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 text-xs font-semibold transition-colors"
                  >
                    <Icon name="phone" size={12} />
                    <span>Ligar (11) 98765-4321</span>
                  </a>
                  <a
                    href="https://wa.me/5511987654321?text=Ol%C3%A1%2C%20preciso%20de%20apoio%20urgente%20no%20condom%C3%ADnio."
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center rounded-[6px] bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1.5 text-xs font-semibold transition-colors"
                    title="WhatsApp"
                  >
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Serviços Públicos Gratuitos */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Serviços Públicos de Urgência (Gratuito)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                { name: "SAMU", phone: "192", desc: "Emergência médica e ambulância", badge: "Saúde" },
                { name: "Bombeiros", phone: "193", desc: "Incêndio, gás e resgates", badge: "Resgate" },
                { name: "Polícia Militar", phone: "190", desc: "Segurança e ocorrências graves", badge: "Segurança" },
                { name: "Defesa Civil", phone: "199", desc: "Tempestades e risco estrutural", badge: "Prevenção" },
              ].map((service) => (
                <div
                  key={service.name}
                  className="p-3 rounded-[8px] bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-900">{service.name}</span>
                      <span className="text-[10px] text-slate-400 bg-slate-200/60 px-1.5 py-0.2 rounded">
                        {service.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 truncate">{service.desc}</p>
                  </div>

                  <a
                    href={`tel:${service.phone}`}
                    className="flex items-center gap-1 rounded-[6px] bg-red-600 hover:bg-red-700 text-white px-2.5 py-1.5 text-xs font-bold transition-colors shrink-0"
                  >
                    <Icon name="phone" size={11} />
                    <span>Ligar {service.phone}</span>
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Rodapé do Modal */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50 text-xs">
          <span className="text-slate-500 font-medium truncate">
            {condoName} · {condoAddress}
          </span>
          <button
            type="button"
            onClick={() => setEmergencyModalOpen(false)}
            className="rounded-[6px] border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  ) : null;

  // =========================================================================
  // REDESIGN COMPLETO: DASHBOARD DO MORADOR (Inspirado na hierarquia do Cofri)
  // =========================================================================
  if (isResident) {
    return (
      <div className="space-y-6">
        {/* 1. NOVO HERO DO DASHBOARD (Grande bloco AZUL SÓLIDO #0055D4, sem gradiente) */}
        <section className="relative overflow-hidden rounded-[16px] sm:rounded-[20px] bg-[#0055D4] p-5 sm:p-7 text-white shadow-sm select-none">
          {/* Símbolo do condomínio/prédio como elemento gráfico sutil de fundo */}
          <div className="pointer-events-none absolute -right-6 -bottom-8 opacity-10 hidden sm:block">
            <Icon name="building" size={210} strokeWidth={1} className="text-white" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <div className="space-y-1.5 max-w-xl">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
                Olá, {userName} 👋
              </h1>

              <p className="text-xs sm:text-sm text-blue-100 font-medium">
                {condoName} {unitLabel ? `• Unidade ${unitLabel}` : ""}
              </p>
              <p className="text-[11px] sm:text-xs text-blue-200/90 font-normal">
                Tudo do seu condomínio em um só lugar, organizado e rápido.
              </p>
            </div>

            {/* Ações do Hero */}
            <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
              <Link
                href="/painel/ocorrencias/nova"
                className="inline-flex min-h-[42px] items-center gap-2 rounded-[10px] bg-[#FFD000] hover:bg-[#FFE04D] active:bg-[#E6BB00] text-[#12162A] px-4 py-2 text-xs sm:text-sm font-bold shadow-xs transition-all duration-150 cursor-pointer"
              >
                <Icon name="plus" size={15} strokeWidth={2.6} />
                <span>Registrar ocorrência</span>
              </Link>

              <button
                type="button"
                onClick={() => setEmergencyModalOpen(true)}
                title="Telefones úteis e emergência 24h"
                className="inline-flex min-h-[42px] items-center gap-2 rounded-[10px] bg-red-600 hover:bg-red-700 active:bg-red-800 text-white px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Icon name="phone" size={15} strokeWidth={2.4} />
                <span>Emergência</span>
              </button>
            </div>
          </div>
        </section>

        {/* 2. AÇÕES RÁPIDAS (Linha de 4 ações: 1ª Amarela destaque Nível 1, demais Brancas) */}
        <section className="space-y-2">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* 1. Registrar ocorrência (Nível 1 - Amarelo Assinatura) */}
            <Link
              href="/painel/ocorrencias/nova"
              className="group relative flex min-h-[116px] sm:min-h-[128px] flex-col justify-between overflow-hidden rounded-[16px] bg-[#FFD000] p-4 sm:p-5 text-[#12162A] shadow-xs transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-center justify-start">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-[#12162A]/10 text-[#12162A] transition-transform group-hover:scale-110">
                  <Icon name="clipboard" size={17} strokeWidth={2.4} />
                </span>
              </div>
              <div className="pr-10 pt-2">
                <h3 className="text-xs sm:text-sm font-black tracking-tight leading-tight text-[#12162A]">
                  Registrar ocorrência
                </h3>
                <p className="mt-0.5 text-[11px] sm:text-xs font-medium text-[#12162A]/75 line-clamp-1">
                  Relatar problema ou manutenção
                </p>
              </div>
              <div className="absolute bottom-3 right-3 flex h-8 w-8 sm:h-8.5 sm:w-8.5 items-center justify-center rounded-full bg-white text-[#12162A] shadow-xs transition-all duration-150 group-hover:scale-110 group-hover:shadow-sm">
                <Icon name="arrow-up-right" size={15} strokeWidth={2.6} />
              </div>
            </Link>

            {/* 2. Nova reserva (Azul) */}
            <Link
              href="/painel/reservas"
              className="group relative flex min-h-[116px] sm:min-h-[128px] flex-col justify-between overflow-hidden rounded-[16px] bg-[#0070F3] p-4 sm:p-5 text-white shadow-xs transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md hover:bg-[#0062D6]"
            >
              <div className="flex items-center justify-start">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-white/15 text-white transition-transform group-hover:scale-110">
                  <Icon name="calendar" size={17} strokeWidth={2.2} />
                </span>
              </div>
              <div className="pr-10 pt-2">
                <h3 className="text-xs sm:text-sm font-black tracking-tight leading-tight text-white">
                  Nova reserva
                </h3>
                <p className="mt-0.5 text-[11px] sm:text-xs font-medium text-white/80 line-clamp-1">
                  Reserve áreas comuns
                </p>
              </div>
              <div className="absolute bottom-3 right-3 flex h-8 w-8 sm:h-8.5 sm:w-8.5 items-center justify-center rounded-full bg-white text-[#0070F3] shadow-xs transition-all duration-150 group-hover:scale-110 group-hover:shadow-sm">
                <Icon name="arrow-up-right" size={15} strokeWidth={2.6} />
              </div>
            </Link>

            {/* 3. Autorizar visitante (Azul) */}
            <Link
              href="/painel/visitantes"
              className="group relative flex min-h-[116px] sm:min-h-[128px] flex-col justify-between overflow-hidden rounded-[16px] bg-[#0070F3] p-4 sm:p-5 text-white shadow-xs transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md hover:bg-[#0062D6]"
            >
              <div className="flex items-center justify-start">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-white/15 text-white transition-transform group-hover:scale-110">
                  <Icon name="users" size={17} strokeWidth={2.2} />
                </span>
              </div>
              <div className="pr-10 pt-2">
                <h3 className="text-xs sm:text-sm font-black tracking-tight leading-tight text-white">
                  Autorizar visitante
                </h3>
                <p className="mt-0.5 text-[11px] sm:text-xs font-medium text-white/80 line-clamp-1">
                  Libere um acesso rápido
                </p>
              </div>
              <div className="absolute bottom-3 right-3 flex h-8 w-8 sm:h-8.5 sm:w-8.5 items-center justify-center rounded-full bg-white text-[#0070F3] shadow-xs transition-all duration-150 group-hover:scale-110 group-hover:shadow-sm">
                <Icon name="arrow-up-right" size={15} strokeWidth={2.6} />
              </div>
            </Link>

            {/* 4. Contratar serviço (Azul) */}
            <Link
              href="/painel/servicos"
              className="group relative flex min-h-[116px] sm:min-h-[128px] flex-col justify-between overflow-hidden rounded-[16px] bg-[#0070F3] p-4 sm:p-5 text-white shadow-xs transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md hover:bg-[#0062D6]"
            >
              <div className="flex items-center justify-start">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-white/15 text-white transition-transform group-hover:scale-110">
                  <Icon name="briefcase" size={17} strokeWidth={2.2} />
                </span>
              </div>
              <div className="pr-10 pt-2">
                <h3 className="text-xs sm:text-sm font-black tracking-tight leading-tight text-white">
                  Contratar serviço
                </h3>
                <p className="mt-0.5 text-[11px] sm:text-xs font-medium text-white/80 line-clamp-1">
                  Encontre profissionais
                </p>
              </div>
              <div className="absolute bottom-3 right-3 flex h-8 w-8 sm:h-8.5 sm:w-8.5 items-center justify-center rounded-full bg-white text-[#0070F3] shadow-xs transition-all duration-150 group-hover:scale-110 group-hover:shadow-sm">
                <Icon name="arrow-up-right" size={15} strokeWidth={2.6} />
              </div>
            </Link>
          </div>
        </section>

        {/* 3. RESUMO DO MORADOR (3 Cards Contextuais Equivalentes ao Cofri) */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Meu Resumo
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            {/* Card 1: Minhas ocorrências */}
            <div className="flex flex-col justify-between rounded-[16px] border border-slate-200/90 bg-white p-5 shadow-2xs hover:border-slate-300 transition-all">
              <div className="flex items-center justify-between pb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Minhas ocorrências
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-blue-50 text-[#0055D4]">
                  <Icon name="clipboard" size={16} />
                </span>
              </div>
              <div className="space-y-1">
                {residentStats.myOccurrences > 0 ? (
                  <>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black tracking-tight text-slate-900 tabular-nums">
                        {residentStats.myOccurrences}
                      </span>
                      <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                        em andamento
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 leading-snug">
                      Acompanhe o reparo e as atualizações do condomínio.
                    </p>
                  </>
                ) : (
                  <>
                    <span className="text-base sm:text-lg font-bold text-slate-800">
                      Tudo certo por aqui 👍
                    </span>
                    <p className="text-xs text-slate-500 leading-snug">
                      Nenhum chamado aberto na sua unidade.
                    </p>
                  </>
                )}
              </div>
              <div className="pt-4 mt-2 border-t border-slate-100 flex justify-between items-center text-xs font-bold">
                <Link
                  href={residentStats.myOccurrences > 0 ? "/painel/ocorrencias" : "/painel/ocorrencias/nova"}
                  className="text-[#0055D4] hover:underline flex items-center gap-1"
                >
                  <span>{residentStats.myOccurrences > 0 ? "Acompanhar ocorrências" : "Relatar um problema"}</span>
                  <Icon name="arrow-up-right" size={13} />
                </Link>
              </div>
            </div>

            {/* Card 2: Próxima reserva */}
            <div className="flex flex-col justify-between rounded-[16px] border border-slate-200/90 bg-white p-5 shadow-2xs hover:border-slate-300 transition-all">
              <div className="flex items-center justify-between pb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Próxima reserva
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-indigo-50 text-indigo-600">
                  <Icon name="calendar" size={16} />
                </span>
              </div>
              <div className="space-y-1">
                {upcomingReservations.length > 0 ? (
                  <>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base sm:text-lg font-black tracking-tight text-slate-900 truncate">
                        {upcomingReservations[0].amenityName}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        Confirmada
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 font-medium">
                      {upcomingReservations[0].date} · {upcomingReservations[0].time}
                    </p>
                  </>
                ) : (
                  <>
                    <span className="text-base sm:text-lg font-bold text-slate-800">
                      Nenhuma reserva futura
                    </span>
                    <p className="text-xs text-slate-500 leading-snug">
                      Salão de festas, churrasqueira e áreas de lazer livres.
                    </p>
                  </>
                )}
              </div>
              <div className="pt-4 mt-2 border-t border-slate-100 flex justify-between items-center text-xs font-bold">
                <Link
                  href="/painel/reservas"
                  className="text-[#0055D4] hover:underline flex items-center gap-1"
                >
                  <span>{upcomingReservations.length > 0 ? "Ver todas as reservas" : "Reservar área comum"}</span>
                  <Icon name="arrow-up-right" size={13} />
                </Link>
              </div>
            </div>

            {/* Card 3: Encomendas */}
            <div className="flex flex-col justify-between rounded-[16px] border border-slate-200/90 bg-white p-5 shadow-2xs hover:border-slate-300 transition-all">
              <div className="flex items-center justify-between pb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Encomendas na portaria
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-amber-50 text-amber-700">
                  <Icon name="package" size={16} />
                </span>
              </div>
              <div className="space-y-1">
                {residentStats.myParcels > 0 ? (
                  <>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black tracking-tight text-slate-900 tabular-nums">
                        {residentStats.myParcels}
                      </span>
                      <span className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-full">
                        {residentStats.myParcels === 1 ? "pronta para retirada" : "prontas para retirada"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 leading-snug">
                      Apresente sua identificação na guarita para retirar.
                    </p>
                  </>
                ) : (
                  <>
                    <span className="text-base sm:text-lg font-bold text-slate-800">
                      Nenhuma pendente
                    </span>
                    <p className="text-xs text-slate-500 leading-snug">
                      Você será notificado assim que uma encomenda chegar.
                    </p>
                  </>
                )}
              </div>
              <div className="pt-4 mt-2 border-t border-slate-100 flex justify-between items-center text-xs font-bold">
                <Link
                  href="/painel/encomendas"
                  className="text-[#0055D4] hover:underline flex items-center gap-1"
                >
                  <span>Ver encomendas</span>
                  <Icon name="arrow-up-right" size={13} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 4. SEÇÃO INFERIOR EM DUAS COLUNAS (Atenção Pessoal + Avisos do Condomínio) */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
          {/* Coluna 1: O que precisa da sua atenção */}
          <div className="rounded-[16px] border border-slate-200/90 bg-white p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-[6px] bg-amber-50 text-amber-700">
                  <Icon name="alert-triangle" size={13} />
                </span>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  O que precisa da sua atenção
                </h3>
              </div>
              {activeAttention.length > 0 && (
                <span className="rounded-full bg-amber-50 border border-amber-200/60 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                  {totalPending} {totalPending === 1 ? "pendência" : "pendências"}
                </span>
              )}
            </div>

            <div className="divide-y divide-slate-100">
              {activeAttention.length === 0 ? (
                <div className="py-6 flex flex-col items-center justify-center text-center space-y-1.5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 mb-1">
                    <Icon name="check-circle" size={20} />
                  </span>
                  <p className="text-xs font-bold text-slate-800">
                    Tudo em dia!
                  </p>
                  <p className="text-[11px] text-slate-400 max-w-xs">
                    Você não possui pendências, encomendas ou avisos urgentes no momento.
                  </p>
                </div>
              ) : (
                activeAttention.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="py-2.5 px-2 -mx-2 flex items-center justify-between gap-3 rounded-[8px] hover:bg-slate-50 transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-[6px] text-xs ${
                          item.urgent ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        <Icon name={item.urgent ? "package" : "clipboard"} size={14} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 group-hover:text-[#0055D4] transition-colors truncate">
                          {item.count} {item.label}
                        </p>
                        {item.detail && (
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            {item.detail}
                          </p>
                        )}
                      </div>
                    </div>

                    <Icon
                      name="chevron-right"
                      size={14}
                      className="text-slate-400 group-hover:text-slate-700 transition-colors shrink-0"
                    />
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Coluna 2: Avisos do condomínio */}
          <div className="rounded-[16px] border border-slate-200/90 bg-white p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-[6px] bg-blue-50 text-[#0055D4]">
                  <Icon name="megaphone" size={13} />
                </span>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Avisos do condomínio
                </h3>
              </div>
              <Link
                href="/painel/comunicados"
                className="text-[11px] font-bold text-[#0055D4] hover:underline"
              >
                Ver todos
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {notices.length === 0 ? (
                <div className="py-6 flex flex-col items-center justify-center text-center">
                  <Icon name="mail" size={20} className="text-slate-300 mb-1.5" />
                  <p className="text-xs font-bold text-slate-700">
                    Nenhum aviso recente
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Comunicados da administração aparecerão listados aqui.
                  </p>
                </div>
              ) : (
                notices.map((n) => {
                  const meta = NOTICE_META[n.kind];
                  const isUrgent = n.priority === "alta" || n.kind === "alerta";
                  return (
                    <Link
                      key={n.id}
                      href={n.href}
                      className="py-2.5 px-2 -mx-2 flex items-start justify-between gap-3 rounded-[8px] hover:bg-slate-50 transition-colors group"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <span
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-[6px] text-xs mt-0.5 ${
                            isUrgent ? "bg-red-50 text-red-600" : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          <Icon name={meta.icon} size={14} />
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-slate-900 group-hover:text-[#0055D4] transition-colors">
                              {n.title}
                            </span>
                            <span className="text-[10px] font-medium text-slate-400">
                              {n.date} · {meta.label}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                            {n.detail}
                          </p>
                        </div>
                      </div>
                      <Icon
                        name="chevron-right"
                        size={14}
                        className="text-slate-400 group-hover:text-slate-700 transition-colors shrink-0 mt-1"
                      />
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        </section>

        {/* 5. ZELADORIA SERVIÇOS (Atalho com chips de categorias) */}
        <section className="rounded-[16px] bg-white border border-slate-200/90 p-5 sm:p-6 shadow-2xs">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1.5 max-w-xl">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Precisa de um profissional para sua casa?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Encontre eletricistas, encanadores, pintores e técnicos avaliados por moradores do seu condomínio.
              </p>

              {/* Categorias Rápidas */}
              <div className="pt-2 flex items-center gap-2 flex-wrap">
                {[
                  { label: "⚡ Elétrica", href: "/painel/servicos?categoria=Eletricista" },
                  { label: "🚿 Hidráulica", href: "/painel/servicos?categoria=Encanador" },
                  { label: "❄️ Ar-condicionado", href: "/painel/servicos?categoria=Climatização" },
                  { label: "🎨 Pintura", href: "/painel/servicos?categoria=Pintura" },
                  { label: "🔨 Pequenos reparos", href: "/painel/servicos?categoria=Reformas" },
                ].map((cat) => (
                  <Link
                    key={cat.label}
                    href={cat.href}
                    className="rounded-full bg-slate-100 hover:bg-blue-50 hover:text-[#0055D4] px-3 py-1 text-xs font-semibold text-slate-700 transition-colors"
                  >
                    {cat.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="shrink-0 flex items-center">
              <Link
                href="/painel/servicos"
                className="inline-flex min-h-[42px] items-center gap-2 rounded-[10px] bg-[#0055D4] hover:bg-[#0043A8] active:bg-[#00388F] text-white px-4 py-2 text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer"
              >
                <span>Encontrar prestador</span>
                <Icon name="arrow-up-right" size={14} strokeWidth={2.4} />
              </Link>
            </div>
          </div>
        </section>

        {/* Modais Compartilhados */}
        {assistantOpen && <CondoAssistant onClose={() => setAssistantOpen(false)} />}
        {EmergencyModal}
      </div>
    );
  }

  // =========================================================================
  // DASHBOARD DA GESTÃO / SÍNDICO (Painel Operacional Completo)
  // =========================================================================
  return (
    <div className="space-y-6">
      {/* 1. Topo da Home: Limpo, Direto e Profissional */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-1">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-[26px] font-bold tracking-tight text-slate-900">
              Olá, {userName}
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-[#0055D4]">
              Gestão do Condomínio
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {condoName}
          </p>
        </div>

        {/* Ações de Suporte no Topo */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Botão de Emergência Compacto */}
          <button
            type="button"
            onClick={() => setEmergencyModalOpen(true)}
            title="Central de Emergência e Telefones Úteis 24h"
            className="inline-flex min-h-9 items-center gap-1.5 rounded-[8px] bg-red-600 hover:bg-red-700 active:bg-red-800 text-white px-3.5 py-1.5 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <Icon name="phone" size={14} className="shrink-0" />
            <span>Emergência</span>
          </button>

          {/* Botão Zeladoria IA */}
          <button
            type="button"
            onClick={() => setAssistantOpen(true)}
            title="Assistente Virtual de Dúvidas e Regras do Condomínio"
            className="inline-flex min-h-9 items-center gap-1.5 rounded-[8px] border border-blue-200 bg-blue-50 hover:bg-blue-100 text-[#0055D4] px-3.5 py-1.5 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <Icon name="sparkles" size={14} className="text-[#0055D4] shrink-0" />
            <span>Zeladoria IA</span>
          </button>
        </div>
      </header>

      {/* 2. AÇÕES PRINCIPAIS (Zeladoria: 1º amarelo, demais azul) */}
      <section className="space-y-2.5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pb-2 pt-1">
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
                  label: "Prestadores",
                  desc: "Profissionais avaliados",
                  href: "/painel/servicos",
                  icon: "briefcase" as IconName,
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
                className={`group relative flex min-h-[112px] sm:min-h-[132px] flex-col justify-between overflow-hidden rounded-[18px] sm:rounded-[20px] p-4 sm:p-5 transition-all duration-200 hover:-translate-y-0.5 ${
                  isYellow
                    ? "bg-[#FFD000] text-[#12162A] shadow-md shadow-[#FFD000]/25 hover:shadow-lg hover:shadow-[#FFD000]/35"
                    : "bg-[#0070F3] text-white shadow-md shadow-[#0070F3]/20 hover:shadow-lg hover:shadow-[#0070F3]/30"
                }`}
              >
                {/* Top-left Icon */}
                <div className="flex items-center justify-start">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-110 ${
                      isYellow
                        ? "bg-[#12162A]/10 text-[#12162A]"
                        : "bg-white/15 text-white"
                    }`}
                  >
                    <Icon name={action.icon} size={17} strokeWidth={2.2} />
                  </span>
                </div>

                {/* Bottom-left Content */}
                <div className="pr-11 pt-3">
                  <h3
                    className={`text-sm sm:text-[15px] font-black tracking-tight leading-tight ${
                      isYellow ? "text-[#12162A]" : "text-white"
                    }`}
                  >
                    {action.label}
                  </h3>
                  <p
                    className={`mt-0.5 text-[11px] sm:text-xs font-medium leading-snug line-clamp-1 ${
                      isYellow ? "text-[#12162A]/75" : "text-white/80"
                    }`}
                  >
                    {action.desc}
                  </p>
                </div>

                {/* Circular arrow button at bottom-right corner */}
                <div
                  className={`absolute bottom-3 right-3 flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-white shadow-sm shadow-black/10 transition-all duration-200 group-hover:scale-110 group-hover:shadow-md ${
                    isYellow ? "text-[#12162A]" : "text-[#0070F3]"
                  }`}
                >
                  <Icon name="arrow-up-right" size={15} strokeWidth={2.6} />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 2b. AVISOS DO CONDOMÍNIO (assembleias, comunicados e alertas) */}
      {notices.length > 0 && (
        <section className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="text-[11px] font-black uppercase tracking-wider text-slate-400">
              Avisos do condomínio
            </h2>
            <Link
              href="/painel/comunicados"
              className="text-[11px] font-bold text-[#0055D4] hover:underline"
            >
              Ver todos
            </Link>
          </div>

          <div className="rounded-[12px] border border-slate-200/80 bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.03)] divide-y divide-slate-100">
            {notices.map((n) => {
              const meta = NOTICE_META[n.kind];
              const isUrgent = n.priority === "alta" || n.kind === "alerta";
              return (
                <Link
                  key={n.id}
                  href={n.href}
                  className="py-2.5 px-2 -mx-2 flex items-start justify-between gap-3 rounded-[6px] hover:bg-slate-50/80 transition-colors group"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-[6px] text-xs mt-0.5 ${
                        isUrgent ? "bg-red-50 text-red-600" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      <Icon name={meta.icon} size={14} />
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-slate-900 group-hover:text-[#0055D4] transition-colors">
                          {n.title}
                        </span>
                        <span className="text-[10px] font-medium text-slate-400">
                          {n.date} · {meta.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                        {n.detail}
                      </p>
                    </div>
                  </div>
                  <Icon
                    name="chevron-right"
                    size={14}
                    className="text-slate-400 group-hover:text-slate-700 transition-colors shrink-0 mt-1"
                  />
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* 3. PRECISA DA SUA ATENÇÃO / SUAS PENDÊNCIAS */}
      {activeAttention.length > 0 && (
        <section className="rounded-[12px] border border-slate-200/80 bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.03)] space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {isResident ? "Suas Pendências" : "Precisa da sua atenção"}
            </h2>
            <span className="rounded-full bg-amber-50 border border-amber-200/60 px-2 py-0.5 text-[10px] font-bold text-amber-800">
              {totalPending} {totalPending === 1 ? "pendência" : "pendências"}
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {activeAttention.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="py-2.5 px-2 -mx-2 flex items-center justify-between gap-3 rounded-[6px] hover:bg-slate-50/80 transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-[6px] text-xs ${
                      item.urgent ? "bg-red-50 text-red-600" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    <Icon name={item.urgent ? "alert-triangle" : "clipboard"} size={14} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 group-hover:text-[#0055D4] transition-colors truncate">
                      {item.count} {item.label}
                    </p>
                    {item.detail && (
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {item.detail}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {item.urgent && (
                    <span className="rounded-full bg-red-50 px-2 py-0.2 text-[9px] font-bold uppercase text-red-700">
                      Alta prioridade
                    </span>
                  )}
                  <Icon
                    name="chevron-right"
                    size={14}
                    className="text-slate-400 group-hover:text-slate-700 transition-colors"
                  />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 5. RESUMO OPERACIONAL (Cards Métricos Minimalistas) */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {isResident ? "Meu Resumo" : "Resumo do Condomínio"}
          </h2>

          {/* Indicador de Conformidade Discreto para Gestão */}
          {!isResident && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setIndicatorTooltip(!indicatorTooltip)}
                onMouseEnter={() => setIndicatorTooltip(true)}
                onMouseLeave={() => setIndicatorTooltip(false)}
                className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 transition-colors"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span>87% Conformidade</span>
              </button>
              {indicatorTooltip && (
                <div className="absolute right-0 top-full z-50 mt-1.5 w-60 rounded-[8px] border border-slate-200 bg-white p-2.5 text-xs text-slate-600 shadow-xl leading-relaxed animate-in fade-in-50 duration-100">
                  <strong className="font-bold text-slate-900 block mb-0.5">Índice de Conformidade: 87/100</strong>
                  Média ponderada baseada no SLA de atendimento e vistorias preventivas.
                </div>
              )}
            </div>
          )}
        </div>

        {isResident ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Link
              href="/painel/ocorrencias"
              className="flex flex-col justify-between rounded-[12px] border border-slate-200/80 bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.03)] hover:border-slate-300 transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-blue-50 text-[#0055D4]">
                  <Icon name="clipboard" size={16} />
                </span>
                <Icon name="arrow-up-right" size={13} className="text-slate-300 group-hover:text-slate-600 transition-colors" />
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
                  {residentStats.myOccurrences}
                </span>
                <p className="text-xs font-semibold text-slate-700 mt-0.5 group-hover:text-[#0055D4] transition-colors">
                  Minhas ocorrências
                </p>
                <p className="text-[11px] text-slate-400 truncate">Ativas</p>
              </div>
            </Link>

            <Link
              href="/painel/reservas"
              className="flex flex-col justify-between rounded-[12px] border border-slate-200/80 bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.03)] hover:border-slate-300 transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-indigo-50 text-indigo-600">
                  <Icon name="calendar" size={16} />
                </span>
                <Icon name="arrow-up-right" size={13} className="text-slate-300 group-hover:text-slate-600 transition-colors" />
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
                  {residentStats.myReservations}
                </span>
                <p className="text-xs font-semibold text-slate-700 mt-0.5 group-hover:text-indigo-600 transition-colors">
                  Minhas reservas
                </p>
                <p className="text-[11px] text-slate-400 truncate">Agendadas</p>
              </div>
            </Link>

            <Link
              href="/painel/encomendas"
              className="flex flex-col justify-between rounded-[12px] border border-slate-200/80 bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.03)] hover:border-slate-300 transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-amber-50 text-amber-600">
                  <Icon name="package" size={16} />
                </span>
                <Icon name="arrow-up-right" size={13} className="text-slate-300 group-hover:text-slate-600 transition-colors" />
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
                  {residentStats.myParcels}
                </span>
                <p className="text-xs font-semibold text-slate-700 mt-0.5 group-hover:text-amber-600 transition-colors">
                  Encomendas
                </p>
                <p className="text-[11px] text-slate-400 truncate">Na portaria</p>
              </div>
            </Link>

            <Link
              href="/painel/comunicados"
              className="flex flex-col justify-between rounded-[12px] border border-slate-200/80 bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.03)] hover:border-slate-300 transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-emerald-50 text-emerald-600">
                  <Icon name="bell" size={16} />
                </span>
                <Icon name="arrow-up-right" size={13} className="text-slate-300 group-hover:text-slate-600 transition-colors" />
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
                  {residentStats.announcements}
                </span>
                <p className="text-xs font-semibold text-slate-700 mt-0.5 group-hover:text-emerald-600 transition-colors">
                  Comunicados
                </p>
                <p className="text-[11px] text-slate-400 truncate">No mural</p>
              </div>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Link
              href="/painel/ocorrencias"
              className="flex flex-col justify-between rounded-[12px] border border-slate-200/80 bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.03)] hover:border-slate-300 transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-blue-50 text-[#0055D4]">
                  <Icon name="alert" size={16} />
                </span>
                <Icon name="arrow-up-right" size={13} className="text-slate-300 group-hover:text-slate-600 transition-colors" />
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
                  {stats.openOccurrences}
                </span>
                <p className="text-xs font-semibold text-slate-700 mt-0.5 group-hover:text-[#0055D4] transition-colors">
                  Ocorrências abertas
                </p>
                <p className="text-[11px] text-slate-400 truncate">Demandas ativas</p>
              </div>
            </Link>

            <Link
              href="/painel/ordens"
              className="flex flex-col justify-between rounded-[12px] border border-slate-200/80 bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.03)] hover:border-slate-300 transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-indigo-50 text-indigo-600">
                  <Icon name="wrench" size={16} />
                </span>
                <Icon name="arrow-up-right" size={13} className="text-slate-300 group-hover:text-slate-600 transition-colors" />
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
                  {stats.executingOrders}
                </span>
                <p className="text-xs font-semibold text-slate-700 mt-0.5 group-hover:text-indigo-600 transition-colors">
                  Ordens em execução
                </p>
                <p className="text-[11px] text-slate-400 truncate">Manutenções</p>
              </div>
            </Link>

            <div className="flex flex-col justify-between rounded-[12px] border border-slate-200/80 bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.03)]">
              <div className="flex items-center justify-between">
                <span className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-emerald-50 text-emerald-600">
                  <Icon name="clock" size={16} />
                </span>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold tracking-tight text-emerald-600 tabular-nums">
                  {stats.slaPercent}%
                </span>
                <p className="text-xs font-semibold text-slate-700 mt-0.5">
                  SLA cumprimento
                </p>
                <p className="text-[11px] text-slate-400 truncate">Pontualidade</p>
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-[12px] border border-slate-200/80 bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.03)]">
              <div className="flex items-center justify-between">
                <span className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-slate-100 text-slate-700">
                  <Icon name="wallet" size={16} />
                </span>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
                  {stats.monthlyExpenses}
                </span>
                <p className="text-xs font-semibold text-slate-700 mt-0.5">
                  Gastos este mês
                </p>
                <p className="text-[11px] text-slate-400 truncate">Previsão</p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 6. ATIVIDADES RECENTES & PRÓXIMAS RESERVAS (2 Colunas Limpas com Divisores) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        {/* Atividades Recentes */}
        <div className="rounded-[12px] bg-white border border-slate-200/80 p-4 shadow-[0_1px_3px_rgba(15,23,42,0.03)] space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {isResident ? "Minhas atividades recentes" : "Atividades recentes"}
            </h3>
            <Link
              href="/painel/ocorrencias"
              className="text-xs font-semibold text-[#0055D4] hover:underline"
            >
              Ver todas
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {recentActivities.length === 0 ? (
              <div className="py-6 flex flex-col items-center justify-center text-center">
                <Icon name="clipboard" size={20} className="text-slate-300 mb-1.5" />
                <p className="text-xs font-semibold text-slate-700">
                  Nenhuma atividade recente
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Novas movimentações aparecerão listadas aqui.
                </p>
              </div>
            ) : (
              recentActivities.map((item) => (
                <Link
                  key={item.id}
                  href="/painel/ocorrencias"
                  className="py-2.5 px-2 -mx-2 flex items-center justify-between gap-3 hover:bg-slate-50/80 rounded-[6px] transition-colors group"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-mono text-[11px] font-semibold text-[#0055D4]">
                        {item.code}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {item.timeAgo}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-900 group-hover:text-[#0055D4] transition-colors truncate">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {item.location}
                    </p>
                  </div>

                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 shrink-0">
                    {item.status}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Próximas Reservas */}
        <div className="rounded-[12px] bg-white border border-slate-200/80 p-4 shadow-[0_1px_3px_rgba(15,23,42,0.03)] space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {isResident ? "Minhas próximas reservas" : "Próximas reservas"}
            </h3>
            <Link
              href="/painel/reservas"
              className="text-xs font-semibold text-[#0055D4] hover:underline"
            >
              Ver todas
            </Link>
          </div>

          <div>
            {upcomingReservations.length === 0 ? (
              <div className="py-6 flex flex-col items-center justify-center text-center space-y-2">
                <Icon name="calendar" size={20} className="text-slate-300 mb-0.5" />
                <div>
                  <p className="text-xs font-semibold text-slate-700">
                    Nenhuma reserva próxima
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Reserve áreas comuns como salão de festas ou churrasqueira.
                  </p>
                </div>
                <Link
                  href="/painel/reservas"
                  className="inline-flex items-center gap-1 rounded-[6px] bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-1.5 transition-colors"
                >
                  <Icon name="plus" size={12} />
                  <span>Nova reserva</span>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {upcomingReservations.map((res) => (
                  <div key={res.id} className="py-2.5 px-2 -mx-2 flex items-center justify-between gap-3">
                    <div>
                      <h4 className="text-xs font-semibold text-slate-900">
                        {res.amenityName}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {res.date} · {res.time} ({res.unit})
                      </p>
                    </div>
                    <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                      Confirmada
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 7. MAPA DO CONDOMÍNIO (Apenas para Gestão/Síndico) */}
      {!isResident && (
        <section className="space-y-2">
          <CondoMap onExpand={() => setFullMapModalOpen(true)} />
        </section>
      )}

      {/* 8. PRESTADORES RECOMENDADOS (Secundário, no final da página) */}
      {recommendedVendors.length > 0 && (
        <section className="rounded-[12px] bg-white border border-slate-200/80 p-4 shadow-[0_1px_3px_rgba(15,23,42,0.03)] space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Prestadores recomendados
              </h3>
              <p className="text-[11px] text-slate-400">
                Profissionais avaliados no condomínio
              </p>
            </div>
            <Link
              href="/painel/servicos"
              className="text-xs font-semibold text-[#0055D4] hover:underline"
            >
              Ver todos
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {recommendedVendors.map((vendor) => (
              <div
                key={vendor.id}
                className="group flex items-center justify-between p-3 rounded-[8px] bg-slate-50/70 border border-slate-200/80 hover:bg-white hover:border-slate-300 transition-all"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] bg-white border border-slate-200 text-[#0055D4] text-xs font-semibold">
                    <Icon name="briefcase" size={15} />
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-semibold text-slate-900 truncate group-hover:text-[#0055D4] transition-colors">
                        {vendor.name}
                      </h4>
                      {vendor.verified && (
                        <Icon name="check-circle" size={12} className="text-[#0055D4] shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {vendor.category} · {vendor.company}
                    </p>
                  </div>
                </div>

                {vendor.reviewsCount > 0 ? (
                  <div className="flex items-center gap-1 shrink-0 rounded-[4px] bg-white border border-slate-200 px-1.5 py-0.5 text-xs font-bold text-slate-700">
                    <Icon name="star" size={11} className="text-[#FFD000] fill-[#FFD000]" />
                    <span>{vendor.rating.toFixed(1)}</span>
                  </div>
                ) : (
                  <span className="shrink-0 text-[10px] text-slate-400">Sem avaliações</span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ASSISTENTE VIRTUAL ZELADORIA IA */}
      {assistantOpen && <CondoAssistant onClose={() => setAssistantOpen(false)} />}

      {/* MODAL: Central de Emergência e SOS */}
      {EmergencyModal}

      {/* MODAL: Mapa Completo Expandido */}
      {fullMapModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
            onClick={() => setFullMapModalOpen(false)}
            aria-hidden
          />
          <div className="relative w-full max-w-5xl rounded-[12px] border border-slate-200 bg-white p-5 shadow-2xl space-y-3 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  Mapa Completo do Condomínio
                </h3>
                <p className="text-xs text-slate-400">
                  Visualização ampliada de áreas comuns e pontos de interesse
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFullMapModalOpen(false)}
                className="p-1 rounded-[6px] text-slate-400 hover:bg-slate-100"
              >
                <Icon name="x" size={18} />
              </button>
            </div>

            <div className="h-[550px] w-full overflow-hidden rounded-[8px] border border-slate-200">
              <CondoMap />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
