"use client";

import { useState } from "react";
import { Icon } from "@/components/icon";

export type LocationType = "unidade" | "area_comum" | "outro";

interface UserUnitInfo {
  unitId: number;
  unitNumber: string;
  blockName: string | null;
  condoName: string;
}

interface CondoBlock {
  id: number;
  name: string;
  floors: number;
}

interface CondoAmenity {
  id: number;
  name: string;
}

interface StepLocalizacaoProps {
  locationType: LocationType;
  onChangeLocationType: (type: LocationType) => void;
  locationString: string;
  onChangeLocationString: (val: string) => void;
  locationDetail: string;
  onChangeLocationDetail: (val: string) => void;
  userUnit: UserUnitInfo | null;
  blocks: CondoBlock[];
  amenities: CondoAmenity[];
  onBack: () => void;
  onNext: () => void;
}

const COMMON_AREAS_PRESETS = [
  "Hall de Entrada",
  "Portaria",
  "Elevador Social",
  "Elevador de Serviço",
  "Garagem / Subsolo",
  "Salão de Festas",
  "Churrasqueira",
  "Piscina",
  "Academia",
  "Corredor dos Apartamentos",
  "Escadarias",
  "Lixeira / Depósito",
  "Jardim / Área Externa",
  "Playground / Quadra",
];

