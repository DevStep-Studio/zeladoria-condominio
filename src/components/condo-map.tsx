"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { Icon, type IconName } from "@/components/icon";

export type CondoMapOccurrence = {
  id: number;
  code: string;
  title: string;
  description?: string;
  category: string;
  severity: "alta" | "media" | "baixa" | "urgente" | string;
  status:
    | "recebida"
    | "em_analise"
    | "em_execucao"
    | "em_andamento"
    | "aguardando_morador"
    | "resolvida"
    | "concluido"
    | "cancelada"
    | string;
  exactLocation?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  createdAt: Date | string;
  unitNumber?: string | null;
  blockName?: string | null;
  reportedByName?: string | null;
  assignedToName?: string | null;
};

export type CondoCoordinates = {
  lat: number;
  lng: number;
  name?: string;
  address?: string;
};

type StatusFilter = "todas" | "abertas" | "em_andamento" | "resolvidas";

// Category definitions with icons and normalized labels
const CATEGORY_MAP: Record<string, { label: string; icon: IconName; svgPath: string }> = {
  eletrica: {
    label: "Elétrica",
    icon: "zap",
    svgPath: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="currentColor"/>',
  },
  iluminacao: {
    label: "Iluminação",
    icon: "sun",
    svgPath:
      '<circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" stroke-width="2"/><line x1="12" y1="1" x2="12" y2="3" stroke="currentColor" stroke-width="2"/><line x1="12" y1="21" x2="12" y2="23" stroke="currentColor" stroke-width="2"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke="currentColor" stroke-width="2"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke="currentColor" stroke-width="2"/><line x1="1" y1="12" x2="3" y2="12" stroke="currentColor" stroke-width="2"/><line x1="21" y1="12" x2="23" y2="12" stroke="currentColor" stroke-width="2"/>',
  },
  hidraulica: {
    label: "Hidráulica",
    icon: "droplet",
    svgPath: '<path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" fill="currentColor"/>',
  },
  vazamento: {
    label: "Vazamento",
    icon: "droplet",
    svgPath: '<path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" fill="currentColor"/>',
  },
  infiltracao: {
    label: "Infiltração",
    icon: "droplet",
    svgPath: '<path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" fill="currentColor"/>',
  },
  limpeza: {
    label: "Limpeza",
    icon: "sparkles",
    svgPath:
      '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" fill="currentColor"/>',
  },
  seguranca: {
    label: "Segurança",
    icon: "shield",
    svgPath:
      '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="none" stroke="currentColor" stroke-width="2"/>',
  },
  portao: {
    label: "Portão",
    icon: "lock",
    svgPath:
      '<rect x="3" y="11" width="18" height="11" rx="2" ry="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4" fill="none" stroke="currentColor" stroke-width="2"/>',
  },
  elevador: {
    label: "Elevador",
    icon: "panel",
    svgPath:
      '<rect x="4" y="3" width="16" height="18" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><polyline points="8 10 10 8 12 10" stroke="currentColor" stroke-width="2" fill="none"/><polyline points="12 14 10 16 8 14" stroke="currentColor" stroke-width="2" fill="none"/>',
  },
  garagem: {
    label: "Garagem",
    icon: "truck",
    svgPath:
      '<rect x="1" y="3" width="15" height="13" fill="none" stroke="currentColor" stroke-width="2"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="5.5" cy="18.5" r="2.5" fill="currentColor"/><circle cx="18.5" cy="18.5" r="2.5" fill="currentColor"/>',
  },
  manutencao: {
    label: "Manutenção",
    icon: "wrench",
    svgPath:
      '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" fill="none" stroke="currentColor" stroke-width="2"/>',
  },
  estrutura: {
    label: "Estrutura",
    icon: "building",
    svgPath:
      '<rect x="4" y="2" width="16" height="20" rx="2" ry="2" fill="none" stroke="currentColor" stroke-width="2"/><line x1="9" y1="22" x2="9" y2="12" stroke="currentColor" stroke-width="2"/><line x1="15" y1="22" x2="15" y2="12" stroke="currentColor" stroke-width="2"/>',
  },
  piscina: {
    label: "Piscina",
    icon: "activity",
    svgPath:
      '<path d="M2 12h20M2 17h20M2 7h20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  },
  ruido: {
    label: "Ruído",
    icon: "bell",
    svgPath:
      '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M13.73 21a2 2 0 0 1-3.46 0" fill="none" stroke="currentColor" stroke-width="2"/>',
  },
  outros: {
    label: "Outros",
    icon: "more",
    svgPath:
      '<circle cx="12" cy="12" r="2" fill="currentColor"/><circle cx="19" cy="12" r="2" fill="currentColor"/><circle cx="5" cy="12" r="2" fill="currentColor"/>',
  },
};

// Priority Colors (🔴 Alta, 🟡 Média, 🔵 Baixa) strictly adhering to prompt
const PRIORITY_THEME: Record<
  string,
  {
    label: string;
    pinBg: string;
    pinRing: string;
    pinText: string;
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
    dotColor: string;
  }
> = {
  alta: {
    label: "Alta",
    pinBg: "#EF4444",
    pinRing: "#DC2626",
    pinText: "#FFFFFF",
    badgeBg: "bg-red-50",
    badgeText: "text-red-700",
    badgeBorder: "border-red-200",
    dotColor: "#EF4444",
  },
  urgente: {
    label: "Urgente",
    pinBg: "#EF4444",
    pinRing: "#B91C1C",
    pinText: "#FFFFFF",
    badgeBg: "bg-red-50",
    badgeText: "text-red-700",
    badgeBorder: "border-red-200",
    dotColor: "#EF4444",
  },
  media: {
    label: "Média",
    pinBg: "#F59E0B",
    pinRing: "#D97706",
    pinText: "#12162A",
    badgeBg: "bg-amber-50",
    badgeText: "text-amber-800",
    badgeBorder: "border-amber-200",
    dotColor: "#F59E0B",
  },
  baixa: {
    label: "Baixa",
    pinBg: "#0055D4",
    pinRing: "#0040A1",
    pinText: "#FFFFFF",
    badgeBg: "bg-blue-50",
    badgeText: "text-[#0055D4]",
    badgeBorder: "border-blue-200",
    dotColor: "#0055D4",
  },
};

// Default fallback condo center
const DEFAULT_CONDO_CENTER: CondoCoordinates = {
  lat: -23.5855,
  lng: -46.6784,
  name: "Residencial Parque das Águas",
  address: "Av. das Nações, 1200",
};

// Helper: Format occurrence date nicely
function formatOccDate(val: Date | string | undefined): string {
  if (!val) return "—";
  try {
    const d = typeof val === "string" ? new Date(val) : val;
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return "—";
  }
}

// Helper: Normalize status into 3 main buckets (aberta, em_andamento, resolvida)
function normalizeStatusBucket(rawStatus: string): "aberta" | "em_andamento" | "resolvida" {
  const s = (rawStatus || "").toLowerCase();
  if (s === "resolvida" || s === "concluido" || s === "concluida" || s === "cancelada") {
    return "resolvida";
  }
  if (s === "em_execucao" || s === "em_andamento") {
    return "em_andamento";
  }
  return "aberta";
}

// Helper: Human friendly status label & styling
function getStatusMeta(rawStatus: string) {
  const bucket = normalizeStatusBucket(rawStatus);
  if (bucket === "resolvida") {
    return {
      label: rawStatus.toLowerCase() === "cancelada" ? "Cancelada" : "Resolvida",
      badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
      dotClass: "bg-emerald-500",
      icon: "check" as IconName,
    };
  }
  if (bucket === "em_andamento") {
    return {
      label: "Em andamento",
      badgeClass: "bg-blue-50 text-[#0055D4] border-blue-200",
      dotClass: "bg-[#0055D4]",
      icon: "activity" as IconName,
    };
  }
  return {
    label: rawStatus === "em_analise" ? "Em análise" : "Aberta",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
    dotClass: "bg-amber-500",
    icon: "clock" as IconName,
  };
}

// Helper: Calculate stable geographical offset when coordinate is missing in DB
function getDeterministicCoordinate(
  occ: CondoMapOccurrence,
  baseLat: number,
  baseLng: number
): { lat: number; lng: number } {
  if (occ.latitude != null && occ.longitude != null && !isNaN(occ.latitude) && !isNaN(occ.longitude)) {
    return { lat: occ.latitude, lng: occ.longitude };
  }

  // Deterministic offset within 40-90m perimeter of condo
  const codeNum = parseInt(occ.code.replace(/\D/g, "") || "1", 10);
  const hash = Math.abs((occ.id * 37 + codeNum * 13 + (occ.category.charCodeAt(0) || 0) * 7) % 360);
  const angle = (hash * Math.PI) / 180;
  const dist = 0.00032 + ((occ.id * 19) % 70) * 0.000005; // ~35m to ~80m

  return {
    lat: baseLat + dist * Math.cos(angle),
    lng: baseLng + dist * Math.sin(angle) * 1.15,
  };
}

export interface CondoMapProps {
  occurrences?: CondoMapOccurrence[];
  condo?: CondoCoordinates;
  onExpand?: () => void;
  isExpandedModal?: boolean;
}

export function CondoMap({
  occurrences = [],
  condo = DEFAULT_CONDO_CENTER,
  onExpand,
  isExpandedModal = false,
}: CondoMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const newPinMarkerRef = useRef<any>(null);

  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState(false);

  // Filters State
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todas");
  const [categoryFilter, setCategoryFilter] = useState<string>("todas");
  const [priorityFilter, setPriorityFilter] = useState<string>("todas");
  const [locationFilter, setLocationFilter] = useState<string>("todos");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);

  // Interaction State
  const [selectedOccurrence, setSelectedOccurrence] = useState<CondoMapOccurrence | null>(null);
  const [newLocationPrompt, setNewLocationPrompt] = useState<{
    lat: number;
    lng: number;
    locLabel: string;
  } | null>(null);
  const [userLocationLoading, setUserLocationLoading] = useState(false);
  const [geoNotice, setGeoNotice] = useState<string | null>(null);

  const condoCenter = useMemo(
    () => ({
      lat: condo?.lat ?? DEFAULT_CONDO_CENTER.lat,
      lng: condo?.lng ?? DEFAULT_CONDO_CENTER.lng,
      name: condo?.name ?? DEFAULT_CONDO_CENTER.name,
      address: condo?.address ?? DEFAULT_CONDO_CENTER.address,
    }),
    [condo]
  );

  // Available distinct categories & locations for dropdowns
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    occurrences.forEach((o) => {
      if (o.category) set.add(o.category.toLowerCase());
    });
    return Array.from(set);
  }, [occurrences]);

  const availableLocations = useMemo(() => {
    const set = new Set<string>();
    occurrences.forEach((o) => {
      if (o.blockName) set.add(o.blockName);
      else if (o.exactLocation) {
        const prefix = o.exactLocation.split("-")[0].trim();
        if (prefix) set.add(prefix);
      }
    });
    return Array.from(set).slice(0, 10);
  }, [occurrences]);

  // Occurrences with deterministic geographical coordinates
  const placedOccurrences = useMemo(() => {
    return occurrences.map((occ) => {
      const coords = getDeterministicCoordinate(occ, condoCenter.lat, condoCenter.lng);
      return {
        ...occ,
        _lat: coords.lat,
        _lng: coords.lng,
        _bucket: normalizeStatusBucket(occ.status),
      };
    });
  }, [occurrences, condoCenter]);

  // Filtered occurrences
  const filteredOccurrences = useMemo(() => {
    return placedOccurrences.filter((occ) => {
      // Status filter
      if (statusFilter === "abertas" && occ._bucket !== "aberta") return false;
      if (statusFilter === "em_andamento" && occ._bucket !== "em_andamento") return false;
      if (statusFilter === "resolvidas" && occ._bucket !== "resolvida") return false;

      // Category filter
      if (categoryFilter !== "todas" && occ.category.toLowerCase() !== categoryFilter.toLowerCase()) {
        return false;
      }

      // Priority filter
      if (priorityFilter !== "todas") {
        const sev = (occ.severity || "").toLowerCase();
        if (priorityFilter === "alta" && sev !== "alta" && sev !== "urgente") return false;
        if (priorityFilter === "media" && sev !== "media") return false;
        if (priorityFilter === "baixa" && sev !== "baixa") return false;
      }

      // Location filter
      if (locationFilter !== "todos") {
        const matchBlock = occ.blockName?.toLowerCase() === locationFilter.toLowerCase();
        const matchExact = occ.exactLocation?.toLowerCase().includes(locationFilter.toLowerCase());
        if (!matchBlock && !matchExact) return false;
      }

      // Search Query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const mCode = occ.code.toLowerCase().includes(q);
        const mTitle = occ.title.toLowerCase().includes(q);
        const mLoc = (occ.exactLocation || "").toLowerCase().includes(q);
        const mBlock = (occ.blockName || "").toLowerCase().includes(q);
        const mCat = (CATEGORY_MAP[occ.category.toLowerCase()]?.label || occ.category).toLowerCase().includes(q);
        if (!mCode && !mTitle && !mLoc && !mBlock && !mCat) {
          return false;
        }
      }

      return true;
    });
  }, [placedOccurrences, statusFilter, categoryFilter, priorityFilter, locationFilter, searchQuery]);

  // Overall and Filtered Counts for header
  const counts = useMemo(() => {
    let total = 0;
    let abertas = 0;
    let emAndamento = 0;
    let resolvidas = 0;

    filteredOccurrences.forEach((o) => {
      total++;
      if (o._bucket === "aberta") abertas++;
      else if (o._bucket === "em_andamento") emAndamento++;
      else if (o._bucket === "resolvida") resolvidas++;
    });

    return { total, abertas, emAndamento, resolvidas };
  }, [filteredOccurrences]);

  // Search Results preview for dropdown
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return placedOccurrences
      .filter((occ) => {
        const mCode = occ.code.toLowerCase().includes(q);
        const mTitle = occ.title.toLowerCase().includes(q);
        const mLoc = (occ.exactLocation || "").toLowerCase().includes(q);
        const mCat = occ.category.toLowerCase().includes(q);
        return mCode || mTitle || mLoc || mCat;
      })
      .slice(0, 5);
  }, [placedOccurrences, searchQuery]);

  // Fly to an occurrence and open its popover
  const handleSelectOccurrence = useCallback((occ: CondoMapOccurrence & { _lat?: number; _lng?: number }) => {
    const lat = occ._lat ?? occ.latitude ?? condoCenter.lat;
    const lng = occ._lng ?? occ.longitude ?? condoCenter.lng;

    setSelectedOccurrence(occ);
    setNewLocationPrompt(null);
    setSearchDropdownOpen(false);

    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([lat, lng], 18, {
        duration: 0.7,
        easeLinearity: 0.25,
      });
    }
  }, [condoCenter]);

  // Recenter map back to condominium center
  const handleRecenterCondo = useCallback(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([condoCenter.lat, condoCenter.lng], 17, {
        duration: 0.6,
      });
    }
  }, [condoCenter]);

  // Geolocation: Find user position
  const handleGetUserLocation = useCallback(() => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setGeoNotice("Geolocalização não suportada no seu navegador.");
      setTimeout(() => setGeoNotice(null), 3500);
      return;
    }

    setUserLocationLoading(true);
    setGeoNotice(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setUserLocationLoading(false);
        const uLat = pos.coords.latitude;
        const uLng = pos.coords.longitude;

        if (mapInstanceRef.current) {
          const L = (await import("leaflet")).default;

          if (userMarkerRef.current) {
            mapInstanceRef.current.removeLayer(userMarkerRef.current);
          }

          const userIcon = L.divIcon({
            className: "custom-user-location-pin",
            html: `
              <div style="position: relative; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center;">
                <div style="position: absolute; width: 26px; height: 26px; border-radius: 50%; background-color: rgba(0, 85, 212, 0.25); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
                <div style="position: relative; width: 14px; height: 14px; border-radius: 50%; background-color: #0055D4; border: 2.5px solid #FFFFFF; box-shadow: 0 1px 4px rgba(0,0,0,0.35);"></div>
              </div>
            `,
            iconSize: [26, 26],
            iconAnchor: [13, 13],
          });

          userMarkerRef.current = L.marker([uLat, uLng], { icon: userIcon, zIndexOffset: 1000 })
            .bindTooltip("Você está aqui", { direction: "top", offset: [0, -12] })
            .addTo(mapInstanceRef.current);

          mapInstanceRef.current.flyTo([uLat, uLng], 18, { duration: 0.8 });
        }
      },
      (err) => {
        setUserLocationLoading(false);
        const msg =
          err.code === 1
            ? "Permissão de localização negada pelo navegador."
            : "Não foi possível obter sua localização atual.";
        setGeoNotice(msg);
        setTimeout(() => setGeoNotice(null), 4000);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  // Render Markers & Clusters on the Map
  const renderMarkers = useCallback(
    (L: any) => {
      if (!mapInstanceRef.current || !markersLayerRef.current) return;

      markersLayerRef.current.clearLayers();

      const zoom = mapInstanceRef.current.getZoom();
      const clusterDistancePx = 45; // Group distance threshold

      // Proximity clustering algorithm when zoomed out
      const clusters: {
        centerLat: number;
        centerLng: number;
        items: (CondoMapOccurrence & { _lat: number; _lng: number; _bucket: string })[];
      }[] = [];

      filteredOccurrences.forEach((item) => {
        if (zoom >= 18) {
          // At maximum zoom, display all individual pins without clustering
          clusters.push({
            centerLat: item._lat,
            centerLng: item._lng,
            items: [item],
          });
          return;
        }

        const point = mapInstanceRef.current.latLngToLayerPoint([item._lat, item._lng]);
        let placedInCluster = false;

        for (const cluster of clusters) {
          const clusterPoint = mapInstanceRef.current.latLngToLayerPoint([
            cluster.centerLat,
            cluster.centerLng,
          ]);
          const dist = Math.hypot(point.x - clusterPoint.x, point.y - clusterPoint.y);

          if (dist < clusterDistancePx) {
            cluster.items.push(item);
            // Recompute cluster center weighted average
            cluster.centerLat =
              (cluster.centerLat * (cluster.items.length - 1) + item._lat) / cluster.items.length;
            cluster.centerLng =
              (cluster.centerLng * (cluster.items.length - 1) + item._lng) / cluster.items.length;
            placedInCluster = true;
            break;
          }
        }

        if (!placedInCluster) {
          clusters.push({
            centerLat: item._lat,
            centerLng: item._lng,
            items: [item],
          });
        }
      });

      // Render each cluster or single marker
      clusters.forEach((cluster) => {
        if (cluster.items.length > 1) {
          // Multi-item cluster badge
          const hasHigh = cluster.items.some(
            (i) => i.severity?.toLowerCase() === "alta" || i.severity?.toLowerCase() === "urgente"
          );
          const hasMed = cluster.items.some((i) => i.severity?.toLowerCase() === "media");

          const clusterBg = "#1E293B"; // Slate 800 - elegant executive
          const dotColor = hasHigh ? "#EF4444" : hasMed ? "#F59E0B" : "#0055D4";

          const clusterIcon = L.divIcon({
            className: "custom-map-cluster",
            html: `
              <div style="
                position: relative;
                width: 36px;
                height: 36px;
                border-radius: 50%;
                background-color: ${clusterBg};
                color: #FFFFFF;
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: sans-serif;
                font-size: 13px;
                font-weight: 800;
                border: 2.5px solid #FFFFFF;
                box-shadow: 0 2px 8px rgba(0,0,0,0.35);
                cursor: pointer;
                transition: transform 0.15s ease;
              " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                <span>${cluster.items.length}</span>
                <span style="
                  position: absolute;
                  top: -2px;
                  right: -2px;
                  width: 10px;
                  height: 10px;
                  border-radius: 50%;
                  background-color: ${dotColor};
                  border: 2px solid #FFFFFF;
                "></span>
              </div>
            `,
            iconSize: [36, 36],
            iconAnchor: [18, 18],
          });

          const marker = L.marker([cluster.centerLat, cluster.centerLng], { icon: clusterIcon }).addTo(
            markersLayerRef.current
          );

          marker.on("click", () => {
            const nextZoom = Math.min(zoom + 2, 19);
            mapInstanceRef.current.setView([cluster.centerLat, cluster.centerLng], nextZoom, {
              animate: true,
            });
          });

          marker.bindTooltip(
            `<div style="font-size: 11px; font-weight: 600;">${cluster.items.length} ocorrências agrupadas (clique para aproximar)</div>`,
            { direction: "top", offset: [0, -18] }
          );
        } else {
          // Single occurrence marker
          const occ = cluster.items[0];
          const sevKey = (occ.severity || "baixa").toLowerCase();
          const theme = PRIORITY_THEME[sevKey] || PRIORITY_THEME.baixa;
          const catMeta = CATEGORY_MAP[occ.category.toLowerCase()] || CATEGORY_MAP.outros;
          const isSelected = selectedOccurrence?.id === occ.id;

          // Status small badge color
          const statusDot =
            occ._bucket === "resolvida"
              ? "#10B981"
              : occ._bucket === "em_andamento"
                ? "#0055D4"
                : "#F59E0B";

          const singleIcon = L.divIcon({
            className: "custom-map-pin",
            html: `
              <div style="
                position: relative;
                width: 34px;
                height: 42px;
                display: flex;
                flex-direction: column;
                align-items: center;
                cursor: pointer;
                filter: drop-shadow(0 2px 5px rgba(0,0,0,0.28));
                transition: transform 0.15s ease;
                ${isSelected ? "transform: scale(1.22); z-index: 999;" : ""}
              " onmouseover="this.style.transform='scale(1.18)'" onmouseout="this.style.transform='${isSelected ? "scale(1.22)" : "scale(1)"}'">
                <!-- Pin Head Circle -->
                <div style="
                  width: 32px;
                  height: 32px;
                  border-radius: 50%;
                  background-color: ${theme.pinBg};
                  color: ${theme.pinText};
                  border: 2px solid #FFFFFF;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  position: relative;
                  box-sizing: border-box;
                ">
                  <svg width="15" height="15" viewBox="0 0 24 24" style="display: block; color: ${theme.pinText};">
                    ${catMeta.svgPath}
                  </svg>

                  <!-- Status Dot -->
                  <div style="
                    position: absolute;
                    top: -2px;
                    right: -2px;
                    width: 8.5px;
                    height: 8.5px;
                    border-radius: 50%;
                    background-color: ${statusDot};
                    border: 1.5px solid #FFFFFF;
                  "></div>
                </div>

                <!-- Pin Pointer Arrow -->
                <div style="
                  width: 0;
                  height: 0;
                  border-left: 5px solid transparent;
                  border-right: 5px solid transparent;
                  border-top: 6px solid ${theme.pinBg};
                  margin-top: -1px;
                "></div>
              </div>
            `,
            iconSize: [34, 42],
            iconAnchor: [17, 40],
          });

          const marker = L.marker([occ._lat, occ._lng], {
            icon: singleIcon,
            zIndexOffset: isSelected ? 500 : 0,
          }).addTo(markersLayerRef.current);

          marker.on("click", () => {
            handleSelectOccurrence(occ);
          });

          marker.bindTooltip(
            `
            <div style="font-family: sans-serif; font-size: 11px; padding: 2px;">
              <span style="font-weight: 800; color: #0055D4;">${occ.code}</span> · <span style="font-weight: 600;">${occ.title}</span>
            </div>
          `,
            { direction: "top", offset: [0, -40] }
          );
        }
      });
    },
    [filteredOccurrences, selectedOccurrence, handleSelectOccurrence]
  );

  // Initialize Leaflet Map
  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    let isMounted = true;

    const initLeaflet = async () => {
      try {
        const L = (await import("leaflet")).default;

        // Ensure Leaflet CSS
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
            center: [condoCenter.lat, condoCenter.lng],
            zoom: 17,
            minZoom: 14,
            maxZoom: 19,
            zoomControl: false,
          });

          // Custom top-left zoom controls
          L.control.zoom({ position: "topleft" }).addTo(map);

          // CARTO Positron Light Tiles (Zero 403 errors, high performance, clean aesthetic)
          const tileLayer = L.tileLayer(
            "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
            {
              attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
              subdomains: "abcd",
              maxZoom: 20,
            }
          );

          tileLayer.on("tileerror", () => {
            // Silently handled without technical error popups
          });

          tileLayer.addTo(map);

          // Click on map to register new occurrence at that location
          map.on("click", (e: any) => {
            const { lat, lng } = e.latlng;
            setNewLocationPrompt({
              lat: Number(lat.toFixed(6)),
              lng: Number(lng.toFixed(6)),
              locLabel: "Ponto marcado no mapa",
            });
            setSelectedOccurrence(null);

            if (newPinMarkerRef.current) {
              map.removeLayer(newPinMarkerRef.current);
            }

            const tempIcon = L.divIcon({
              className: "custom-new-placement-pin",
              html: `
                <div style="
                  width: 28px;
                  height: 28px;
                  border-radius: 50%;
                  background-color: #FFD000;
                  color: #12162A;
                  border: 2px solid #12162A;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-weight: bold;
                  font-size: 15px;
                  box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                  animation: bounce 1s infinite alternate;
                ">📍</div>
              `,
              iconSize: [28, 28],
              iconAnchor: [14, 28],
            });

            newPinMarkerRef.current = L.marker([lat, lng], { icon: tempIcon }).addTo(map);
          });

          // Re-render markers on zoom/move for dynamic clustering
          map.on("zoomend", () => {
            renderMarkers(L);
          });

          markersLayerRef.current = L.layerGroup().addTo(map);
          mapInstanceRef.current = map;
        }

        if (isMounted) {
          setMapReady(true);
          setMapError(false);
          renderMarkers(L);
        }
      } catch (err) {
        console.error("Leaflet map initialization error:", err);
        if (isMounted) {
          setMapError(true);
        }
      }
    };

    initLeaflet();

    return () => {
      isMounted = false;
    };
  }, [condoCenter, renderMarkers]);

  // Re-render markers whenever filters, selection, or occurrences change
  useEffect(() => {
    if (typeof window === "undefined" || !mapReady) return;
    import("leaflet").then((module) => {
      renderMarkers(module.default);
    });
  }, [mapReady, renderMarkers]);

  // Dismiss new location placement pin
  const handleDismissPlacement = useCallback(() => {
    setNewLocationPrompt(null);
    if (mapInstanceRef.current && newPinMarkerRef.current) {
      mapInstanceRef.current.removeLayer(newPinMarkerRef.current);
      newPinMarkerRef.current = null;
    }
  }, []);

  const hasActiveFilters =
    statusFilter !== "todas" ||
    categoryFilter !== "todas" ||
    priorityFilter !== "todas" ||
    locationFilter !== "todos" ||
    searchQuery.trim() !== "";

  const handleClearFilters = useCallback(() => {
    setStatusFilter("todas");
    setCategoryFilter("todas");
    setPriorityFilter("todas");
    setLocationFilter("todos");
    setSearchQuery("");
  }, []);

  const selectedPriorityTheme = selectedOccurrence
    ? PRIORITY_THEME[(selectedOccurrence.severity || "baixa").toLowerCase()] || PRIORITY_THEME.baixa
    : null;
  const selectedStatusMeta = selectedOccurrence ? getStatusMeta(selectedOccurrence.status) : null;
  const selectedCategoryMeta = selectedOccurrence
    ? CATEGORY_MAP[selectedOccurrence.category.toLowerCase()] || CATEGORY_MAP.outros
    : null;

  return (
    <div className="rounded-[14px] border border-slate-200 bg-white p-4 sm:p-5 shadow-xs select-none">
      {/* 1. CABEÇALHO DO MAPA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-extrabold text-[#0F172A] tracking-tight">
              MAPA DO CONDOMÍNIO
            </h3>
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-[#0055D4]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#0055D4] animate-pulse" />
              Tempo Real
            </span>
          </div>

          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Visualize e acompanhe ocorrências e serviços em tempo real
          </p>

          {/* Contador de Ocorrências (Atualizado Dinamicamente) */}
          <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-slate-600 flex-wrap">
            <span className="text-slate-900 font-bold">{counts.total} ocorrências</span>
            <span className="text-slate-300">•</span>
            <span className="text-amber-700">{counts.abertas} abertas</span>
            <span className="text-slate-300">•</span>
            <span className="text-[#0055D4]">{counts.emAndamento} em andamento</span>
            <span className="text-slate-300">•</span>
            <span className="text-emerald-700">{counts.resolvidas} resolvidas</span>
          </div>
        </div>

        {/* Ações do Topo: Centralizar, Minha Localização e Expandir */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleGetUserLocation}
            disabled={userLocationLoading}
            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-[8px] border border-slate-200 bg-white hover:bg-slate-50 active:bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 shadow-xs transition-colors cursor-pointer"
            title="Mostrar minha localização atual no mapa"
          >
            <Icon
              name="navigation"
              size={14}
              className={userLocationLoading ? "animate-spin text-[#0055D4]" : "text-slate-600"}
            />
            <span>{userLocationLoading ? "Localizando..." : "Minha localização"}</span>
          </button>

          <button
            type="button"
            onClick={handleRecenterCondo}
            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-[8px] border border-slate-200 bg-white hover:bg-slate-50 active:bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 shadow-xs transition-colors cursor-pointer"
            title="Retornar à posição central do condomínio"
          >
            <Icon name="target" size={14} className="text-[#0055D4]" />
            <span>Centralizar condomínio</span>
          </button>

          {onExpand && !isExpandedModal && (
            <button
              type="button"
              onClick={onExpand}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-[8px] border border-blue-200 bg-blue-50/80 hover:bg-blue-100 px-3 py-1.5 text-xs font-bold text-[#0055D4] transition-colors cursor-pointer"
              title="Expandir mapa em tela cheia"
            >
              <Icon name="arrow-up-right" size={14} />
              <span>Expandir</span>
            </button>
          )}
        </div>
      </div>

      {/* Aviso de Geolocalização (se houver erro ou permissão negada) */}
      {geoNotice && (
        <div className="mt-3 p-2.5 rounded-[8px] bg-amber-50 border border-amber-200 flex items-center justify-between text-xs text-amber-800 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <Icon name="alert-triangle" size={15} className="text-amber-600 shrink-0" />
            <span>{geoNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setGeoNotice(null)}
            className="p-1 text-amber-700 hover:text-amber-900"
          >
            <Icon name="x" size={14} />
          </button>
        </div>
      )}

      {/* 2. BARRA DE BUSCA E FILTROS */}
      <div className="mt-4 space-y-3">
        {/* Campo de Busca Rápida */}
        <div className="relative">
          <div className="relative flex items-center">
            <span className="absolute left-3 text-slate-400 pointer-events-none">
              <Icon name="search" size={15} />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchDropdownOpen(true);
              }}
              onFocus={() => setSearchDropdownOpen(true)}
              placeholder="Buscar ocorrência, local ou número... (ex: OC-101, Lâmpada, Bloco A, Portaria)"
              className="w-full h-10 pl-9 pr-8 rounded-[10px] border border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#0055D4] focus:ring-1 focus:ring-[#0055D4] focus:outline-none transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSearchDropdownOpen(false);
                }}
                className="absolute right-2.5 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <Icon name="x" size={13} />
              </button>
            )}
          </div>

          {/* Dropdown de Sugestões de Busca */}
          {searchDropdownOpen && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-30 mt-1 rounded-[10px] border border-slate-200 bg-white shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-100">
              <div className="p-1.5 space-y-0.5 max-h-60 overflow-y-auto">
                {searchResults.map((occ) => {
                  const pTheme =
                    PRIORITY_THEME[(occ.severity || "baixa").toLowerCase()] || PRIORITY_THEME.baixa;
                  return (
                    <button
                      key={occ.id}
                      type="button"
                      onClick={() => handleSelectOccurrence(occ)}
                      className="w-full text-left p-2 rounded-[6px] hover:bg-slate-50 flex items-center justify-between gap-2.5 transition-colors cursor-pointer"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-[#0055D4]">
                            {occ.code}
                          </span>
                          <span className="text-xs font-semibold text-slate-900 truncate">
                            {occ.title}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {occ.exactLocation || occ.blockName || "Área comum"} ·{" "}
                          {CATEGORY_MAP[occ.category.toLowerCase()]?.label || occ.category}
                        </p>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${pTheme.badgeBg} ${pTheme.badgeText} border ${pTheme.badgeBorder} shrink-0`}
                      >
                        {pTheme.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Linha de Filtros: Status Tabs + Selects Categoria, Prioridade, Local */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 flex-wrap">
          {/* Status Tabs: Todas | Abertas | Em andamento | Resolvidas */}
          <div className="inline-flex rounded-[8px] border border-slate-200 bg-slate-50 p-0.5 text-xs font-semibold text-slate-600 overflow-x-auto max-w-full">
            {[
              { key: "todas" as StatusFilter, label: "Todas" },
              { key: "abertas" as StatusFilter, label: "Abertas" },
              { key: "em_andamento" as StatusFilter, label: "Em andamento" },
              { key: "resolvidas" as StatusFilter, label: "Resolvidas" },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key)}
                className={`rounded-[6px] px-3 py-1.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === tab.key
                    ? "bg-white text-[#0055D4] shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Selects: Categoria, Prioridade, Local */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Categoria */}
            <div className="relative">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="h-8.5 rounded-[8px] border border-slate-200 bg-white px-2.5 pr-7 text-xs font-semibold text-slate-700 hover:border-slate-300 focus:border-[#0055D4] focus:outline-none cursor-pointer appearance-none"
              >
                <option value="todas">Categoria: Todas</option>
                {Object.entries(CATEGORY_MAP).map(([key, info]) => (
                  <option key={key} value={key}>
                    {info.label}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-2 top-2.5 text-slate-400">
                <Icon name="chevron-down" size={12} />
              </span>
            </div>

            {/* Prioridade */}
            <div className="relative">
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="h-8.5 rounded-[8px] border border-slate-200 bg-white px-2.5 pr-7 text-xs font-semibold text-slate-700 hover:border-slate-300 focus:border-[#0055D4] focus:outline-none cursor-pointer appearance-none"
              >
                <option value="todas">Prioridade: Todas</option>
                <option value="alta">🔴 Alta / Urgente</option>
                <option value="media">🟡 Média</option>
                <option value="baixa">🔵 Baixa</option>
              </select>
              <span className="pointer-events-none absolute right-2 top-2.5 text-slate-400">
                <Icon name="chevron-down" size={12} />
              </span>
            </div>

            {/* Local */}
            <div className="relative">
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="h-8.5 rounded-[8px] border border-slate-200 bg-white px-2.5 pr-7 text-xs font-semibold text-slate-700 hover:border-slate-300 focus:border-[#0055D4] focus:outline-none cursor-pointer appearance-none"
              >
                <option value="todos">Local: Todos</option>
                <option value="Bloco A">Bloco A</option>
                <option value="Bloco B">Bloco B</option>
                <option value="Portaria">Portaria</option>
                <option value="Garagem">Garagem</option>
                <option value="Salão">Salão de Festas</option>
                <option value="Piscina">Piscina</option>
                {availableLocations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-2 top-2.5 text-slate-400">
                <Icon name="chevron-down" size={12} />
              </span>
            </div>

            {/* Limpar Filtros */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="h-8.5 px-2.5 rounded-[8px] text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Limpar todos os filtros"
              >
                Limpar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. MAPA CANVAS COM LEAFLET & POPUP OVERLAY */}
      <div className="relative mt-3.5 w-full rounded-[12px] overflow-hidden border border-slate-200 bg-slate-100">
        {/* Canvas do Mapa */}
        <div
          ref={mapContainerRef}
          className={`w-full z-0 transition-all ${
            isExpandedModal ? "h-[540px] sm:h-[600px]" : "h-[360px] sm:h-[420px] md:h-[460px]"
          }`}
        />

        {/* Fallback de Erro caso mapa não carregue */}
        {mapError && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
            <div className="h-12 w-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 mb-3">
              <Icon name="map-pin" size={24} />
            </div>
            <h4 className="text-sm font-bold text-slate-800">
              Não foi possível carregar o mapa interativo
            </h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              Verifique sua conexão com a internet ou tente recarregar a visualização.
            </p>
            <button
              type="button"
              onClick={() => {
                setMapError(false);
                setMapReady(false);
              }}
              className="mt-3 px-3.5 py-1.5 rounded-[8px] bg-[#0055D4] text-white text-xs font-bold shadow-xs hover:bg-[#0047B3] transition-colors cursor-pointer"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {/* Mini Instrução de Clique no Mapa (Discreta) */}
        <div className="pointer-events-none absolute top-3 right-3 z-10 hidden sm:flex items-center gap-1.5 rounded-[6px] bg-white/90 backdrop-blur-xs px-2.5 py-1 text-[11px] font-semibold text-slate-600 border border-slate-200/80 shadow-xs">
          <span>💡 Clique no mapa para registrar uma ocorrência no local</span>
        </div>

        {/* Floating Modal / Popover: Detalhes da Ocorrência Selecionada (Prompt 3) */}
        {selectedOccurrence && selectedPriorityTheme && selectedStatusMeta && (
          <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-sm z-20 rounded-[12px] border border-slate-200 bg-white p-4 shadow-xl animate-in slide-in-from-bottom-2 duration-150">
            {/* Header do Popover */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-extrabold text-[#0055D4]">
                  {selectedOccurrence.code}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-[4px] border ${selectedPriorityTheme.badgeBg} ${selectedPriorityTheme.badgeText} ${selectedPriorityTheme.badgeBorder}`}
                >
                  ● {selectedPriorityTheme.label}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-[4px] border ${selectedStatusMeta.badgeClass}`}
                >
                  {selectedStatusMeta.label}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOccurrence(null)}
                className="p-1 rounded-[4px] text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                aria-label="Fechar resumo da ocorrência"
              >
                <Icon name="x" size={14} />
              </button>
            </div>

            {/* Título & Detalhes */}
            <div className="mt-2.5 space-y-2">
              <h4 className="text-sm font-bold text-slate-900 leading-snug">
                {selectedOccurrence.title}
              </h4>

              <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50/80 p-2.5 rounded-[8px] border border-slate-100">
                <div>
                  <span className="text-slate-400 block font-medium">Local</span>
                  <span className="font-bold text-slate-800 truncate block">
                    {selectedOccurrence.exactLocation || selectedOccurrence.blockName || "Área comum"}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block font-medium">Categoria</span>
                  <span className="font-bold text-slate-800 truncate block">
                    {selectedCategoryMeta?.label || selectedOccurrence.category}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block font-medium">Aberta em</span>
                  <span className="font-bold text-slate-800 block">
                    {formatOccDate(selectedOccurrence.createdAt)}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block font-medium">Responsável</span>
                  <span className="font-bold text-slate-800 truncate block">
                    {selectedOccurrence.assignedToName || selectedOccurrence.reportedByName || "Equipe Predial"}
                  </span>
                </div>
              </div>

              {selectedOccurrence.description && (
                <p className="text-[11px] text-slate-600 line-clamp-2">
                  {selectedOccurrence.description}
                </p>
              )}
            </div>

            {/* Ações do Card */}
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
              <Link
                href={`/painel/ocorrencias?highlight=${selectedOccurrence.code}`}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-[8px] bg-[#0055D4] hover:bg-[#0047B3] active:bg-[#003B94] text-white py-2 px-3 text-xs font-bold transition-colors shadow-xs cursor-pointer text-center"
              >
                <span>Ver ocorrência</span>
                <Icon name="arrow-up-right" size={13} strokeWidth={2.4} />
              </Link>

              <button
                type="button"
                onClick={() => setSelectedOccurrence(null)}
                className="rounded-[8px] border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 py-2 px-3 text-xs font-semibold transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        )}

        {/* Floating Modal / Popover: Registrar Ocorrência neste Local (Prompt 12) */}
        {newLocationPrompt && (
          <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-xs z-20 rounded-[12px] border border-slate-200 bg-white p-4 shadow-xl animate-in slide-in-from-bottom-2 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#FFD000] text-[#12162A] text-xs">
                  📍
                </span>
                <h4 className="text-xs font-bold text-slate-900">Novo Ponto Marcado</h4>
              </div>
              <button
                type="button"
                onClick={handleDismissPlacement}
                className="p-1 rounded-[4px] text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <Icon name="x" size={14} />
              </button>
            </div>

            <p className="text-xs text-slate-600 mt-2 font-medium">
              Deseja registrar uma nova ocorrência ou vistoria vinculada a este ponto?
            </p>

            <div className="mt-2 text-[10px] font-mono text-slate-400 bg-slate-50 p-1.5 rounded border border-slate-100">
              Lat: {newLocationPrompt.lat} · Lng: {newLocationPrompt.lng}
            </div>

            <div className="mt-3 flex items-center gap-2">
              <Link
                href={`/painel/ocorrencias/nova?lat=${newLocationPrompt.lat}&lng=${newLocationPrompt.lng}&loc=${encodeURIComponent(
                  newLocationPrompt.locLabel
                )}`}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-[8px] bg-[#FFD000] hover:bg-[#FFE04D] text-[#12162A] py-2 px-3 text-xs font-bold transition-colors shadow-xs cursor-pointer"
              >
                <Icon name="plus" size={13} strokeWidth={2.4} />
                <span>Registrar ocorrência</span>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* 4. LEGENDA DISCRETA & INFORMAÇÃO OPERACIONAL (Prompt 7) */}
      <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600 flex-wrap">
        {/* Prioridades */}
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
          <span className="font-bold text-[11px] uppercase tracking-wider text-slate-400">
            Prioridade:
          </span>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#EF4444]" />
            <span className="text-[11px] font-medium text-slate-700">Alta</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#F59E0B]" />
            <span className="text-[11px] font-medium text-slate-700">Média</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#0055D4]" />
            <span className="text-[11px] font-medium text-slate-700">Baixa</span>
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
          <span className="font-bold text-[11px] uppercase tracking-wider text-slate-400">
            Status:
          </span>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            <span className="text-[11px] font-medium text-slate-700">Aberta</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#0055D4]" />
            <span className="text-[11px] font-medium text-slate-700">Em andamento</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-[11px] font-medium text-slate-700">Resolvida</span>
          </div>
        </div>
      </div>
    </div>
  );
}
