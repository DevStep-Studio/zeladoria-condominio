"use client";

import { Icon } from "@/components/icon";
import {
  getCategorySubcategories,
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
  if (!isOpen) return null;

  const currentSubcategories =
    filters.category && filters.category !== "Todas"
      ? getCategorySubcategories(filters.category)
      : [];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        {/* Drawer container: Bottom Sheet on mobile (<sm), Right Drawer on Desktop (>=sm) */}
        <div className="w-screen max-w-md bg-white border-l border-slate-200 shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-[#0055D4]">
                <Icon name="filter" size={16} />
              </span>
              <div>
                <h3 className="text-base font-black text-[#0F172A]">Filtros de Busca</h3>
                <p className="text-xs text-slate-400">Refine os prestadores da sua região</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onReset}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Limpar
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <Icon name="x" size={16} />
              </button>
            </div>
          </div>

          {/* Scrollable Filters Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs">
            {/* Disponibilidade Imediata */}
            <div className="space-y-2">
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400">
                Disponibilidade
              </label>
              <label
                onClick={() => onChange({ availableNowOnly: !filters.availableNowOnly })}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                  filters.availableNowOnly
                    ? "border-emerald-500 bg-emerald-50/50 shadow-2xs"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`h-2.5 w-2.5 rounded-full ${filters.availableNowOnly ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`} />
                  <div>
                    <span className="font-bold text-[#0F172A] block">Disponível agora / Atende hoje</span>
                    <span className="text-[11px] text-slate-500">Apenas profissionais com agenda aberta hoje</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={filters.availableNowOnly}
                  onChange={(e) => onChange({ availableNowOnly: e.target.checked })}
                  className="rounded h-4 w-4 text-[#0055D4] focus:ring-[#0055D4]"
                />
              </label>
            </div>

            {/* Categoria */}
            <div className="space-y-2">
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400">
                Categoria Principal
              </label>
              <div className="flex flex-wrap gap-1.5">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => onChange({ category: cat.id, subcategory: undefined })}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                      filters.category === cat.id
                        ? "bg-[#0055D4] text-white shadow-xs"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Subcategorias quando categoria selecionada */}
            {currentSubcategories.length > 0 && (
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400">
                  Subcategorias de {filters.category}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {currentSubcategories.map((sub) => {
                    const isSelected = filters.subcategory === sub;
                    return (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => onChange({ subcategory: isSelected ? undefined : sub })}
                        className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer border ${
                          isSelected
                            ? "bg-[#0055D4] text-white border-[#0055D4]"
                            : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        {sub}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Avaliação Mínima */}
            <div className="space-y-2 pt-1 border-t border-slate-100">
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400">
                Avaliação Mínima dos Moradores
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { val: 0, label: "Todas" },
                  { val: 4.5, label: "4.5+ ★" },
                  { val: 4.8, label: "4.8+ ★ (Excelência)" },
                ].map((item) => (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => onChange({ minRating: item.val })}
                    className={`py-2 px-2 rounded-xl border text-center font-bold transition-all cursor-pointer text-xs ${
                      filters.minRating === item.val
                        ? "border-[#0055D4] bg-blue-50 text-[#0055D4] font-black shadow-2xs"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Faixa de Preço Máximo */}
            <div className="space-y-2 pt-1 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400">
                  Preço Inicial Máximo
                </label>
                <span className="font-black text-[#0055D4]">
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
                className="w-full accent-[#0055D4] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                <span>R$ 40</span>
                <span>R$ 200</span>
                <span>Sem limite</span>
              </div>
            </div>

            {/* Distância Máxima */}
            <div className="space-y-2 pt-1 border-t border-slate-100">
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400">
                Raio de Proximidade
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { val: undefined, label: "Qualquer" },
                  { val: 3, label: "3 km" },
                  { val: 5, label: "5 km" },
                  { val: 10, label: "10 km" },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => onChange({ maxDistanceKm: item.val })}
                    className={`py-2 px-1 rounded-xl border text-center font-bold transition-all cursor-pointer text-xs ${
                      filters.maxDistanceKm === item.val
                        ? "border-[#0055D4] bg-blue-50 text-[#0055D4] font-black"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
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
                <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Icon name="check-circle" size={15} className="text-[#0055D4]" />
                    <div>
                      <span className="font-bold text-slate-800 block">Profissional Verificado</span>
                      <span className="text-[11px] text-slate-400">Documentação e antecedentes validados</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={filters.verifiedOnly}
                    onChange={(e) => onChange({ verifiedOnly: e.target.checked })}
                    className="rounded h-4 w-4 text-[#0055D4] focus:ring-[#0055D4]"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Icon name="shield" size={15} className="text-emerald-600" />
                    <div>
                      <span className="font-bold text-slate-800 block">Já atendeu no condomínio</span>
                      <span className="text-[11px] text-slate-400">Histórico de serviços no seu condomínio</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={filters.condoHiredOnly}
                    onChange={(e) => onChange({ condoHiredOnly: e.target.checked })}
                    className="rounded h-4 w-4 text-[#0055D4] focus:ring-[#0055D4]"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Bottom Bar Actions */}
          <div className="p-4 border-t border-slate-100 bg-white flex items-center gap-3">
            <button
              type="button"
              onClick={onReset}
              className="flex-1 rounded-xl border border-slate-200 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer text-center"
            >
              Limpar Filtros
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-[2] rounded-xl bg-[#0055D4] hover:bg-[#0047BA] text-white py-3 text-xs font-bold transition-colors cursor-pointer text-center shadow-xs"
            >
              Ver {totalResultsCount} profissional{totalResultsCount === 1 ? "" : "is"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
