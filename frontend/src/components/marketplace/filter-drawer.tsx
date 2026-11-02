"use client";

import { useEffect } from "react";
import { Icon } from "@/components/icon";
import {
  getCategorySubcategories,
  categoryIcon,
  type CategoryOption,
} from "@/lib/services/providers-data";

export interface ExtendedFilterState {
  category: string;
  subcategory?: string;
  minRating: number;
  verifiedOnly: boolean;
  maxPrice: number;
  availableNowOnly: boolean;
  condoHiredOnly: boolean;
  maxDistanceKm?: number;
}

export function FilterDrawer({
  isOpen,
  filters,
  categories,
  totalResultsCount,
  onClose,
  onChange,
  onReset,
}: {
  isOpen: boolean;
  filters: ExtendedFilterState;
  categories: CategoryOption[];
  totalResultsCount: number;
  onClose: () => void;
  onChange: (updated: Partial<ExtendedFilterState>) => void;
  onReset: () => void;
}) {
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

  const currentSubcategories =
    filters.category && filters.category !== "Todas"
      ? getCategorySubcategories(filters.category)
      : [];

  const selectedCatOption = categories.find((c) => c.id === filters.category);
  const categoryDisplayName = selectedCatOption?.name || filters.category;

  // Contador de filtros ativos
  const activeCount =
    (filters.category && filters.category !== "Todas" ? 1 : 0) +
    (filters.subcategory ? 1 : 0) +
    (filters.minRating > 0 ? 1 : 0) +
    (filters.verifiedOnly ? 1 : 0) +
    (filters.availableNowOnly ? 1 : 0) +
    (filters.condoHiredOnly ? 1 : 0) +
    (filters.maxPrice < 50000 ? 1 : 0) +
    (filters.maxDistanceKm ? 1 : 0);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        {/* Drawer container: Bottom Sheet no mobile (<sm), Gaveta lateral no Desktop (>=sm) */}
        <div className="w-screen max-w-md bg-white border-l border-slate-200/90 shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-[#FB6B01] border border-orange-100 shadow-2xs">
                <Icon name="filter" size={16} />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-[#0F172A]">Filtros de Busca</h3>
                  {activeCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-orange-100 text-[#FB6B01] text-[10px] font-black">
                      {activeCount}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Refine os prestadores da sua região
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {activeCount > 0 && (
                <button
                  type="button"
                  onClick={onReset}
                  className="text-xs font-bold text-slate-500 hover:text-[#FB6B01] px-2.5 py-1 rounded-lg hover:bg-orange-50/70 transition-colors cursor-pointer mr-1"
                >
                  Limpar tudo
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Fechar"
                aria-label="Fechar gaveta de filtros"
              >
                <Icon name="x" size={16} />
              </button>
            </div>
          </div>

          {/* Scrollable Filters Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 text-xs">
            {/* Disponibilidade Imediata */}
            <div className="space-y-2">
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400">
                Disponibilidade
              </label>
              <div
                onClick={() => onChange({ availableNowOnly: !filters.availableNowOnly })}
                className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                  filters.availableNowOnly
                    ? "border-emerald-400 bg-emerald-50/70 shadow-2xs ring-1 ring-emerald-400/20"
                    : "border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`flex h-8 w-8 items-center justify-center rounded-xl shrink-0 ${
                    filters.availableNowOnly ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400"
                  }`}>
                    <Icon name="clock" size={15} />
                  </span>
                  <div>
                    <span className="font-bold text-xs text-[#0F172A] block leading-snug">
                      Disponível agora / Atende hoje
                    </span>
                    <span className="text-[11px] text-slate-500 font-normal">
                      Apenas profissionais com agenda aberta hoje
                    </span>
                  </div>
                </div>
                <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                  filters.availableNowOnly ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300 bg-white"
                }`}>
                  {filters.availableNowOnly && <Icon name="check" size={11} strokeWidth={3} />}
                </div>
              </div>
            </div>

            {/* Categoria Principal - Grid 2 colunas organizado */}
            <div className="space-y-2 pt-1 border-t border-slate-100">
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400">
                Categoria Principal
              </label>
              <div className="grid grid-cols-2 gap-2">
                {categories.map((cat) => {
                  const isSelected = filters.category === cat.id;
                  const iconName = cat.icon || categoryIcon(cat.id);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => onChange({ category: cat.id, subcategory: undefined })}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? "border-[#FB6B01] bg-orange-50 text-[#FB6B01] font-bold shadow-2xs ring-1 ring-[#FB6B01]/30"
                          : "border-slate-200/90 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <span className={`flex h-7 w-7 items-center justify-center rounded-lg shrink-0 transition-colors ${
                        isSelected ? "bg-[#FB6B01] text-white" : "bg-slate-100 text-slate-500"
                      }`}>
                        <Icon name={iconName} size={13} />
                      </span>
                      <span className="text-xs truncate font-medium flex-1">
                        {cat.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Subcategorias quando categoria selecionada */}
            {currentSubcategories.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400">
                    Especialidades de {categoryDisplayName}
                  </label>
                  {filters.subcategory && (
                    <button
                      type="button"
                      onClick={() => onChange({ subcategory: undefined })}
                      className="text-[11px] font-bold text-[#FB6B01] hover:underline cursor-pointer"
                    >
                      Ver todas
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {currentSubcategories.map((sub) => {
                    const isSelected = filters.subcategory === sub;
                    return (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => onChange({ subcategory: isSelected ? undefined : sub })}
                        className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer border ${
                          isSelected
                            ? "bg-[#FB6B01] text-white border-[#FB6B01] shadow-2xs font-bold"
                            : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200/80"
                        }`}
                      >
                        {sub}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Avaliação Mínima dos Moradores */}
            <div className="space-y-2 pt-1 border-t border-slate-100">
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400">
                Avaliação Mínima dos Moradores
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { val: 0, label: "Todas", sub: "Qualquer nota" },
                  { val: 4.5, label: "4.5+ ★", sub: "Muito bom" },
                  { val: 4.8, label: "4.8+ ★", sub: "Excelente" },
                ].map((item) => (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => onChange({ minRating: item.val })}
                    className={`py-2 px-1.5 rounded-xl border text-center transition-all cursor-pointer ${
                      filters.minRating === item.val
                        ? "border-[#FB6B01] bg-orange-50 text-[#FB6B01] font-black shadow-2xs ring-1 ring-[#FB6B01]/20"
                        : "border-slate-200/90 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span className="text-xs font-bold block">{item.label}</span>
                    <span className={`text-[10px] block mt-0.5 ${
                      filters.minRating === item.val ? "text-[#FB6B01]/90 font-bold" : "text-slate-400 font-medium"
                    }`}>
                      {item.sub}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Preço Inicial Máximo */}
            <div className="space-y-2.5 pt-1 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400">
                  Preço Inicial Máximo
                </label>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-orange-50 border border-orange-200 text-xs font-bold text-[#FB6B01]">
                  {filters.maxPrice >= 50000 ? "Sem limite" : `Até R$ ${(filters.maxPrice / 100).toFixed(0)}`}
                </span>
              </div>
              <input
                type="range"
                min={4000}
                max={50000}
                step={2000}
                value={filters.maxPrice}
                onChange={(e) => onChange({ maxPrice: Number(e.target.value) })}
                className="w-full accent-[#FB6B01] cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400 font-medium px-0.5">
                <span>R$ 40</span>
                <span>R$ 200</span>
                <span>Sem limite</span>
              </div>

              {/* Presets Rápidos */}
              <div className="grid grid-cols-4 gap-1.5 pt-0.5">
                {[
                  { val: 8000, label: "Até R$ 80" },
                  { val: 15000, label: "Até R$ 150" },
                  { val: 25000, label: "Até R$ 250" },
                  { val: 50000, label: "Qualquer" },
                ].map((preset) => (
                  <button
                    key={preset.val}
                    type="button"
                    onClick={() => onChange({ maxPrice: preset.val })}
                    className={`py-1.5 px-1 rounded-lg border text-[11px] font-medium text-center transition-all cursor-pointer ${
                      filters.maxPrice === preset.val
                        ? "border-[#FB6B01] bg-orange-50 text-[#FB6B01] font-bold"
                        : "border-slate-200/80 bg-slate-50/70 hover:bg-slate-100 text-slate-600"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Raio de Proximidade */}
            <div className="space-y-2 pt-1 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400">
                  Raio de Proximidade
                </label>
                {filters.maxDistanceKm && (
                  <span className="text-xs font-bold text-[#FB6B01]">
                    Até {filters.maxDistanceKm} km
                  </span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { val: undefined, label: "Qualquer" },
                  { val: 5, label: "5 km" },
                  { val: 10, label: "10 km" },
                  { val: 20, label: "20 km" },
                  { val: 50, label: "50 km" },
                  { val: 100, label: "100 km" },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => onChange({ maxDistanceKm: item.val })}
                    className={`py-2 px-1 rounded-xl border text-center font-bold transition-all cursor-pointer text-xs ${
                      filters.maxDistanceKm === item.val
                        ? "border-[#FB6B01] bg-orange-50 text-[#FB6B01] font-bold shadow-2xs ring-1 ring-[#FB6B01]/20"
                        : "border-slate-200/90 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Critérios de Confiança */}
            <div className="space-y-2 pt-1 border-t border-slate-100">
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400">
                Critérios de Confiança
              </label>
              <div className="space-y-2">
                <div
                  onClick={() => onChange({ verifiedOnly: !filters.verifiedOnly })}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                    filters.verifiedOnly
                      ? "border-[#FB6B01] bg-orange-50/60 shadow-2xs ring-1 ring-[#FB6B01]/20"
                      : "border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-50 text-[#FB6B01] shrink-0">
                      <Icon name="check-circle" size={15} />
                    </span>
                    <div>
                      <span className="font-bold text-xs text-[#0F172A] block leading-snug">
                        Profissional Verificado
                      </span>
                      <span className="text-[11px] text-slate-500 font-normal">
                        Documentação e antecedentes validados
                      </span>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                    filters.verifiedOnly ? "bg-[#FB6B01] border-[#FB6B01] text-white" : "border-slate-300 bg-white"
                  }`}>
                    {filters.verifiedOnly && <Icon name="check" size={11} strokeWidth={3} />}
                  </div>
                </div>

                <div
                  onClick={() => onChange({ condoHiredOnly: !filters.condoHiredOnly })}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                    filters.condoHiredOnly
                      ? "border-blue-400 bg-blue-50/60 shadow-2xs ring-1 ring-blue-400/20"
                      : "border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-[#1355FF] shrink-0">
                      <Icon name="shield" size={15} />
                    </span>
                    <div>
                      <span className="font-bold text-xs text-[#0F172A] block leading-snug">
                        Já atendeu no condomínio
                      </span>
                      <span className="text-[11px] text-slate-500 font-normal">
                        Histórico de serviços no seu condomínio
                      </span>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                    filters.condoHiredOnly ? "bg-[#1355FF] border-[#1355FF] text-white" : "border-slate-300 bg-white"
                  }`}>
                    {filters.condoHiredOnly && <Icon name="check" size={11} strokeWidth={3} />}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar Actions */}
          <div className="p-4 border-t border-slate-100 bg-white flex items-center gap-2.5">
            <button
              type="button"
              onClick={onReset}
              className="flex-1 rounded-xl border border-slate-200/90 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer text-center"
            >
              Limpar Filtros
            </button>
            <button
              type="button"
              onClick={onClose}
              className={`flex-[2] rounded-xl py-3 text-xs font-bold transition-all cursor-pointer text-center shadow-2xs ${
                totalResultsCount > 0
                  ? "bg-[#FB6B01] hover:bg-[#E05F00] text-white"
                  : "bg-slate-200 text-slate-600 hover:bg-slate-300"
              }`}
            >
              Ver {totalResultsCount} {totalResultsCount === 1 ? "profissional" : "profissionais"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
