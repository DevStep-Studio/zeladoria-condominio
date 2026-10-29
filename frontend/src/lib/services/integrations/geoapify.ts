/**
 * Integração Oficial Geoapify Location Platform
 * Documentação: https://apidocs.geoapify.com/
 * 
 * Plano Gratuito: 3.000 créditos / dia.
 * Recursos:
 * - Geocodificação direta (Endereço -> Coordenadas Lat/Lng)
 * - Geocodificação reversa (Coordenadas Lat/Lng -> Endereço)
 * - Cache em memória com TTL de 24 horas para economia rigorosa de cotas
 * - Tratamento de Rate Limiting (429) e timeout com fallback elegante
 * - Atribuição obrigatória às fontes cartográficas
 */

import { canMakeApiCall, recordApiUsage } from "./usage-tracker";

export const GEOAPIFY_ATTRIBUTION = "© OpenStreetMap contributors, Powered by Geoapify";

export interface GeoapifyAddressResult {
  formatted: string;
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
  lat: number;
  lng: number;
  confidence: number; // 0 a 1
  resultType?: string;
}

interface CacheItem<T> {
  data: T;
  expiresAt: number;
}

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 horas
const memoryCache = new Map<string, CacheItem<any>>();

function getFromCache<T>(key: string): T | null {
  const item = memoryCache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  return item.data;
}

function setInCache<T>(key: string, data: T): void {
  // Limita o tamanho do cache a 500 entradas para evitar vazamento de memória
  if (memoryCache.size > 500) {
    const firstKey = memoryCache.keys().next().value;
    if (firstKey) memoryCache.delete(firstKey);
  }
  memoryCache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

export function getGeoapifyApiKey(): string {
  return (
    process.env.GEOAPIFY_API_KEY ||
    process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY ||
    ""
  );
}

/**
 * Consulta a API Geoapify para converter um texto de endereço em coordenadas e detalhes normalizados.
 */
export async function geocodeAddress(
  query: string,
  options?: { countryCode?: string; limit?: number }
): Promise<GeoapifyAddressResult[]> {
  const cleanQuery = query.trim();
  if (cleanQuery.length < 3) return [];

  const cacheKey = `geo_${cleanQuery.toLowerCase()}_${options?.countryCode || "br"}`;
  const cached = getFromCache<GeoapifyAddressResult[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const { allowed, reason } = canMakeApiCall("geoapify");
  if (!allowed) {
    console.warn(`[Geoapify] Chamada bloqueada pelo controlador de cotas: ${reason}`);
    return [];
  }

  const apiKey = getGeoapifyApiKey();
  const startTime = Date.now();
  const limit = options?.limit || 5;
  const countryFilter = options?.countryCode ? `&filter=countrycode:${options.countryCode}` : "&filter=countrycode:br";

  const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(
    cleanQuery
  )}${countryFilter}&limit=${limit}&lang=pt&apiKey=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(4500),
    });

    const durationMs = Date.now() - startTime;

    if (!response.ok) {
      recordApiUsage({
        service: "geoapify",
        action: "geocodeAddress",
        success: false,
        statusCode: response.status,
        durationMs,
        message: `HTTP ${response.status}: ${response.statusText}`,
      });
      return [];
    }

    const data = await response.json();
    const features = data?.features || [];

    const results: GeoapifyAddressResult[] = features.map((f: any) => {
      const props = f.properties || {};
      return {
        formatted: props.formatted || cleanQuery,
        street: props.street || props.address_line1,
        number: props.housenumber,
        neighborhood: props.suburb || props.district,
        city: props.city || props.county,
        state: props.state_code || props.state,
        postcode: props.postcode,
        country: props.country || "Brasil",
        lat: Number(props.lat || f.geometry?.coordinates?.[1]),
        lng: Number(props.lon || f.geometry?.coordinates?.[0]),
        confidence: Number(props.rank?.confidence ?? 0.8),
        resultType: props.result_type,
      };
    });

    recordApiUsage({
      service: "geoapify",
      action: "geocodeAddress",
      success: true,
      statusCode: 200,
      durationMs,
      creditsConsumed: 1,
      message: `Encontrados ${results.length} resultados para "${cleanQuery.slice(0, 30)}"`,
    });

    if (results.length > 0) {
      setInCache(cacheKey, results);
    }

    return results;
  } catch (error: any) {
    const durationMs = Date.now() - startTime;
    recordApiUsage({
      service: "geoapify",
      action: "geocodeAddress",
      success: false,
      durationMs,
      message: error?.message || "Erro de conexão ou timeout",
    });
    return [];
  }
}

/**
 * Geocodificação Reversa: Converte latitude e longitude em um endereço legível.
 */
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<GeoapifyAddressResult | null> {
  const roundedLat = Math.round(lat * 10000) / 10000;
  const roundedLng = Math.round(lng * 10000) / 10000;
  const cacheKey = `rev_${roundedLat}_${roundedLng}`;

  const cached = getFromCache<GeoapifyAddressResult>(cacheKey);
  if (cached) return cached;

  const { allowed } = canMakeApiCall("geoapify");
  if (!allowed) return null;

  const apiKey = getGeoapifyApiKey();
  const startTime = Date.now();
  const url = `https://api.geoapify.com/v1/geocode/reverse?lat=${roundedLat}&lon=${roundedLng}&lang=pt&apiKey=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(4000),
    });

    const durationMs = Date.now() - startTime;

    if (!response.ok) {
      recordApiUsage({
        service: "geoapify",
        action: "reverseGeocode",
        success: false,
        statusCode: response.status,
        durationMs,
      });
      return null;
    }

    const data = await response.json();
    const feature = data?.features?.[0];
    if (!feature) return null;

    const props = feature.properties || {};
    const result: GeoapifyAddressResult = {
      formatted: props.formatted || `${roundedLat}, ${roundedLng}`,
      street: props.street,
      number: props.housenumber,
      neighborhood: props.suburb || props.district,
      city: props.city || props.county,
      state: props.state_code || props.state,
      postcode: props.postcode,
      country: props.country || "Brasil",
      lat: Number(props.lat || roundedLat),
      lng: Number(props.lon || roundedLng),
      confidence: Number(props.rank?.confidence ?? 0.8),
      resultType: props.result_type,
    };

    recordApiUsage({
      service: "geoapify",
      action: "reverseGeocode",
      success: true,
      statusCode: 200,
      durationMs,
      creditsConsumed: 1,
      message: `Reverso concluído: ${result.formatted.slice(0, 35)}`,
    });

    setInCache(cacheKey, result);
    return result;
  } catch (error: any) {
    const durationMs = Date.now() - startTime;
    recordApiUsage({
      service: "geoapify",
      action: "reverseGeocode",
      success: false,
      durationMs,
      message: error?.message,
    });
    return null;
  }
}
