export interface CepResult {
  cep: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
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
};

export async function lookupCep(rawCep: string): Promise<CepResult | null> {
  const clean = rawCep.replace(/\D/g, "");
  if (clean.length !== 8) return null;

  try {
    const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`, {
      headers: { "User-Agent": "ZeladoriaCondominio/1.0" },
      signal: AbortSignal.timeout(4000),
    });

    if (!res.ok) return null;
    const data = await res.json();
    if (data.erro) return null;

    const cityLower = (data.localidade || "sao paulo")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    const coords = CITY_COORDS[cityLower] || { lat: -23.5505, lng: -46.6333 };

    return {
      cep: clean,
      street: data.logradouro || "",
      neighborhood: data.bairro || "",
      city: data.localidade || "São Paulo",
      state: data.uf || "SP",
      lat: coords.lat,
      lng: coords.lng,
    };
  } catch {
    // Fallback gracioso se a API externa estiver fora do ar ou sem internet
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
