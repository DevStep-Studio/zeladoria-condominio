"use client";

import { useState } from "react";
import { Icon } from "@/components/icon";

export interface ServiceLocation {
  type: "meu_condominio" | "outro_condominio" | "outro_endereco";
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
}

export function LocationModal({
  isOpen,
  currentLocation,
  availableCondos = [],
  onClose,
  onSave,
}: {
  isOpen: boolean;
  currentLocation: ServiceLocation;
  availableCondos?: { id: number; name: string; address: string; city: string; state: string }[];
  onClose: () => void;
  onSave: (loc: ServiceLocation) => void;
}) {
  const [selectedType, setSelectedType] = useState<ServiceLocation["type"]>(currentLocation.type || "meu_condominio");
  const [selectedCondoId, setSelectedCondoId] = useState<number | null>(null);
  const [unit, setUnit] = useState(currentLocation.unit || "Unidade 302");

  // Custom address fields
  const [cep, setCep] = useState(currentLocation.cep || "");
  const [street, setStreet] = useState(currentLocation.street || "");
  const [number, setNumber] = useState(currentLocation.number || "");
  const [complement, setComplement] = useState(currentLocation.complement || "");
  const [neighborhood, setNeighborhood] = useState(currentLocation.neighborhood || "");
  const [city, setCity] = useState(currentLocation.city || "Curitiba");
  const [state, setState] = useState(currentLocation.state || "PR");

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (selectedType === "meu_condominio") {
      onSave({
        type: "meu_condominio",
        name: currentLocation.name || "Residencial Parque das Águas",
        address: currentLocation.address || "Av. das Nações, 1200",
        unit,
        city: currentLocation.city || "Curitiba",
        state: currentLocation.state || "PR",
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
        });
      }
    } else {
      const fullAddress = [
        street ? `${street}, ${number || "s/n"}` : "",
        complement,
        neighborhood,
      ]
        .filter(Boolean)
        .join(" - ");

      onSave({
        type: "outro_endereco",
        name: street ? `${street}, ${number || ""}` : "Endereço Externo",
        address: fullAddress || "Endereço particular",
        cep,
        street,
        number,
        complement,
        neighborhood,
        city: city || "Curitiba",
        state: state || "PR",
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
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xl z-10 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-[#0055D4]">
              Local de Atendimento
            </span>
            <h3 className="text-base sm:text-lg font-black text-[#0F172A] tracking-tight">
              Para onde você precisa do serviço?
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Filtraremos profissionais que atendem este endereço específico.
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

        {/* Options Radios */}
        <div className="space-y-2.5">
          {/* Option 1: Meu Condomínio */}
          <div
            onClick={() => setSelectedType("meu_condominio")}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
              selectedType === "meu_condominio"
                ? "border-[#0055D4] bg-blue-50/50 shadow-2xs"
                : "border-slate-200 hover:border-slate-300 bg-white"
            }`}
          >
            <div className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
              selectedType === "meu_condominio"
                ? "border-[#0055D4] bg-[#0055D4]"
                : "border-slate-300 bg-white"
            }`}>
              {selectedType === "meu_condominio" && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <Icon name="building" size={14} className="text-[#0055D4] shrink-0" />
                <span className="text-xs font-bold text-[#0F172A]">
                  Meu Condomínio Atual
                </span>
                <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-blue-100 text-[#0055D4]">
                  Padrão
                </span>
              </div>
              <p className="text-xs font-medium text-slate-700 mt-1">
                {currentLocation.name || "Residencial Parque das Águas"}
              </p>
              <p className="text-[11px] text-slate-400">
                {currentLocation.address || "Av. das Nações, 1200"} · {currentLocation.city || "Curitiba"} - {currentLocation.state || "PR"}
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
                    className="w-full h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:border-[#0055D4]"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Option 2: Outro Condomínio Vinculado */}
          {availableCondos.length > 0 && (
            <div
              onClick={() => setSelectedType("outro_condominio")}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                selectedType === "outro_condominio"
                  ? "border-[#0055D4] bg-blue-50/50 shadow-2xs"
                  : "border-slate-200 hover:border-slate-300 bg-white"
              }`}
            >
              <div className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                selectedType === "outro_condominio"
                  ? "border-[#0055D4] bg-[#0055D4]"
                  : "border-slate-300 bg-white"
              }`}>
                {selectedType === "outro_condominio" && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
              </div>

              <div className="flex-1 min-w-0">
                <span className="text-xs font-bold text-[#0F172A] block">
                  Outro Condomínio Vinculado
                </span>
                <p className="text-[11px] text-slate-400">
                  Caso você possua outra unidade ou gerencie múltiplos condomínios.
                </p>

                {selectedType === "outro_condominio" && (
                  <div className="mt-2.5 space-y-2">
                    <select
                      value={selectedCondoId || availableCondos[0]?.id}
                      onChange={(e) => setSelectedCondoId(Number(e.target.value))}
                      className="w-full h-8 px-2 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:border-[#0055D4]"
                    >
                      {availableCondos.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} — {c.address}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Option 3: Outro Endereço */}
          <div
            onClick={() => setSelectedType("outro_endereco")}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
              selectedType === "outro_endereco"
                ? "border-[#0055D4] bg-blue-50/50 shadow-2xs"
                : "border-slate-200 hover:border-slate-300 bg-white"
            }`}
          >
            <div className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
              selectedType === "outro_endereco"
                ? "border-[#0055D4] bg-[#0055D4]"
                : "border-slate-300 bg-white"
            }`}>
              {selectedType === "outro_endereco" && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
            </div>

            <div className="flex-1 min-w-0">
              <span className="text-xs font-bold text-[#0F172A] block">
                Outro Endereço (Residência ou Comercial)
              </span>
              <p className="text-[11px] text-slate-400">
                Para serviços particulares fora da área condominial.
              </p>

              {selectedType === "outro_endereco" && (
                <div className="mt-3 pt-2 border-t border-blue-100/60 space-y-2.5 text-xs">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">CEP</label>
                      <input
                        type="text"
                        value={cep}
                        onChange={(e) => setCep(e.target.value)}
                        placeholder="80000-000"
                        className="w-full h-8 px-2 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:border-[#0055D4]"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Rua / Logradouro</label>
                      <input
                        type="text"
                        value={street}
                        onChange={(e) => setStreet(e.target.value)}
                        placeholder="Nome da rua ou avenida"
                        className="w-full h-8 px-2 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:border-[#0055D4]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Número</label>
                      <input
                        type="text"
                        value={number}
                        onChange={(e) => setNumber(e.target.value)}
                        placeholder="123"
                        className="w-full h-8 px-2 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:border-[#0055D4]"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Complemento</label>
                      <input
                        type="text"
                        value={complement}
                        onChange={(e) => setComplement(e.target.value)}
                        placeholder="Apto, Casa 2, Sala"
                        className="w-full h-8 px-2 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:border-[#0055D4]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Bairro</label>
                      <input
                        type="text"
                        value={neighborhood}
                        onChange={(e) => setNeighborhood(e.target.value)}
                        placeholder="Bairro"
                        className="w-full h-8 px-2 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:border-[#0055D4]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Cidade / UF</label>
                      <div className="flex gap-1">
                        <input
                          type="text"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="Cidade"
                          className="w-full h-8 px-2 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:border-[#0055D4]"
                        />
                        <input
                          type="text"
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          placeholder="UF"
                          className="w-12 h-8 px-1.5 text-center uppercase rounded-lg border border-slate-200 bg-white text-xs outline-none focus:border-[#0055D4]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Privacy Note */}
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500">
          <Icon name="shield" size={14} className="text-[#0055D4] shrink-0" />
          <span>
            <strong>Privacidade garantida:</strong> Durante a busca, prestadores visualizam apenas a região. Sua unidade e telefone só são liberados após você confirmar a contratação.
          </span>
        </div>

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
            className="px-5 py-2 rounded-xl bg-[#0055D4] hover:bg-[#0047BA] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            Confirmar Local
          </button>
        </div>
      </div>
    </div>
  );
}
