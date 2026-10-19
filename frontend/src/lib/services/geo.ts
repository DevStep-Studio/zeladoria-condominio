/**
 * Módulo de utilitários geoespaciais e cálculo de proximidade real.
 * Utiliza a fórmula de Haversine para aferição de distância entre condomínio e prestador.
 */

export function calculateHaversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export function formatDistanceText(distanceKm: number | null | undefined): string {
  if (distanceKm == null || isNaN(distanceKm)) {
    return "Atende seu condomínio";
  }
  return `${distanceKm.toFixed(1).replace(".", ",")} km`;
}