export function StepLocalizacao({
  locationType,
  onChangeLocationType,
  locationString,
  onChangeLocationString,
  locationDetail,
  onChangeLocationDetail,
  userUnit,
  blocks,
  amenities,
  onBack,
  onNext,
}: StepLocalizacaoProps) {
  // Hierarchical helper state when area_comum is active
  const [selectedBlockId, setSelectedBlockId] = useState<number | null>(
    blocks.length > 0 ? blocks[0].id : null
  );
  const [selectedFloor, setSelectedFloor] = useState<string>("Térreo");
  const [selectedSubArea, setSelectedSubArea] = useState<string>("Corredor");

  const handleSelectUnit = () => {
    onChangeLocationType("unidade");
    if (userUnit) {
      const formatted = `${userUnit.blockName ? `${userUnit.blockName} • ` : ""}Unidade ${userUnit.unitNumber}`;
      onChangeLocationString(formatted);
    }
  };

  const handleSelectAreaPreset = (areaName: string) => {
    onChangeLocationType("area_comum");
    onChangeLocationString(areaName);
  };

  const handleApplyHierarchical = () => {
    const blockObj = blocks.find((b) => b.id === selectedBlockId);
    const blockName = blockObj ? blockObj.name : "Bloco Principal";
    const formatted = `${blockName} • ${selectedFloor} • ${selectedSubArea}`;
    onChangeLocationType("area_comum");
    onChangeLocationString(formatted);
  };

  const canProceed = locationString.trim().length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sm sm:text-base font-bold text-slate-900 mb-1">
          Onde aconteceu?
        </h2>
        <p className="text-xs text-slate-500">
          Escolha o tipo de ambiente para que a equipe saiba exatamente onde agir.
        </p>
      </div>

      {/* 3 Escolhas Rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Opção 1: Minha Unidade */}
        <button
          type="button"
          onClick={handleSelectUnit}
          className={`flex flex-col items-start p-4 rounded-xl border text-left transition-all ${
            locationType === "unidade"
              ? "border-[#0070F3] bg-blue-50/70 text-[#0055D4] shadow-xs ring-1 ring-[#0070F3]"
              : "border-slate-200 bg-white hover:bg-slate-50 text-slate-800"
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                locationType === "unidade"
                  ? "bg-[#0070F3] text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              <Icon name="home" size={17} />
            </span>
            <span className="text-xs font-bold">Minha unidade</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-tight">
            {userUnit
              ? `${userUnit.blockName ? `${userUnit.blockName} • ` : ""}Apto ${userUnit.unitNumber}`
              : "Seu apartamento cadastrado"}
          </p>
        </button>

        {/* Opção 2: Área Comum */}
        <button
          type="button"
          onClick={() => {
            onChangeLocationType("area_comum");
            if (!locationString || locationString.includes("Unidade")) {
              onChangeLocationString(COMMON_AREAS_PRESETS[0]);
            }
          }}
          className={`flex flex-col items-start p-4 rounded-xl border text-left transition-all ${
            locationType === "area_comum"
              ? "border-[#0070F3] bg-blue-50/70 text-[#0055D4] shadow-xs ring-1 ring-[#0070F3]"
              : "border-slate-200 bg-white hover:bg-slate-50 text-slate-800"
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                locationType === "area_comum"
                  ? "bg-[#0070F3] text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              <Icon name="building" size={17} />
            </span>
            <span className="text-xs font-bold">Área comum</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-tight">
            Corredores, elevadores, lazer ou portaria
          </p>
        </button>

        {/* Opção 3: Outro Local */}
        <button
          type="button"
          onClick={() => {
            onChangeLocationType("outro");
            if (locationType !== "outro") onChangeLocationString("");
          }}
          className={`flex flex-col items-start p-4 rounded-xl border text-left transition-all ${
            locationType === "outro"
              ? "border-[#0070F3] bg-blue-50/70 text-[#0055D4] shadow-xs ring-1 ring-[#0070F3]"
              : "border-slate-200 bg-white hover:bg-slate-50 text-slate-800"
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                locationType === "outro"
                  ? "bg-[#0070F3] text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              <Icon name="map-pin" size={17} />
            </span>
            <span className="text-xs font-bold">Outro local</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-tight">
            Calçada externa, rampa ou local específico
          </p>
        </button>
      </div>

      {/* Conteúdo Dinâmico por Tipo */}

      {/* Caso: Minha Unidade */}
      {locationType === "unidade" && (
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
          <div className="flex items-center gap-2">
            <Icon name="check-circle" size={16} className="text-[#0055D4]" />
            <span className="text-xs font-bold text-slate-900">
              Local selecionado: {locationString || `${userUnit?.blockName ? `${userUnit.blockName} • ` : ""}Unidade ${userUnit?.unitNumber || "Não vinculada"}`}
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            A equipe saberá que o problema está restrito ou tem origem na sua unidade.
          </p>
        </div>
      )}

      {/* Caso: Área Comum */}
      {locationType === "area_comum" && (
        <div className="space-y-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
          {/* Seletor hierárquico se houver blocos */}
          {blocks.length > 0 && (
            <div className="space-y-2.5 pb-3 border-b border-slate-200">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                Localização hierárquica por bloco
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {/* Bloco/Torre */}
                <div>
                  <label className="text-[11px] text-slate-500 font-medium block mb-1">
                    Torre / Bloco
                  </label>
                  <select
                    value={selectedBlockId || ""}
                    onChange={(e) => setSelectedBlockId(Number(e.target.value))}
                    className="w-full text-xs font-medium bg-white border border-slate-200 rounded-lg p-2 text-slate-800 outline-none focus:border-[#0070F3]"
                  >
                    {blocks.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Andar */}
                <div>
                  <label className="text-[11px] text-slate-500 font-medium block mb-1">
                    Andar / Nível
                  </label>
                  <select
                    value={selectedFloor}
                    onChange={(e) => setSelectedFloor(e.target.value)}
                    className="w-full text-xs font-medium bg-white border border-slate-200 rounded-lg p-2 text-slate-800 outline-none focus:border-[#0070F3]"
                  >
                    <option value="Subsolo 2">Subsolo 2</option>
                    <option value="Subsolo 1">Subsolo 1</option>
                    <option value="Térreo">Térreo</option>
                    <option value="1º andar">1º andar</option>
                    <option value="2º andar">2º andar</option>
                    <option value="3º andar">3º andar</option>
                    <option value="4º andar">4º andar</option>
                    <option value="5º andar">5º andar</option>
                    <option value="6º andar">6º andar</option>
                    <option value="Cobertura">Cobertura</option>
                  </select>
                </div>

                {/* Ponto específico */}
                <div>
                  <label className="text-[11px] text-slate-500 font-medium block mb-1">
                    Ambiente
                  </label>
                  <select
                    value={selectedSubArea}
                    onChange={(e) => setSelectedSubArea(e.target.value)}
                    className="w-full text-xs font-medium bg-white border border-slate-200 rounded-lg p-2 text-slate-800 outline-none focus:border-[#0070F3]"
                  >
                    <option value="Corredor">Corredor</option>
                    <option value="Hall de entrada">Hall de entrada</option>
                    <option value="Elevador Social">Elevador Social</option>
                    <option value="Elevador de Serviço">Elevador de Serviço</option>
                    <option value="Escada de emergência">Escada de emergência</option>
                    <option value="Garagem">Garagem</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleApplyHierarchical}
                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:border-[#0070F3] text-[#0055D4] text-xs font-bold transition-colors shadow-2xs"
                >
                  Aplicar esta localização
                </button>
              </div>
            </div>
          )}

          {/* Espaços Comuns e Lazer */}
          <div>
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-2">
              Ou selecione um espaço comum
            </span>
            <div className="flex flex-wrap gap-1.5">
              {/* Espaços cadastrados no condomínio */}
              {amenities.map((amenity) => {
                const isSelected = locationString === amenity.name;
                return (
                  <button
                    key={amenity.id}
                    type="button"
                    onClick={() => handleSelectAreaPreset(amenity.name)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      isSelected
                        ? "border-[#0070F3] bg-[#0070F3] text-white font-bold"
                        : "border-slate-200 bg-white hover:bg-slate-100 text-slate-700"
                    }`}
                  >
                    {amenity.name}
                  </button>
                );
              })}

              {/* Presets gerais */}
              {COMMON_AREAS_PRESETS.map((area) => {
                const isSelected = locationString === area;
                return (
                  <button
                    key={area}
                    type="button"
                    onClick={() => handleSelectAreaPreset(area)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      isSelected
                        ? "border-[#0070F3] bg-[#0070F3] text-white font-bold"
                        : "border-slate-200 bg-white hover:bg-slate-100 text-slate-700"
                    }`}
                  >
                    {area}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Caso: Outro Local */}
      {locationType === "outro" && (
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-800 block">
            Descreva o local
          </label>
          <input
            type="text"
            value={locationString}
            onChange={(e) => onChangeLocationString(e.target.value)}
            placeholder="Ex.: Rampa de acesso ao subsolo, calçada do portão de pedestres"
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 outline-none focus:border-[#0070F3] transition-colors"
          />
        </div>
      )}

      {/* Complemento Opcional */}
      <div>
        <label
          htmlFor="ocorrencia-loc-detalhe"
          className="block text-xs font-bold text-slate-800 mb-1"
        >
          Quer dar mais detalhes do local? <span className="font-normal text-slate-400">(opcional)</span>
        </label>
        <input
          id="ocorrencia-loc-detalhe"
          type="text"
          value={locationDetail}
          onChange={(e) => onChangeLocationDetail(e.target.value)}
          placeholder="Ex.: Em frente ao apto 34, próximo à lixeira ou à coluna 12."
          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 outline-none focus:border-[#0070F3] transition-colors shadow-2xs"
        />
      </div>

      {/* Resumo visual da localização */}
      {locationString && (
        <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200 flex items-center gap-2">
          <Icon name="map-pin" size={16} className="text-[#0055D4] shrink-0" />
          <p className="text-xs font-bold text-[#0055D4] truncate">
            {locationString}
            {locationDetail ? ` (${locationDetail})` : ""}
          </p>
        </div>
      )}

      {/* Ações de Navegação */}
      <div className="pt-4 flex items-center justify-between border-t border-slate-100">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs sm:text-sm font-bold hover:bg-slate-50 transition-colors"
        >
          <Icon name="arrow-left" size={15} />
          <span>Voltar</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          disabled={!canProceed}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0070F3] hover:bg-[#005FD6] text-white text-xs sm:text-sm font-bold shadow-xs transition-colors disabled:opacity-40 disabled:pointer-events-none"
        >
          <span>Revisar ocorrência</span>
          <Icon name="arrow-right" size={16} />
        </button>
      </div>
    </div>
  );
}
