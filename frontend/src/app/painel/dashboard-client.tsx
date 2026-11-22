"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
import { Icon, type IconName } from "@/components/icon";
import { CondoMap, type CondoMapOccurrence, type CondoCoordinates } from "@/components/condo-map";
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
    badge: "bg-blue-50 text-[#1455FF]",
    chip: "bg-blue-50 text-[#1455FF]",
  },
  alerta: {
    label: "Alerta",
    icon: "alert-triangle",
    badge: "bg-red-50 text-red-600",
    chip: "bg-red-50 text-red-700",
  },
};

import { PorteiroDashboard, type InsideVisitor, type ExpectedVisitor, type PendingParcel, type ShiftInfo, type PorteiroOverview } from "@/components/porteiro-dashboard";
import { SindicoDashboard, type SindicoTodaySummary, type SmartPreventionAlert, type LogbookEntry, type ManagementOccurrence } from "@/components/sindico-dashboard";

export type {
  InsideVisitor,
  ExpectedVisitor,
  PendingParcel,
  ShiftInfo,
  PorteiroOverview,
  SindicoTodaySummary,
  SmartPreventionAlert,
  LogbookEntry,
  ManagementOccurrence,
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
  mapOccurrences = [],
  condoCoordinates,
  // Specialized Props
  activeShift,
  lastShift,
  porteiroOverview,
  allUnits = [],
  sindicoSummary,
  smartAlerts = [],
  logbookEntries = [],
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
  mapOccurrences?: CondoMapOccurrence[];
  condoCoordinates?: CondoCoordinates;
  // Specialized Props
  activeShift?: ShiftInfo | null;
  lastShift?: ShiftInfo | null;
  porteiroOverview?: PorteiroOverview;
  allUnits?: Array<{ id: number; label: string }>;
  sindicoSummary?: SindicoTodaySummary;
  smartAlerts?: SmartPreventionAlert[];
  logbookEntries?: LogbookEntry[];
}) {
  // Hooks moved to the top of the component to obey React Rules of Hooks
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);
  const [fullMapModalOpen, setFullMapModalOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [indicatorTooltip, setIndicatorTooltip] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  // Estado e busca para o card "Acompanhe sua solicitação"
  const [protocolQuery, setProtocolQuery] = useState("");
  const [protocolResult, setProtocolResult] = useState<any | null>(null);
  const [protocolSearched, setProtocolSearched] = useState(false);
  const protocolInputRef = useRef<HTMLInputElement>(null);

  const handleConsultarProtocolo = (e: React.FormEvent) => {
    e.preventDefault();
    const q = protocolQuery.trim();
    if (!q) return;

    setProtocolSearched(true);
    const found =
      mapOccurrences.find(
        (o) => o.code.toLowerCase() === q.toLowerCase() || String(o.id) === q
      ) ||
      recentActivities.find(
        (o) => o.code.toLowerCase() === q.toLowerCase() || String(o.id) === q
      );

    if (found) {
      setProtocolResult(found);
    } else {
      setProtocolResult(null);
      // Redireciona para pesquisa na página de ocorrências
      router.push(`/painel/ocorrencias?search=${encodeURIComponent(q)}`);
    }
  };

  const handleFocusProtocol = () => {
    if (protocolInputRef.current) {
      protocolInputRef.current.focus();
      protocolInputRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      router.push("/painel/ocorrencias");
    }
  };

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

  const router = useRouter();

  // Sincronização em tempo real para avisos e contadores de encomendas
  useEffect(() => {
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel("zc_encomendas_sync");
      bc.onmessage = () => {
        router.refresh();
      };
    } catch {}

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "zc_encomendas_last_update") {
        router.refresh();
      }
    };
    window.addEventListener("storage", handleStorage);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        router.refresh();
      }
    };
    window.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", () => router.refresh());

    const interval = setInterval(() => {
      router.refresh();
    }, 15000);

    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", () => router.refresh());
      if (bc) bc.close();
    };
  }, [router]);

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

  // 1. Specialized Porteiro Dashboard View
  if ((role === "porteiro" || role === "zelador") && porteiroOverview) {
    return (
      <PorteiroDashboard
        userName={userName}
        condoName={condoName}
        activeShift={activeShift ?? null}
        lastShift={lastShift ?? null}
        overview={porteiroOverview}
        allUnits={allUnits}
      />
    );
  }

  // 2. Specialized Síndico Management Dashboard View
  if ((role === "sindico" || role === "superadmin" || role === "conselho") && !isResident && sindicoSummary) {
    return (
      <SindicoDashboard
        userName={userName}
        condoName={condoName}
        attentionItems={attentionItems}
        todaySummary={sindicoSummary}
        smartAlerts={smartAlerts}
        logbookEntries={logbookEntries}
        recentActivities={recentActivities}
        mapOccurrences={mapOccurrences}
        condoCoordinates={condoCoordinates}
      />
    );
  }

  // 3. Resident / Standard Dashboard View

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
  // =========================================================================
  // DASHBOARD DA HOME — CENTRAL VISUAL INSTITUCIONAL (FIEL À REFERÊNCIA)
  // =========================================================================
  if (isResident) {
    const nextReservation = upcomingReservations.length > 0 ? upcomingReservations[0] : null;
    const hasParcels = residentStats.myParcels > 0;
    const hasOccurrences = residentStats.myOccurrences > 0;
    const hasReservation = Boolean(nextReservation);
    const hasTodayItems = hasParcels || hasOccurrences || hasReservation;

    // Avisos do condomínio (dados reais do condomínio ou avisos institucionais da referência)
    const displayNotices: CondoNotice[] =
      notices.length > 0
        ? notices
        : [
            {
              id: "aviso-1",
              kind: "alerta",
              title: "Manutenção preventiva dos elevadores",
              detail: "Nesta quinta-feira, das 8h às 12h, os elevadores ficarão indisponíveis.",
              date: "18/10/2026",
              href: "/painel/comunicados",
              priority: "alta",
            },
            {
              id: "aviso-2",
              kind: "comunicado",
              title: "Nova rotina de retirada de encomendas",
              detail: "As encomendas passarão a ser retiradas mediante código no aplicativo.",
              date: "16/10/2026",
              href: "/painel/comunicados",
              priority: "normal",
            },
            {
              id: "aviso-3",
              kind: "assembleia",
              title: "Assembleia Geral Ordinária 2026",
              detail: "Convocação publicada com pauta, quórum e instruções de participação.",
              date: "14/10/2026",
              href: "/painel/assembleias",
              priority: "alta",
            },
          ];

    // Os 6 cards de serviços presentes na referência
    const serviceCards = [
      {
        id: "ocorrencias",
        title: "Ocorrências",
        description: "Registre problemas e solicite manutenções",
        href: "/painel/ocorrencias",
        icon: "alert-triangle" as IconName,
      },
      {
        id: "reservas",
        title: "Reservas",
        description: "Reserve espaços como salão, churrasqueira e mais",
        href: "/painel/reservas",
        icon: "calendar" as IconName,
      },
      {
        id: "visitantes",
        title: "Visitantes",
        description: "Autorize e gerencie o acesso de visitantes",
        href: "/painel/visitantes",
        icon: "users" as IconName,
      },
      {
        id: "encomendas",
        title: "Encomendas",
        description: "Acompanhe e retire suas encomendas",
        href: "/painel/encomendas",
        icon: "package" as IconName,
      },
      {
        id: "assembleias",
        title: "Assembleias",
        description: "Participe, vote e acompanhe as deliberações",
        href: "/painel/assembleias",
        icon: "scale" as IconName,
      },
      {
        id: "tiao",
        title: "Tião Zelador",
        description: "Seu assistente do condomínio com IA",
        href: "/painel/servicos",
        icon: "tiao" as IconName,
      },
    ];

    return (
      <div className="space-y-6 max-w-[1480px] mx-auto pb-8">
        {/* ================================================================= */}
        {/* 1. HERO PRINCIPAL COM IMAGEM DO CONDOMÍNIO (FIEL À IMAGEM)       */}
        {/* ================================================================= */}
        <section className="relative overflow-hidden rounded-3xl bg-[#071A38] text-white border border-[#E1E8F2] shadow-sm min-h-[260px] sm:min-h-[280px] lg:min-h-[300px] flex items-stretch">
          {/* Lado Esquerdo: Conteúdo textual com fundo escuro e contraste nítido */}
          <div className="w-full lg:w-[56%] p-6 sm:p-8 lg:p-10 flex flex-col justify-center relative z-10">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
              Participe do seu condomínio
            </h1>
            <p className="text-xs sm:text-sm text-white/80 font-normal mt-2.5 max-w-lg leading-relaxed">
              Registre ocorrências, acompanhe solicitações e facilite a rotina condominial.
            </p>

            {/* Botões Principais da Referência */}
            <div className="flex items-center gap-3 mt-6 flex-wrap">
              <Link
                href="/painel/ocorrencias?nova=1"
                className="inline-flex items-center gap-2 rounded-full bg-[#1455FF] hover:bg-[#0048E8] text-white px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-bold shadow-md transition-all active:scale-95 group"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[#1455FF]">
                  <Icon name="plus" size={13} strokeWidth={3} />
                </span>
                <span>Registrar ocorrência</span>
                <Icon
                  name="chevron-right"
                  size={14}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </Link>

              <button
                type="button"
                onClick={handleFocusProtocol}
                className="inline-flex items-center gap-2 rounded-full border border-white/40 hover:bg-white/10 text-white px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold transition-all cursor-pointer active:scale-95"
              >
                <Icon name="search" size={14} />
                <span>Acompanhar solicitação</span>
              </button>
            </div>
          </div>

          {/* Lado Direito: Fotografia Realista do Condomínio com Badge */}
          <div className="hidden lg:block lg:w-[44%] relative overflow-hidden">
            {/* Imagem do Condomínio (fotografia realista) */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/condominio-hero.jpg"
              alt={condoName || "Condomínio Residencial"}
              className="w-full h-full object-cover object-center"
            />
            {/* Degradê de fusão suave entre a foto e o fundo azul escuro */}
            <div className="absolute inset-y-0 left-0 w-28 bg-gradient-to-r from-[#071A38] to-transparent pointer-events-none" />

            {/* Badge de Identificação do Condomínio sobre a foto */}
            <div className="absolute top-5 right-5 bg-white/95 backdrop-blur-xs text-[#071A38] px-3.5 py-1.5 rounded-xl shadow-md border border-white/40 flex items-center gap-2 text-xs font-bold">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#1455FF] text-white">
                <Icon name="building" size={12} />
              </span>
              <span className="truncate max-w-[200px]">
                {condoName || "Residencial Parque das Águas"}
              </span>
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* 2. CARDS DE SERVIÇOS (6 CARDS CONFORME A REFERÊNCIA VISUAL)      */}
        {/* ================================================================= */}
        <section>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {serviceCards.map((card) => {
              const isTiaoCard = card.id === "tiao";

              return (
                <Link
                  key={card.id}
                  href={card.href}
                  className="service-card flex flex-col justify-between rounded-2xl border border-[#E1E8F2] bg-white p-4 sm:p-5 shadow-[0_2px_8px_rgba(7,26,56,0.04)] hover:shadow-[0_8px_20px_rgba(20,85,255,0.08)] hover:border-[#1455FF]/40 transition-all cursor-pointer group min-h-[145px]"
                >
                  {/* Topo do card: Ícone + Seta */}
                  <div className="flex items-center justify-between w-full mb-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF1FF] text-[#1455FF] transition-transform group-hover:scale-105">
                      {isTiaoCard ? (
                        <img
                          src="/brands/tiao/mascot-orange.png"
                          alt="Tião Zelador"
                          className="h-6 w-6 object-contain"
                        />
                      ) : (
                        <Icon name={card.icon} size={18} strokeWidth={2} />
                      )}
                    </span>
                    <Icon
                      name="chevron-right"
                      size={15}
                      className="text-slate-400 group-hover:text-[#1455FF] group-hover:translate-x-0.5 transition-all"
                    />
                  </div>

                  {/* Informações: Título e Descrição */}
                  <div>
                    <h3 className="text-sm font-bold text-[#101828] group-hover:text-[#1455FF] transition-colors leading-tight">
                      {card.title}
                    </h3>
                    <p className="text-[11px] sm:text-xs text-[#526079] mt-1 leading-snug line-clamp-2">
                      {card.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* ================================================================= */}
        {/* 3. SEÇÃO INTERMEDIÁRIA (AVISOS + ACOMPANHE + ACESSE PELO CELULAR) */}
        {/* ================================================================= */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* COLUNA ESQUERDA: Avisos do condomínio */}
          <div className="rounded-2xl border border-[#E1E8F2] bg-white p-5 shadow-[0_2px_8px_rgba(7,26,56,0.04)] flex flex-col justify-between">
            <div>
              {/* Cabeçalho da seção */}
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#E1E8F2]">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF1FF] text-[#1455FF] shrink-0">
                    <Icon name="megaphone" size={18} />
                  </span>
                  <div>
                    <h2 className="text-base font-bold text-[#101828]">Avisos do condomínio</h2>
                    <p className="text-xs text-[#526079] mt-0.5">
                      Fique por dentro de comunicados, assembleias e novidades.
                    </p>
                  </div>
                </div>

                <Link
                  href="/painel/comunicados"
                  className="text-xs font-bold text-[#1455FF] hover:underline inline-flex items-center gap-1 shrink-0 mt-1"
                >
                  <span>Ver todos</span>
                  <Icon name="chevron-right" size={12} />
                </Link>
              </div>

              {/* Lista de Avisos */}
              <div className="divide-y divide-[#E1E8F2] mt-1">
                {displayNotices.slice(0, 3).map((notice) => {
                  const isAlert = notice.kind === "alerta" || notice.priority === "alta";
                  const isAssembly = notice.kind === "assembleia";

                  const badgeClass = isAlert
                    ? "bg-rose-50 text-rose-600 border border-rose-200"
                    : isAssembly
                    ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                    : "bg-blue-50 text-[#1455FF] border border-blue-200";

                  const badgeLabel = isAlert
                    ? "Alerta"
                    : isAssembly
                    ? "Assembleia"
                    : "Comunicado";

                  const iconTone = isAlert
                    ? "bg-rose-50 text-rose-600"
                    : isAssembly
                    ? "bg-indigo-50 text-indigo-700"
                    : "bg-blue-50 text-[#1455FF]";

                  return (
                    <Link
                      key={notice.id}
                      href={notice.href}
                      className="py-3.5 px-2 -mx-2 flex items-center justify-between gap-3 hover:bg-slate-50/80 rounded-xl transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs ${iconTone}`}
                        >
                          <Icon
                            name={
                              isAlert
                                ? "alert-triangle"
                                : isAssembly
                                ? "scale"
                                : "megaphone"
                            }
                            size={16}
                          />
                        </span>

                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs sm:text-sm font-bold text-[#101828] group-hover:text-[#1455FF] transition-colors truncate">
                              {notice.title}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeClass}`}
                            >
                              {badgeLabel}
                            </span>
                          </div>
                          <p className="text-xs text-[#526079] line-clamp-1 leading-relaxed">
                            {notice.detail}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-[#526079] font-medium hidden sm:inline">
                          {notice.date}
                        </span>
                        <Icon
                          name="chevron-right"
                          size={14}
                          className="text-slate-400 group-hover:text-[#1455FF] group-hover:translate-x-0.5 transition-all"
                        />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {/* COLUNA DIREITA: Acompanhe sua solicitação + Acesse pelo celular */}
          <div className="space-y-6 flex flex-col justify-between">
            {/* Card Superior: Acompanhe sua solicitação */}
            <div className="rounded-2xl border border-[#E1E8F2] bg-white p-5 shadow-[0_2px_8px_rgba(7,26,56,0.04)]">
              <div className="flex items-center gap-3 mb-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF1FF] text-[#1455FF] shrink-0">
                  <Icon name="clipboard" size={18} />
                </span>
                <div>
                  <h2 className="text-base font-bold text-[#101828]">Acompanhe sua solicitação</h2>
                  <p className="text-xs text-[#526079] mt-0.5">
                    Informe o número do protocolo e veja o andamento.
                  </p>
                </div>
              </div>

              <form onSubmit={handleConsultarProtocolo} className="flex items-center gap-2 mt-4">
                <div className="relative flex-1">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                    #
                  </span>
                  <input
                    ref={protocolInputRef}
                    type="text"
                    value={protocolQuery}
                    onChange={(e) => setProtocolQuery(e.target.value)}
                    placeholder="Ex.: ZEL-20261116-1067"
                    className="w-full h-11 pl-8 pr-3 rounded-xl border border-[#E1E8F2] bg-[#F5F8FC] text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#1455FF] focus:ring-2 focus:ring-[#1455FF]/20 outline-none transition-all"
                  />
                </div>
                <button
                  type="submit"
                  className="h-11 px-5 rounded-xl bg-[#1455FF] hover:bg-[#0048E8] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
                >
                  <Icon name="search" size={15} />
                  <span>Consultar</span>
                </button>
              </form>

              {/* Resultado inline caso encontre o protocolo localmente */}
              {protocolSearched && protocolResult && (
                <div className="mt-3 p-3 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-slate-800 animate-in fade-in-50">
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span>Protocolo: {protocolResult.code}</span>
                    <span className="text-[#1455FF]">{protocolResult.status}</span>
                  </div>
                  <p className="mt-1 text-slate-600 line-clamp-1">{protocolResult.title}</p>
                  <Link
                    href={`/painel/ocorrencias`}
                    className="mt-2 text-[11px] font-bold text-[#1455FF] hover:underline inline-block"
                  >
                    Ver detalhes completos da ocorrência →
                  </Link>
                </div>
              )}
            </div>

            {/* Card Inferior: Acesse também pelo celular */}
            <div className="rounded-2xl border border-[#E1E8F2] bg-white p-5 shadow-[0_2px_8px_rgba(7,26,56,0.04)] flex flex-col sm:flex-row items-center gap-5">
              {/* Mockup de Celular Profissional com a Marca Zeladoria */}
              <div className="relative w-20 h-36 sm:w-24 sm:h-44 bg-[#071A38] rounded-[22px] border-[3px] border-slate-900 p-1 shadow-lg shrink-0 flex flex-col justify-between overflow-hidden select-none">
                <div className="w-8 h-1 bg-slate-900 rounded-full mx-auto" />
                <div className="flex-1 bg-[#0A224A] rounded-[16px] p-2 flex flex-col items-center justify-center text-center mt-1">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#1455FF] text-white mb-1 shadow-2xs">
                    <Icon name="building" size={12} />
                  </span>
                  <span className="text-[7px] font-black tracking-tight text-white uppercase leading-none">
                    Zeladoria
                  </span>
                  <span className="text-[6px] font-semibold text-blue-200 uppercase leading-none mt-0.5">
                    Condomínio
                  </span>
                </div>
                <div className="w-6 h-0.5 bg-white/40 rounded-full mx-auto mt-1" />
              </div>

              {/* Textos e Botões de Aplicativo */}
              <div className="flex-1 text-center sm:text-left">
                <h3 className="text-base font-bold text-[#101828]">Acesse também pelo celular</h3>
                <p className="text-xs text-[#526079] mt-1 leading-relaxed">
                  Gerencie ocorrências, reservas, visitantes e muito mais, onde estiver.
                </p>

                {/* Badges de Lojas / Download */}
                <div className="flex items-center justify-center sm:justify-start gap-2.5 mt-3.5 flex-wrap">
                  {/* Google Play Badge */}
                  <a
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 text-[11px] font-semibold shadow-xs transition-colors"
                  >
                    <svg className="w-4 h-4 fill-current text-emerald-400" viewBox="0 0 24 24">
                      <path d="M3.6 1.8l11.4 10.2L3.6 22.2c-.4-.4-.6-1-.6-1.7V3.5c0-.7.2-1.3.6-1.7zm13 8.7L5.8.4c.5-.3 1.2-.3 1.8.1l11 6.2-2 3.8zm0 3l2 3.8-11 6.2c-.6.3-1.3.3-1.8.1l10.8-10.1zm1.2-1.5l2.6 1.5c.9.5.9 1.4 0 1.9l-2.6 1.5-2.2-2.4 2.2-2.5z" />
                    </svg>
                    <div className="text-left leading-none">
                      <span className="text-[8px] text-slate-400 block uppercase">Disponível no</span>
                      <span className="text-[11px] font-bold">Google Play</span>
                    </div>
                  </a>

                  {/* App Store Badge */}
                  <a
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 text-[11px] font-semibold shadow-xs transition-colors"
                  >
                    <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 24 24">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.84c.66-.8 1.11-1.92.99-3.04-.96.04-2.12.64-2.8 1.44-.59.68-1.11 1.78-.97 2.87 1.07.08 2.12-.53 2.78-1.27z" />
                    </svg>
                    <div className="text-left leading-none">
                      <span className="text-[8px] text-slate-400 block uppercase">Disponível na</span>
                      <span className="text-[11px] font-bold">App Store</span>
                    </div>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* 4. BANNER INFERIOR: SEU CONDOMÍNIO MAIS CONECTADO                 */}
        {/* ================================================================= */}
        <section className="rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#0048E8] via-[#0038C8] to-[#0028A0] p-4 sm:p-5 lg:px-7 lg:py-5 text-white shadow-md shadow-blue-950/15 flex flex-col md:flex-row md:items-center md:justify-between gap-4 sm:gap-6 border border-blue-400/20">
          <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
            {/* Ícone oficial do condomínio conectado */}
            <div className="h-12 w-12 sm:h-14 sm:w-14 shrink-0 rounded-full flex items-center justify-center">
              <img
                src="/condominio-icon-badge.png"
                alt="Condomínio Conectado"
                className="h-full w-full object-contain"
              />
            </div>

            {/* Linha divisória vertical */}
            <div className="hidden sm:block h-10 w-[1.5px] bg-white/25 shrink-0" />

            {/* Textos */}
            <div className="min-w-0 space-y-0.5">
              <h3 className="text-base sm:text-lg lg:text-xl font-bold sm:font-black text-white tracking-tight">
                Seu condomínio, mais conectado.
              </h3>
              <p className="text-xs sm:text-sm text-white/90 font-medium leading-relaxed">
                Acompanhe comunicados, solicitações e novidades em um só lugar.
              </p>
            </div>
          </div>

          <div className="shrink-0 self-start md:self-auto">
            <Link
              href="/painel/comunicados"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white hover:bg-slate-50 text-[#0038C8] px-5 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-bold shadow-sm hover:shadow-md transition-all active:scale-95 group cursor-pointer whitespace-nowrap"
            >
              <span>Ver comunicados</span>
              <Icon
                name="arrow-right"
                size={15}
                strokeWidth={2.8}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>
          </div>
        </section>

        {/* ================================================================= */}
        {/* 5. INFORMAÇÕES OPERACIONAIS EXISTENTES (PRESERVAÇÃO TOTAL)        */}
        {/* ================================================================= */}
        {hasTodayItems && (
          <section className="space-y-3 pt-2">
            <h2 className="text-sm font-bold text-[#101828] tracking-tight">
              Suas pendências & atividades de hoje
            </h2>

            <div className="rounded-2xl border border-[#E1E8F2] bg-white shadow-[0_2px_8px_rgba(7,26,56,0.04)] divide-y divide-[#E1E8F2] overflow-hidden">
              {/* Encomendas para retirar */}
              {hasParcels && (
                <Link
                  href="/painel/encomendas"
                  className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-900">
                      <Icon name="package" size={16} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-[#101828] group-hover:text-[#1455FF] transition-colors truncate">
                        {residentStats.myParcels}{" "}
                        {residentStats.myParcels === 1
                          ? "encomenda aguardando retirada"
                          : "encomendas aguardando retirada"}
                      </p>
                      <p className="text-[11px] text-[#526079] truncate mt-0.5">
                        Disponível na portaria · apresente seu código ou QR Code
                      </p>
                    </div>
                  </div>
                  <Icon
                    name="chevron-right"
                    size={15}
                    className="text-slate-400 group-hover:text-[#1455FF] transition-colors shrink-0"
                  />
                </Link>
              )}

              {/* Ocorrências em andamento */}
              {hasOccurrences && (
                <Link
                  href="/painel/ocorrencias"
                  className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EAF1FF] text-[#1455FF]">
                      <Icon name="clipboard" size={16} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-[#101828] group-hover:text-[#1455FF] transition-colors truncate">
                        {residentStats.myOccurrences}{" "}
                        {residentStats.myOccurrences === 1
                          ? "ocorrência sua em andamento"
                          : "ocorrências suas em andamento"}
                      </p>
                      <p className="text-[11px] text-[#526079] truncate mt-0.5">
                        Acompanhe as respostas e o status do chamado
                      </p>
                    </div>
                  </div>
                  <Icon
                    name="chevron-right"
                    size={15}
                    className="text-slate-400 group-hover:text-[#1455FF] transition-colors shrink-0"
                  />
                </Link>
              )}

              {/* Próxima Reserva */}
              {hasReservation && nextReservation && (
                <Link
                  href="/painel/reservas"
                  className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                      <Icon name="calendar" size={16} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-[#101828] group-hover:text-[#1455FF] transition-colors truncate">
                        {nextReservation.amenityName}
                      </p>
                      <p className="text-[11px] text-[#526079] truncate mt-0.5">
                        {nextReservation.date === "Hoje" ? "Hoje" : nextReservation.date} ·{" "}
                        {nextReservation.time}
                      </p>
                    </div>
                  </div>
                  <Icon
                    name="chevron-right"
                    size={15}
                    className="text-slate-400 group-hover:text-[#1455FF] transition-colors shrink-0"
                  />
                </Link>
              )}
            </div>
          </section>
        )}

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
            <span className="inline-flex items-center gap-1.5 rounded-[6px] bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-[#1455FF]">
              Gestão do Condomínio
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {condoName}
          </p>
        </div>

        {/* Ações de Suporte no Topo */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {/* Botão de Emergência Compacto */}
          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("open-emergency-sos"));
              }
              setEmergencyModalOpen(true);
            }}
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
            className="inline-flex min-h-9 items-center gap-1.5 rounded-[8px] border border-blue-200 bg-blue-50 hover:bg-blue-100 text-[#1455FF] px-3.5 py-1.5 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <Icon name="sparkles" size={14} className="text-[#1455FF] shrink-0" />
            <span>Zeladoria IA</span>
          </button>
        </div>
      </header>

      {/* 2. AÇÕES PRINCIPAIS (Zeladoria: 1º amarelo, demais azul) */}
      <section className="space-y-2.5">
        <div className="grid grid-cols-1 min-[360px]:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pb-2 pt-1">
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
                  label: "Tião Zelador",
                  desc: "Profissionais avaliados",
                  href: "/painel/servicos",
                  icon: "tiao" as IconName,
                  variant: "orange" as const,
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
                  label: "Tião Zelador",
                  desc: "Profissionais avaliados",
                  href: "/painel/servicos",
                  icon: "tiao" as IconName,
                  variant: "orange" as const,
                },
              ]
          ).map((action) => {
            const isYellow = action.variant === "yellow";
            const isOrange = action.variant === "orange" || action.label === "Tião Zelador";

            return (
              <Link
                key={action.label}
                href={action.href}
                className={`group relative flex min-h-[112px] sm:min-h-[132px] flex-col justify-between overflow-hidden rounded-[18px] sm:rounded-[20px] p-4 sm:p-5 transition-all duration-200 hover:-translate-y-0.5 ${
                  isOrange
                    ? "bg-[#FB6B01] text-white shadow-md shadow-[#FB6B01]/25 hover:shadow-lg hover:shadow-[#FB6B01]/35"
                    : isYellow
                    ? "bg-[#FFD000] text-[#12162A] shadow-md shadow-[#FFD000]/25 hover:shadow-lg hover:shadow-[#FFD000]/35"
                    : "bg-[#1455FF] text-white shadow-md shadow-[#1455FF]/20 hover:shadow-lg hover:shadow-[#1455FF]/30"
                }`}
              >
                {/* Top-left Icon */}
                <div className="flex items-center justify-start">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-110 ${
                      isOrange
                        ? "bg-white/20 text-white"
                        : isYellow
                        ? "bg-[#12162A]/10 text-[#12162A]"
                        : "bg-white/15 text-white"
                    }`}
                  >
                    {isOrange ? (
                      <img
                        src="/brands/tiao/mascot-white.png"
                        alt="Tião"
                        className="h-5.5 w-5.5 object-contain"
                      />
                    ) : (
                      <Icon name={action.icon} size={17} strokeWidth={2.2} />
                    )}
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
                  className={`absolute bottom-3 right-3 flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-[8px] bg-white shadow-sm shadow-black/10 transition-all duration-200 group-hover:scale-110 group-hover:shadow-md ${
                    isOrange
                      ? "text-[#FB6B01]"
                      : isYellow
                      ? "text-[#12162A]"
                      : "text-[#1455FF]"
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
              className="text-[11px] font-bold text-[#1455FF] hover:underline"
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
                        <span className="text-xs font-semibold text-slate-900 group-hover:text-[#1455FF] transition-colors">
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
            <span className="rounded-[6px] bg-amber-50 border border-amber-200/60 px-2 py-0.5 text-[10px] font-bold text-amber-800">
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
                    <p className="text-xs font-semibold text-slate-900 group-hover:text-[#1455FF] transition-colors truncate">
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
                    <span className="rounded-[4px] bg-red-50 px-2 py-0.2 text-[9px] font-bold uppercase text-red-700">
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
                className="inline-flex items-center gap-1.5 rounded-[6px] bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 transition-colors"
              >
                <span className="h-1.5 w-1.5 rounded-[2px] bg-emerald-500" />
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
                <span className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-blue-50 text-[#1455FF]">
                  <Icon name="clipboard" size={16} />
                </span>
                <Icon name="arrow-up-right" size={13} className="text-slate-300 group-hover:text-slate-600 transition-colors" />
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
                  {residentStats.myOccurrences}
                </span>
                <p className="text-xs font-semibold text-slate-700 mt-0.5 group-hover:text-[#1455FF] transition-colors">
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
                <span className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-blue-50 text-[#1455FF]">
                  <Icon name="alert" size={16} />
                </span>
                <Icon name="arrow-up-right" size={13} className="text-slate-300 group-hover:text-slate-600 transition-colors" />
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
                  {stats.openOccurrences}
                </span>
                <p className="text-xs font-semibold text-slate-700 mt-0.5 group-hover:text-[#1455FF] transition-colors">
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
              className="text-xs font-semibold text-[#1455FF] hover:underline"
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
                      <span className="font-mono text-[11px] font-semibold text-[#1455FF]">
                        {item.code}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {item.timeAgo}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-900 group-hover:text-[#1455FF] transition-colors truncate">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {item.location}
                    </p>
                  </div>

                  <span className="rounded-[4px] bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 shrink-0">
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
              className="text-xs font-semibold text-[#1455FF] hover:underline"
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
                    <span className="rounded-[4px] bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
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
          <CondoMap
            occurrences={mapOccurrences}
            condo={condoCoordinates}
            onExpand={() => setFullMapModalOpen(true)}
          />
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
              className="text-xs font-semibold text-[#1455FF] hover:underline"
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
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] bg-white border border-slate-200 text-[#1455FF] text-xs font-semibold">
                    <Icon name="briefcase" size={15} />
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-semibold text-slate-900 truncate group-hover:text-[#1455FF] transition-colors">
                        {vendor.name}
                      </h4>
                      {vendor.verified && (
                        <Icon name="check-circle" size={12} className="text-[#1455FF] shrink-0" />
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
              <CondoMap
                occurrences={mapOccurrences}
                condo={condoCoordinates}
                isExpandedModal
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
