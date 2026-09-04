"use client";

import { Icon } from "@/components/icon";
import { CATEGORIES_CONFIG } from "@/lib/services/providers-data";

export interface FilterState {
  category: string;
  minRating: number;
  availableTodayOnly: boolean;
  fastResponseOnly: boolean;
  verifiedOnly: boolean;
  maxPrice: number;
}

export function FilterBottomSheet({
  isOpen,
  filters,
  totalResultsCount,
  onClose,
  onChange,
  onReset,
}: {
  isOpen: boolean;
  filters: FilterState;
  totalResultsCount: number;
  onClose: () => void;
  onChange: (updated: Partial<FilterState>) => void;
  onReset: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden
      />

      {/* Bottom Sheet Modal */}
      <div className="relative w-full max-w-lg max-h-[85vh] rounded-t-3xl border-t border-slate-200 bg-white p-5 sm:p-6 shadow-2xl z-10 flex flex-col space-y-4 animate-in slide-in-from-bottom duration-200">
        {/* Handle */}
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto -mt-1 shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Icon name="filter" size={16} className="text-[#0055D4]" />
            <h3 className="text-base font-bold text-[#0F172A]">Filtros de Busca</h3>
          </div>
          <button
            type="button"
            onClick={onReset}
            className="text-xs font-bold text-slate-500 hover:text-slate-800"
          >
            Limpar todos
          </button>
        </div>

        {/* Scrollable Filters Body */}
        <div className="overflow-y-auto space-y-5 flex-1 pr-1 text-xs">
          {/* Categoria */}
          <div>
            <label className="block font-bold text-[#0F172A] mb-2 uppercase text-[10px] tracking-wider text-slate-400">
              Categoria
            </label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES_CONFIG.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => onChange({ category: cat.id })}
                  className={`rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                    filters.category === cat.id
                      ? "bg-[#0055D4] text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Avaliação Mínima */}
          <div>
            <label className="block font-bold text-[#0F172A] mb-2 uppercase text-[10px] tracking-wider text-slate-400">
              Avaliação Mínima
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { val: 0, label: "Todas" },
                { val: 4.5, label: "4.5+ ★" },
                { val: 4.8, label: "4.8+ ★ (Top)" },
              ].map((item) => (
                <button
                  key={item.val}
                  type="button"
                  onClick={() => onChange({ minRating: item.val })}
                  className={`py-2 px-3 rounded-xl border text-center font-bold transition-all ${
                    filters.minRating === item.val
                      ? "border-[#0055D4] bg-blue-50 text-[#0055D4]"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Critérios de Agilidade e Segurança */}
          <div>
            <label className="block font-bold text-[#0F172A] mb-2 uppercase text-[10px] tracking-wider text-slate-400">
              Critérios Especiais
            </label>
            <div className="space-y-2">
              <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="font-semibold text-slate-800">Disponível hoje</span>
                </div>
                <input
                  type="checkbox"
                  checked={filters.availableTodayOnly}
                  onChange={(e) => onChange({ availableTodayOnly: e.target.checked })}
                  className="rounded h-4 w-4 text-[#0055D4] focus:ring-[#0055D4]"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <div className="flex items-center gap-2">
                  <Icon name="clock" size={14} className="text-[#0055D4]" />
                  <span className="font-semibold text-slate-800">Resposta rápida (≤ 30 min)</span>
                </div>
                <input
                  type="checkbox"
                  checked={filters.fastResponseOnly}
                  onChange={(e) => onChange({ fastResponseOnly: e.target.checked })}
                  className="rounded h-4 w-4 text-[#0055D4] focus:ring-[#0055D4]"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <div className="flex items-center gap-2">
                  <Icon name="check-circle" size={14} className="text-[#0055D4]" />
                  <span className="font-semibold text-slate-800">Apenas verificados</span>
                </div>
                <input
                  type="checkbox"
                  checked={filters.verifiedOnly}
                  onChange={(e) => onChange({ verifiedOnly: e.target.checked })}
                  className="rounded h-4 w-4 text-[#0055D4] focus:ring-[#0055D4]"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Bottom Bar Actions */}
        <div className="pt-2 border-t border-slate-100 flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-[#0055D4] hover:bg-[#0047BA] text-white py-3 text-xs font-bold transition-colors cursor-pointer text-center shadow-xs"
          >
            Ver {totalResultsCount} profissional{totalResultsCount === 1 ? "" : "is"}
          </button>
        </div>
      </div>
    </div>
  );
}
