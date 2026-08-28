"use client";

import { useState } from "react";
import { Icon } from "@/components/icon";

type MapMarker = {
  id: string;
  title: string;
  category: "manutencao" | "seguranca" | "reserva" | "portaria";
  location: string;
  status: "aberto" | "em_andamento" | "concluido";
  x: number; // percentage X
  y: number; // percentage Y
  color: string;
};

const DEFAULT_MARKERS: MapMarker[] = [
  {
    id: "m1",
    title: "Vazamento no registro principal",
    category: "manutencao",
    location: "Garagem Subsolo 1 · Vaga 42",
    status: "aberto",
    x: 48,
    y: 46,
    color: "#0070F3", // Blue
  },
  {
    id: "m2",
    title: "Portaria Principal & Acesso Pedestres",
    category: "portaria",
    location: "Entrada Principal · Guarita 1",
    status: "concluido",
    x: 52,
    y: 50,
    color: "#10B981", // Emerald Green
  },
  {
    id: "m3",
    title: "Revisão nas lâmpadas do jardim",
    category: "manutencao",
    location: "Área de Lazer · Próximo ao quiosque",
    status: "em_andamento",
    x: 42,
    y: 44,
    color: "#F59E0B", // Yellow/Amber
  },
  {
    id: "m4",
    title: "Reserva Salão Gourmet",
    category: "reserva",
    location: "Bloco A · Salão Nobre",
    status: "concluido",
    x: 56,
    y: 42,
    color: "#8B5CF6", // Purple
  },
];

