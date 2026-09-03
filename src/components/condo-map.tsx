"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icon";

type FilterType = "todos" | "ocorrencias" | "equipamentos";

type MapMarker = {
  id: number;
  title: string;
  category: "eletrica" | "hidraulica" | "limpeza" | "seguranca" | "manutencao" | "outros";
  type: "ocorrencia" | "equipamento";
  lat: number;
  lng: number;
  status: string;
};

const SAMPLE_MARKERS: MapMarker[] = [
  {
    id: 1,
    title: "Lâmpada corredor Torre A",
    category: "eletrica",
    type: "ocorrencia",
    lat: -23.5858,
    lng: -46.6784,
    status: "Em aberto",
  },
  {
    id: 2,
    title: "Vazamento subsolo -1",
    category: "hidraulica",
    type: "ocorrencia",
    lat: -23.5849,
    lng: -46.6792,
    status: "Em execução",
  },
  {
    id: 3,
    title: "Bomba de recalque",
    category: "hidraulica",
    type: "equipamento",
    lat: -23.5862,
    lng: -46.6775,
    status: "Operacional",
  },
  {
    id: 4,
    title: "Câmera portaria principal",
    category: "seguranca",
    type: "equipamento",
    lat: -23.5851,
    lng: -46.6779,
    status: "Ativo",
  },
  {
    id: 5,
    title: "Manutenção elevador social",
    category: "manutencao",
    type: "ocorrencia",
    lat: -23.5855,
    lng: -46.6788,
    status: "Agendado",
  },
];

const CATEGORY_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  eletrica: { bg: "#FAB800", text: "#0F172A", label: "Elétrica" },
  hidraulica: { bg: "#0070F3", text: "#FFFFFF", label: "Hidráulica" },
  limpeza: { bg: "#0D9488", text: "#FFFFFF", label: "Limpeza" },
  seguranca: { bg: "#EF4444", text: "#FFFFFF", label: "Segurança" },
  manutencao: { bg: "#8B5CF6", text: "#FFFFFF", label: "Manutenção" },
  outros: { bg: "#64748B", text: "#FFFFFF", label: "Outros" },
};

export function CondoMap({ onExpand }: { onExpand?: () => void } = {}) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersLayerRef = useRef<any>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>("todos");

  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    let isMounted = true;

    // Dynamically load Leaflet
    const loadMap = async () => {
      const L = (await import("leaflet")).default;
      // Inject CSS if missing
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      if (!isMounted || !mapContainerRef.current) return;

      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: [-23.5855, -46.6784],
          zoom: 16,
          zoomControl: false,
        });

        L.control.zoom({ position: "topleft" }).addTo(map);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(map);

        mapInstanceRef.current = map;
        markersLayerRef.current = L.layerGroup().addTo(map);
      }

      renderMarkers(L);
    };

    loadMap();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    import("leaflet").then((module) => {
      renderMarkers(module.default);
    });
  }, [activeFilter]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderMarkers = (L: any) => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    const filtered = SAMPLE_MARKERS.filter((m) => {
      if (activeFilter === "ocorrencias") return m.type === "ocorrencia";
      if (activeFilter === "equipamentos") return m.type === "equipamento";
      return true;
    });

    filtered.forEach((marker) => {
      const col = CATEGORY_COLORS[marker.category] || CATEGORY_COLORS.outros;

      const icon = L.divIcon({
        className: "custom-map-pin",
        html: `
          <div style="
            background-color: ${col.bg};
            color: ${col.text};
            width: 28px;
            height: 28px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            font-weight: 800;
            border: 2px solid #FFFFFF;
            box-shadow: 0 2px 6px rgba(0,0,0,0.25);
          ">
            ${marker.category.charAt(0).toUpperCase()}
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const popupContent = `
        <div style="font-family: sans-serif; min-width: 160px; padding: 2px;">
          <div style="font-size: 10px; font-weight: bold; color: #64748B; text-transform: uppercase;">
            ${col.label} · ${marker.type === "ocorrencia" ? "Ocorrência" : "Equipamento"}
          </div>
          <div style="font-size: 12px; font-weight: bold; color: #0F172A; margin: 3px 0;">
            ${marker.title}
          </div>
          <div style="font-size: 11px; color: #0070F3; font-weight: 600;">
            Status: ${marker.status}
          </div>
        </div>
      `;

      L.marker([marker.lat, marker.lng], { icon })
        .bindPopup(popupContent)
        .addTo(markersLayerRef.current);
    });
  };

  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([-23.5855, -46.6784], 16, { animate: true });
    }
  };

  return (
    <div className="rounded-[14px] border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-[#0F172A]">
            Mapa do Condomínio
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            Visualize ocorrências e serviços em tempo real
          </p>
        </div>

        {/* Filters and Recenter */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex rounded-[8px] border border-slate-200 bg-slate-50 p-0.5 text-xs font-semibold text-slate-600">
            {(["todos", "ocorrencias", "equipamentos"] as FilterType[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setActiveFilter(f)}
                className={`rounded-[6px] px-2.5 py-1 text-xs font-bold capitalize transition-colors ${
                  activeFilter === f
                    ? "bg-white text-[#0070F3] shadow-xs"
                    : "hover:text-slate-900"
                }`}
              >
                {f === "todos" ? "Todos" : f === "ocorrencias" ? "Ocorrências" : "Equipamentos"}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleRecenter}
            className="inline-flex items-center gap-1 rounded-[8px] border border-slate-200 bg-white hover:bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-600 transition-colors"
            title="Recentralizar mapa"
          >
            <Icon name="target" size={13} />
            <span>Recentralizar</span>
          </button>

          {onExpand && (
            <button
              type="button"
              onClick={onExpand}
              className="inline-flex items-center gap-1 rounded-[8px] border border-blue-200 bg-blue-50/70 hover:bg-blue-100 px-2.5 py-1 text-xs font-bold text-[#0070F3] transition-colors"
              title="Ver mapa em tela cheia"
            >
              <Icon name="arrow-up-right" size={13} />
              <span>Expandir</span>
            </button>
          )}
        </div>
      </div>

      {/* Map Canvas */}
      <div className="relative mt-3 h-[300px] sm:h-[340px] w-full rounded-[10px] overflow-hidden border border-slate-200">
        <div ref={mapContainerRef} className="h-full w-full z-0" />
      </div>

      {/* Legend */}
      <div className="mt-3.5 flex items-center justify-start gap-3 sm:gap-4 flex-wrap text-xs text-slate-600">
        <span className="font-bold text-[11px] uppercase tracking-wider text-slate-400">
          Legenda:
        </span>
        {Object.entries(CATEGORY_COLORS).map(([key, info]) => (
          <div key={key} className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: info.bg }}
            />
            <span className="text-[11px] font-medium">{info.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
