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
  { label: "Curitiba (PR)", name: "Curitiba e Região", city: "Curitiba", state: "PR", lat: -25.4284, lng: -49.2733 },
  { label: "São Paulo (SP)", name: "São Paulo - Capital", city: "São Paulo", state: "SP", lat: -23.5505, lng: -46.6333 },
  { label: "Campinas (SP)", name: "Campinas", city: "Campinas", state: "SP", lat: -22.9099, lng: -47.0626 },
  { label: "Rio de Janeiro (RJ)", name: "Rio de Janeiro", city: "Rio de Janeiro", state: "RJ", lat: -22.9068, lng: -43.1729 },
  { label: "Belo Horizonte (MG)", name: "Belo Horizonte", city: "Belo Horizonte", state: "MG", lat: -19.9167, lng: -43.9345 },
  { label: "Brasília (DF)", name: "Brasília", city: "Brasília", state: "DF", lat: -15.7975, lng: -47.8919 },
  { label: "Florianópolis (SC)", name: "Florianópolis", city: "Florianópolis", state: "SC", lat: -27.5954, lng: -48.548 },
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
  const [city, setCity] = useState(currentLocation.city || "Curitiba");
  const [state, setState] = useState(currentLocation.state || "PR");
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
      setCepMessage("Localizando endereço...");
      try {
        const res = await lookupCep(raw);
        if (res) {
          if (res.street) setStreet(res.street);
          if (res.neighborhood) setNeighborhood(res.neighborhood);
          if (res.city) setCity(res.city);
          if (res.state) setState(res.state);
          setCustomCoords({ lat: res.lat, lng: res.lng });
          setCepMessage(`✓ ${res.neighborhood || res.city} (${res.state})`);
        } else {
          setCepMessage("CEP não localizado. Preencha manualmente abaixo.");
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
          name: "Minha Localização Atual",
          address: `Coordenadas: ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
          city: "Localização Atual",
          state: "GPS",
          lat,
          lng,
        });
        onClose();
      },
      () => {
        setIsGpsLoading(false);
        alert("Não foi possível obter sua localização. Permita o acesso ao GPS nas configurações do seu navegador.");
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
    setCepMessage(`✓ Cidade selecionada: ${c.name}`);
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
        city: city || "Curitiba",
        state: state || "PR",
        lat: customCoords.lat ?? -25.4284,
        lng: customCoords.lng ?? -49.2733,
      });
    }
    onClose();
  };

  const condoDefault = availableCondos[0];
  const condoName = currentLocation.name || condoDefault?.name || "Residencial Parque das Águas";
  const condoAddress = currentLocation.address || condoDefault?.address || "Av. das Nações, 1200";
  const condoCity = currentLocation.city || condoDefault?.city || "Curitiba";
  const condoState = currentLocation.state || condoDefault?.state || "PR";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl z-10 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Cabeçalho */}
        <div className="p-5 sm:p-6 pb-4 border-b border-slate-100 flex items-start justify-between gap-3">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#FB6B01]">
              Localização do Serviço
            </span>
            <h3 className="text-base sm:text-lg font-bold text-[#0F172A] leading-snug">
              Onde você precisa de atendimento?
            </h3>
            <p className="text-xs text-slate-500 font-normal">
              Mostraremos profissionais que atendem exatamente o local informado.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
            aria-label="Fechar"
          >
            <Icon name="x" size={16} />
          </button>
        </div>

        {/* Corpo do Modal com Scroll */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Atalhos Rápidos: GPS e Mapa (Design limpo em 2 colunas) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={handleUseGps}
              disabled={isGpsLoading}
              className="flex items-center gap-3 p-3 rounded-xl border border-slate-200/90 bg-slate-50/70 hover:bg-orange-50/60 hover:border-orange-200 text-slate-700 hover:text-[#FB6B01] transition-all cursor-pointer group text-left shadow-2xs"
            >
              <div className="h-8.5 w-8.5 rounded-lg bg-white border border-slate-200 group-hover:border-orange-300 text-slate-500 group-hover:text-[#FB6B01] flex items-center justify-center shrink-0 transition-colors shadow-2xs">
                <Icon name="navigation" size={15} />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold block text-slate-800 group-hover:text-[#FB6B01]">
                  {isGpsLoading ? "Buscando GPS..." : "Localização GPS"}
                </span>
                <span className="text-[10px] text-slate-400 block truncate">Sensor do seu aparelho</span>
              </div>
            </button>

            {onPickOnMap && (
              <button
                type="button"
                onClick={() => {
                  onPickOnMap();
                  onClose();
                }}
                className="flex items-center gap-3 p-3 rounded-xl border border-slate-200/90 bg-slate-50/70 hover:bg-orange-50/60 hover:border-orange-200 text-slate-700 hover:text-[#FB6B01] transition-all cursor-pointer group text-left shadow-2xs"
              >
                <div className="h-8.5 w-8.5 rounded-lg bg-white border border-slate-200 group-hover:border-orange-300 text-slate-500 group-hover:text-[#FB6B01] flex items-center justify-center shrink-0 transition-colors shadow-2xs">
                  <Icon name="map-pin" size={15} />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold block text-slate-800 group-hover:text-[#FB6B01]">
                    Escolher no Mapa
                  </span>
                  <span className="text-[10px] text-slate-400 block truncate">Apontar ponto no mapa</span>
                </div>
              </button>
            )}
          </div>

          {/* Opções Principais de Endereço */}
          <div className="space-y-3 pt-1">
            {/* Opção 1: Meu Condomínio Atual (Destaque limpo) */}
            <div
              onClick={() => setSelectedType("meu_condominio")}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                selectedType === "meu_condominio"
                  ? "border-[#FB6B01] bg-orange-50/20 ring-1 ring-[#FB6B01]/30 shadow-2xs"
                  : "border-slate-200 hover:border-slate-300 bg-white"
              }`}
            >
              {/* Radio Button Customizado */}
              <div
                className={`mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                  selectedType === "meu_condominio"
                    ? "border-[#FB6B01] bg-[#FB6B01]"
                    : "border-slate-300 bg-white"
                }`}
              >
                {selectedType === "meu_condominio" && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">
                    Meu condomínio
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-orange-100 text-[#FB6B01]">
                    Atual
                  </span>
                </div>

                <p className="text-xs font-bold text-slate-800 mt-1">
                  {condoName}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {condoAddress} · {condoCity} - {condoState}
                </p>

                {selectedType === "meu_condominio" && (
                  <div className="mt-3 pt-3 border-t border-orange-100/70 space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700">
                      Sua unidade / apartamento:
                    </label>
                    <input
                      type="text"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      placeholder="Ex: Apto 302, Bloco B"
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-900 outline-none focus:border-[#FB6B01] focus:ring-1 focus:ring-orange-500/20 transition-all"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Opção 2: Outro Condomínio Vinculado (Se houver mais de 1) */}
            {availableCondos.length > 1 && (
              <div
                onClick={() => setSelectedType("outro_condominio")}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                  selectedType === "outro_condominio"
                    ? "border-[#FB6B01] bg-orange-50/20 ring-1 ring-[#FB6B01]/30 shadow-2xs"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <div
                  className={`mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                    selectedType === "outro_condominio"
                      ? "border-[#FB6B01] bg-[#FB6B01]"
                      : "border-slate-300 bg-white"
                  }`}
                >
                  {selectedType === "outro_condominio" && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                </div>

                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold text-slate-900 block">
                    Outro condomínio vinculado
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Selecione outro condomínio onde você possui unidade ou gerencia.
                  </p>

                  {selectedType === "outro_condominio" && (
                    <div className="mt-3 space-y-2">
                      <select
                        value={selectedCondoId || availableCondos[0]?.id}
                        onChange={(e) => setSelectedCondoId(Number(e.target.value))}
                        className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-900 outline-none focus:border-[#FB6B01]"
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

            {/* Opção 3: Outro Endereço / Fora do Condomínio */}
            <div
              onClick={() => setSelectedType("outro_endereco")}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                selectedType === "outro_endereco"
                  ? "border-[#FB6B01] bg-orange-50/20 ring-1 ring-[#FB6B01]/30 shadow-2xs"
                  : "border-slate-200 hover:border-slate-300 bg-white"
              }`}
            >
              <div
                className={`mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                  selectedType === "outro_endereco"
                    ? "border-[#FB6B01] bg-[#FB6B01]"
                    : "border-slate-300 bg-white"
                }`}
              >
                {selectedType === "outro_endereco" && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
              </div>

              <div className="flex-1 min-w-0">
                <span className="text-xs font-bold text-slate-900 block">
                  Outro endereço (Casa, Loja ou Escritório)
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Informe o CEP ou rua para atendimento fora da área do condomínio.
                </p>

                {selectedType === "outro_endereco" && (
                  <div className="mt-3 pt-3 border-t border-orange-100/70 space-y-3 text-xs">
                    {/* Atalhos discretos de cidades */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Cidades com atendimento:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {PRESET_CITIES.map((c) => (
                          <button
                            key={c.label}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectPresetCity(c);
                            }}
                            className={`px-2.5 py-1 rounded-md text-[10px] font-bold border transition-colors cursor-pointer ${
                              city.toLowerCase() === c.city.toLowerCase()
                                ? "bg-[#FB6B01] text-white border-[#FB6B01]"
                                : "bg-white hover:bg-slate-50 text-slate-600 border-slate-200"
                            }`}
                          >
                            {c.city} ({c.state})
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Formulário de CEP e Rua */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                          CEP {isCepSearching && <span className="text-[#FB6B01]">...</span>}
                        </label>
                        <input
                          type="text"
                          value={cep}
                          onChange={(e) => handleCepChange(e.target.value)}
                          placeholder="00000-000"
                          className="w-full h-8.5 px-2.5 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:border-[#FB6B01]"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Rua / Logradouro</label>
                        <input
                          type="text"
                          value={street}
                          onChange={(e) => setStreet(e.target.value)}
                          placeholder="Nome da rua ou avenida"
                          className="w-full h-8.5 px-2.5 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:border-[#FB6B01]"
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
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Número</label>
                        <input
                          type="text"
                          value={number}
                          onChange={(e) => setNumber(e.target.value)}
                          placeholder="123"
                          className="w-full h-8.5 px-2.5 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:border-[#FB6B01]"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Complemento / Bairro</label>
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            value={complement}
                            onChange={(e) => setComplement(e.target.value)}
                            placeholder="Apto/Casa"
                            className="w-1/2 h-8.5 px-2.5 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:border-[#FB6B01]"
                          />
                          <input
                            type="text"
                            value={neighborhood}
                            onChange={(e) => setNeighborhood(e.target.value)}
                            placeholder="Bairro"
                            className="w-1/2 h-8.5 px-2.5 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:border-[#FB6B01]"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2">
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Cidade</label>
                        <input
                          type="text"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="Cidade"
                          className="w-full h-8.5 px-2.5 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:border-[#FB6B01]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">UF</label>
                        <input
                          type="text"
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          placeholder="PR"
                          className="w-full h-8.5 px-2 text-center uppercase rounded-lg border border-slate-200 bg-white text-xs outline-none focus:border-[#FB6B01]"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé com Ações */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-5 py-2 rounded-xl bg-[#FB6B01] hover:bg-[#E05F00] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            Confirmar Local
          </button>
        </div>
      </div>
    </div>
  );
}
