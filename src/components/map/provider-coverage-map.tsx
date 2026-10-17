"use client";

import { useEffect, useRef } from "react";
import { Icon } from "@/components/icon";

interface ProviderCoverageMapProps {
  lat: number;
  lng: number;
  radiusKm: number;
  onLocationChange: (coords: { lat: number; lng: number }) => void;
  className?: string;
}

export function ProviderCoverageMap({
  lat,
  lng,
  radiusKm,
  onLocationChange,
  className = "h-72 w-full rounded-xl overflow-hidden border border-slate-200",
}: ProviderCoverageMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const circleRef = useRef<any>(null);
  const onLocationChangeRef = useRef(onLocationChange);

  useEffect(() => {
    onLocationChangeRef.current = onLocationChange;
  }, [onLocationChange]);

  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    let isMounted = true;

    async function initMap() {
      const L = (await import("leaflet")).default;
      if (!isMounted || !mapContainerRef.current) return;

      // Inject Leaflet CSS if not already present
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

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(map);

        mapInstanceRef.current = map;
      }

      const map = mapInstanceRef.current;

      // Create Custom Pin Icon
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
            cursor: grab;
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

      // Update or create marker
      if (!markerRef.current) {
        const marker = L.marker([lat, lng], {
          icon: customPin,
          draggable: true,
          title: "Arraste para ajustar sua base de atendimento",
        }).addTo(map);

        marker.on("dragend", () => {
          const newPos = marker.getLatLng();
          onLocationChangeRef.current({ lat: newPos.lat, lng: newPos.lng });
        });

        markerRef.current = marker;
      } else {
        markerRef.current.setLatLng([lat, lng]);
      }

      // Update or create coverage circle
      const radiusMeters = radiusKm * 1000;
      if (!circleRef.current) {
        const circle = L.circle([lat, lng], {
          radius: radiusMeters,
          color: "#1355FF",
          weight: 2,
          opacity: 0.8,
          fillColor: "#1355FF",
          fillOpacity: 0.12,
        }).addTo(map);

        circleRef.current = circle;
      } else {
        circleRef.current.setLatLng([lat, lng]);
        circleRef.current.setRadius(radiusMeters);
      }

      // Smooth pan to coordinates
      map.panTo([lat, lng]);
    }

    initMap();

    return () => {
      isMounted = false;
    };
  }, [lat, lng, radiusKm]);

  return (
    <div className="relative">
      <div ref={mapContainerRef} className={className} />
      <div className="absolute top-2 left-2 z-[400] bg-white/95 backdrop-blur-xs border border-slate-200 shadow-xs px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-slate-700 flex items-center gap-1.5 pointer-events-none">
        <span className="w-2 h-2 rounded-full bg-[#1355FF] animate-pulse" />
        <span>Arraste o pin no mapa para calibrar sua localização</span>
      </div>
    </div>
  );
}
