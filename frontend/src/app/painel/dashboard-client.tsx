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
  const [protocolFeedback, setProtocolFeedback] = useState<string | null>(null);
  const [appStoreHint, setAppStoreHint] = useState(false);
  const protocolInputRef = useRef<HTMLInputElement>(null);

  const handleConsultarProtocolo = (e: React.FormEvent) => {
    e.preventDefault();
    const q = protocolQuery.trim();
    if (!q) {
      setProtocolFeedback("Informe o número do protocolo para consultar.");
      setProtocolResult(null);
      setProtocolSearched(false);
      protocolInputRef.current?.focus();
      return;
    }

    setProtocolFeedback(null);
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
      // Redireciona para pesquisa real na página de ocorrências
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
      <div className="w-full max-w-[1648px] mx-auto px-4 sm:px-6 lg:px-[44px] py-6">
        <PorteiroDashboard
          userName={userName}
          condoName={condoName}
          activeShift={activeShift ?? null}
          lastShift={lastShift ?? null}
          overview={porteiroOverview}
          allUnits={allUnits}
        />
      </div>
    );
  }

  // 2. Specialized Síndico Management Dashboard View
  if ((role === "sindico" || role === "superadmin" || role === "conselho") && !isResident && sindicoSummary) {
    return (
      <div className="w-full max-w-[1648px] mx-auto px-4 sm:px-6 lg:px-[44px] py-6">
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
      </div>
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
  // DASHBOARD DA HOME — CENTRAL VISUAL INSTITUCIONAL (FIEL À REFERÊNCIA 2)
  // =========================================================================
  if (isResident) {
    const nextReservation = upcomingReservations.length > 0 ? upcomingReservations[0] : null;
    const hasParcels = residentStats.myParcels > 0;
    const hasOccurrences = residentStats.myOccurrences > 0;
    const hasReservation = Boolean(nextReservation);
    const hasTodayItems = hasParcels || hasOccurrences || hasReservation;

    const displayNotices: CondoNotice[] = notices;

    // Os 6 cards de serviços presentes na referência (ícones e textos fiéis)
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
        icon: "gavel" as IconName,
      },
      {
        id: "tiao",
        title: "Tião Zelador",
        description: "Seu assistente do condomínio com IA",
        href: "/painel/servicos",
        icon: "tiao" as IconName,
      },
    ];

    const androidAppUrl = process.env.NEXT_PUBLIC_ANDROID_APP_URL;
    const iosAppUrl = process.env.NEXT_PUBLIC_IOS_APP_URL;

    return (
      <div className="w-full overflow-x-clip">
        {/* ================================================================= */}
        {/* 1. HERO BACKGROUND — FULL WIDTH (FOTOGRAFIA CLARA ATÉ A BASE)     */}
        {/* ================================================================= */}
        <section className="relative w-full overflow-hidden bg-[#08152A] text-white lg:h-[304px]">
          {/* Camada Fotográfica Mobile (< md): Imagem de fundo com overlay moderno para profundidade visual */}
          <div className="md:hidden absolute inset-0 pointer-events-none select-none overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/condominio-hero.jpg"
              alt={condoName || "Condomínio Residencial"}
              className="w-full h-full object-cover object-[72%_center] brightness-[0.72] contrast-[1.08]"
            />
            {/* Gradiente multi-camada escuro para contraste impecável dos textos brancos */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, rgba(8,21,42,0.85) 0%, rgba(8,21,42,0.72) 35%, rgba(8,21,42,0.92) 75%, #08152A 100%)",
              }}
            />
          </div>

          {/* Camada Fotográfica Tablet e Desktop (>= md) */}
          <div className="hidden md:block absolute inset-y-0 right-0 w-[48%] lg:w-[59.5%] h-full pointer-events-none select-none overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/condominio-hero.jpg"
              alt={condoName || "Condomínio Residencial"}
              className="w-full h-full object-cover object-right-top brightness-[1.04] contrast-[1.03]"
            />
            {/* Degradê suave concentrado na borda esquerda, revelando céu azul, árvores e prédio iluminados */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "linear-gradient(90deg, #08152A 0%, rgba(8,21,42,0.85) 4%, rgba(8,21,42,0.45) 11%, rgba(8,21,42,0.10) 20%, rgba(8,21,42,0) 28%)",
              }}
            />
          </div>

          {/* Container alinhado ao mesmo eixo visual do layout inferior */}
          <div className="relative z-10 max-w-[1760px] mx-auto px-4 sm:px-6 lg:pl-[56px] lg:pr-[44px] pt-6 pb-16 sm:pt-8 sm:pb-16 lg:pt-[14px] lg:pb-[66px] flex flex-col justify-center h-full">
            <div className="max-w-[740px] md:max-w-[54%] lg:max-w-[740px]">
              {/* Badge de identificação do condomínio para Mobile e Tablet */}
              <div className="lg:hidden inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-[#E8EFFA] text-[12px] font-semibold mb-2.5 w-fit shadow-xs">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#0052F5] text-white">
                  <Icon name="building" size={10} strokeWidth={2.4} />
                </span>
                <span className="tracking-tight">{condoName || "Residencial Parque das Águas"}</span>
              </div>

              <h1 className="text-[26px] min-[375px]:text-[29px] sm:text-[34px] md:text-[34px] lg:text-[46px] min-[1600px]:text-[50px] font-extrabold text-white tracking-[-0.015em] leading-[1.08] sm:leading-[1.06]">
                Participe do seu condomínio
              </h1>
              <p className="text-sm sm:text-[16px] md:text-[16px] lg:text-[19px] min-[1600px]:text-[20.5px] text-[#E8EFFA] font-normal mt-2 max-w-[540px] leading-[1.32]">
                Registre ocorrências, acompanhe solicitações e facilite a rotina condominial.
              </p>

              {/* Botões Principais Fiéis à Referência 2 */}
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 sm:gap-3.5 lg:gap-4 mt-4.5 sm:mt-5 lg:mt-[18px] w-full max-w-[380px] min-[440px]:max-w-[420px] lg:max-w-none">
                <Link
                  href="/painel/ocorrencias?nova=1"
                  className="inline-flex items-center justify-center gap-3.5 h-[48px] sm:h-[54px] px-5 sm:px-6.5 rounded-[12px] bg-white hover:bg-slate-50 text-[#0A2563] text-[15px] sm:text-[16.5px] font-bold shadow-[0_6px_18px_rgba(0,0,0,0.22)] transition-all active:scale-[0.98] group whitespace-nowrap w-full lg:w-auto"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0052F5] text-white shrink-0 shadow-2xs">
                    <Icon name="plus" size={14} strokeWidth={3} />
                  </span>
                  <span>Registrar ocorrência</span>
                  <Icon
                    name="chevron-right"
                    size={16}
                    strokeWidth={2.6}
                    className="text-[#0A2563] transition-transform group-hover:translate-x-0.5 shrink-0"
                  />
                </Link>

                <button
                  type="button"
                  onClick={handleFocusProtocol}
                  className="inline-flex items-center justify-center gap-2.5 h-[48px] sm:h-[54px] px-5 sm:px-7 rounded-[12px] bg-[#08152A]/75 hover:bg-[#0C1E3C] border-[1.5px] border-white/65 hover:border-white text-white text-[15px] sm:text-[16px] font-semibold backdrop-blur-xs transition-all cursor-pointer active:scale-[0.98] whitespace-nowrap w-full lg:w-auto"
                >
                  <Icon name="search" size={18} strokeWidth={2.1} />
                  <span>Acompanhar solicitação</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* MAIN CONTENT — CONTAINER RESPONSIVO AMPLO                         */}
        {/* ================================================================= */}
        <div className="w-full max-w-[1760px] mx-auto px-4 sm:px-6 lg:px-[44px] pb-5 space-y-4 xl:space-y-[16px]">
          {/* =============================================================== */}
          {/* 2. BANDEJA BRANCA SOBREPOSTA AO HERO COM OS 6 CARDS DE SERVIÇOS */}
          {/* =============================================================== */}
          <section className="relative z-20 -mt-10 sm:-mt-12 lg:-mt-[51px]">
            <div className="rounded-[24px] bg-white/95 backdrop-blur-xs p-3 sm:p-3.5 lg:p-[15px] shadow-[0_10px_34px_rgba(7,26,56,0.10)] border border-white">
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5 xl:gap-[16px]">
                {serviceCards.map((card) => {
                  const isTiaoCard = card.id === "tiao";

                  return (
                    <Link
                      key={card.id}
                      href={card.href}
                      className="group flex flex-col justify-between rounded-[18px] border border-[#E2E8F0] bg-white px-4 py-3.5 xl:px-[16px] xl:py-[14px] min-h-[120px] xl:min-h-[130px] shadow-[0_3px_12px_rgba(7,26,56,0.045)] hover:shadow-[0_10px_24px_rgba(20,85,255,0.10)] hover:border-[#1455FF]/45 transition-all cursor-pointer"
                    >
                      {/* Topo do card: Ícone azul proeminente + seta escura */}
                      <div className="flex items-start justify-between w-full">
                        <span className="flex h-10.5 w-10.5 xl:h-11.5 xl:w-11.5 shrink-0 items-center justify-center rounded-[12px] bg-[#EAF1FF] text-[#0D47FF] transition-transform group-hover:scale-105">
                          {isTiaoCard ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src="/brands/tiao/mascot-blue.png"
                              alt="Tião Zelador"
                              className="h-8 w-8 object-contain"
                            />
                          ) : (
                            <Icon name={card.icon} size={23} strokeWidth={2.2} />
                          )}
                        </span>
                        <Icon
                          name="chevron-right"
                          size={18}
                          strokeWidth={2.6}
                          className="text-[#101828] mt-1 group-hover:text-[#0048E8] group-hover:translate-x-0.5 transition-all shrink-0"
                        />
                      </div>

                      {/* Título forte + Descrição em azul-acinzentado */}
                      <div className="mt-2.5 min-w-0">
                        <h3 className="text-[16px] xl:text-[17.5px] font-extrabold text-[#101828] group-hover:text-[#1455FF] transition-colors leading-tight tracking-[-0.01em] truncate">
                          {card.title}
                        </h3>
                        <p className="text-[12.5px] xl:text-[13px] text-[#526079] mt-0.5 leading-[1.32] line-clamp-2">
                          {card.description}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>

          {/* =============================================================== */}
          {/* 3. LINHA INTERMEDIÁRIA: AVISOS (ESQUERDA) + DIREITA (PROTOCOLO + APP) */}
          {/* =============================================================== */}
          <section className="grid grid-cols-1 xl:grid-cols-2 gap-4 xl:gap-[20px] items-stretch">
            {/* COLUNA ESQUERDA: Avisos do condomínio */}
            <div className="h-full rounded-[20px] border border-[#E2E8F0] bg-white px-5 py-3.5 sm:px-6 sm:py-4 shadow-[0_4px_16px_rgba(7,26,56,0.045)] flex flex-col justify-between min-w-0">
              <div className="h-full flex flex-col min-w-0">
                {/* Cabeçalho da seção */}
                <div className="flex items-start justify-between gap-3 pb-2.5 border-b border-[#EDF1F7]">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-[#EAF1FF] text-[#101828] shrink-0">
                      <Icon name="megaphone" size={22} strokeWidth={2.1} />
                    </span>
                    <div className="min-w-0">
                      <h2 className="text-[18.5px] sm:text-[20px] font-extrabold text-[#101828] leading-tight tracking-[-0.01em]">
                        Avisos do condomínio
                      </h2>
                      <p className="text-xs sm:text-[13px] text-[#526079] mt-0.5 truncate">
                        Fique por dentro de comunicados, assembleias e novidades.
                      </p>
                    </div>
                  </div>

                  <Link
                    href="/painel/comunicados"
                    className="text-xs sm:text-[14px] font-bold text-[#0D47FF] hover:underline inline-flex items-center gap-1 shrink-0 mt-1 whitespace-nowrap"
                  >
                    <span>Ver todos</span>
                    <Icon name="chevron-right" size={15} strokeWidth={2.5} />
                  </Link>
                </div>

                {/* Lista de Avisos (3 itens reais ou estado vazio) */}
                {displayNotices.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF1FF] text-[#1455FF] mb-2.5">
                      <Icon name="megaphone" size={18} />
                    </span>
                    <p className="text-sm font-bold text-[#101828]">Nenhum aviso publicado</p>
                    <p className="text-xs text-[#526079] mt-0.5 max-w-xs">
                      Comunicados, convocações e notícias do condomínio aparecerão aqui assim que forem publicados.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#EDF1F7] mt-0.5 flex-1 flex flex-col justify-around">
                    {displayNotices.slice(0, 3).map((notice) => {
                      const isAssembly = notice.kind === "assembleia";
                      const isAlert =
                        !isAssembly && (notice.kind === "alerta" || notice.priority === "alta");

                      const badgeClass = isAlert
                        ? "bg-[#FDECEC] text-[#D92D20]"
                        : "bg-[#EAF1FF] text-[#0D47FF]";

                      const badgeLabel = isAlert
                        ? "Alerta"
                        : isAssembly
                        ? "Assembleia"
                        : "Comunicado";

                      const iconTone = isAlert
                        ? "bg-[#FDECEC] text-[#DC2626]"
                        : "bg-[#EAF1FF] text-[#0D47FF]";

                      const shortDate = notice.date ? notice.date.replace(/,.*/, "").split(" ")[0] : "";

                      return (
                        <Link
                          key={notice.id}
                          href={notice.href}
                          className="py-2 px-2 -mx-2 flex items-center justify-between gap-3 hover:bg-slate-50/80 rounded-xl transition-colors group cursor-pointer min-w-0"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <span
                              className={`flex h-9.5 w-9.5 shrink-0 items-center justify-center rounded-[10px] ${iconTone}`}
                            >
                              <Icon
                                name={
                                  isAlert
                                    ? "alert-triangle"
                                    : isAssembly
                                    ? "users"
                                    : "megaphone"
                                }
                                size={19}
                                strokeWidth={2.2}
                              />
                            </span>

                            <div className="min-w-0 space-y-0.5 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[14px] sm:text-[14.5px] font-bold text-[#101828] group-hover:text-[#1455FF] transition-colors truncate max-w-full">
                                  {notice.title}
                                </span>
                                <span
                                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full leading-none shrink-0 ${badgeClass}`}
                                >
                                  {badgeLabel}
                                </span>
                              </div>
                              <p className="text-xs sm:text-[13px] text-[#526079] truncate leading-snug">
                                {notice.detail}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5 shrink-0">
                            <span className="text-xs sm:text-[13px] text-[#526079] font-medium hidden sm:inline tabular-nums">
                              {shortDate}
                            </span>
                            <Icon
                              name="chevron-right"
                              size={16}
                              strokeWidth={2.4}
                              className="text-[#526079] group-hover:text-[#1455FF] group-hover:translate-x-0.5 transition-all"
                            />
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* COLUNA DIREITA: Acompanhe sua solicitação + Acesse pelo celular */}
            <div className="flex flex-col justify-between gap-4 xl:gap-[16px] min-w-0">
              {/* Card Superior: Acompanhe sua solicitação */}
              <div className="rounded-[20px] border border-[#E2E8F0] bg-white px-5 py-4 sm:px-6 sm:py-4.5 shadow-[0_4px_16px_rgba(7,26,56,0.045)] min-w-0">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-[#EAF1FF] text-[#101828] shrink-0">
                    <Icon name="layers" size={22} strokeWidth={2.1} />
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-[18.5px] sm:text-[20px] font-extrabold text-[#101828] leading-tight tracking-[-0.01em]">
                      Acompanhe sua solicitação
                    </h2>
                    <p className="text-xs sm:text-[13px] text-[#526079] mt-0.5">
                      Informe o número do protocolo e veja o andamento.
                    </p>
                  </div>
                </div>

                <form
                  onSubmit={handleConsultarProtocolo}
                  className="flex flex-col min-[380px]:flex-row items-stretch min-[380px]:items-center gap-2.5 sm:gap-3 mt-3"
                >
                  <div className="relative flex-1 min-w-0">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B] font-semibold text-base select-none">
                      #
                    </span>
                    <input
                      ref={protocolInputRef}
                      type="text"
                      value={protocolQuery}
                      onChange={(e) => {
                        setProtocolQuery(e.target.value);
                        if (protocolFeedback) setProtocolFeedback(null);
                      }}
                      placeholder="Ex.: ZEL-20261116-1067"
                      className="w-full h-[45px] pl-10 pr-3.5 rounded-[11px] border border-[#CBD5E1] bg-white text-[14.5px] font-medium text-[#101828] placeholder:text-[#64748B] focus:border-[#1455FF] focus:ring-2 focus:ring-[#1455FF]/20 outline-none transition-all min-w-0"
                    />
                  </div>
                  <button
                    type="submit"
                    className="h-[45px] px-6 sm:px-7 rounded-[11px] bg-[#0052F5] hover:bg-[#0044CC] text-white font-bold text-sm sm:text-[15px] flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer shrink-0 whitespace-nowrap"
                  >
                    <Icon name="search" size={18} strokeWidth={2.3} />
                    <span>Consultar</span>
                  </button>
                </form>

                {protocolFeedback && (
                  <p className="mt-2 text-xs font-medium text-rose-600">{protocolFeedback}</p>
                )}

                {/* Resultado inline caso encontre o protocolo localmente */}
                {protocolSearched && protocolResult && (
                  <div className="mt-3 p-3 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-slate-800 animate-in fade-in-50">
                    <div className="flex items-center justify-between font-bold text-slate-900">
                      <span>Protocolo: {protocolResult.code}</span>
                      <span className="text-[#1455FF]">{protocolResult.status}</span>
                    </div>
                    <p className="mt-1 text-slate-600 line-clamp-1">{protocolResult.title}</p>
                    <Link
                      href="/painel/ocorrencias"
                      className="mt-2 text-[11px] font-bold text-[#1455FF] hover:underline inline-block"
                    >
                      Ver detalhes completos da ocorrência →
                    </Link>
                  </div>
                )}
              </div>

              {/* Card Inferior: Acesse também pelo celular */}
              <div className="flex-1 rounded-[20px] border border-[#D8E4F8] bg-gradient-to-r from-[#E3ECFA] to-[#ECF2FE] px-5 py-3 sm:px-6 shadow-[0_4px_16px_rgba(7,26,56,0.035)] relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-4 min-h-[118px] min-w-0">
                <div className="flex items-center gap-3.5 sm:gap-5 flex-1 min-w-0 w-full">
                  {/* Mockup de Smartphone inclinado com enquadramento fiel à referência (Apenas sm: e acima, onde há espaço lateral sem colisão) */}
                  <div className="hidden sm:flex relative w-[110px] h-[146px] ml-1 -mb-11 -rotate-10 bg-[#0B1426] rounded-t-[18px] border-[4px] border-[#0B1426] shadow-xl shrink-0 overflow-hidden flex-col select-none">
                    <div className="w-10 h-1.5 bg-[#0B1426] rounded-b-md mx-auto relative z-10" />
                    <div className="flex-1 bg-gradient-to-b from-[#1455FF] to-[#0B43DA] rounded-t-[13px] px-2 pt-3 pb-7 flex flex-col items-center justify-center text-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/logo-white.png?v=5"
                        alt="Zeladoria Condomínio"
                        className="w-[76px] h-auto object-contain"
                      />
                    </div>
                  </div>

                  {/* Ícone smartphone alternativo elegante para mobile (< sm) onde o mockup 3D causava sobreposição */}
                  <div className="sm:hidden flex h-11 w-11 items-center justify-center rounded-[12px] bg-[#1455FF]/15 text-[#0052F5] shrink-0">
                    <Icon name="smartphone" size={22} strokeWidth={2.2} />
                  </div>

                  {/* Textos centralizados verticalmente */}
                  <div className="min-w-0 flex-1 text-left">
                    <h3 className="text-[17.5px] sm:text-[19px] font-extrabold text-[#101828] leading-tight tracking-[-0.01em]">
                      Acesse também pelo celular
                    </h3>
                    <p className="text-xs sm:text-[13.5px] text-[#475569] mt-0.5 sm:mt-1 leading-snug max-w-[340px]">
                      Gerencie ocorrências, reservas, visitantes e muito mais, onde estiver.
                    </p>
                    {appStoreHint && (
                      <p className="text-[11px] font-semibold text-[#0D47FF] mt-1.5">
                        Aplicativo oficial em breve disponível na App Store e Google Play.
                      </p>
                    )}
                  </div>
                </div>

                {/* Coluna Direita: Badges Google Play e App Store */}
                <div className="flex flex-row sm:flex-col gap-2 sm:gap-1.5 shrink-0 max-w-full justify-start sm:justify-center w-full sm:w-auto">
                  {androidAppUrl ? (
                    <a
                      href={androidAppUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2.5 rounded-[8px] bg-black hover:bg-neutral-900 text-white px-3.5 py-1.5 w-[138px] h-[39px] shadow-xs transition-colors"
                    >
                      <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M3.6 1.8c-.4.4-.6 1-.6 1.7v17c0 .7.2 1.3.6 1.7l10.2-10.2L3.6 1.8z" />
                        <path fill="#34A853" d="M16.6 14.8l-2.8-2.8 2.8-2.8 3.2 1.8c.9.5.9 1.4 0 1.9l-3.2 1.9z" />
                        <path fill="#FBBC05" d="M13.8 12l2.8 2.8-11 6.2c-.6.3-1.3.3-1.8-.1L13.8 12z" />
                        <path fill="#EA4335" d="M13.8 12L3.8 2.1c.5-.4 1.2-.4 1.8-.1l11 6.2-2.8 3.8z" />
                      </svg>
                      <div className="text-left leading-none">
                        <span className="text-[8.5px] text-white/80 block font-normal">Disponível no</span>
                        <span className="text-[12.5px] font-bold tracking-tight">Google Play</span>
                      </div>
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setAppStoreHint((v) => !v)}
                      className="inline-flex items-center gap-2.5 rounded-[8px] bg-black hover:bg-neutral-900 text-white px-3.5 py-1.5 w-[138px] h-[39px] shadow-xs transition-colors cursor-pointer"
                    >
                      <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M3.6 1.8c-.4.4-.6 1-.6 1.7v17c0 .7.2 1.3.6 1.7l10.2-10.2L3.6 1.8z" />
                        <path fill="#34A853" d="M16.6 14.8l-2.8-2.8 2.8-2.8 3.2 1.8c.9.5.9 1.4 0 1.9l-3.2 1.9z" />
                        <path fill="#FBBC05" d="M13.8 12l2.8 2.8-11 6.2c-.6.3-1.3.3-1.8-.1L13.8 12z" />
                        <path fill="#EA4335" d="M13.8 12L3.8 2.1c.5-.4 1.2-.4 1.8-.1l11 6.2-2.8 3.8z" />
                      </svg>
                      <div className="text-left leading-none">
                        <span className="text-[8.5px] text-white/80 block font-normal">Disponível no</span>
                        <span className="text-[12.5px] font-bold tracking-tight">Google Play</span>
                      </div>
                    </button>
                  )}

                  {iosAppUrl ? (
                    <a
                      href={iosAppUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2.5 rounded-[8px] bg-black hover:bg-neutral-900 text-white px-3.5 py-1.5 w-[138px] h-[39px] shadow-xs transition-colors"
                    >
                      <svg className="w-5 h-5 fill-current text-white shrink-0" viewBox="0 0 24 24">
                        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.84c.66-.8 1.11-1.92.99-3.04-.96.04-2.12.64-2.8 1.44-.59.68-1.11 1.78-.97 2.87 1.07.08 2.12-.53 2.78-1.27z" />
                      </svg>
                      <div className="text-left leading-none">
                        <span className="text-[8.5px] text-white/80 block font-normal">Disponível na</span>
                        <span className="text-[12.5px] font-bold tracking-tight">App Store</span>
                      </div>
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setAppStoreHint((v) => !v)}
                      className="inline-flex items-center gap-2.5 rounded-[8px] bg-black hover:bg-neutral-900 text-white px-3.5 py-1.5 w-[138px] h-[39px] shadow-xs transition-colors cursor-pointer"
                    >
                      <svg className="w-5 h-5 fill-current text-white shrink-0" viewBox="0 0 24 24">
                        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.84c.66-.8 1.11-1.92.99-3.04-.96.04-2.12.64-2.8 1.44-.59.68-1.11 1.78-.97 2.87 1.07.08 2.12-.53 2.78-1.27z" />
                      </svg>
                      <div className="text-left leading-none">
                        <span className="text-[8.5px] text-white/80 block font-normal">Disponível na</span>
                        <span className="text-[12.5px] font-bold tracking-tight">App Store</span>
                      </div>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* =============================================================== */}
          {/* 4. BANNER INFERIOR DO TIÃO ZELADOR (FIEL À REFERÊNCIA 2)        */}
          {/* =============================================================== */}
          <section className="rounded-[20px] bg-gradient-to-r from-[#0F65FF] via-[#0B52E6] to-[#083EC4] px-5 py-3.5 sm:px-7 sm:py-4 text-white shadow-[0_6px_22px_rgba(11,82,230,0.25)] flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              {/* Mascote real do Tião Zelador */}
              <div className="h-[64px] w-[64px] sm:h-[72px] sm:w-[72px] shrink-0 rounded-[16px] bg-white/10 border border-white/15 flex items-center justify-center p-1.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/brands/tiao/mascot-white.png"
                  alt="Tião Zelador"
                  className="h-full w-full object-contain"
                />
              </div>

              <div className="min-w-0 space-y-0.5">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="text-lg sm:text-[20px] font-extrabold text-white tracking-tight">
                    Tião Zelador
                  </h3>
                  <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-white text-[#0A47C8] text-[11px] font-extrabold uppercase tracking-wide shadow-2xs">
                    <Icon name="check" size={11} strokeWidth={3.2} />
                    Verificado
                  </span>
                </div>
                <h4 className="text-base sm:text-[18px] font-bold text-white leading-snug">
                  Precisa de uma mão no seu condomínio?
                </h4>
                <p className="text-xs sm:text-[13.5px] text-white/95 font-normal leading-snug min-[1400px]:whitespace-nowrap">
                  Converse com o Tião Zelador, o assistente de IA da Zeladoria, e resolva dúvidas, gere solicitações e receba orientações.
                </p>
              </div>
            </div>

            <div className="shrink-0">
              <button
                type="button"
                onClick={() => setAssistantOpen(true)}
                className="w-full md:w-auto inline-flex items-center justify-center gap-3 rounded-[12px] bg-white hover:bg-slate-50 text-[#0B2E8A] px-6.5 py-3 text-sm sm:text-[15.5px] font-extrabold shadow-md transition-all active:scale-95 group cursor-pointer whitespace-nowrap"
              >
                <span>Conversar com o Tião Zelador</span>
                <Icon
                  name="chevron-right"
                  size={16}
                  strokeWidth={2.8}
                  className="text-[#0B2E8A] transition-transform group-hover:translate-x-0.5 shrink-0"
                />
              </button>
            </div>
          </section>

          {/* =============================================================== */}
          {/* 5. INFORMAÇÕES OPERACIONAIS EXISTENTES (PRESERVAÇÃO TOTAL)      */}
          {/* =============================================================== */}
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
        </div>

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
    <div className="w-full max-w-[1648px] mx-auto px-4 sm:px-6 lg:px-[44px] py-6 space-y-6">
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
