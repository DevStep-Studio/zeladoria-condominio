"use client";

import { useMemo, useState } from "react";
import { Icon, type IconName } from "@/components/icon";
import {
  CATEGORIES_CATALOG,
  type CategoryDefinition,
} from "@/lib/services/occurrence-inference";

interface CategoryPickerSheetProps {
  isOpen: boolean;
  selectedKey: string;
  onSelect: (category: CategoryDefinition) => void;
  onClose: () => void;
}

export function CategoryPickerSheet({
  isOpen,
  selectedKey,
  onSelect,
  onClose,
}: CategoryPickerSheetProps) {
  const [search, setSearch] = useState("");

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return CATEGORIES_CATALOG;
    const q = search.toLowerCase();
    return CATEGORIES_CATALOG.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.keywords.some((k) => k.includes(q))
    );
  }, [search]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl bg-white p-5 sm:p-6 shadow-2xl border border-slate-200 flex flex-col max-h-[85vh] sm:max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              Escolha a categoria do problema
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500">
              Selecione o tema que melhor representa a ocorrência
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <Icon name="x" size={18} />
          </button>
        </div>

        {/* Busca */}
        <div className="pt-3 pb-2">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Icon name="search" size={14} />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar categoria (ex: lâmpada, cano, portão)..."
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#0070F3] focus:bg-white transition-colors"
              autoFocus
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                <Icon name="x" size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Lista de Categorias */}
        <div className="flex-1 overflow-y-auto py-2 space-y-1.5 pr-1">
          {filteredCategories.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              Nenhuma categoria encontrada para &ldquo;{search}&rdquo;.
            </div>
          ) : (
            filteredCategories.map((cat) => {
              const isSelected = cat.key === selectedKey;
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => {
                    onSelect(cat);
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? "border-[#0070F3] bg-blue-50/70 text-[#0055D4] shadow-2xs"
                      : "border-slate-200 bg-white hover:bg-slate-50 text-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-lg shrink-0 ${
                        isSelected
                          ? "bg-[#0070F3] text-white"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      <Icon name={cat.icon as IconName} size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold truncate">
                        {cat.label}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {cat.description}
                      </p>
                    </div>
                  </div>
                  {isSelected && (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0070F3] text-white shrink-0 ml-2">
                      <Icon name="check" size={13} strokeWidth={3} />
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
