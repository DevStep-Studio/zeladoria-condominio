"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icon";
import type { MarketplaceProvider } from "@/lib/services/providers-data";

export function MarketplaceMap({
  providers = [],
  onSelectProvider,
  onRequestBudget,
}: {
  providers: MarketplaceProvider[];
  onSelectProvider: (p: MarketplaceProvider) => void;
  onRequestBudget: (p: MarketplaceProvider) => void;
}) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const [selectedProvider, setSelectedProvider] = useState<MarketplaceProvider | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    let isMounted = true;

    async function initMap() {
      const L = (await import("leaflet")).default;
      if (!isMounted || !mapContainerRef.current) return;

      if (!mapInstanceRef.current) {
        // Base center (São Paulo - região dos condomínios)
        const map = L.map(mapContainerRef.current, {
          center: [-23.5615, -46.6559],
          zoom: 13,
          zoomControl: false,
        });

        L.control.zoom({ position: "bottomright" }).addTo(map);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/">OSM</a>',
          maxZoom: 19,
        }).addTo(map);

        const markersLayer = L.layerGroup().addTo(map);
        markersLayerRef.current = markersLayer;
        mapInstanceRef.current = map;
      }

      // Render provider markers
      if (markersLayerRef.current) {
        markersLayerRef.current.clearLayers();

        // Condo central pin
        const condoIcon = L.divIcon({
          className: "condo-center-pin",
          html: `
            <div style="
              background-color: #0055D4;
              color: #FFFFFF;
              width: 32px;
              height: 32px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              border: 3px solid #FFFFFF;
              box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            ">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><line x1="8" y1="6" x2="8.01" y2="6"/><line x1="16" y1="6" x2="16.01" y2="6"/><line x1="8" y1="10" x2="8.01" y2="10"/><line x1="16" y1="10" x2="16.01" y2="10"/><line x1="8" y1="14" x2="8.01" y2="14"/><line x1="16" y1="14" x2="16.01" y2="14"/></svg>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        L.marker([-23.5615, -46.6559], { icon: condoIcon })
          .bindTooltip("Seu Condomínio", { permanent: true, direction: "top", offset: [0, -18] })
          .addTo(markersLayerRef.current);

        // Providers pins (dispersed safely within 1-5km radius without exposing exact home addresses)
        providers.forEach((p, idx) => {
          // Offsets deterministic around center
          const angle = (idx * (360 / Math.max(1, providers.length))) * (Math.PI / 180);
          const distance = 0.008 + (idx % 3) * 0.006;
          const lat = -23.5615 + Math.cos(angle) * distance;
          const lng = -46.6559 + Math.sin(angle) * distance;

          const providerPin = L.divIcon({
            className: "provider-map-pin",
            html: `
              <div style="
                background-color: ${p.isVerified ? "#0055D4" : "#0F172A"};
                color: #FFFFFF;
                width: 28px;
                height: 28px;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                border: 2px solid #FFD000;
                box-shadow: 0 2px 8px rgba(0,0,0,0.25);
                cursor: pointer;
              ">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#FFD000" stroke="#FFD000" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              </div>
            `,
            iconSize: [28, 28],
            iconAnchor: [14, 14],
          });

          const marker = L.marker([lat, lng], { icon: providerPin }).addTo(markersLayerRef.current);

          marker.on("click", () => {
            setSelectedProvider(p);
          });
        });
      }
    }

    initMap();

    return () => {
      isMounted = false;
    };
  }, [providers]);

  return (
    <div className="relative w-full h-[520px] rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-xs">
      <div ref={mapContainerRef} className="w-full h-full z-10" />

      {/* Map Legend */}
      <div className="absolute top-3 left-3 z-20 bg-white/95 backdrop-blur-xs p-2.5 rounded-xl border border-slate-200 text-xs shadow-xs space-y-1">
        <div className="flex items-center gap-1.5 font-bold text-[#0F172A]">
          <span className="h-2.5 w-2.5 rounded-[3px] bg-[#0055D4]" />
          <Icon name="building" size={13} className="text-[#0055D4]" />
          <span>Seu Condomínio (Ponto de Atendimento)</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
          <span className="h-2 w-2 rounded-[2px] bg-slate-900 border border-amber-400" />
          <span>Profissionais credenciados na região</span>
        </div>
      </div>

      {/* Selected Provider Floating Overlay Card */}
      {selectedProvider && (
        <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-20 bg-white p-4 rounded-2xl border border-slate-200 shadow-xl space-y-3 animate-in slide-in-from-bottom-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-10 w-10 rounded-xl bg-blue-50 text-[#0055D4] flex items-center justify-center font-black text-sm shrink-0 overflow-hidden">
                {selectedProvider.avatarUrl ? (
                  <img src={selectedProvider.avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  selectedProvider.name.charAt(0)
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <h4 className="font-bold text-xs sm:text-sm text-[#0F172A] truncate">
                    {selectedProvider.name}
                  </h4>
                  {selectedProvider.isVerified && (
                    <Icon name="check-circle" size={13} className="text-[#0055D4] shrink-0" />
                  )}
                </div>
                <p className="text-[11px] text-slate-500 truncate">
                  {selectedProvider.category} · {selectedProvider.company}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedProvider(null)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-full"
            >
              <Icon name="x" size={14} />
            </button>
          </div>

          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
            <div className="flex items-center gap-1 font-black text-[#0F172A]">
              <Icon name="star" size={12} className="text-[#FFD000] fill-[#FFD000]" />
              <span>{selectedProvider.rating ? selectedProvider.rating.toFixed(1) : "Novo"}</span>
              <span className="text-[10px] text-slate-400 font-normal">
                ({selectedProvider.reviewsCount} avaliações)
              </span>
            </div>

            <span className="text-xs font-black text-[#0055D4]">
              {selectedProvider.startingPriceCents
                ? `A partir de R$ ${(selectedProvider.startingPriceCents / 100).toFixed(0)}`
                : "Sob consulta"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => onSelectProvider(selectedProvider)}
              className="rounded-xl border border-slate-200 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer text-center"
            >
              Ver perfil
            </button>
            <button
              type="button"
              onClick={() => onRequestBudget(selectedProvider)}
              className="rounded-xl bg-[#0055D4] hover:bg-[#0047BA] text-white py-1.5 text-xs font-bold transition-colors cursor-pointer text-center shadow-xs"
            >
              Solicitar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