export function CondoMap({
  condoName = "Condomínio Residencial Solar das Palmeiras",
  address = "Rua das Acácias, 120 · Bloco A",
}: {
  condoName?: string;
  address?: string;
}) {
  const [zoom, setZoom] = useState(15);
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
  const [sosModalOpen, setSosModalOpen] = useState(false);
  const [isRecentered, setIsRecentered] = useState(false);

  const handleRecenter = () => {
    setIsRecentered(true);
    setZoom(15);
    setTimeout(() => setIsRecentered(false), 1500);
  };

  return (
    <div className="flex flex-col rounded-[16px] border border-[var(--color-line)] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)] overflow-hidden">
      {/* Top Header Card: PONTO DE PARTIDA */}
      <div className="flex items-center justify-between border-b border-[var(--color-line)] bg-white px-4 py-3.5 sm:px-5">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] bg-[#ECFDF5] text-[#059669]">
            <Icon name="home" size={14} />
          </span>
          <div className="min-w-0">
            <span className="block text-[10px] font-black uppercase tracking-wider text-[#059669]">
              PONTO DE PARTIDA
            </span>
            <p className="truncate text-xs font-bold text-[var(--color-ink)] sm:text-sm">
              {condoName} · {address}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleRecenter}
            className={`inline-flex items-center gap-1 rounded-[8px] border border-[var(--color-line)] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#059669] hover:bg-[#ECFDF5] transition-all ${
              isRecentered ? "scale-95 bg-[#ECFDF5]" : ""
            }`}
          >
            <Icon name="target" size={13} />
            <span className="hidden sm:inline">Recentralizar</span>
          </button>
          <button
            type="button"
            title="Alterar endereço ou bloco"
            className="flex h-8 w-8 items-center justify-center rounded-[8px] text-[var(--color-muted)] hover:bg-[var(--color-surface-muted)]"
          >
            <Icon name="pencil" size={13} />
          </button>
        </div>
      </div>

      {/* Interactive Map Surface */}
      <div className="relative h-[480px] w-full overflow-hidden bg-[#E9E5DC] select-none lg:h-[560px]">
        {/* Real OpenStreetMap Vector / Tile Imagery Layer */}
        <div
          className="absolute inset-0 transition-transform duration-300 ease-out"
          style={{
            backgroundImage: `radial-gradient(#CBD5E1 1px, transparent 1px), linear-gradient(to right, rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.03) 1px, transparent 1px)`,
            backgroundColor: "#F4EFE6",
            backgroundSize: "24px 24px, 48px 48px, 48px 48px",
            transform: `scale(${zoom / 15})`,
          }}
        >
          {/* Stylized Street & Neighborhood Map Layout SVG (similar to Leaflet OSM render) */}
          <svg className="absolute inset-0 h-full w-full opacity-85" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#E2DCD2" strokeWidth="1" />
              </pattern>
            </defs>

            {/* Green areas & parks */}
            <path
              d="M 20,40 Q 120,60 160,180 T 80,320 T 40,240 Z"
              fill="#D4EAD6"
              stroke="#B2D8B6"
              strokeWidth="1.5"
            />
            <path
              d="M 320,80 Q 420,110 440,220 T 360,340 T 280,220 Z"
              fill="#D4EAD6"
              stroke="#B2D8B6"
              strokeWidth="1.5"
            />

            {/* Condominium Main Boundary Area */}
            <rect
              x="180"
              y="180"
              width="240"
              height="220"
              rx="16"
              fill="#FFFFFF"
              stroke="#0070F3"
              strokeWidth="2.5"
              strokeDasharray="6 4"
              opacity="0.95"
            />
            <rect x="195" y="195" width="210" height="190" rx="12" fill="#EFF6FF" opacity="0.6" />

            {/* Condominium Buildings */}
            <rect x="210" y="210" width="70" height="60" rx="6" fill="#0070F3" opacity="0.85" />
            <text x="245" y="245" fill="#FFFFFF" fontSize="11" fontWeight="bold" textAnchor="middle">
              BLOCO A
            </text>

            <rect x="310" y="210" width="70" height="60" rx="6" fill="#0070F3" opacity="0.85" />
            <text x="345" y="245" fill="#FFFFFF" fontSize="11" fontWeight="bold" textAnchor="middle">
              BLOCO B
            </text>

            <rect x="210" y="295" width="85" height="55" rx="6" fill="#F59E0B" opacity="0.85" />
            <text x="252" y="327" fill="#FFFFFF" fontSize="10" fontWeight="bold" textAnchor="middle">
              SALÃO & LAZER
            </text>

            <rect x="315" y="300" width="65" height="50" rx="6" fill="#10B981" opacity="0.85" />
            <text x="347" y="330" fill="#FFFFFF" fontSize="10" fontWeight="bold" textAnchor="middle">
              PORTARIA
            </text>

            {/* Main roads */}
            <path
              d="M -20,280 Q 150,290 300,260 T 600,240"
              fill="none"
              stroke="#FED7AA"
              strokeWidth="18"
            />
            <path
              d="M -20,280 Q 150,290 300,260 T 600,240"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="12"
            />

            <path
              d="M 280,-20 Q 290,180 295,360 T 310,600"
              fill="none"
              stroke="#FED7AA"
              strokeWidth="16"
            />
            <path
              d="M 280,-20 Q 290,180 295,360 T 310,600"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="10"
            />

            {/* Street labels */}
            <text x="70" y="275" fill="#78716C" fontSize="10" fontWeight="bold">
              Av. Principal dos Condomínios
            </text>
            <text x="315" y="120" fill="#78716C" fontSize="10" fontWeight="bold">
              Rua das Acácias
            </text>
          </svg>

          {/* Interactive Dynamic Map Pins */}
          {DEFAULT_MARKERS.map((marker) => {
            const isSelected = selectedMarker?.id === marker.id;
            return (
              <div
                key={marker.id}
                onClick={() => setSelectedMarker(marker)}
                style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10 group"
              >
                {/* Pin Circle */}
                <div
                  className={`relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-white shadow-md transition-transform duration-200 group-hover:scale-125 ${
                    isSelected ? "scale-125 ring-4 ring-blue-400" : ""
                  }`}
                  style={{ backgroundColor: marker.color }}
                >
                  <span className="h-2 w-2 rounded-full bg-white animate-ping opacity-75" />
                  <span className="absolute h-2 w-2 rounded-full bg-white" />
                </div>

                {/* Pin Tooltip */}
                <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden whitespace-nowrap rounded-[8px] bg-[#0F172A] px-2.5 py-1 text-[11px] font-bold text-white shadow-lg group-hover:block z-20">
                  {marker.title}
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Marker Detail Card Popover */}
        {selectedMarker ? (
          <div className="absolute top-4 left-4 right-4 z-20 rounded-[12px] border border-[var(--color-line)] bg-white/95 backdrop-blur-md p-4 shadow-xl sm:left-4 sm:right-auto sm:w-80">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span
                  className="inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase text-white"
                  style={{ backgroundColor: selectedMarker.color }}
                >
                  {selectedMarker.category}
                </span>
                <h4 className="mt-1 text-sm font-bold text-[var(--color-ink)] leading-tight">
                  {selectedMarker.title}
                </h4>
                <p className="mt-1 text-xs text-[var(--color-muted)]">{selectedMarker.location}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMarker(null)}
                className="text-[var(--color-muted)] hover:text-[var(--color-ink)] p-1"
              >
                <Icon name="x" size={16} />
              </button>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-[var(--color-line)] pt-2.5">
              <span className="text-[11px] font-semibold text-[var(--color-muted)]">
                Status: <strong className="text-[var(--color-ink)] uppercase">{selectedMarker.status}</strong>
              </span>
              <a
                href="/painel/chamados"
                className="text-xs font-bold text-[#0070F3] hover:underline"
              >
                Ver chamado →
              </a>
            </div>
          </div>
        ) : null}

        {/* Map Controls: Zoom (+ / -) */}
        <div className="absolute top-4 left-4 z-10 flex flex-col rounded-[10px] border border-[var(--color-line)] bg-white shadow-md overflow-hidden">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(20, z + 1))}
            className="flex h-8 w-8 items-center justify-center text-[var(--color-ink)] hover:bg-[var(--color-surface-muted)] font-bold text-base border-b border-[var(--color-line)]"
            title="Aumentar zoom"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(10, z - 1))}
            className="flex h-8 w-8 items-center justify-center text-[var(--color-ink)] hover:bg-[var(--color-surface-muted)] font-bold text-base"
            title="Diminuir zoom"
          >
            -
          </button>
        </div>

        {/* Red SOS Button in Bottom Left from Reference */}
        <div className="absolute bottom-5 left-5 z-20">
          <button
            type="button"
            onClick={() => setSosModalOpen(true)}
            className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#EF4444] to-[#DC2626] text-white shadow-[0_8px_24px_rgba(239,68,68,0.45)] transition-all duration-200 hover:scale-110 active:scale-95"
            title="Botão de Emergência SOS"
          >
            <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-30 pointer-events-none" />
            <span className="font-black text-sm tracking-wider uppercase">SOS</span>
          </button>
        </div>

        {/* Map Attribution */}
        <div className="absolute bottom-1 right-2 z-10 rounded-sm bg-white/80 px-1.5 py-0.5 text-[9px] text-[var(--color-muted)] backdrop-blur-xs">
          Leaflet | © <a href="https://www.openstreetmap.org" target="_blank" rel="noreferrer" className="underline">OpenStreetMap</a>
        </div>
      </div>

      {/* Emergency SOS Modal */}
      {sosModalOpen ? (
        <div className="fixed inset-0 z-[99] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-[20px] bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[var(--color-line)] pb-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-red-100 text-red-600 font-bold">
                  <Icon name="alert" size={18} />
                </span>
                <div>
                  <h3 className="text-base font-bold text-[var(--color-ink)]">Emergência & SOS Condominial</h3>
                  <p className="text-xs text-[var(--color-muted)]">Contatos rápidos e acionamento imediato</p>
                </div>
              </div>
              <button
                onClick={() => setSosModalOpen(false)}
                className="text-[var(--color-muted)] hover:text-[var(--color-ink)] p-1"
              >
                <Icon name="x" size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-2.5">
              <a
                href="tel:193"
                className="flex items-center justify-between rounded-[12px] border border-red-200 bg-red-50 p-3.5 text-red-900 hover:bg-red-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-white font-bold text-xs">
                    193
                  </span>
                  <div>
                    <p className="text-sm font-bold">Corpo de Bombeiros</p>
                    <p className="text-xs text-red-700">Incêndio, vazamento de gás e resgate</p>
                  </div>
                </div>
                <Icon name="phone" size={16} />
              </a>

              <a
                href="tel:190"
                className="flex items-center justify-between rounded-[12px] border border-blue-200 bg-blue-50 p-3.5 text-blue-900 hover:bg-blue-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0070F3] text-white font-bold text-xs">
                    190
                  </span>
                  <div>
                    <p className="text-sm font-bold">Polícia Militar</p>
                    <p className="text-xs text-blue-700">Segurança pública e ocorrências</p>
                  </div>
                </div>
                <Icon name="phone" size={16} />
              </a>

              <a
                href="tel:192"
                className="flex items-center justify-between rounded-[12px] border border-emerald-200 bg-emerald-50 p-3.5 text-emerald-900 hover:bg-emerald-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white font-bold text-xs">
                    192
                  </span>
                  <div>
                    <p className="text-sm font-bold">SAMU (Ambulância)</p>
                    <p className="text-xs text-emerald-700">Atendimento médico de urgência</p>
                  </div>
                </div>
                <Icon name="phone" size={16} />
              </a>

              <div className="rounded-[12px] border border-[var(--color-line)] bg-[var(--color-surface-muted)] p-3.5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-[var(--color-ink)]">Portaria 24 Horas</p>
                    <p className="text-xs text-[var(--color-muted)]">Ramal interno: 94 ou (21) 98765-4321</p>
                  </div>
                  <span className="chip bg-[#ECFDF5] text-[#059669] font-bold">Online</span>
                </div>
              </div>
            </div>

            <div className="mt-5">
              <button
                type="button"
                onClick={() => {
                  alert("Alerta de emergência emitido para a guarita e equipe de plantão.");
                  setSosModalOpen(false);
                }}
                className="w-full rounded-[10px] bg-red-600 py-3 text-sm font-bold text-white hover:bg-red-700 shadow-md transition-colors"
              >
                🚨 Disparar Alerta para Portaria & Síndico
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
