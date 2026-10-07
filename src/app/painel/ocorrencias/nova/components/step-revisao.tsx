"use client";

import { useState } from "react";
import { Icon, type IconName } from "@/components/icon";
import type { CategoryDefinition } from "@/lib/services/occurrence-inference";

interface StepRevisaoProps {
  title: string;
  onChangeTitle: (val: string) => void;
  description: string;
  category: CategoryDefinition;
  locationSummary: string;
  photos: string[];
  severity: "baixa" | "media" | "alta" | "urgente";
  isSubmitting: boolean;
  submitError: string | null;
  onEditStep1: () => void;
  onEditStep2: () => void;
  onSubmit: () => void;
}

const SEVERITY_LABEL_MAP: Record<string, { label: string; color: string }> = {
  baixa: { label: "Baixa (Ajuste rotineiro)", color: "text-slate-600 bg-slate-100" },
  media: { label: "Normal (Prioridade padrão)", color: "text-blue-700 bg-blue-50 border-blue-200" },
  alta: { label: "Alta (Atenção prioritária)", color: "text-amber-800 bg-amber-50 border-amber-200" },
  urgente: { label: "Urgente (Ação imediata)", color: "text-red-700 bg-red-50 border-red-200" },
};

export function StepRevisao({
  title,
  onChangeTitle,
  description,
  category,
  locationSummary,
  photos,
  severity,
  isSubmitting,
  submitError,
  onEditStep1,
  onEditStep2,
  onSubmit,
}: StepRevisaoProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  const severityInfo = SEVERITY_LABEL_MAP[severity] || SEVERITY_LABEL_MAP.media;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sm sm:text-base font-bold text-slate-900 mb-1">
          Confirme sua ocorrência
        </h2>
        <p className="text-xs text-slate-500">
          Revise os detalhes abaixo antes de registrar. Nossa equipe será notificada de imediato.
        </p>
      </div>

      {submitError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-800 flex items-center gap-2">
          <Icon name="alert-triangle" size={16} className="text-red-600 shrink-0" />
          <span>{submitError}</span>
        </div>
      )}

      {/* Cartão de Resumo sem Poluição */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 space-y-5 shadow-xs">
        {/* Título da Ocorrência (com edição rápida) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Título gerado
            </span>
            <button
              type="button"
              onClick={() => setIsEditingTitle(!isEditingTitle)}
              className="inline-flex items-center gap-1 text-xs font-bold text-[#0070F3] hover:underline"
            >
              <Icon name="pencil" size={12} />
              <span>{isEditingTitle ? "Concluir edição" : "Editar título"}</span>
            </button>
          </div>

          {isEditingTitle ? (
            <input
              type="text"
              value={title}
              onChange={(e) => onChangeTitle(e.target.value)}
              className="w-full text-base font-bold text-slate-900 border border-[#0070F3] rounded-lg p-2 outline-none"
              autoFocus
            />
          ) : (
            <p className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
              {title}
            </p>
          )}
        </div>

        {/* Metadados Essenciais: Categoria, Localização e Prioridade */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100">
          {/* Categoria */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Categoria</span>
              <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-800 mt-0.5">
                <Icon name={category.icon as IconName} size={15} className="text-[#0055D4]" />
                {category.label}
              </span>
            </div>
            <button
              type="button"
              onClick={onEditStep1}
              className="text-[11px] font-bold text-[#0070F3] hover:underline"
            >
              Alterar
            </button>
          </div>

          {/* Localização */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <span className="text-[11px] text-slate-400 block font-medium">Localização</span>
              <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-800 mt-0.5 truncate">
                <Icon name="map-pin" size={15} className="text-[#0055D4] shrink-0" />
                <span className="truncate">{locationSummary}</span>
              </span>
            </div>
            <button
              type="button"
              onClick={onEditStep2}
              className="text-[11px] font-bold text-[#0070F3] hover:underline shrink-0"
            >
              Alterar
            </button>
          </div>
        </div>

        {/* Descrição Informada */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              O que você relatou
            </span>
            <button
              type="button"
              onClick={onEditStep1}
              className="text-[11px] font-bold text-[#0070F3] hover:underline"
            >
              Editar texto
            </button>
          </div>
          <p className="text-xs sm:text-sm text-slate-700 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200 leading-relaxed whitespace-pre-wrap">
            {description}
          </p>
        </div>

        {/* Prioridade Sugerida pelo Sistema */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Prioridade estimada:
            </span>
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${severityInfo.color}`}
            >
              {severityInfo.label}
            </span>
          </div>
        </div>

        {/* Fotos Anexadas */}
        {photos.length > 0 && (
          <div className="pt-2 border-t border-slate-100">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Fotos anexadas ({photos.length})
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {photos.map((src, idx) => (
                <div
                  key={idx}
                  className="aspect-4/3 rounded-xl overflow-hidden border border-slate-200 bg-slate-100"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt={`Foto ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Ações Finais de Envio */}
      <div className="pt-2 flex items-center justify-between">
        <button
          type="button"
          onClick={onEditStep2}
          disabled={isSubmitting}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs sm:text-sm font-bold hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          <Icon name="arrow-left" size={15} />
          <span>Voltar e ajustar</span>
        </button>

        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#0070F3] hover:bg-[#005FD6] text-white text-xs sm:text-sm font-bold shadow-xs transition-colors disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              <span>Registrando ocorrência...</span>
            </>
          ) : (
            <>
              <Icon name="check" size={16} strokeWidth={2.5} />
              <span>Enviar ocorrência</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
