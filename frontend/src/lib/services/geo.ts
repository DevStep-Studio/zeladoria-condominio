/**
 * Módulo de Utilitários Geoespaciais (Equivalente PostGIS / MySQL Spatial)
 * 
 * Implementa cálculos de distâncias esféricas (Haversine / ST_Distance_Sphere),
 * validação de raios de cobertura em metros e filtragem espacial de prestadores.
 * 
 * Regra Principal: O raio pertence ao prestador! O morador só visualiza
 * o profissional caso seu endereço esteja contido dentro do raio configurado pelo prestador.
 */

import { recordApiUsage } from "./integrations/usage-tracker";

export const STANDARD_RADIUS_PRESETS_METERS = [
  1000,    // 1 km
  3000,    // 3 km
  5000,    // 5 km
  10000,   // 10 km
  20000,   // 20 km
  30000,   // 30 km
  50000,   // 50 km
  100000,  // 100 km
] as const;

/**
 * Calcula a distância esférica em metros entre dois pontos geográficos (lat/lng)
 * Equivalente de cálculo a ST_Distance_Sphere(POINT(lon, lat), POINT(lon, lat)) do PostGIS/MySQL Spatial.
 * NOTA: A ordem matemática no PostGIS é ST_MakePoint(longitude, latitude).
 */
export function calculateHaversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Raio da Terra em metros
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceMeters = Math.round(R * c);

  return distanceMeters;
}

/**
 * Calcula a distância em quilômetros com uma casa decimal.
 */
export function calculateHaversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const meters = calculateHaversineMeters(lat1, lon1, lat2, lon2);
  return Math.round((meters / 1000) * 10) / 10;
}

/**
 * Verifica se um endereço alvo está dentro da área de cobertura do prestador.
 * Regra do Marketplace: Se a distância for menor ou igual ao raio, retorna true.
 */
export function isWithinCoverageRadius(params: {
  providerLat: number | null | undefined;
  providerLng: number | null | undefined;
  providerRadiusMeters: number | null | undefined;
  targetLat: number | null | undefined;
  targetLng: number | null | undefined;
}): { within: boolean; distanceMeters: number | null } {
  const { providerLat, providerLng, providerRadiusMeters = 15000, targetLat, targetLng } = params;

  if (
    providerLat == null ||
    providerLng == null ||
    targetLat == null ||
    targetLng == null ||
    isNaN(providerLat) ||
    isNaN(providerLng) ||
    isNaN(targetLat) ||
    isNaN(targetLng)
  ) {
    // Se faltarem coordenadas, mantém acessível como fallback sem bloquear
    return { within: true, distanceMeters: null };
  }

  const radius = providerRadiusMeters && providerRadiusMeters > 0 ? providerRadiusMeters : 15000;
  const distanceMeters = calculateHaversineMeters(providerLat, providerLng, targetLat, targetLng);

  return {
    within: distanceMeters <= radius,
    distanceMeters,
  };
}

/**
 * Formata a distância de forma amigável para exibição nos cards de profissionais
 */
export function formatDistanceText(distanceKm: number | null | undefined): string {
  if (distanceKm == null || isNaN(distanceKm)) {
    return "Atende seu condomínio";
  }
  return `${distanceKm.toFixed(1).replace(".", ",")} km`;
}

/**
 * Formata raio em metros para exibição textual (ex: 5.000 m ou 5 km)
 */
export function formatRadiusLabel(meters: number): string {
  if (meters >= 1000) {
    const km = meters / 1000;
    return `${km} km (${meters.toLocaleString("pt-BR")} m)`;
  }
  return `${meters.toLocaleString("pt-BR")} metros`;
}
