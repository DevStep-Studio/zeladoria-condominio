"use client";

import { useEffect, useRef } from "react";
import { GEOAPIFY_ATTRIBUTION } from "@/lib/services/integrations/geoapify";

interface ProviderCoverageMapProps {
  lat: number;
  lng: number;
  radiusKm?: number;
  radiusMeters?: number;
  onLocationChange: (coords: { lat: number; lng: number }) => void;
  className?: string;
  readOnly?: boolean;
}

export function ProviderCoverageMap({
  lat,
  lng,
  radiusKm = 15,
  radiusMeters,
  onLocationChange,
  className = "h-72 w-full rounded-xl overflow-hidden border border-slate-200",
  readOnly = false,
}: ProviderCoverageMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const circleRef = useRef<any>(null);
  const onLocationChangeRef = useRef(onLocationChange);

  // Calcula raio efetivo em metros
  const effectiveRadiusMeters = radiusMeters ?? radiusKm * 1000;

  useEffect(() => {
    onLocationChangeRef.current = onLocationChange;
  }, [onLocationChange]);

  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    let isMounted = true;

    async function initMap() {
      const L = (await import("leaflet")).default;
      if (!isMounted || !mapContainerRef.current) return;

      // Injeta CSS do Leaflet se não estiver presente
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: [lat, lng],
          zoom: 12,
          zoomControl: false,
        });

        L.control.zoom({ position: "bottomright" }).addTo(map);

        // OpenStreetMap com atribuição a Geoapify e OSM
        const tileLayer = L.tileLayer(
          "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
          {
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> | Powered by <a href="https://www.geoapify.com/" target="_blank">Geoapify</a>',
            subdomains: ["a", "b"],
            maxZoom: 19,
          }
        );

        tileLayer.on("tileerror", (error: any) => {
          // Fallback automático para ESRI se houver erro de tile
          if (error?.tile && !error.tile.dataset?.fallback) {
            error.tile.dataset.fallback = "true";
            const coords = error.coords;
            if (coords) {
              error.tile.src = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/${coords.z}/${coords.y}/${coords.x}`;
            }
          }
        });

        tileLayer.addTo(map);

        if (!readOnly) {
          map.on("click", (e: any) => {
            const { lat: clickLat, lng: clickLng } = e.latlng;
            onLocationChangeRef.current({ lat: clickLat, lng: clickLng });
          });
        }

        mapInstanceRef.current = map;
      }

      const map = mapInstanceRef.current;

      // Pin customizado
      const customPin = L.divIcon({
        className: "custom-provider-pin",
        html: `
          <div style="
            background-color: #1355FF;
            color: #FFFFFF;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px rgba(19, 85, 255, 0.4);
            border: 3px solid #FFFFFF;
            cursor: ${readOnly ? "default" : "grab"};
            transition: transform 0.15s ease;
          ">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      // Atualiza marcador
      if (!markerRef.current) {
        const marker = L.marker([lat, lng], {
          icon: customPin,
          draggable: !readOnly,
          title: "Base de atendimento do prestador",
        }).addTo(map);

        if (!readOnly) {
          marker.on("dragend", () => {
            const newPos = marker.getLatLng();
            onLocationChangeRef.current({ lat: newPos.lat, lng: newPos.lng });
          });
        }

        markerRef.current = marker;
      } else {
        markerRef.current.setLatLng([lat, lng]);
      }

      // Atualiza círculo de cobertura em metros
      if (!circleRef.current) {
        const circle = L.circle([lat, lng], {
          radius: effectiveRadiusMeters,
          color: "#1355FF",
          weight: 2,
          opacity: 0.8,
          fillColor: "#1355FF",
          fillOpacity: 0.12,
        }).addTo(map);

        circleRef.current = circle;
      } else {
        circleRef.current.setLatLng([lat, lng]);
        circleRef.current.setRadius(effectiveRadiusMeters);
      }

      map.panTo([lat, lng]);
    }

    initMap();

    return () => {
      isMounted = false;
    };
  }, [lat, lng, effectiveRadiusMeters, readOnly]);

  return (
    <div className="relative">
      <div ref={mapContainerRef} className={className} />
      <div className="absolute top-2 left-2 z-[400] bg-white/95 backdrop-blur-xs border border-slate-200 shadow-xs px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-slate-700 flex items-center gap-1.5 pointer-events-none">
        <span className="w-2 h-2 rounded-full bg-[#1355FF] animate-pulse" />
        <span>{readOnly ? "Área de atendimento" : "Arraste o pin ou clique no mapa para calibrar"}</span>
      </div>

      <div className="absolute bottom-1 left-2 z-[400] pointer-events-none text-[9px] text-slate-500 bg-white/80 px-1.5 py-0.5 rounded">
        {GEOAPIFY_ATTRIBUTION}
      </div>
    </div>
  );
}
