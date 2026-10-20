"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/icon";
import { lookupCep } from "@/lib/services/cep";

export interface ServiceLocation {
  type: "meu_condominio" | "outro_condominio" | "outro_endereco" | "gps" | "mapa";
  name: string;
  address: string;
  unit?: string;
  city: string;
  state: string;
  cep?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  lat?: number;
  lng?: number;
}

const PRESET_CITIES = [
  { label: "São Paulo (SP)", name: "São Paulo - Capital", city: "São Paulo", state: "SP", lat: -23.5505, lng: -46.6333 },
  { label: "Curitiba (PR)", name: "Curitiba e Região", city: "Curitiba", state: "PR", lat: -25.4284, lng: -49.2733 },
  { label: "Campinas (SP)", name: "Campinas", city: "Campinas", state: "SP", lat: -22.9099, lng: -47.0626 },
  { label: "Rio de Janeiro (RJ)", name: "Rio de Janeiro", city: "Rio de Janeiro", state: "RJ", lat: -22.9068, lng: -43.1729 },
  { label: "Belo Horizonte (MG)", name: "Belo Horizonte", city: "Belo Horizonte", state: "MG", lat: -19.9167, lng: -43.9345 },
  { label: "Brasília (DF)", name: "Brasília", city: "Brasília", state: "DF", lat: -15.7975, lng: -47.8919 },
];

