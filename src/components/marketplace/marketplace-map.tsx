"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icon";
import type { MarketplaceProvider } from "@/lib/services/providers-data";

export function MarketplaceMap({
  providers = [],
  condoName = "Residencial Parque das Águas",
  condoAddress = "Av. das Nações, 1200",
  condoLat = -23.5615,
  condoLng = -46.6559,
  onSelectProvider,
  onRequestBudget,
}: {
  providers: MarketplaceProvider[];
  condoName?: string;
  condoAddress?: string;
  condoLat?: number;
  condoLng?: number;
  onSelectProvider: (p: MarketplaceProvider) => void;
  onRequestBudget: (p: MarketplaceProvider) => void;
}) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const providerCardsListRef = useRef<HTMLDivElement>(null);

  const [selectedProvider, setSelectedProvider] = useState<MarketplaceProvider | null>(
    providers.length > 0 ? providers[0] : null
  );

  // Sync selected provider when providers list updates
  useEffect(() => {
    if (providers.length > 0 && (!selectedProvider || !providers.some((p) => p.id === selectedProvider.id))) {
      setSelectedProvider(providers[0]);
    }
  }, [providers]);

  // Leaflet map initialization
  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    let isMounted = true;

    async function initMap() {
      const L = (await import("leaflet")).default;
      if (!isMounted || !mapContainerRef.current) return;

      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: [condoLat, condoLng],
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

      // Render markers
      if (markersLayerRef.current) {
        markersLayerRef.current.clearLayers();

        // 1. Central Pin do Condomínio (Ponto de Atendimento)
        const condoIcon = L.divIcon({
          className: "condo-center-pin",
          html: `
            <div style="
              background-color: #0055D4;
              color: #FFFFFF;
              width: 34px;
              height: 34px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              border: 3px solid #FFFFFF;
              box-shadow: 0 4px 12px rgba(0,85,212,0.4);
            ">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
            </div>
          `,
          iconSize: [34, 34],
          iconAnchor: [17, 17],
        });

        L.marker([condoLat, condoLng], { icon: condoIcon })
          .bindTooltip(`Atendimento em ${condoName}`, {
            permanent: false,
            direction: "top",
            offset: [0, -18],
          })
          .addTo(markersLayerRef.current);

        // 2. Pins dos Prestadores (dispersos com base no raio de atendimento, sem expor endereço residencial)
        providers.forEach((p, idx) => {
          const angle = (idx * (360 / Math.max(1, providers.length))) * (Math.PI / 180);
          const distance = 0.007 + (idx % 4) * 0.005;
          const lat = condoLat + Math.cos(angle) * distance;
          const lng = condoLng + Math.sin(angle) * distance;

          const isSelected = selectedProvider?.id === p.id;

          const providerPin = L.divIcon({
            className: `provider-pin-${p.id}`,
            html: `
              <div style="
                background-color: ${isSelected ? "#0055D4" : "#FFFFFF"};
                color: ${isSelected ? "#FFFFFF" : "#0F172A"};
                min-width: 32px;
                height: 32px;
                padding: 0 8px;
                border-radius: 16px;
                display: flex;
                align-items: center;
                gap: 4px;
                font-family: inherit;
                font-size: 11px;
                font-weight: 800;
                border: 2px solid ${isSelected ? "#FFD000" : "#CBD5E1"};
                box-shadow: 0 4px 10px rgba(0,0,0,0.15);
                cursor: pointer;
                transition: transform 0.2s ease;
              ">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#FFD000" stroke="#FFD000" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                <span>${p.rating ? p.rating.toFixed(1) : "Novo"}</span>
              </div>
            `,
            iconSize: [60, 32],
            iconAnchor: [30, 16],
          });

          const marker = L.marker([lat, lng], { icon: providerPin }).addTo(markersLayerRef.current);

          marker.on("click", () => {
            setSelectedProvider(p);
            // Scroll to card in desktop list
            const el = document.getElementById(`provider-map-card-${p.id}`);
            if (el) {
              el.scrollIntoView({ behavior: "smooth", block: "nearest" });
            }
          });
        });
      }

      // Redraw map tiles
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 200);
    }

    initMap();

    return () => {
      isMounted = false;
    };
  }, [providers, condoLat, condoLng, condoName, selectedProvider?.id]);

  return (
    <div className="flex flex-col lg:flex-row gap-4 w-full h-[580px] rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-xs">
      {/* LADO ESQUERDO: MAPA INTERATIVO (58% desktop / 100% mobile) */}
      <div className="relative flex-1 lg:flex-[58] h-full min-h-[340px] bg-slate-100 overflow-hidden">
        <div ref={mapContainerRef} className="w-full h-full z-10" />

        {/* Legenda Limpa do Mapa */}
        <div className="absolute top-3 left-3 z-20 bg-white p-2.5 rounded-xl border border-slate-200 text-xs shadow-xs space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-[#0F172A]">
            <span className="h-2.5 w-2.5 rounded-full bg-[#0055D4]" />
            <span>Local do Atendimento ({condoName})</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
            <span className="h-2 w-2 rounded-full border border-amber-400 bg-white" />
            <span>Profissionais credenciados que atendem aqui</span>
          </div>
        </div>

        {/* MOBILE OVERLAY: Mini card flutuante sólido no rodapé do mapa no celular */}
        {selectedProvider && (
          <div className="lg:hidden absolute bottom-3 left-3 right-3 z-20 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xl space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-11 w-11 rounded-xl bg-blue-50 text-[#0055D4] flex items-center justify-center font-black text-sm shrink-0 overflow-hidden">
                  {selectedProvider.avatarUrl ? (
                    <img src={selectedProvider.avatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    selectedProvider.name.charAt(0)
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <h4 className="font-bold text-xs text-[#0F172A] truncate">
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

              <div className="text-right shrink-0">
                <div className="flex items-center gap-1 font-black text-xs text-[#0F172A]">
                  <Icon name="star" size={12} className="text-[#FFD000] fill-[#FFD000]" />
                  <span>{selectedProvider.rating ? selectedProvider.rating.toFixed(1) : "Novo"}</span>
                </div>
                <span className="text-[11px] text-slate-400">
                  {selectedProvider.distanceKm != null ? `${selectedProvider.distanceKm.toFixed(1)} km` : "Próximo"}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
              <span className="font-black text-[#0F172A]">
                {selectedProvider.startingPriceCents
                  ? `A partir de R$ ${(selectedProvider.startingPriceCents / 100).toFixed(0)}`
                  : "Sob consulta"}
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onSelectProvider(selectedProvider)}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Ver perfil
                </button>
                <button
                  type="button"
                  onClick={() => onRequestBudget(selectedProvider)}
                  className="rounded-xl bg-[#0055D4] hover:bg-[#0047BA] text-white px-3.5 py-1.5 text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  Solicitar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* LADO DIREITO (DESKTOP): LISTA LATERAL DE PROFISSIONAIS (42% largura) */}
      <div className="hidden lg:flex flex-col lg:flex-[42] h-full border-l border-slate-200 bg-slate-50/50">
        <div className="p-3.5 border-b border-slate-200 bg-white flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="font-black text-xs text-[#0F172A]">
              Profissionais na Região
            </span>
            <span className="rounded-[4px] bg-slate-100 px-1.5 py-0.2 text-[10px] font-bold text-slate-600">
              {providers.length}
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            Selecione no mapa ou na lista
          </span>
        </div>

        {/* Scrollable Provider List */}
        <div
          ref={providerCardsListRef}
          className="flex-1 overflow-y-auto p-3 space-y-2.5"
        >
          {providers.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              Nenhum profissional encontrado nesta região.
            </div>
          ) : (
            providers.map((p) => {
              const isSelected = selectedProvider?.id === p.id;
              const photo = p.portfolio?.[0]?.url || p.coverUrl || p.avatarUrl;

              return (
                <div
                  key={p.id}
                  id={`provider-map-card-${p.id}`}
                  onClick={() => setSelectedProvider(p)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer bg-white ${
                    isSelected
                      ? "border-[#0055D4] ring-2 ring-blue-100 shadow-sm"
                      : "border-slate-200 hover:border-slate-300 shadow-2xs"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Thumbnail */}
                    <div className="h-16 w-16 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                      {photo ? (
                        <img src={photo} alt={p.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center font-black text-sm text-[#0055D4] bg-blue-50">
                          {p.name.charAt(0)}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-xs font-bold text-[#0F172A] truncate">
                          {p.name}
                        </h4>
                        {p.isVerified && (
                          <Icon name="check-circle" size={13} className="text-[#0055D4] shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">
                        {p.category} · {p.company}
                      </p>

                      <div className="flex items-center justify-between gap-2 mt-1.5 text-xs">
                        <div className="flex items-center gap-1 font-bold text-[#0F172A]">
                          <Icon name="star" size={11} className="text-[#FFD000] fill-[#FFD000]" />
                          <span>{p.rating ? p.rating.toFixed(1) : "Novo"}</span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            ({p.reviewsCount})
                          </span>
                        </div>

                        <span className="text-[11px] text-slate-400">
                          {p.distanceKm != null ? `${p.distanceKm.toFixed(1)} km` : "Próximo"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Price */}
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">
                        A partir de
                      </span>
                      <span className="text-xs font-black text-[#0F172A]">
                        {p.startingPriceCents
                          ? `R$ ${(p.startingPriceCents / 100).toFixed(0)}`
                          : "Sob consulta"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectProvider(p);
                        }}
                        className="rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        Ver perfil
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRequestBudget(p);
                        }}
                        className="rounded-lg bg-[#0055D4] hover:bg-[#0047BA] text-white px-3 py-1 text-[11px] font-bold transition-colors shadow-2xs"
                      >
                        Solicitar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
