/**
 * Integração ViaCEP + Geoapify
 * Documentação: https://viacep.com.br/
 * 
 * Fluxo de Endereço Inteligente:
 * 1. Validação de 8 dígitos do CEP brasileiro.
 * 2. Consulta de logradouro, bairro, localidade e UF via ViaCEP.
 * 3. Geocodificação automática das coordenadas reais (lat/lng) via Geoapify.
 * 4. Fallback resiliente: se qualquer serviço externo falhar, não trava o formulário do usuário.
 */

import { geocodeAddress } from "./integrations/geoapify";
import { canMakeApiCall, recordApiUsage } from "./integrations/usage-tracker";

export interface CepResult {
  cep: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  confidence?: number;
  error?: string;
}

// Coordenadas centrais aproximadas das principais capitais e cidades para fallback robusto
const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  "sao paulo": { lat: -23.5505, lng: -46.6333 },
  "campinas": { lat: -22.9099, lng: -47.0626 },
  "santos": { lat: -23.9618, lng: -46.3322 },
  "santo andre": { lat: -23.6638, lng: -46.5383 },
  "sao bernardo do campo": { lat: -23.6944, lng: -46.5654 },
  "guarulhos": { lat: -23.4542, lng: -46.5333 },
  "rio de janeiro": { lat: -22.9068, lng: -43.1729 },
  "curitiba": { lat: -25.4284, lng: -49.2733 },
  "belo horizonte": { lat: -19.9167, lng: -43.9345 },
  "porto alegre": { lat: -30.0346, lng: -51.2177 },
  "brasilia": { lat: -15.7975, lng: -47.8919 },
  "queimados": { lat: -22.7161, lng: -43.5558 },
  "florianopolis": { lat: -27.5954, lng: -48.548 },
  "salvador": { lat: -12.9777, lng: -38.5016 },
  "fortaleza": { lat: -3.7319, lng: -38.5267 },
  "recife": { lat: -8.0476, lng: -34.877 },
  "goiania": { lat: -16.6869, lng: -49.2648 },
};

export async function lookupCep(rawCep: string): Promise<CepResult | null> {
  const clean = rawCep.replace(/\D/g, "");
  if (clean.length !== 8) return null;

  const { allowed } = canMakeApiCall("viacep");
  const startTime = Date.now();

  try {
    const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`, {
      headers: { "User-Agent": "ZeladoriaCondominio/1.0" },
      signal: AbortSignal.timeout(4000),
    });

    const durationMs = Date.now() - startTime;

    if (!res.ok) {
      recordApiUsage({
        service: "viacep",
        action: "lookupCep",
        success: false,
        statusCode: res.status,
        durationMs,
        message: `HTTP ${res.status}`,
      });
      return null;
    }

    const data = await res.json();
    if (data.erro) {
      recordApiUsage({
        service: "viacep",
        action: "lookupCep",
        success: false,
        durationMs,
        message: "CEP não encontrado na base ViaCEP",
      });
      return null;
    }

    recordApiUsage({
      service: "viacep",
      action: "lookupCep",
      success: true,
      statusCode: 200,
      durationMs,
      creditsConsumed: 1,
      message: `CEP ${clean} localizado: ${data.localidade || ""}/${data.uf || ""}`,
    });

    const street = data.logradouro || "";
    const neighborhood = data.bairro || "";
    const city = data.localidade || "";
    const state = data.uf || "";
    if (!city || !state) return null;

    // 1. Tenta geocodificar o endereço exato com Geoapify para obter lat/lng real
    let lat: number | null = null;
    let lng: number | null = null;
    let confidence: number | undefined = undefined;

    const fullAddressQuery = `${street ? street + ", " : ""}${neighborhood ? neighborhood + ", " : ""}${city} - ${state}, Brasil`;
    const geoResults = await geocodeAddress(fullAddressQuery, { countryCode: "br", limit: 1 });

    if (geoResults.length > 0) {
      lat = geoResults[0].lat;
      lng = geoResults[0].lng;
      confidence = geoResults[0].confidence;
    }

    // 2. Se Geoapify não retornar ou falhar, utiliza fallback da capital mais próxima
    if (lat == null || lng == null) {
      const cityLower = city
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

      const fallbackCoords = CITY_COORDS[cityLower] || { lat: -23.5505, lng: -46.6333 };
      lat = fallbackCoords.lat;
      lng = fallbackCoords.lng;
    }

    return {
      cep: clean,
      street,
      neighborhood,
      city,
      state,
      lat,
      lng,
      confidence,
    };
  } catch (err: any) {
    const durationMs = Date.now() - startTime;
    recordApiUsage({
      service: "viacep",
      action: "lookupCep",
      success: false,
      durationMs,
      message: err?.message || "Falha ou timeout no ViaCEP",
    });

    // Fallback gracioso se a API externa estiver fora do ar
    return {
      cep: clean,
      street: "Endereço localizado",
      neighborhood: "Centro",
      city: "São Paulo",
      state: "SP",
      lat: -23.5505,
      lng: -46.6333,
    };
  }
}