export function LocationModal({
  isOpen,
  currentLocation,
  availableCondos = [],
  onClose,
  onSave,
  onPickOnMap,
}: {
  isOpen: boolean;
  currentLocation: ServiceLocation;
  availableCondos?: { id: number; name: string; address: string; city: string; state: string; lat?: number; lng?: number }[];
  onClose: () => void;
  onSave: (loc: ServiceLocation) => void;
  onPickOnMap?: () => void;
}) {
  const [selectedType, setSelectedType] = useState<ServiceLocation["type"]>(currentLocation.type || "meu_condominio");
  const [selectedCondoId, setSelectedCondoId] = useState<number | null>(
    availableCondos[0]?.id ?? null
  );
  const [unit, setUnit] = useState(currentLocation.unit || "Unidade 302");

  // Custom address fields
  const [cep, setCep] = useState(currentLocation.cep || "");
  const [street, setStreet] = useState(currentLocation.street || "");
  const [number, setNumber] = useState(currentLocation.number || "");
  const [complement, setComplement] = useState(currentLocation.complement || "");
  const [neighborhood, setNeighborhood] = useState(currentLocation.neighborhood || "");
  const [city, setCity] = useState(currentLocation.city || "São Paulo");
  const [state, setState] = useState(currentLocation.state || "SP");
  const [customCoords, setCustomCoords] = useState<{ lat?: number; lng?: number }>({
    lat: currentLocation.lat,
    lng: currentLocation.lng,
  });

  const [isCepSearching, setIsCepSearching] = useState(false);
  const [cepMessage, setCepMessage] = useState<string | null>(null);
  const [isGpsLoading, setIsGpsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Busca de CEP automática
  const handleCepChange = async (val: string) => {
    const raw = val.replace(/\D/g, "").slice(0, 8);
    const formatted = raw.length > 5 ? `${raw.slice(0, 5)}-${raw.slice(5)}` : raw;
    setCep(formatted);

    if (raw.length === 8) {
      setIsCepSearching(true);
      setCepMessage("Buscando endereço e coordenadas...");
      try {
        const res = await lookupCep(raw);
        if (res) {
          if (res.street) setStreet(res.street);
          if (res.neighborhood) setNeighborhood(res.neighborhood);
          if (res.city) setCity(res.city);
          if (res.state) setState(res.state);
          setCustomCoords({ lat: res.lat, lng: res.lng });
          setCepMessage(`✓ Localizado: ${res.neighborhood || res.city} (${res.state})`);
        } else {
          setCepMessage("CEP não encontrado. Preencha os campos abaixo.");
        }
      } catch {
        setCepMessage("Erro na consulta do CEP.");
      } finally {
        setIsCepSearching(false);
      }
    } else {
      setCepMessage(null);
    }
  };

  // Geolocalização via GPS do Navegador
  const handleUseGps = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      alert("Geolocalização não suportada pelo navegador.");
      return;
    }

    setIsGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsGpsLoading(false);
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));

        onSave({
          type: "gps",
          name: "Minha Localização Atual (GPS)",
          address: `Lat: ${lat}, Lng: ${lng}`,
          city: "Localização Atual",
          state: "GPS",
          lat,
          lng,
        });
        onClose();
      },
      () => {
        setIsGpsLoading(false);
        alert("Não foi possível obter sua localização. Permita o acesso ao GPS nas configurações do navegador.");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Seleção rápida de cidade
  const handleSelectPresetCity = (c: typeof PRESET_CITIES[0]) => {
    setSelectedType("outro_endereco");
    setCity(c.city);
    setState(c.state);
    setStreet("");
    setNumber("");
    setNeighborhood("");
    setCustomCoords({ lat: c.lat, lng: c.lng });
    setCepMessage(`✓ Região selecionada: ${c.name}`);
  };

  const handleConfirm = () => {
    if (selectedType === "meu_condominio") {
      const condoDefault = availableCondos[0];
      onSave({
        type: "meu_condominio",
        name: currentLocation.name || condoDefault?.name || "Residencial Parque das Águas",
        address: currentLocation.address || condoDefault?.address || "Av. das Nações, 1200",
        unit,
        city: currentLocation.city || condoDefault?.city || "Curitiba",
        state: currentLocation.state || condoDefault?.state || "PR",
        lat: condoDefault?.lat ?? currentLocation.lat ?? -25.432,
        lng: condoDefault?.lng ?? currentLocation.lng ?? -49.278,
      });
    } else if (selectedType === "outro_condominio") {
      const condo = availableCondos.find((c) => c.id === selectedCondoId) || availableCondos[0];
      if (condo) {
        onSave({
          type: "outro_condominio",
          name: condo.name,
          address: condo.address,
          unit,
          city: condo.city,
          state: condo.state,
          lat: condo.lat ?? -23.5615,
          lng: condo.lng ?? -46.6559,
        });
      }
    } else {
      const fullAddress = [
        street ? `${street}, ${number || "s/n"}` : "",
        complement,
        neighborhood,
        `${city} - ${state}`,
      ]
        .filter(Boolean)
        .join(" - ");

      onSave({
        type: "outro_endereco",
        name: street ? `${street}, ${number || ""}` : `Região de ${city} (${state})`,
        address: fullAddress || `Endereço em ${city} - ${state}`,
        cep,
        street,
        number,
        complement,
        neighborhood,
        city: city || "São Paulo",
        state: state || "SP",
        lat: customCoords.lat ?? -23.5505,
        lng: customCoords.lng ?? -46.6333,
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xl z-10 space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-[#1355FF]">
              Localização do Serviço
            </span>
            <h3 className="text-base sm:text-lg font-black text-[#0F172A] tracking-tight">
              Onde você precisa de atendimento?
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Filtraremos profissionais credenciados que atendem este local.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <Icon name="x" size={16} />
          </button>
        </div>

        {/* Quick GPS Button */}
        <button
          type="button"
          onClick={handleUseGps}
          disabled={isGpsLoading}
          className="w-full flex items-center justify-between p-3 rounded-2xl bg-blue-50/70 hover:bg-blue-100/70 border border-blue-200 text-[#1355FF] transition-colors cursor-pointer text-left"
        >
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-[#1355FF] text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Icon name="map-pin" size={15} />
            </div>
            <div>
              <span className="text-xs font-black block text-[#0F172A]">
                {isGpsLoading ? "Obtendo sinal GPS..." : "Usar minha localização atual (GPS)"}
              </span>
              <span className="text-[11px] text-slate-500">
                Calibrar pelo sensor de localização do seu aparelho
              </span>
            </div>
          </div>
          <Icon name="chevron-right" size={14} className="text-[#1355FF] shrink-0" />
        </button>

        {/* Cidades Rápidas */}
        <div>
          <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
            Cidades Rápidas:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_CITIES.map((c) => (
              <button
                key={c.label}
                type="button"
                onClick={() => handleSelectPresetCity(c)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                  city.toLowerCase() === c.city.toLowerCase()
                    ? "bg-[#1355FF] text-white border-[#1355FF]"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Opções Principais */}
        <div className="space-y-2.5">
          {/* Opção 1: Meu Condomínio Atual */}
          <div
            onClick={() => setSelectedType("meu_condominio")}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
              selectedType === "meu_condominio"
                ? "border-[#1355FF] bg-blue-50/40 shadow-2xs"
                : "border-slate-200 hover:border-slate-300 bg-white"
            }`}
          >
            <div className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
              selectedType === "meu_condominio"
                ? "border-[#1355FF] bg-[#1355FF]"
                : "border-slate-300 bg-white"
            }`}>
              {selectedType === "meu_condominio" && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <Icon name="building" size={14} className="text-[#1355FF] shrink-0" />
                <span className="text-xs font-bold text-[#0F172A]">
                  Meu Condomínio Atual
                </span>
                <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-blue-100 text-[#1355FF]">
                  Padrão
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-700 mt-1">
                {currentLocation.name || availableCondos[0]?.name || "Residencial Parque das Águas"}
              </p>
              <p className="text-[11px] text-slate-400">
                {currentLocation.address || availableCondos[0]?.address || "Av. das Nações, 1200"} · {currentLocation.city || availableCondos[0]?.city || "Curitiba"} - {currentLocation.state || availableCondos[0]?.state || "PR"}
              </p>

              {selectedType === "meu_condominio" && (
                <div className="mt-2.5 pt-2 border-t border-blue-100/60">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Sua Unidade / Apartamento:
                  </label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="Ex: Apto 302, Bloco B"
                    className="w-full h-8 px-2.5 rounded-xl border border-slate-200 bg-white text-xs outline-none focus:border-[#1355FF]"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Opção 2: Outro Condomínio Vinculado */}
          {availableCondos.length > 1 && (
            <div
              onClick={() => setSelectedType("outro_condominio")}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                selectedType === "outro_condominio"
                  ? "border-[#1355FF] bg-blue-50/40 shadow-2xs"
                : "border-slate-200 hover:border-slate-300 bg-white"
              }`}
            >
              <div className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                selectedType === "outro_condominio"
                  ? "border-[#1355FF] bg-[#1355FF]"
                  : "border-slate-300 bg-white"
              }`}>
                {selectedType === "outro_condominio" && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
              </div>

              <div className="flex-1 min-w-0">
                <span className="text-xs font-bold text-[#0F172A] block">
                  Outro Condomínio Vinculado
                </span>
                <p className="text-[11px] text-slate-400">
                  Selecione outro condomínio gerenciado ou onde possui unidade.
                </p>

                {selectedType === "outro_condominio" && (
                  <div className="mt-2.5 space-y-2">
                    <select
                      value={selectedCondoId || availableCondos[0]?.id}
                      onChange={(e) => setSelectedCondoId(Number(e.target.value))}
                      className="w-full h-8 px-2 rounded-xl border border-slate-200 bg-white text-xs outline-none focus:border-[#1355FF]"
                    >
                      {availableCondos.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} — {c.city}/{c.state}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Opção 3: Outro Endereço / CEP */}
          <div
            onClick={() => setSelectedType("outro_endereco")}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
              selectedType === "outro_endereco"
                ? "border-[#1355FF] bg-blue-50/40 shadow-2xs"
                : "border-slate-200 hover:border-slate-300 bg-white"
            }`}
          >
            <div className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
              selectedType === "outro_endereco"
                ? "border-[#1355FF] bg-[#1355FF]"
                : "border-slate-300 bg-white"
            }`}>
              {selectedType === "outro_endereco" && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
            </div>

            <div className="flex-1 min-w-0">
              <span className="text-xs font-bold text-[#0F172A] block">
                Outro Endereço (Residência, Loja ou Casa)
              </span>
              <p className="text-[11px] text-slate-400">
                Digite o CEP ou rua para atendimento fora da área condominial.
              </p>

              {selectedType === "outro_endereco" && (
                <div className="mt-3 pt-2.5 border-t border-blue-100/60 space-y-2.5 text-xs">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">
                        CEP {isCepSearching && <span className="text-[#1355FF]">...</span>}
                      </label>
                      <input
                        type="text"
                        value={cep}
                        onChange={(e) => handleCepChange(e.target.value)}
                        placeholder="01000-000"
                        className="w-full h-8 px-2 rounded-xl border border-slate-200 bg-white text-xs outline-none focus:border-[#1355FF]"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Rua / Logradouro</label>
                      <input
                        type="text"
                        value={street}
                        onChange={(e) => setStreet(e.target.value)}
                        placeholder="Nome da rua ou avenida"
                        className="w-full h-8 px-2 rounded-xl border border-slate-200 bg-white text-xs outline-none focus:border-[#1355FF]"
                      />
                    </div>
                  </div>

                  {cepMessage && (
                    <p className={`text-[11px] font-bold ${cepMessage.startsWith("✓") ? "text-emerald-600" : "text-amber-600"}`}>
                      {cepMessage}
                    </p>
                  )}

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Número</label>
                      <input
                        type="text"
                        value={number}
                        onChange={(e) => setNumber(e.target.value)}
                        placeholder="123"
                        className="w-full h-8 px-2 rounded-xl border border-slate-200 bg-white text-xs outline-none focus:border-[#1355FF]"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Complemento / Bairro</label>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={complement}
                          onChange={(e) => setComplement(e.target.value)}
                          placeholder="Apto/Casa"
                          className="w-1/2 h-8 px-2 rounded-xl border border-slate-200 bg-white text-xs outline-none focus:border-[#1355FF]"
                        />
                        <input
                          type="text"
                          value={neighborhood}
                          onChange={(e) => setNeighborhood(e.target.value)}
                          placeholder="Bairro"
                          className="w-1/2 h-8 px-2 rounded-xl border border-slate-200 bg-white text-xs outline-none focus:border-[#1355FF]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Cidade</label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Cidade"
                        className="w-full h-8 px-2 rounded-xl border border-slate-200 bg-white text-xs outline-none focus:border-[#1355FF]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">UF</label>
                      <input
                        type="text"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        placeholder="SP"
                        className="w-full h-8 px-2 text-center uppercase rounded-xl border border-slate-200 bg-white text-xs outline-none focus:border-[#1355FF]"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Escolher direto no Mapa Button */}
        {onPickOnMap && (
          <button
            type="button"
            onClick={() => {
              onPickOnMap();
              onClose();
            }}
            className="w-full py-2.5 rounded-xl border border-dashed border-[#1355FF]/40 text-[#1355FF] bg-blue-50/30 hover:bg-blue-50/70 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Icon name="map-pin" size={13} />
            <span>Ou clique no mapa para escolher o ponto exato</span>
          </button>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-5 py-2 rounded-xl bg-[#1355FF] hover:bg-[#0D47E6] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            Confirmar Local
          </button>
        </div>
      </div>
    </div>
  );
}
